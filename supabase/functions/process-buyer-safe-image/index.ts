// AnyBike buyer-safe authorised stock image processor
// EXISTING SUPABASE EDGE FUNCTION: process-buyer-safe-image
// Replace the entire current index.ts with this file.
//
// V11L — SOURCE PLACEHOLDER HASH FILTER + GROUNDED SELLER-BRANDING QA + ATOMIC QUEUE CLAIM + WORKER WIF LOGIN
// - Atomically claims one waiting image via anybike_claim_next_buyer_safe_image().
// - Uses Supabase's supported combined auth modes: signed-in admin user JWTs and server-side secret-key calls via the apikey header.
// - Archives the exact original supplier image into AnyBike storage before editing.
// - Saves a SHA-256 source_image_hash for future feed-sync dedupe/persistence.
// - Can backfill the original archive for an already-safe image without rerunning Gemini.
// - Pins @imagemagick/magick-wasm to 0.0.42 because 0.0.43 is missing dist/magick.wasm in the Supabase runtime.
// - Google Vision remains the gatekeeper: Gemini is called only when seller branding is detected.
// - After repair, Google Vision checks the edited image again against the SAME dealer aliases.
//   Seller-branding QA therefore cannot fail because Gemini invents an unrelated dealer/sign name.
// - Loads seller-specific aliases from public.dealer_identity_aliases.
// - Builds one or more LOCAL repair crops around seller-identifying OCR/logo regions.
// - Gemini edits ONLY those local crops.
// - ImageMagick/WASM resizes each returned repair crop back to the exact crop dimensions
//   and composites it onto the untouched original source image.
// - The AI-generated image is NEVER used as the final canvas.
// - Final output width and height MUST exactly match the original source dimensions.
// - Motorcycle/manufacturer/model branding must be preserved.
// - No whole-image crop, zoom, shift or reframing is permitted.
// - Uses Google Workload Identity Federation + short-lived service-account credentials.
// - PILOT: process ONE image and inspect it before processing the rest.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server@^1";
import {
  CompositeOperator,
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
  Point,
} from "npm:@imagemagick/magick-wasm@0.0.42";

const magickWasmBytes = await Deno.readFile(
  new URL(
    "magick.wasm",
    import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.42"),
  ),
);
await initializeImageMagick(magickWasmBytes);


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-anybike-internal-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}


type Vertex = { x?: number; y?: number };
type Poly = { vertices?: Vertex[] };
type VisionAnnotation = {
  description?: string;
  boundingPoly?: Poly;
  score?: number;
};
type SafeSearchAnnotation = {
  adult?: string;
  spoof?: string;
  medical?: string;
  violence?: string;
  racy?: string;
};

type Box = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  reason: string;
};

type WordBox = Box & {
  text: string;
  norm: string;
  cx: number;
  cy: number;
  height: number;
};

type TextLine = {
  words: WordBox[];
  text: string;
  norm: string;
  box: Box;
  avgCy: number;
  avgHeight: number;
};

function normalizeText(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stemToken(value: string): string {
  let token = normalizeText(value).replace(/\s+/g, "");
  if (token.endsWith("'s")) token = token.slice(0, -2);
  if (token.length > 5 && token.endsWith("s")) token = token.slice(0, -1);
  return token;
}

function polyToBox(poly: Poly | undefined, reason: string): Box | null {
  const vertices = poly?.vertices || [];
  if (!vertices.length) return null;
  const xs = vertices.map((v) => Number(v.x || 0));
  const ys = vertices.map((v) => Number(v.y || 0));
  const x1 = Math.min(...xs);
  const y1 = Math.min(...ys);
  const x2 = Math.max(...xs);
  const y2 = Math.max(...ys);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x1, y1, x2, y2, reason };
}

function unionBoxes(boxes: Box[], reason: string): Box {
  return {
    x1: Math.min(...boxes.map((b) => b.x1)),
    y1: Math.min(...boxes.map((b) => b.y1)),
    x2: Math.max(...boxes.map((b) => b.x2)),
    y2: Math.max(...boxes.map((b) => b.y2)),
    reason,
  };
}

function boxesOverlapOrNear(a: Box, b: Box, gap = 12): boolean {
  return !(
    a.x2 + gap < b.x1 ||
    b.x2 + gap < a.x1 ||
    a.y2 + gap < b.y1 ||
    b.y2 + gap < a.y1
  );
}

function mergeBoxes(input: Box[]): Box[] {
  const boxes = [...input];
  const result: Box[] = [];
  while (boxes.length) {
    let current = boxes.shift()!;
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = boxes.length - 1; i >= 0; i--) {
        if (boxesOverlapOrNear(current, boxes[i])) {
          current = unionBoxes(
            [current, boxes[i]],
            `${current.reason}; ${boxes[i].reason}`,
          );
          boxes.splice(i, 1);
          changed = true;
        }
      }
    }
    result.push(current);
  }
  return result;
}

function buildLines(textAnnotations: VisionAnnotation[]): TextLine[] {
  const words: WordBox[] = [];

  for (const ann of textAnnotations.slice(1)) {
    const text = ann.description || "";
    const norm = normalizeText(text);
    const box = polyToBox(ann.boundingPoly, `OCR: ${text}`);
    if (!norm || !box) continue;
    const height = Math.max(1, box.y2 - box.y1);
    words.push({
      ...box,
      text,
      norm,
      cx: (box.x1 + box.x2) / 2,
      cy: (box.y1 + box.y2) / 2,
      height,
    });
  }

  words.sort((a, b) => a.cy - b.cy || a.x1 - b.x1);
  const rawLines: WordBox[][] = [];

  for (const word of words) {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const avgCy = line.reduce((s, w) => s + w.cy, 0) / line.length;
      const avgHeight = line.reduce((s, w) => s + w.height, 0) / line.length;
      const tolerance = Math.max(10, avgHeight * 0.65, word.height * 0.65);
      const distance = Math.abs(word.cy - avgCy);
      if (distance <= tolerance && distance < bestDistance) {
        bestIndex = i;
        bestDistance = distance;
      }
    }

    if (bestIndex === -1) rawLines.push([word]);
    else rawLines[bestIndex].push(word);
  }

  return rawLines
    .map((lineWords) => {
      lineWords.sort((a, b) => a.x1 - b.x1);
      const text = lineWords.map((w) => w.text).join(" ");
      const norm = normalizeText(text);
      const box = unionBoxes(lineWords, `OCR line: ${text}`);
      return {
        words: lineWords,
        text,
        norm,
        box,
        avgCy: lineWords.reduce((s, w) => s + w.cy, 0) / lineWords.length,
        avgHeight:
          lineWords.reduce((s, w) => s + w.height, 0) / lineWords.length,
      };
    })
    .sort((a, b) => a.avgCy - b.avgCy || a.box.x1 - b.box.x1);
}

function dealerAnchorStems(aliases: string[]): Set<string> {
  const generic = new Set([
    "motorcycle",
    "motorcycles",
    "motorbike",
    "motorbikes",
    "bike",
    "bikes",
    "motor",
    "motors",
    "dealer",
    "dealers",
    "sales",
    "centre",
    "center",
    "limited",
    "ltd",
    "the",
    "and",
    "of",
    "uk",
  ]);

  const anchors = new Set<string>();
  for (const alias of aliases) {
    const tokens = normalizeText(alias).split(" ").filter(Boolean);
    const firstDistinctive = tokens.find((t) => {
      const stem = stemToken(t);
      return stem.length >= 4 && !generic.has(t) && !generic.has(stem);
    });
    if (firstDistinctive) anchors.add(stemToken(firstDistinctive));
  }
  return anchors;
}

