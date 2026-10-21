
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://www.anybike.co.uk",
  "https://anybike.co.uk"
]);

function cors(req: Request) {
  const origin = req.headers.get("origin") || "";

  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin)
      ? origin
      : "https://www.anybike.co.uk",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...cors(req),
      "Content-Type": "application/json"
    }
  });
}

function esc(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tidyGivenName(value: string) {
  const name = String(value || "")
    .trim()
    .toLocaleLowerCase("en-GB");

  return name.replace(
    /(^|[-'’])([a-zà-öø-ÿ])/g,
    (_match, prefix, letter) =>
      prefix + letter.toLocaleUpperCase("en-GB")
  );
}

function preferredFirstName(fullName: string) {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "";

  const first = parts[0];
  const second = parts[1] || "";

  const surnameFirst =
    parts.length > 1 &&
    first === first.toLocaleUpperCase("en-GB") &&
    first !== first.toLocaleLowerCase("en-GB") &&
    /[a-zà-öø-ÿ]/.test(second);

  return tidyGivenName(surnameFirst ? second : first);
}

function isSuitableFirstName(value: string) {
  const name = String(value || "").trim();

  if (!name || name.length > 40) return false;

  const genericNames = new Set([
    "dealer",
    "dealership",
    "customer",
    "user",
    "unknown",
    "there",
    "admin",
    "sales",
    "info",
    "support",
    "motorcycles",
    "motorcycle",
    "motors",
    "limited",
    "ltd"
  ]);

  return (
    /^[\p{L}\p{M}'’-]+$/u.test(name) &&
    !genericNames.has(name.toLowerCase())
  );
}

function serviceClient() {
  const secretsRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  let secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (secretsRaw) {
    try {
      const parsed = JSON.parse(secretsRaw);
      secret = parsed.default || secret;
    } catch {
      // Continue with the existing service credential.
    }
  }

  if (!secret) {
    throw new Error("Server credential unavailable");
  }

  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    secret,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors(req) });
  }

  if (req.method !== "POST") {
    return json(
      req,
      { success: false, error: "Method not allowed" },
      405
    );
  }

  try {
    // Verify the signed-in AnyBike administrator.
    const authHeader =
      req.headers.get("Authorization") || "";

    const accessToken = authHeader
      .replace(/^Bearer\s+/i, "")
      .trim();

    if (!accessToken) {
      return json(
        req,
        {
          success: false,
          error: "Admin authentication required"
        },
        401
      );
    }

    const supabase = serviceClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return json(
        req,
        {
          success: false,
          error: "Admin authentication required"
        },
        401
      );
    }

    const { data: admin, error: adminError } =
      await supabase
        .from("admin_users")
        .select("user_id,active")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

    if (adminError) throw adminError;

    if (!admin) {
      return json(
        req,
        {
          success: false,
          error: "Admin access required"
        },
        403
      );
    }

    // Read the requested customer and existing message.
    const body = await req.json().catch(() => ({}));

    const userId = String(body?.user_id || "").trim();
    const threadId = Number(body?.thread_id || 0);

    const linkPath = String(
      body?.link || "/customer-dashboard.html"
    ).trim();

    const title = String(
      body?.title || "Complete your AnyBike setup"
    ).trim();

    if (!userId || !threadId) {
      return json(
        req,
        {
          success: false,
          error: "Customer and message thread are required"
        },
        400
      );
    }

    const { data: target, error: targetError } =
      await supabase.auth.admin.getUserById(userId);

    if (targetError || !target?.user) {
      return json(
        req,
        {
          success: false,
          error: "Customer account not found"
        },
        404
      );
    }

    const { data: thread, error: threadError } =
      await supabase
        .from("message_centre_threads")
        .select(
          "id,customer_id,customer_name,customer_email,last_message"
        )
        .eq("id", threadId)
        .eq("customer_id", userId)
        .maybeSingle();

    if (threadError) throw threadError;

    if (!thread) {
      return json(
        req,
        {
          success: false,
          error: "Onboarding message thread not found"
        },
        404
      );
    }

    const email = String(
      thread.customer_email ||
      target.user.email ||
      ""
    ).trim();

    if (!email) {
      return json(
        req,
        {
          success: false,
          error: "Customer email is missing"
        },
        400
      );
    }

    const customerName = String(
      thread.customer_name ||
      target.user.user_metadata?.full_name ||
      ""
    ).trim();

    const firstName = preferredFirstName(customerName);

    const message = String(
      thread.last_message ||
      "Please continue your AnyBike account setup."
    ).trim();

    // Dealer invitations get their own concise,
    // friendly wording. Other onboarding emails
    // retain their existing message and destination.
    const dealerInvite = /dealer services/i.test(title);

    const emailTitle = dealerInvite
      ? "Welcome to AnyBike"
      : title;

    // For dealer invitations, prefer a neutral
    // greeting rather than guessing a first name
    // from a dealership or company name.
    const greeting = dealerInvite
      ? "Hello,"
      : isSuitableFirstName(firstName)
        ? `Hi ${firstName},`
        : "Hello,";

    const emailMessage = dealerInvite
      ? "Thank you for joining AnyBike. We'd like to know which of our services would be useful to your dealership, from buying and selling motorcycles to trade underwriting and international opportunities. Simply select the services that interest you using our short form. You can choose as many as you like, and there's no obligation."
      : message;

    const buttonText = dealerInvite
      ? "Choose Your Dealer Services →"
      : "Continue Your AnyBike Setup";

    const eyebrowText = dealerInvite
      ? "AnyBike · UK Dealer Services"
      : "Account Setup";

    // The dealer button takes customers directly
    // to the questionnaire after authentication.
    let returnPath = dealerInvite
      ? "/uk-dealer-services.html"
      : linkPath;

    if (returnPath.startsWith("http")) {
      try {
        const parsed = new URL(returnPath);
        returnPath =
          parsed.pathname +
          parsed.search +
          parsed.hash;
      } catch {
        returnPath = "/customer-profile.html";
      }
    }

    if (
      !returnPath.startsWith("/") ||
      returnPath.startsWith("//") ||
      returnPath.toLowerCase().includes("admin-")
    ) {
      returnPath = "/customer-profile.html";
    }

    // Generate the existing protected setup link.
    const { data: setupLink, error: setupLinkError } =
      await supabase
        .from("customer_setup_links")
        .insert({
          customer_id: userId,
          return_path: returnPath,
          created_by: user.id
        })
        .select("token,return_path")
        .single();

    if (setupLinkError || !setupLink?.token) {
      throw (
        setupLinkError ||
        new Error("Could not create protected setup link")
      );
    }

    const loginParams = new URLSearchParams();

    loginParams.set(
      "setup",
      String(setupLink.token)
    );

    loginParams.set(
      "return",
      String(setupLink.return_path || returnPath)
    );

    const setupUrl =
      "https://www.anybike.co.uk/customer-login.html?" +
      loginParams.toString();

    const resendApiKey =
      Deno.env.get("RESEND_API_KEY") || "";

    if (!resendApiKey) {
      return json(
        req,
        {
          success: false,
          error: "Email service is not configured"
        },
        503
      );
    }

    // Send one clean, responsive AnyBike email.
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f4">
<tr>
<td align="center" style="padding:24px 12px">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#fff;border:1px solid #ddd;border-radius:10px;overflow:hidden">

<tr>
<td align="center" style="padding:22px 24px">
<img
src="https://www.anybike.co.uk/assets/Anybike-email-logo-white.png"
alt="AnyBike"
width="260"
style="display:block;width:100%;max-width:260px;height:auto;border:0"
>
</td>
</tr>

<tr>
<td style="height:4px;background:#ed1c24"></td>
</tr>

<tr>
<td style="padding:26px 28px 30px">

<div style="font-size:12px;font-weight:700;letter-spacing:1px;color:#ed1c24;text-transform:uppercase;margin-bottom:10px">
${esc(eyebrowText)}
</div>

<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#111">
${esc(emailTitle)}
</h1>

<p style="margin:0 0 18px;font-size:16px;line-height:1.6">
${esc(greeting)}
</p>

<p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#333;white-space:pre-line">
${esc(emailMessage)}
</p>

<p style="margin:0 0 26px">
<a
href="${esc(setupUrl)}"
style="display:inline-block;background:#ed1c24;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 22px;border-radius:7px;text-align:center"
>
${esc(buttonText)}
</a>
</p>

<p style="margin:0 0 5px;font-size:15px;line-height:1.6;color:#333">
We look forward to working with you.
</p>

<p style="margin:0;font-size:15px;line-height:1.6;color:#333">
Kind regards,<br>
<strong>The AnyBike Team</strong>
</p>

</td>
</tr>

<tr>
<td style="padding:19px 28px;background:#171717;color:#fff">
<div style="font-size:15px;font-weight:700">
AnyBike.co.uk
</div>
<div style="font-size:12px;line-height:1.6;color:#ccc;margin-top:5px">
Motorcycle sourcing, trade and export.
</div>
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: "AnyBike <no-reply@anybike.co.uk>",
          to: [email],
          subject: emailTitle,
          html
        })
      }
    );

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      return json(
        req,
        {
          success: false,
          error: "Setup email could not be sent",
          details: result
        },
        502
      );
    }

    return json(req, {
      success: true,
      email_id: result?.id || null,
      to: email
    });

  } catch (error) {
    return json(
      req,
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      },
      400
    );
  }
});