function findSellerRegions(
  textAnnotations: VisionAnnotation[],
  logoAnnotations: VisionAnnotation[],
  aliases: string[],
): Box[] {
  const anchors = dealerAnchorStems(aliases);

  const generic = new Set([
    "motorcycle",
    "motorcycles",
    "motorbike",
    "motorbikes",
    "bike",
    "bikes",
    "motor",
    "motors",
    "dealer",
    "dealers",
    "sales",
    "centre",
    "center",
    "limited",
    "ltd",
    "the",
    "and",
    "of",
    "uk",
  ]);

  // Every token that appears in one of this dealer's approved aliases.
  // Example for Hayballs:
  // hayball / motorcycles / salisbury
  const aliasTokens = new Set<string>();
  for (const alias of aliases) {
    for (const token of normalizeText(alias).split(" ").filter(Boolean)) {
      aliasTokens.add(stemToken(token));
    }
  }

  const words: WordBox[] = [];
  for (const ann of textAnnotations.slice(1)) {
    const text = ann.description || "";
    const norm = normalizeText(text);
    const box = polyToBox(ann.boundingPoly, `OCR: ${text}`);
    if (!norm || !box) continue;

    const stem = stemToken(norm);
    if (!stem) continue;

    words.push({
      ...box,
      text,
      norm,
      cx: (box.x1 + box.x2) / 2,
      cy: (box.y1 + box.y2) / 2,
      height: Math.max(1, box.y2 - box.y1),
    });
  }

  const hits: Box[] = [];
  const selected = new Set<number>();

  // Start only from a distinctive dealer word such as HAYBALL.
  // This avoids treating generic words such as "motorcycles" as seller identity
  // when they appear elsewhere in the photograph.
  for (let i = 0; i < words.length; i++) {
    const anchor = words[i];
    const anchorStem = stemToken(anchor.norm);
    if (!anchors.has(anchorStem)) continue;

    selected.add(i);

    const anchorWidth = Math.max(1, anchor.x2 - anchor.x1);
    const anchorHeight = Math.max(1, anchor.y2 - anchor.y1);

    // Pull in only nearby words that are also part of the dealer's alias set.
    // This catches layouts such as:
    //   Hayball Motorcycles
    //   Salisbury
    // without creating one giant rectangle across the motorcycle.
    for (let j = 0; j < words.length; j++) {
      if (j === i) continue;
      const candidate = words[j];
      const candidateStem = stemToken(candidate.norm);

      if (!aliasTokens.has(candidateStem)) continue;

      const horizontalGap =
        candidate.x1 > anchor.x2
          ? candidate.x1 - anchor.x2
          : anchor.x1 > candidate.x2
          ? anchor.x1 - candidate.x2
          : 0;

      const verticalGap =
        candidate.y1 > anchor.y2
          ? candidate.y1 - anchor.y2
          : anchor.y1 > candidate.y2
          ? anchor.y1 - candidate.y2
          : 0;

      const maxHorizontal = Math.max(220, anchorWidth * 7);
      const maxVertical = Math.max(110, anchorHeight * 3.5);

      if (horizontalGap <= maxHorizontal && verticalGap <= maxVertical) {
        selected.add(j);
      }
    }
  }

  for (const index of selected) {
    const w = words[index];
    hits.push({
      x1: w.x1,
      y1: w.y1,
      x2: w.x2,
      y2: w.y2,
      reason: `dealer word: ${w.text}`,
    });
  }

  // Logo detection stays conservative. Only mask a logo when Google's own
  // description contains the dealer's distinctive anchor. Manufacturer logos
  // such as ROYAL ENFIELD are therefore preserved.
  for (const logo of logoAnnotations || []) {
    const desc = normalizeText(logo.description || "");
    if (!desc) continue;

    const logoStems = desc.split(" ").map(stemToken).filter(Boolean);
    const matchesDealer = logoStems.some((token) => anchors.has(token));
    if (!matchesDealer) continue;

    const box = polyToBox(
      logo.boundingPoly,
      `dealer logo: ${logo.description || "unknown"}`,
    );
    if (box) hits.push(box);
  }

  // IMPORTANT: do not merge all hits into one dealer board rectangle.
  // Each detected word/logo keeps its own tight mask.
  return hits;
}
function expandBox(box: Box, width: number, height: number): Box {
  const boxHeight = Math.max(1, box.y2 - box.y1);
  const pad = Math.max(4, Math.round(boxHeight * 0.12));
  return {
    x1: Math.max(0, Math.floor(box.x1 - pad)),
    y1: Math.max(0, Math.floor(box.y1 - pad)),
    x2: Math.min(width - 1, Math.ceil(box.x2 + pad)),
    y2: Math.min(height - 1, Math.ceil(box.y2 + pad)),
    reason: box.reason,
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}


async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Provider-neutral registry of exact source-image hashes that are known
// supplier/dealer placeholder artwork rather than genuine motorcycle photos.
// Keep the original source archived for traceability, but never expose or
// process these as buyer-safe motorcycle photographs.
const KNOWN_SOURCE_PLACEHOLDER_HASHES = new Set<string>([
  // Hayballs "AWAITING PREPARATION" artwork first seen via Deep Blue.
  "13ecc7b9611072b27ea7e7ba88e25c2497b73ca6dc950749e0c0a8dbfc6dff56",
]);

function isKnownSourcePlaceholderHash(hash: string): boolean {
  return KNOWN_SOURCE_PLACEHOLDER_HASHES.has((hash || "").toLowerCase());
}


const VISION_LIKELIHOOD: Record<string, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
};

function safeSearchDecision(safe: SafeSearchAnnotation): {
  status: "approved" | "review_required" | "rejected";
  reason: string;
} {
  const checks = [
    ["adult", safe.adult],
    ["violence", safe.violence],
    ["racy", safe.racy],
  ] as const;

  const rejected = checks.filter(([, value]) =>
    (VISION_LIKELIHOOD[String(value || "UNKNOWN").toUpperCase()] || 0) >= 4
  );
  if (rejected.length) {
    return {
      status: "rejected",
      reason: rejected.map(([name, value]) => `${name}=${value}`).join(", "),
    };
  }

  const review = checks.filter(([, value]) =>
    (VISION_LIKELIHOOD[String(value || "UNKNOWN").toUpperCase()] || 0) === 3
  );
  if (review.length) {
    return {
      status: "review_required",
      reason: review.map(([name, value]) => `${name}=${value}`).join(", "),
    };
  }

  return { status: "approved", reason: "SafeSearch passed" };
}

function fullDetectedText(textAnnotations: VisionAnnotation[]): string {
  return String(textAnnotations?.[0]?.description || "");
}

function looksLikeDealerPlaceholder(textAnnotations: VisionAnnotation[]): boolean {
  const text = normalizeText(fullDetectedText(textAnnotations));
  if (!text) return false;
  const phrases = [
    "awaiting preparation",
    "image coming soon",
    "photo coming soon",
    "coming soon",
    "awaiting image",
    "no image available",
    "image unavailable",
    "photograph unavailable",
    "photos to follow",
    "picture to follow",
  ];
  return phrases.some((phrase) => text.includes(normalizeText(phrase)));
}

function findCommercialTextRegions(textAnnotations: VisionAnnotation[]): Box[] {
  const lines = buildLines(textAnnotations);
  const hits: Box[] = [];

  for (const line of lines) {
    const original = line.text || "";
    const normalized = line.norm || "";

    const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(original);
    const hasUrl =
      /(?:https?:\/\/|www\.|\b[a-z0-9-]+\.(?:co\.uk|com|net|org|uk)\b)/i.test(original);
    const hasPhone =
      /(?:\+44|0)\s*(?:\d[\s().-]*){9,11}/.test(original);
    const commercialPhrase =
      /\b(call us|contact us|visit us|finance|part exchange|px|for sale|sales team|dealer|dealership)\b/i
        .test(original);

    if (hasEmail || hasUrl || hasPhone || commercialPhrase) {
      hits.push({
        ...line.box,
        reason: `commercial/contact text: ${original}`,
      });
    }
  }

  return hits;
}

function imageQualityDecision(bytes: Uint8Array): {
  status: "usable" | "review_required";
  reason: string;
} {
  const dimensions = readImageDimensions(bytes);
  if (!dimensions) {
    return { status: "review_required", reason: "Image dimensions could not be read" };
  }
  const pixels = dimensions.width * dimensions.height;
  if (dimensions.width < 320 || dimensions.height < 240 || pixels < 120000) {
    return {
      status: "review_required",
      reason: `Image resolution is only ${dimensions.width}x${dimensions.height}`,
    };
  }
  return { status: "usable", reason: `${dimensions.width}x${dimensions.height}` };
}

async function archiveOriginalSourceImage(
  adminClient: any,
  job: any,
  inputBytes: Uint8Array,
  contentType: string,
): Promise<{
  hash: string;
  storagePath: string;
  publicUrl: string;
}> {
  const hash = await sha256Hex(inputBytes);
  const mimeType = contentType || "image/jpeg";
  const extension = extensionForMime(mimeType);
  const position = Number(job.position ?? 0);

  const storagePath =
    `buyer-safe-originals/${job.junction_stock_id}/${job.junction_stock_id}-${position}-${job.id}-${hash.slice(0, 16)}.${extension}`;

  const { error: uploadError } = await adminClient.storage
    .from("motorcycles")
    .upload(storagePath, inputBytes, {
      contentType: mimeType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (uploadError) {
    throw new Error("Original-image archive upload failed: " + uploadError.message);
  }

  const { data: publicData } = adminClient.storage
    .from("motorcycles")
    .getPublicUrl(storagePath);

  const publicUrl = publicData?.publicUrl || "";
  if (!publicUrl) {
    throw new Error("Could not create original-image archive public URL.");
  }

  const archivedAt = new Date().toISOString();
  const { error: updateError } = await adminClient
    .from("junction_stock_images")
    .update({
      source_image_hash: hash,
      source_archive_storage_path: storagePath,
      source_archive_url: publicUrl,
      source_archived_at: archivedAt,
      buyer_safe_updated_at: archivedAt,
    })
    .eq("id", job.id);

  if (updateError) {
    throw new Error("Could not save original-image archive details: " + updateError.message);
  }

  return { hash, storagePath, publicUrl };
}

async function inspectWithGoogleVision(
  bytes: Uint8Array,
  apiKey: string,
): Promise<{
  textAnnotations: VisionAnnotation[];
  logoAnnotations: VisionAnnotation[];
  safeSearch: SafeSearchAnnotation;
}> {
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: bytesToBase64(bytes) },
            features: [
              { type: "TEXT_DETECTION", maxResults: 100 },
              { type: "LOGO_DETECTION", maxResults: 20 },
              { type: "SAFE_SEARCH_DETECTION" },
            ],
          },
        ],
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Google Vision returned HTTP ${response.status}: ${payload?.error?.message || "request failed"}`,
    );
  }

  const result = payload?.responses?.[0];
  if (result?.error?.message) {
    throw new Error(`Google Vision error: ${result.error.message}`);
  }

  return {
    textAnnotations: Array.isArray(result?.textAnnotations)
      ? result.textAnnotations
      : [],
    logoAnnotations: Array.isArray(result?.logoAnnotations)
      ? result.logoAnnotations
      : [],
    safeSearch: result?.safeSearchAnnotation || {},
  };
}


const GOOGLE_PROJECT_ID = "project-c0969553-28de-4fff-81e";
const GOOGLE_PROJECT_NUMBER = "768037321496";
const GOOGLE_WIF_POOL_ID = "anybike-supabase";
const GOOGLE_WIF_PROVIDER_ID = "supabase-anybike";
const GOOGLE_SERVICE_ACCOUNT =
  "anybike-image-editor@project-c0969553-28de-4fff-81e.iam.gserviceaccount.com";

const GOOGLE_WIF_AUDIENCE =
  `//iam.googleapis.com/projects/${GOOGLE_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GOOGLE_WIF_POOL_ID}/providers/${GOOGLE_WIF_PROVIDER_ID}`;

async function getGoogleFederatedToken(subjectToken: string): Promise<string> {
  const response = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audience: GOOGLE_WIF_AUDIENCE,
      grantType: "urn:ietf:params:oauth:grant-type:token-exchange",
      requestedTokenType: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subjectTokenType: "urn:ietf:params:oauth:token-type:jwt",
      subjectToken,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.access_token) {
    throw new Error(
      `Google STS token exchange failed (HTTP ${response.status}): ${
        payload?.error_description || payload?.error || "no access token returned"
      }`,
    );
  }

  return payload.access_token;
}

async function getGoogleServiceAccountToken(
  federatedToken: string,
): Promise<string> {
  const response = await fetch(
    `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${
      encodeURIComponent(GOOGLE_SERVICE_ACCOUNT)
    }:generateAccessToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${federatedToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scope: ["https://www.googleapis.com/auth/cloud-platform"],
        lifetime: "1800s",
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.accessToken) {
    throw new Error(
      `Google service-account impersonation failed (HTTP ${response.status}): ${
        payload?.error?.message || "no access token returned"
      }`,
    );
  }

  return payload.accessToken;
}


function readImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { width: view.getUint32(16, false), height: view.getUint32(20, false) };
  }
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) break;
      const sof = [0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker);
      if (sof && length >= 7) {
        const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
        const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
        return { width, height };
      }
      offset += length;
    }
  }
  return null;
}

function closestSupportedAspect(width: number, height: number): string {
  const supported: Array<[string, number]> = [
    ["1:1", 1], ["3:2", 3/2], ["2:3", 2/3], ["3:4", 3/4],
    ["4:3", 4/3], ["4:5", 4/5], ["5:4", 5/4], ["9:16", 9/16],
    ["16:9", 16/9], ["21:9", 21/9],
  ];
  const ratio = width / height;
  supported.sort((a,b) => Math.abs(a[1]-ratio) - Math.abs(b[1]-ratio));
  return supported[0][0];
}

const MAX_REPAIR_PATCHES = 3;

function buildRepairPatchRegions(
  rawRegions: Box[],
  width: number,
  height: number,
): Box[] {
  if (!rawRegions.length) return [];

  // First give each detected seller word/logo some context so Gemini can see
  // the sign/board/background around it, then merge nearby regions.
  const expanded = rawRegions.map((box) => {
    const w = Math.max(1, box.x2 - box.x1);
    const h = Math.max(1, box.y2 - box.y1);
    const padX = Math.max(48, Math.round(w * 0.9));
    const padY = Math.max(48, Math.round(h * 1.8));

    return {
      x1: Math.max(0, Math.floor(box.x1 - padX)),
      y1: Math.max(0, Math.floor(box.y1 - padY)),
      x2: Math.min(width, Math.ceil(box.x2 + padX)),
      y2: Math.min(height, Math.ceil(box.y2 + padY)),
      reason: box.reason,
    };
  });

  // Merge regions that now overlap or nearly touch. Usually a dealer board
  // becomes one repair crop, so we normally make only one Gemini image call.
  const groups: Box[] = [];
  for (const candidate of expanded) {
    let merged = candidate;
    let changed = true;

    while (changed) {
      changed = false;
      for (let i = groups.length - 1; i >= 0; i--) {
        if (boxesOverlapOrNear(merged, groups[i], 36)) {
          merged = unionBoxes(
            [merged, groups[i]],
            `${merged.reason}; ${groups[i].reason}`,
          );
          groups.splice(i, 1);
          changed = true;
        }
      }
    }

    groups.push(merged);
  }

  // Cost/safety guard. If Vision somehow finds many separate seller regions,
  // keep the largest local areas only and fail later if branding remains.
  return groups
    .sort((a, b) =>
      (b.x2 - b.x1) * (b.y2 - b.y1) -
      (a.x2 - a.x1) * (a.y2 - a.y1)
    )
    .slice(0, MAX_REPAIR_PATCHES)
    .map((box) => ({
      ...box,
      x1: Math.max(0, Math.floor(box.x1)),
      y1: Math.max(0, Math.floor(box.y1)),
      x2: Math.min(width, Math.ceil(box.x2)),
      y2: Math.min(height, Math.ceil(box.y2)),
    }))
    .filter((box) => box.x2 > box.x1 && box.y2 > box.y1);
}

function magickFormatForMime(mimeType: string): number {
  const m = (mimeType || "").toLowerCase();
  if (m.includes("png")) return MagickFormat.Png;
  if (m.includes("webp")) return MagickFormat.WebP;
  return MagickFormat.Jpeg;
}

function cropImageRegion(
  sourceBytes: Uint8Array,
  region: Box,
): Uint8Array {
  const cropWidth = Math.max(1, Math.round(region.x2 - region.x1));
  const cropHeight = Math.max(1, Math.round(region.y2 - region.y1));
  let output = new Uint8Array();

  ImageMagick.read(sourceBytes, (image) => {
    image.crop(
      new MagickGeometry(
        Math.round(region.x1),
        Math.round(region.y1),
        cropWidth,
        cropHeight,
      ),
    );
    image.resetPage();
    image.quality = 92;
    image.write(MagickFormat.Jpeg, (data) => {
      output = Uint8Array.from(data);
    });
  });

  if (!output.length) {
    throw new Error("Could not create the local seller-branding repair crop.");
  }

  return output;
}

function compositeRepairPatch(
  masterBytes: Uint8Array,
  repairBytes: Uint8Array,
  region: Box,
  outputMimeType: string,
): Uint8Array {
  const cropWidth = Math.max(1, Math.round(region.x2 - region.x1));
  const cropHeight = Math.max(1, Math.round(region.y2 - region.y1));
  let output = new Uint8Array();

  ImageMagick.read(masterBytes, (master) => {
    ImageMagick.read(repairBytes, (repair) => {
      // Gemini is free to return a different patch resolution/aspect ratio.
      // That is harmless here because only this LOCAL patch is normalized.
      // The original full-size canvas is never resized.
      const exactGeometry = new MagickGeometry(cropWidth, cropHeight);
      exactGeometry.ignoreAspectRatio = true;
      repair.resize(exactGeometry);
      repair.resetPage();

      master.composite(
        repair,
        CompositeOperator.Over,
        new Point(Math.round(region.x1), Math.round(region.y1)),
      );

      master.quality = 92;
      master.write(magickFormatForMime(outputMimeType), (data) => {
        output = Uint8Array.from(data);
      });
    });
  });

  if (!output.length) {
    throw new Error("Could not composite the local repair patch onto the original image.");
  }

  return output;
}

async function editLocalSellerPatchWithGemini(
  patchBytes: Uint8Array,
  aliases: string[],
  googleAccessToken: string,
  patchIndex: number,
  patchCount: number,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const endpoint =
    `https://aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/global/publishers/google/models/gemini-2.5-flash-image:generateContent`;

  const prompt = [
    `This is local repair crop ${patchIndex} of ${patchCount} from a motorcycle sales photograph.`,
    `Selling dealer aliases: ${aliases.join(", ")}.`,
    "Remove ONLY the selling dealer advertising/signage/branding visible in this crop and naturally reconstruct what should be behind it.",
    "If the dealer branding is on an advertising board or sign, remove the dealer-identifying board/sign content naturally rather than covering it with a box.",
    "CRITICAL: preserve every visible part of the motorcycle exactly.",
    "Never alter motorcycle manufacturer branding, model names, tank badges, fairing badges, OEM graphics, decals, wheels, engine, bodywork, paint, accessories, mirrors, tyres or motorcycle position.",
    "Do not invent another motorcycle or move any motorcycle part.",
    "Do not add black boxes, blur blocks, coloured patches, text, logos, borders or watermarks.",
    "Keep lighting, perspective, floor, wall and surrounding background as close to the supplied crop as possible.",
    "Return one edited image only.",
  ].join(" ");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: bytesToBase64(patchBytes),
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE"],
        candidateCount: 1,
        temperature: 0.15,
        imageConfig: {
          imageOutputOptions: {
            mimeType: "image/jpeg",
            compressionQuality: 92,
          },
        },
      },
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      `Gemini local repair failed (HTTP ${response.status}): ${
        payload?.error?.message || "request failed"
      }`,
    );
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) {
    throw new Error("Gemini returned no local repair image.");
  }

  const imagePart = parts.find((part: any) => part?.inlineData?.data);
  const data = imagePart?.inlineData?.data;
  const mimeType = imagePart?.inlineData?.mimeType || "image/jpeg";

  if (!data || typeof data !== "string") {
    throw new Error("Gemini returned no local repair image bytes.");
  }

  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  if (!bytes.length) {
    throw new Error("Gemini returned an empty local repair image.");
  }

  return { bytes, mimeType };
}

async function detectQrCodeWithGemini(
  imageBytes: Uint8Array,
  mimeType: string,
  googleAccessToken: string,
): Promise<{ detected: boolean; reason: string }> {
  const endpoint =
    `https://aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/global/publishers/google/models/gemini-2.5-flash:generateContent`;

  const prompt = [
    "Inspect this motorcycle sales photograph only for QR codes / matrix barcodes.",
    "A QR code may be on a dealer advert, poster, sign, card, screen, wall graphic, or other object.",
    "Do not confuse ordinary square logos, number plates, dashboard pixels, or decorative checker patterns with a QR code.",
    'Return ONLY JSON: {"qr_code_detected":true,"reason":"short reason"} or {"qr_code_detected":false,"reason":"none"}.',
  ].join(" ");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: bytesToBase64(imageBytes),
            },
          },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Gemini QR-code detection failed (HTTP ${response.status}): ${payload?.error?.message || "request failed"}`,
    );
  }

  const raw = payload?.candidates?.[0]?.content?.parts
    ?.map((p: any) => p?.text || "")
    .join("")
    .trim() || "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch {}
  return {
    detected: parsed?.qr_code_detected === true,
    reason: String(parsed?.reason || (parsed?.qr_code_detected ? "QR code detected" : "none")),
  };
}

async function detectSellerRegionsWithGemini(
  imageBytes: Uint8Array,
  mimeType: string,
  aliases: string[],
  googleAccessToken: string,
): Promise<Box[]> {
  const dims = readImageDimensions(imageBytes);
  if (!dims) {
    throw new Error("Could not read image dimensions for Gemini seller-branding detection.");
  }

  const endpoint =
    `https://aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/global/publishers/google/models/gemini-2.5-flash:generateContent`;

  const prompt = [
    "Inspect this motorcycle sales photograph for SELLING-DEALER identity only.",
    `Image dimensions are ${dims.width} by ${dims.height} pixels.`,
    `Selling dealer aliases: ${aliases.join(", ")}.`,
    "Find visible dealer names, dealer logos, dealership wall signs, dealer web/email/phone text, and dealer-specific advertising that identifies the selling dealer.",
    "Do NOT mark BMW, Motorrad, S1000RR, manufacturer logos, model badges, OEM graphics, registration plates, or motorcycle branding unless they are part of the dealer's own advertising sign.",
    "Return tight pixel rectangles around only the selling-dealer identity that should be removed.",
    "Coordinates must be absolute pixels in the original image.",
    'Return ONLY JSON: {"regions":[{"x1":0,"y1":0,"x2":100,"y2":50,"reason":"dealer name"}]}.',
    'If no selling-dealer identity is visible, return {"regions":[]}.',
  ].join(" ");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: bytesToBase64(imageBytes),
            },
          },
          { text: prompt },
        ],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Gemini seller-branding detection failed (HTTP ${response.status}): ${payload?.error?.message || "request failed"}`,
    );
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  const textPart = Array.isArray(parts)
    ? parts.find((part: any) => typeof part?.text === "string")
    : null;
  if (!textPart?.text) {
    throw new Error("Gemini seller-branding detection returned no JSON.");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(textPart.text);
  } catch {
    throw new Error(
      `Gemini seller-branding detection returned invalid JSON: ${textPart.text.slice(0, 300)}`,
    );
  }

  const regions = Array.isArray(parsed?.regions) ? parsed.regions : [];
  return regions
    .map((r: any): Box | null => {
      const x1 = Math.max(0, Math.min(dims.width, Math.round(Number(r?.x1))));
      const y1 = Math.max(0, Math.min(dims.height, Math.round(Number(r?.y1))));
      const x2 = Math.max(0, Math.min(dims.width, Math.round(Number(r?.x2))));
      const y2 = Math.max(0, Math.min(dims.height, Math.round(Number(r?.y2))));
      if (![x1,y1,x2,y2].every(Number.isFinite) || x2 <= x1 || y2 <= y1) return null;
      return {
        x1, y1, x2, y2,
        reason: String(r?.reason || "Gemini detected selling-dealer identity"),
      };
    })
    .filter((r: Box | null): r is Box => !!r);
}

async function repairSellerBrandingLocally(
  originalBytes: Uint8Array,
  originalMimeType: string,
  rawRegions: Box[],
  aliases: string[],
  googleAccessToken: string,
): Promise<{
  bytes: Uint8Array;
  mimeType: string;
  repairRegions: Box[];
}> {
  const originalDimensions = readImageDimensions(originalBytes);
  if (!originalDimensions) {
    throw new Error(
      "Could not read original image dimensions, so exact-canvas repair cannot be guaranteed.",
    );
  }

  const repairRegions = buildRepairPatchRegions(
    rawRegions,
    originalDimensions.width,
    originalDimensions.height,
  );

  if (!repairRegions.length) {
    throw new Error("Seller branding was detected but no valid local repair region could be created.");
  }

  let masterBytes = originalBytes;
  const outputMimeType =
    (originalMimeType || "").toLowerCase().includes("png")
      ? "image/png"
      : (originalMimeType || "").toLowerCase().includes("webp")
      ? "image/webp"
      : "image/jpeg";

  for (let i = 0; i < repairRegions.length; i++) {
    const region = repairRegions[i];

    // Always crop from the current master so multiple repairs can safely
    // coexist without replacing the full photograph.
    const localCrop = cropImageRegion(masterBytes, region);

    const editedPatch = await editLocalSellerPatchWithGemini(
      localCrop,
      aliases,
      googleAccessToken,
      i + 1,
      repairRegions.length,
    );

    masterBytes = compositeRepairPatch(
      masterBytes,
      editedPatch.bytes,
      region,
      outputMimeType,
    );

    const currentDimensions = readImageDimensions(masterBytes);
    if (
      !currentDimensions ||
      currentDimensions.width !== originalDimensions.width ||
      currentDimensions.height !== originalDimensions.height
    ) {
      throw new Error(
        `Local repair changed the full image size (${originalDimensions.width}x${originalDimensions.height} -> ${
          currentDimensions
            ? `${currentDimensions.width}x${currentDimensions.height}`
            : "unknown"
        }). Output rejected.`,
      );
    }
  }

  return {
    bytes: masterBytes,
    mimeType: outputMimeType,
    repairRegions,
  };
}


async function verifyFramingWithGemini(
  originalBytes: Uint8Array,
  originalMimeType: string,
  editedBytes: Uint8Array,
  editedMimeType: string,
  googleAccessToken: string,
): Promise<{
  composition_preserved: boolean;
  motorcycle_unchanged: boolean;
  reason: string;
}> {
  const endpoint =
    `https://aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/global/publishers/google/models/gemini-2.5-flash:generateContent`;

  const prompt = [
    "Compare these two motorcycle sales photographs.",
    "Image 1 is the ORIGINAL.",
    "Image 2 is the EDITED result.",
    "The only permitted visual change is removal of selling-dealer branding/signage and natural repair of the background where that branding was.",
    "Judge ONLY framing/composition and whether the motorcycle itself stayed unchanged.",
    "Do NOT judge whether dealer branding remains. A separate Google Vision alias check handles that deterministically.",
    "Do not invent, infer or name signs, logos, dealers or affiliations that are not relevant to framing or motorcycle preservation.",
    "Reject the edit if Image 2 is cropped, zoomed, narrowed, widened, shifted, reframed, rotated, or if any visible edge/background content has been lost.",
    "Reject the edit if the motorcycle itself changed in any meaningful way, including manufacturer/model branding, badges, graphics, shape, paint, wheels, engine, accessories or position.",
    'Return ONLY compact JSON in this exact shape: {"composition_preserved":true,"motorcycle_unchanged":true,"reason":"short reason"}',
  ].join(" ");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: originalMimeType || "image/jpeg",
                data: bytesToBase64(originalBytes),
              },
            },
            {
              inlineData: {
                mimeType: editedMimeType || "image/jpeg",
                data: bytesToBase64(editedBytes),
              },
            },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      `Gemini framing QA failed (HTTP ${response.status}): ${
        payload?.error?.message || "request failed"
      }`,
    );
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  const textPart = Array.isArray(parts)
    ? parts.find((part: any) => typeof part?.text === "string")
    : null;

  if (!textPart?.text) {
    throw new Error("Gemini framing QA returned no JSON.");
  }

  let result: any;
  try {
    result = JSON.parse(textPart.text);
  } catch {
    throw new Error(
      `Gemini framing QA returned invalid JSON: ${textPart.text.slice(0, 300)}`,
    );
  }

  return {
    composition_preserved: result?.composition_preserved === true,
    motorcycle_unchanged: result?.motorcycle_unchanged === true,
    reason: String(result?.reason || "No reason supplied."),
  };
}

function extensionForMime(mimeType: string): string {
  const m = (mimeType || "").toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("webp")) return "webp";
  return "png";
}

export default {
  fetch: withSupabase(
    { auth: ["user", "secret"] },
    async (req, ctx) => {
      if (req.method === "OPTIONS") {
        return new Response("ok", { status: 200, headers: corsHeaders });
      }
      if (req.method !== "POST") {
        return json({ success: false, error: "POST required." }, 405);
      }

      const adminClient = ctx.supabaseAdmin;

      const requestBody = await req.json().catch(() => ({}));
      const targetJunctionStockId = Number(requestBody?.junction_stock_id || 0);


      // Google Workload Identity Federation needs a real Supabase Auth user JWT.
      // Browser/admin calls already have one. Automatic secret-key calls sign in
      // as the dedicated AnyBike buyer-safe worker user and use that JWT.
      let googleSubjectToken = "";

      // Supabase validates both supported call paths for us:
      // - authMode "secret": database/pg_net automation using the `apikey` header.
      // - authMode "user": signed-in AnyBike admin using the Authorization bearer token.
      //
      // Verify JWT remains OFF at the Edge Function platform setting because
      // this function intentionally supports secret-key service calls as well
      // as signed-in user calls.
      if (ctx.authMode === "secret") {
        const workerPassword =
          Deno.env.get("ANYBIKE_BUYER_SAFE_WORKER_PASSWORD") || "";
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const publicKey =
          Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
          Deno.env.get("SUPABASE_ANON_KEY") ||
          "";

        if (!workerPassword || !supabaseUrl || !publicKey) {
          return json(
            {
              success: false,
              error:
                "Buyer-safe worker login is not configured. Check ANYBIKE_BUYER_SAFE_WORKER_PASSWORD and the Supabase public key environment variables.",
            },
            500,
          );
        }

        let workerLogin: any = null;
        let workerLoginStatus = 0;
        let workerLoginError = "Unknown worker login error.";

        /*
         * Automatic workers may be launched concurrently. Supabase Auth can
         * occasionally return a transient 429/5xx/504 or network failure.
         * Retry those transient failures locally instead of failing the image
         * queue invocation immediately.
         */
        for (let attempt = 1; attempt <= 4; attempt++) {
          try {
            const workerLoginResponse = await fetch(
              `${supabaseUrl}/auth/v1/token?grant_type=password`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  apikey: publicKey,
                },
                body: JSON.stringify({
                  email: "buyer-safe-worker@anybike.co.uk",
                  password: workerPassword,
                }),
              },
            );

            workerLoginStatus = workerLoginResponse.status;
            workerLogin = await workerLoginResponse.json().catch(() => null);

            if (workerLoginResponse.ok && workerLogin?.access_token) {
              googleSubjectToken = String(workerLogin.access_token);
              break;
            }

            workerLoginError = String(
              workerLogin?.error_description ||
                workerLogin?.msg ||
                workerLogin?.error ||
                `HTTP ${workerLoginResponse.status}`,
            );

            const transient =
              workerLoginResponse.status === 429 ||
              workerLoginResponse.status >= 500;

            if (!transient || attempt === 4) {
              break;
            }
          } catch (error) {
            workerLoginError = errorMessage(error);

            if (attempt === 4) {
              break;
            }
          }

          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, attempt - 1))
          );
        }

        if (!googleSubjectToken) {
          return json(
            {
              success: false,
              error:
                "Buyer-safe worker login failed after retries: " +
                workerLoginError +
                (workerLoginStatus ? ` (HTTP ${workerLoginStatus})` : ""),
            },
            500,
          );
        }
      }

      if (ctx.authMode === "user") {
        const authorization = req.headers.get("Authorization") || "";
        const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();

        if (!accessToken) {
          return json(
            { success: false, error: "Admin authorisation token was not received." },
            401,
          );
        }

        googleSubjectToken = accessToken;

        const {
          data: { user },
          error: userError,
        } = await adminClient.auth.getUser(accessToken);

        if (userError || !user) {
          return json(
            {
              success: false,
              error: userError?.message || "Admin login token is invalid.",
            },
            401,
          );
        }

        const { data: adminUser, error: adminError } = await adminClient
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .eq("active", true)
          .maybeSingle();

        if (adminError) {
          return json(
            {
              success: false,
              error: "Admin authorisation check failed: " + adminError.message,
            },
            500,
          );
        }

        if (!adminUser) {
          return json(
            { success: false, error: "Active AnyBike admin access is required." },
            403,
          );
        }
      }

      if (!googleSubjectToken) {
        return json(
          {
            success: false,
            error: "Google WIF subject token is unavailable.",
          },
          500,
        );
      }

      const googleVisionApiKey = Deno.env.get("GOOGLE_VISION_API_KEY") || "";
      if (!googleVisionApiKey) {
        return json(
          {
            success: false,
            error: "GOOGLE_VISION_API_KEY is not configured in Edge Function secrets.",
          },
          500,
        );
      }

      // First backfill an original archive for any already-safe image that predates V11C.
      // This does NOT rerun Vision or Gemini and therefore does not incur another AI edit cost.
      let archiveQuery = adminClient
        .from("junction_stock_images")
        .select("id,junction_stock_id,position,source_url,buyer_safe_status,buyer_safe_url,source_archive_url")
        .eq("buyer_safe_status", "safe")
        .not("source_url", "is", null)
        .is("source_archive_url", null)
        .order("buyer_safe_processed_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1);

      if (targetJunctionStockId > 0) {
        archiveQuery = archiveQuery.eq("junction_stock_id", targetJunctionStockId);
      }

      const { data: archiveJob, error: archiveJobError } = await archiveQuery.maybeSingle();

      if (archiveJobError) {
        return json({ success: false, error: archiveJobError.message }, 500);
      }

      if (archiveJob) {
        try {
          const download = await fetch(archiveJob.source_url, {
            redirect: "follow",
            headers: {
              "User-Agent": "AnyBike Buyer Safe Image Processor/2.0",
              Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
            },
          });

          if (!download.ok) {
            throw new Error(`Supplier image returned HTTP ${download.status}`);
          }

          const contentType = download.headers.get("content-type") || "";
          if (contentType && !contentType.toLowerCase().startsWith("image/")) {
            throw new Error(`Supplier URL returned ${contentType} instead of an image.`);
          }

          const inputBytes = new Uint8Array(await download.arrayBuffer());
          if (!inputBytes.length) {
            throw new Error("The downloaded supplier image was empty.");
          }

          const archived = await archiveOriginalSourceImage(
            adminClient,
            archiveJob,
            inputBytes,
            contentType || "image/jpeg",
          );

          return json({
            success: true,
            processed: 1,
            archived_only: true,
            image_id: archiveJob.id,
            junction_stock_id: archiveJob.junction_stock_id,
            source_image_hash: archived.hash,
            source_archive_url: archived.publicUrl,
            message:
              "Original supplier image archived successfully. Existing buyer-safe image was preserved and Gemini was not rerun.",
          });
        } catch (error) {
          return json(
            {
              success: false,
              processed: 0,
              image_id: archiveJob.id,
              error: errorMessage(error),
            },
            500,
          );
        }
      }

      // Atomically claim exactly one waiting active image. The database function
      // uses FOR UPDATE SKIP LOCKED so simultaneous automatic worker calls
      // cannot claim the same supplier image.
      const claimFunction = targetJunctionStockId > 0
        ? "anybike_claim_buyer_safe_image_v1"
        : "anybike_claim_next_buyer_safe_image";
      const claimArgs = targetJunctionStockId > 0
        ? { p_junction_stock_id: targetJunctionStockId }
        : undefined;

      const { data: claimedRows, error: jobError } = await adminClient
        .rpc(claimFunction, claimArgs);

      if (jobError) {
        return json({ success: false, error: jobError.message }, 500);
      }

      const claimed = Array.isArray(claimedRows) ? claimedRows[0] : null;
      if (!claimed) {
        return json({
          success: true,
          processed: 0,
          message: targetJunctionStockId > 0
            ? "This motorcycle has no waiting buyer-safe image to process."
            : "There are no waiting buyer-safe images and no originals need archiving.",
        });
      }

      const job = {
        ...claimed,
        position: claimed.image_position,
      };

      try {
        // Resolve this Junction stock image back to its supplying dealer.
        const { data: sourceLink, error: sourceLinkError } = await adminClient
          .from("stock_source_links")
          .select("dealer_stock_master_id")
          .eq("junction_stock_id", job.junction_stock_id)
          .order("id", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (sourceLinkError || !sourceLink?.dealer_stock_master_id) {
          throw new Error(
            "Could not identify the dealer stock record for this image: " +
              (sourceLinkError?.message || "no stock source link"),
          );
        }

        const { data: dealerStock, error: dealerStockError } = await adminClient
          .from("dealer_stock_master")
          .select("dealer_organisation_id")
          .eq("id", sourceLink.dealer_stock_master_id)
          .maybeSingle();

        if (dealerStockError || !dealerStock?.dealer_organisation_id) {
          throw new Error(
            "Could not identify the supplying dealer organisation: " +
              (dealerStockError?.message || "dealer organisation missing"),
          );
        }

        const dealerOrganisationId = Number(dealerStock.dealer_organisation_id);

        const { data: aliasesData, error: aliasesError } = await adminClient
          .from("dealer_identity_aliases")
          .select("alias_text")
          .eq("dealer_organisation_id", dealerOrganisationId)
          .eq("active", true)
          .order("id", { ascending: true });

        if (aliasesError) {
          throw new Error("Could not load dealer identity aliases: " + aliasesError.message);
        }

        const aliases = (aliasesData || [])
          .map((row: { alias_text?: string }) => row.alias_text || "")
          .filter(Boolean);

        if (!aliases.length) {
          throw new Error(
            `No active dealer identity aliases exist for dealer organisation ${dealerOrganisationId}.`,
          );
        }

        const download = await fetch(job.source_url, {
          redirect: "follow",
          headers: {
            "User-Agent": "AnyBike Buyer Safe Image Processor/2.0",
            Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
          },
        });

        if (!download.ok) {
          throw new Error(`Supplier image returned HTTP ${download.status}`);
        }

        const contentType = download.headers.get("content-type") || "";
        if (contentType && !contentType.toLowerCase().startsWith("image/")) {
          throw new Error(
            `Supplier URL returned ${contentType} instead of an image.`,
          );
        }

        const inputBytes = new Uint8Array(await download.arrayBuffer());
        if (!inputBytes.length) {
          throw new Error("The downloaded supplier image was empty.");
        }
        if (inputBytes.length > 10_000_000) {
          throw new Error("The supplier image is larger than 10 MB.");
        }

        // Preserve the exact source bytes before Vision/Gemini touch anything.
        const archivedSource = await archiveOriginalSourceImage(
          adminClient,
          job,
          inputBytes,
          contentType || "image/jpeg",
        );

        // Stop immediately when the supplier has supplied known placeholder
        // artwork instead of a genuine motorcycle photograph. This rule is
        // deliberately provider-neutral: the same artwork may arrive through
        // Deep Blue, Dealerwebs or another stock feed.
        if (isKnownSourcePlaceholderHash(archivedSource.hash)) {
          const classifiedAt = new Date().toISOString();
          const { error: placeholderError } = await adminClient
            .from("junction_stock_images")
            .update({
              buyer_safe_status: "source_placeholder",
              buyer_safe_storage_path: null,
              buyer_safe_url: null,
              buyer_safe_error: null,
              buyer_safe_processed_at: null,
              buyer_safe_updated_at: classifiedAt,
              moderation_status: "approved",
              identity_sanitisation_status: "clean",
              quality_status: "poor_placeholder",
              approved_for_buyer_display: false,
              placeholder_reason: "Known dealer/supplier placeholder artwork",
            })
            .eq("id", job.id);

          if (placeholderError) {
            throw new Error(
              "Could not classify known source placeholder: " +
                placeholderError.message,
            );
          }

          return json({
            success: true,
            processed: 1,
            image_id: job.id,
            junction_stock_id: job.junction_stock_id,
            dealer_organisation_id: dealerOrganisationId,
            source_placeholder: true,
            buyer_safe_status: "source_placeholder",
            source_image_hash: archivedSource.hash,
            source_archive_url: archivedSource.publicUrl,
            source_archive_storage_path: archivedSource.storagePath,
            message:
              "Known supplier/dealer placeholder artwork was detected by source-image hash. The original was archived, no Vision/Gemini processing was run, and the buyer-facing stock layer will use the AnyBike system placeholder.",
          });
        }

        let vision: Awaited<ReturnType<typeof inspectWithGoogleVision>> | null = null;
        let googleAccessToken = "";
        let detectorMethod = "google-vision";
        let rawRegions: Box[] = [];

        try {
          vision = await inspectWithGoogleVision(
            inputBytes,
            googleVisionApiKey,
          );
        } catch (visionError) {
          const visionMessage = errorMessage(visionError);
          const quotaBlocked =
            /resource has been exhausted|quota|rate limit|429/i.test(visionMessage);
          if (!quotaBlocked) throw visionError;

          const federatedToken = await getGoogleFederatedToken(googleSubjectToken);
          googleAccessToken = await getGoogleServiceAccountToken(federatedToken);
          rawRegions = mergeBoxes(
            await detectSellerRegionsWithGemini(
              inputBytes,
              contentType || "image/jpeg",
              aliases,
              googleAccessToken,
            ),
          );
          detectorMethod = "gemini-fallback";
        }

        if (vision) {
          const safety = safeSearchDecision(vision.safeSearch);
          if (safety.status !== "approved") {
            const now = new Date().toISOString();
            await adminClient
              .from("junction_stock_images")
              .update({
                buyer_safe_status: "failed",
                buyer_safe_url: null,
                buyer_safe_storage_path: null,
                buyer_safe_error: ("Image moderation " + safety.status + ": " + safety.reason).slice(0, 1000),
                buyer_safe_updated_at: now,
                moderation_status: safety.status,
                identity_sanitisation_status: "pending",
                quality_status: "pending",
                approved_for_buyer_display: false,
                placeholder_reason: "Image held by content moderation",
              })
              .eq("id", job.id);

            return json({
              success: true,
              processed: 1,
              image_id: job.id,
              junction_stock_id: job.junction_stock_id,
              moderation_status: safety.status,
              message: "Image was not approved for buyer display: " + safety.reason,
            });
          }

          if (looksLikeDealerPlaceholder(vision.textAnnotations)) {
            const now = new Date().toISOString();
            await adminClient
              .from("junction_stock_images")
              .update({
                buyer_safe_status: "source_placeholder",
                buyer_safe_url: null,
                buyer_safe_storage_path: null,
                buyer_safe_error: null,
                buyer_safe_updated_at: now,
                moderation_status: "approved",
                identity_sanitisation_status: "clean",
                quality_status: "poor_placeholder",
                approved_for_buyer_display: false,
                placeholder_reason: "Dealer placeholder/coming-soon artwork detected",
              })
              .eq("id", job.id);

            return json({
              success: true,
              processed: 1,
              image_id: job.id,
              junction_stock_id: job.junction_stock_id,
              source_placeholder: true,
              message: "Dealer placeholder artwork/text detected. AnyBike Awaiting Image will be used.",
            });
          }

          rawRegions = mergeBoxes([
            ...findSellerRegions(
              vision.textAnnotations,
              vision.logoAnnotations,
              aliases,
            ),
            ...findCommercialTextRegions(vision.textAnnotations),
          ]);
        }

        // Hard buyer-safe gate: a visible QR code can route the buyer back to
        // the supplying dealer, advert, campaign page, or another source identity.
        // Do not repair or blur it; reject this source photo and use another angle.
        if (!googleAccessToken) {
          const federatedToken = await getGoogleFederatedToken(googleSubjectToken);
          googleAccessToken = await getGoogleServiceAccountToken(federatedToken);
        }
        const qrCheck = await detectQrCodeWithGemini(
          inputBytes,
          contentType || "image/jpeg",
          googleAccessToken,
        );
        if (qrCheck.detected) {
          const now = new Date().toISOString();
          const { error: qrUpdateError } = await adminClient
            .from("junction_stock_images")
            .update({
              buyer_safe_status: "failed",
              buyer_safe_url: null,
              buyer_safe_storage_path: null,
              buyer_safe_error: ("QR code blocked from buyer-safe image: " + qrCheck.reason).slice(0, 1000),
              buyer_safe_updated_at: now,
              moderation_status: "approved",
              identity_sanitisation_status: "pending",
              quality_status: "usable",
              approved_for_buyer_display: false,
              placeholder_reason: "QR code detected — source identity/link risk",
            })
            .eq("id", job.id);

          if (qrUpdateError) {
            throw new Error("Could not block QR-code image: " + qrUpdateError.message);
          }

          return json({
            success: true,
            processed: 1,
            image_id: job.id,
            junction_stock_id: job.junction_stock_id,
            qr_code_blocked: true,
            message: "QR code detected. This source photo was blocked from buyer display and AnyBike will use another clean image where available.",
          });
        }

        const quality = imageQualityDecision(inputBytes);
        if (quality.status !== "usable") {
          const now = new Date().toISOString();
          await adminClient
            .from("junction_stock_images")
            .update({
              buyer_safe_status: "failed",
              buyer_safe_url: null,
              buyer_safe_storage_path: null,
              buyer_safe_error: ("Image quality review required: " + quality.reason).slice(0, 1000),
              buyer_safe_updated_at: now,
              moderation_status: "approved",
              identity_sanitisation_status: "pending",
              quality_status: "review_required",
              approved_for_buyer_display: false,
              placeholder_reason: "Image quality requires review",
            })
            .eq("id", job.id);

          return json({
            success: true,
            processed: 1,
            image_id: job.id,
            junction_stock_id: job.junction_stock_id,
            quality_status: "review_required",
            message: quality.reason,
          });
        }

        // Keep all image manipulation off the Supabase CPU.
        // Google Vision does detection and Gemini does the actual visual repair.
        let outputBytes = inputBytes;
        let outputMimeType = contentType || "image/jpeg";
        let editMethod = "unchanged-no-seller-branding-detected";
        let repairRegions: Box[] = [];

        if (rawRegions.length) {
          if (!googleAccessToken) {
            const federatedToken = await getGoogleFederatedToken(googleSubjectToken);
            googleAccessToken = await getGoogleServiceAccountToken(
              federatedToken,
            );
          }

          let edited = await repairSellerBrandingLocally(
            inputBytes,
            contentType || "image/jpeg",
            rawRegions,
            aliases,
            googleAccessToken,
          );

          let qa = await verifyFramingWithGemini(
            inputBytes,
            contentType || "image/jpeg",
            edited.bytes,
            edited.mimeType,
            googleAccessToken,
          );

          if (!qa.composition_preserved) {
            throw new Error(
              `Buyer-safe edit rejected: framing/composition changed. ${qa.reason}`,
            );
          }

          if (!qa.motorcycle_unchanged) {
            throw new Error(
              `Buyer-safe edit rejected: motorcycle changed. ${qa.reason}`,
            );
          }

          // Seller-branding QA is grounded in Google Vision + the supplying
          // dealer's approved aliases. If verified dealer branding remains after
          // the first local repair, make ONE more tightly targeted repair pass
          // around only those remaining verified regions. This avoids manual
          // intervention for stubborn dealer boards while keeping a hard limit
          // on AI edits.
          let remainingSellerRegions: Box[] = [];
          try {
            const editedVision = await inspectWithGoogleVision(
              edited.bytes,
              googleVisionApiKey,
            );
            remainingSellerRegions = findSellerRegions(
              editedVision.textAnnotations,
              editedVision.logoAnnotations,
              aliases,
            );
          } catch (visionError) {
            const visionMessage = errorMessage(visionError);
            if (!/resource has been exhausted|quota|rate limit|429/i.test(visionMessage)) {
              throw visionError;
            }
            remainingSellerRegions = mergeBoxes(
              await detectSellerRegionsWithGemini(
                edited.bytes,
                edited.mimeType,
                aliases,
                googleAccessToken,
              ),
            );
            detectorMethod = "gemini-fallback";
          }

          let allRepairRegions = [...edited.repairRegions];
          let repairPasses = 1;

          if (remainingSellerRegions.length) {
            const secondPass = await repairSellerBrandingLocally(
              edited.bytes,
              edited.mimeType,
              remainingSellerRegions,
              aliases,
              googleAccessToken,
            );

            repairPasses = 2;
            allRepairRegions = [
              ...allRepairRegions,
              ...secondPass.repairRegions,
            ];

            // Compare the final two-pass result against the untouched original,
            // not against the first edit.
            qa = await verifyFramingWithGemini(
              inputBytes,
              contentType || "image/jpeg",
              secondPass.bytes,
              secondPass.mimeType,
              googleAccessToken,
            );

            if (!qa.composition_preserved) {
              throw new Error(
                `Buyer-safe edit rejected after second repair pass: framing/composition changed. ${qa.reason}`,
              );
            }

            if (!qa.motorcycle_unchanged) {
              throw new Error(
                `Buyer-safe edit rejected after second repair pass: motorcycle changed. ${qa.reason}`,
              );
            }

            edited = secondPass;

            try {
              const editedVision = await inspectWithGoogleVision(
                edited.bytes,
                googleVisionApiKey,
              );
              remainingSellerRegions = findSellerRegions(
                editedVision.textAnnotations,
                editedVision.logoAnnotations,
                aliases,
              );
            } catch (visionError) {
              const visionMessage = errorMessage(visionError);
              if (!/resource has been exhausted|quota|rate limit|429/i.test(visionMessage)) {
                throw visionError;
              }
              remainingSellerRegions = mergeBoxes(
                await detectSellerRegionsWithGemini(
                  edited.bytes,
                  edited.mimeType,
                  aliases,
                  googleAccessToken,
                ),
              );
              detectorMethod = "gemini-fallback";
            }
          }

          if (remainingSellerRegions.length) {
            const remainingReasons = remainingSellerRegions
              .map((region) => region.reason)
              .slice(0, 10)
              .join("; ");
            throw new Error(
              `Buyer-safe edit rejected: verified selling-dealer branding remains after ${repairPasses} repair pass(es) (${remainingReasons}).`,
            );
          }

          outputBytes = edited.bytes;
          outputMimeType = edited.mimeType;
          repairRegions = allRepairRegions;
          editMethod = (repairPasses === 2
            ? "gemini-local-patch-original-canvas-two-pass-strict-qa"
            : "gemini-local-patch-original-canvas-strict-qa") +
            (detectorMethod === "gemini-fallback" ? "-gemini-detector-fallback" : "");
        }

        if (!outputBytes.length) {
          throw new Error("Buyer-safe image output was empty.");
        }

        const sourceDimensions = readImageDimensions(inputBytes);
        const finalDimensions = readImageDimensions(outputBytes);
        if (
          sourceDimensions &&
          (
            !finalDimensions ||
            finalDimensions.width !== sourceDimensions.width ||
            finalDimensions.height !== sourceDimensions.height
          )
        ) {
          throw new Error(
            `FINAL SIZE GATE: buyer-safe image must exactly match source dimensions (${sourceDimensions.width}x${sourceDimensions.height}); got ${
              finalDimensions
                ? `${finalDimensions.width}x${finalDimensions.height}`
                : "unknown"
            }. Output rejected.`,
          );
        }

        const position = Number(job.position ?? 0);
        const extension = extensionForMime(outputMimeType);
        const versionTag = Date.now();
        const filename =
          `${job.junction_stock_id}-${position}-${job.id}-${versionTag}.${extension}`;
        const storagePath =
          `buyer-safe/${job.junction_stock_id}/${filename}`;

        const { error: uploadError } = await adminClient.storage
          .from("motorcycles")
          .upload(storagePath, outputBytes, {
            contentType: outputMimeType,
            cacheControl: "31536000",
            upsert: false,
          });

        if (uploadError) {
          throw new Error("Storage upload failed: " + uploadError.message);
        }

        const { data: publicData } = adminClient.storage
          .from("motorcycles")
          .getPublicUrl(storagePath);

        const safeUrl = publicData.publicUrl;
        if (!safeUrl) {
          throw new Error("Could not create buyer-safe public image URL.");
        }

        const finishedAt = new Date().toISOString();
        const { error: completeError } = await adminClient
          .from("junction_stock_images")
          .update({
            buyer_safe_status: "safe",
            buyer_safe_storage_path: storagePath,
            buyer_safe_url: safeUrl,
            buyer_safe_error: null,
            buyer_safe_processed_at: finishedAt,
            buyer_safe_updated_at: finishedAt,
            moderation_status: "approved",
            identity_sanitisation_status: rawRegions.length ? "sanitised" : "clean",
            quality_status: "usable",
            approved_for_buyer_display: true,
            placeholder_reason: null,
          })
          .eq("id", job.id);

        if (completeError) {
          throw new Error(
            "Could not complete buyer-safe image: " + completeError.message,
          );
        }

        return json({
          success: true,
          processed: 1,
          image_id: job.id,
          junction_stock_id: job.junction_stock_id,
          dealer_organisation_id: dealerOrganisationId,
          buyer_safe_url: safeUrl,
          source_image_hash: archivedSource.hash,
          source_archive_url: archivedSource.publicUrl,
          source_archive_storage_path: archivedSource.storagePath,
          detected_seller_region_count: rawRegions.length,
          detected_seller_regions: rawRegions.map((b) => ({
            x1: b.x1,
            y1: b.y1,
            x2: b.x2,
            y2: b.y2,
            reason: b.reason,
          })),
          repair_patch_count: repairRegions.length,
          repair_patch_regions: repairRegions.map((b) => ({
            x1: b.x1,
            y1: b.y1,
            x2: b.x2,
            y2: b.y2,
            reason: b.reason,
          })),
          edit_method: editMethod,
          message: rawRegions.length
            ? `One buyer-safe image was created using local Gemini repair pasted back onto the original canvas. ${rawRegions.length} seller-identifying region(s) produced ${repairRegions.length} repair patch(es).`
            : "One buyer-safe image was created unchanged because no seller-identifying dealer alias/logo was detected.",
        });
      } catch (error) {
        const message = errorMessage(error);
        await adminClient
          .from("junction_stock_images")
          .update({
            buyer_safe_status: "failed",
            buyer_safe_error: message.slice(0, 1000),
            buyer_safe_updated_at: new Date().toISOString(),
            approved_for_buyer_display: false,
          })
          .eq("id", job.id);

        return json(
          {
            success: false,
            processed: 0,
            image_id: job.id,
            error: message,
          },
          500,
        );
      }
    },
  ),
};
