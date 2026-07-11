/* ==========================================================================
   AnyBike — admin-files.js
   Files v8.1 — Deal Files
   ========================================================================== */

(function () {
  "use strict";

  const DEAL_FILES_BUCKET = "deal-files";
  const DEFAULT_UPLOADED_BY = "Andy Gifford";

  const dragDepthByEnquiry = new Map();

  function getSupabaseClient() {
    if (typeof window.sb !== "undefined") {
      return window.sb;
    }

    if (typeof sb !== "undefined") {
      return sb;
    }

    throw new Error("Supabase client 'sb' was not found.");
  }

  function escapeHtml(value) {
    if (typeof window.escapeAdminHtml === "function") {
      return window.escapeAdminHtml(value);
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normaliseNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function getFileInput(enquiryId) {
    return document.getElementById(
      "deal-file-input-" + normaliseNumber(enquiryId)
    );
  }

  function getDropzone(enquiryId) {
    return document.getElementById(
      "deal-file-dropzone-" + normaliseNumber(enquiryId)
    );
  }

  function getStatusBox(enquiryId) {
    return document.getElementById(
      "deal-file-status-" + normaliseNumber(enquiryId)
    );
  }

  function getFileList(enquiryId) {
    return document.getElementById(
      "deal-files-list-" + normaliseNumber(enquiryId)
    );
  }

  function getCountBadge(enquiryId) {
    return document.getElementById(
      "deal-file-count-" + normaliseNumber(enquiryId)
    );
  }

  function setUploadStatus(enquiryId, message, type) {
    const statusBox = getStatusBox(enquiryId);

    if (!statusBox) {
      return;
    }

    statusBox.className = "deal-file-upload-status";
    statusBox.textContent = String(message || "");

    if (message) {
      statusBox.classList.add("show");
    }

    if (type === "success") {
      statusBox.classList.add("success");
    }

    if (type === "error") {
      statusBox.classList.add("error");
    }
  }

  function setUploading(enquiryId, isUploading) {
    const dropzone = getDropzone(enquiryId);

    if (!dropzone) {
      return;
    }

    dropzone.classList.toggle("uploading", Boolean(isUploading));
  }

  function updateCountBadge(enquiryId, count) {
    const badge = getCountBadge(enquiryId);

    if (!badge) {
      return;
    }

    const total = normaliseNumber(count);

    badge.textContent = total === 1 ? "1 File" : total + " Files";

    badge.classList.remove(
      "badge-green",
      "badge-grey",
      "badge-red"
    );

    badge.classList.add(total > 0 ? "badge-green" : "badge-grey");
  }

  function sanitiseFileName(fileName) {
    const cleaned = String(fileName || "file")
      .replace(/[^\w.\-() ]+/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");

    return cleaned || "file";
  }

  function createStoragePath(enquiryId, fileName) {
    const uniquePart =
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10);

    return (
      normaliseNumber(enquiryId) +
      "/" +
      uniquePart +
      "-" +
      sanitiseFileName(fileName)
    );
  }

  function formatFileSize(bytes) {
    const size = normaliseNumber(bytes);

    if (size < 1024) {
      return size + " B";
    }

    if (size < 1024 * 1024) {
      return (size / 1024).toFixed(1) + " KB";
    }

    if (size < 1024 * 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(1) + " MB";
    }

    return (size / (1024 * 1024 * 1024)).toFixed(1) + " GB";
  }

  function formatFileDate(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getExtension(fileName) {
    const name = String(fileName || "");
    const parts = name.split(".");

    return parts.length > 1
      ? String(parts.pop()).toLowerCase()
      : "";
  }

  function isImageFile(file) {
    return String(file.mime_type || "")
      .toLowerCase()
      .startsWith("image/");
  }

  function isPdfFile(file) {
    return (
      String(file.mime_type || "").toLowerCase() === "application/pdf" ||
      getExtension(file.file_name) === "pdf"
    );
  }

  function canPreviewFile(file) {
    return isImageFile(file) || isPdfFile(file);
  }

  function getFileIcon(file) {
    const mime = String(file.mime_type || "").toLowerCase();
    const extension = getExtension(file.file_name);

    if (mime.startsWith("image/")) {
      return "🖼️";
    }

    if (isPdfFile(file)) {
      return "📕";
    }

    if (
      mime.includes("word") ||
      extension === "doc" ||
      extension === "docx"
    ) {
      return "📝";
    }

    if (
      mime.includes("spreadsheet") ||
      mime.includes("excel") ||
      ["xls", "xlsx", "csv"].includes(extension)
    ) {
      return "📊";
    }

    if (["zip", "rar", "7z"].includes(extension)) {
      return "🗜️";
    }

    return "📄";
  }

  async function getFileRecord(fileId, enquiryId) {
    const client = getSupabaseClient();

    const result = await client
      .from("deal_files")
      .select(
        "id,enquiry_id,bike_id,file_name,storage_path,mime_type,file_size,uploaded_by,created_at"
      )
      .eq("id", normaliseNumber(fileId))
      .eq("enquiry_id", normaliseNumber(enquiryId))
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      throw new Error("File record not found.");
    }

    return result.data;
  }

  async function createSignedUrl(storagePath, expiresInSeconds) {
    const client = getSupabaseClient();

    const result = await client.storage
      .from(DEAL_FILES_BUCKET)
      .createSignedUrl(
        storagePath,
        normaliseNumber(expiresInSeconds) || 300
      );

    if (result.error) {
      throw result.error;
    }

    if (!result.data || !result.data.signedUrl) {
      throw new Error("Secure file link could not be created.");
    }

    return result.data.signedUrl;
  }

  function renderFileRows(enquiryId, files) {
    const list = getFileList(enquiryId);

    if (!list) {
      return;
    }

    if (!files.length) {
      list.innerHTML =
        '<div class="deal-file-empty">' +
        "No files have been uploaded to this deal yet." +
        "</div>";

      return;
    }

    list.innerHTML = files
      .map(function (file) {
        const fileId = normaliseNumber(file.id);
        const enquiry = normaliseNumber(enquiryId);

        return `
          <div class="deal-file-row" id="deal-file-row-${fileId}">
            <div class="deal-file-icon">
              ${getFileIcon(file)}
            </div>

            <div class="deal-file-info">
              <span
                class="deal-file-name"
                title="${escapeHtml(file.file_name)}">
                ${escapeHtml(file.file_name)}
              </span>

              <div class="deal-file-meta">
                <span>${escapeHtml(file.mime_type || "Unknown type")}</span>
                <span>${formatFileSize(file.file_size)}</span>
                <span>${formatFileDate(file.created_at)}</span>

                ${
                  file.uploaded_by
                    ? `<span>Uploaded by ${escapeHtml(file.uploaded_by)}</span>`
                    : ""
                }
              </div>
            </div>

            <div class="deal-file-actions">
              ${
                canPreviewFile(file)
                  ? `
                    <button
                      type="button"
                      onclick="previewDealFile(${fileId},${enquiry});return false;">
                      👁 Preview
                    </button>
                  `
                  : ""
              }

              <button
                type="button"
                onclick="downloadDealFile(${fileId},${enquiry});return false;">
                ⬇ Download
              </button>

              <button
                type="button"
                class="deal-file-delete"
                onclick="deleteDealFile(${fileId},${enquiry});return false;">
                🗑 Delete
              </button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  async function loadDealFiles(enquiryId) {
    const id = normaliseNumber(enquiryId);
    const list = getFileList(id);
    const badge = getCountBadge(id);

    if (!id) {
      return;
    }

    if (list) {
      list.innerHTML =
        '<div class="deal-file-empty">Loading deal files…</div>';
    }

    if (badge) {
      badge.textContent = "Loading";
    }

    try {
      const client = getSupabaseClient();

      const result = await client
        .from("deal_files")
        .select(
          "id,enquiry_id,bike_id,file_name,storage_path,mime_type,file_size,uploaded_by,created_at"
        )
        .eq("enquiry_id", id)
        .order("created_at", {
          ascending: false
        });

      if (result.error) {
        throw result.error;
      }

      const files = result.data || [];

      updateCountBadge(id, files.length);
      renderFileRows(id, files);
    } catch (error) {
      console.error("Deal files load failed:", error);

      if (list) {
        list.innerHTML =
          '<div class="deal-file-empty">' +
          "Files could not be loaded: " +
          escapeHtml(error.message || "Unknown error") +
          "</div>";
      }

      if (badge) {
        badge.textContent = "Error";
        badge.classList.remove("badge-green", "badge-grey");
        badge.classList.add("badge-red");
      }
    }
  }

  async function uploadDealFiles(enquiryId, bikeId, fileList) {
    const id = normaliseNumber(enquiryId);
    const motorcycleId = normaliseNumber(bikeId);
    const files = Array.from(fileList || []);

    if (!id) {
      alert("This deal does not have a valid enquiry ID.");
      return;
    }

    if (!files.length) {
      return;
    }

    setUploading(id, true);
    setUploadStatus(
      id,
      "Preparing " +
        files.length +
        (files.length === 1 ? " file…" : " files…"),
      ""
    );

    const client = getSupabaseClient();
    const failures = [];
    let uploadedCount = 0;

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];

        setUploadStatus(
          id,
          "Uploading " +
            (index + 1) +
            " of " +
            files.length +
            ": " +
            file.name,
          ""
        );

        const storagePath = createStoragePath(id, file.name);

        const uploadResult = await client.storage
          .from(DEAL_FILES_BUCKET)
          .upload(storagePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type || undefined
          });

        if (uploadResult.error) {
          failures.push(
            file.name + ": " + uploadResult.error.message
          );
          continue;
        }

        const metadataResult = await client
          .from("deal_files")
          .insert({
            enquiry_id: id,
            bike_id: motorcycleId || null,
            file_name: file.name,
            storage_path: storagePath,
            mime_type: file.type || null,
            file_size: normaliseNumber(file.size),
            uploaded_by: DEFAULT_UPLOADED_BY
          });

        if (metadataResult.error) {
          await client.storage
            .from(DEAL_FILES_BUCKET)
            .remove([storagePath]);

          failures.push(
            file.name + ": " + metadataResult.error.message
          );
          continue;
        }

        uploadedCount++;
      }

      const input = getFileInput(id);

      if (input) {
        input.value = "";
      }

      await loadDealFiles(id);

      if (uploadedCount > 0 && failures.length === 0) {
        setUploadStatus(
          id,
          uploadedCount +
            (uploadedCount === 1
              ? " file uploaded successfully."
              : " files uploaded successfully."),
          "success"
        );
      } else if (uploadedCount > 0) {
        setUploadStatus(
          id,
          uploadedCount +
            " uploaded. " +
            failures.length +
            " failed.",
          "error"
        );

        console.error("Deal file upload failures:", failures);
      } else {
        setUploadStatus(
          id,
          "No files were uploaded. " +
            (failures[0] || "Unknown upload error."),
          "error"
        );

        console.error("Deal file upload failures:", failures);
      }

      if (typeof window.loadDealTimeline === "function") {
        window.loadDealTimeline(id);
      }
    } catch (error) {
      console.error("Deal file upload failed:", error);

      setUploadStatus(
        id,
        "Upload failed: " +
          (error.message || "Unknown error"),
        "error"
      );
    } finally {
      setUploading(id, false);
    }
  }

  function openDealFilePicker(enquiryId) {
    const input = getFileInput(enquiryId);

    if (input) {
      input.click();
    }
  }

  function handleDealFilePickerKey(event, enquiryId) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openDealFilePicker(enquiryId);
  }

  function handleDealFileDragEnter(event, enquiryId) {
    event.preventDefault();
    event.stopPropagation();

    const id = normaliseNumber(enquiryId);
    const currentDepth = dragDepthByEnquiry.get(id) || 0;

    dragDepthByEnquiry.set(id, currentDepth + 1);

    const dropzone = getDropzone(id);

    if (dropzone) {
      dropzone.classList.add("drag-active");
    }
  }

  function handleDealFileDragOver(event, enquiryId) {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }

    const dropzone = getDropzone(enquiryId);

    if (dropzone) {
      dropzone.classList.add("drag-active");
    }
  }

  function handleDealFileDragLeave(event, enquiryId) {
    event.preventDefault();
    event.stopPropagation();

    const id = normaliseNumber(enquiryId);
    const currentDepth = Math.max(
      0,
      (dragDepthByEnquiry.get(id) || 0) - 1
    );

    dragDepthByEnquiry.set(id, currentDepth);

    if (currentDepth > 0) {
      return;
    }

    const dropzone = getDropzone(id);

    if (dropzone) {
      dropzone.classList.remove("drag-active");
    }
  }

  function handleDealFileDrop(event, enquiryId, bikeId) {
    event.preventDefault();
    event.stopPropagation();

    const id = normaliseNumber(enquiryId);

    dragDepthByEnquiry.set(id, 0);

    const dropzone = getDropzone(id);

    if (dropzone) {
      dropzone.classList.remove("drag-active");
    }

    const files = event.dataTransfer
      ? event.dataTransfer.files
      : null;

    uploadDealFiles(id, bikeId, files);
  }

  function ensurePreviewModal() {
    let modal = document.getElementById(
      "deal-file-preview-modal"
    );

    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "deal-file-preview-modal";
    modal.className = "deal-file-preview-modal";

    modal.innerHTML = `
      <div
        class="deal-file-preview-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deal-file-preview-title">

        <div class="deal-file-preview-head">
          <div
            class="deal-file-preview-title"
            id="deal-file-preview-title">
            File preview
          </div>

          <button
            type="button"
            class="deal-file-preview-close"
            onclick="closeDealFilePreview();return false;"
            aria-label="Close file preview">
            ✕
          </button>
        </div>

        <div
          class="deal-file-preview-body"
          id="deal-file-preview-body">
        </div>
      </div>
    `;

    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeDealFilePreview();
      }
    });

    document.body.appendChild(modal);

    return modal;
  }

  function openPreviewModal(file, signedUrl) {
    const modal = ensurePreviewModal();
    const title = document.getElementById(
      "deal-file-preview-title"
    );
    const body = document.getElementById(
      "deal-file-preview-body"
    );

    if (!title || !body) {
      return;
    }

    title.textContent = file.file_name || "File preview";
    body.innerHTML = "";

    if (isImageFile(file)) {
      const image = document.createElement("img");
      image.src = signedUrl;
      image.alt = file.file_name || "Uploaded deal image";
      body.appendChild(image);
    } else if (isPdfFile(file)) {
      const frame = document.createElement("iframe");
      frame.src = signedUrl;
      frame.title = file.file_name || "PDF preview";
      body.appendChild(frame);
    } else {
      body.innerHTML =
        '<div class="deal-file-preview-unavailable">' +
        "Preview is not available for this file type." +
        "</div>";
    }

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeDealFilePreview() {
    const modal = document.getElementById(
      "deal-file-preview-modal"
    );
    const body = document.getElementById(
      "deal-file-preview-body"
    );

    if (modal) {
      modal.classList.remove("open");
    }

    if (body) {
      body.innerHTML = "";
    }

    document.body.style.overflow = "";
  }

  async function previewDealFile(fileId, enquiryId) {
    try {
      const file = await getFileRecord(fileId, enquiryId);

      if (!canPreviewFile(file)) {
        alert("Preview is not available for this file type.");
        return;
      }

      const signedUrl = await createSignedUrl(
        file.storage_path,
        600
      );

      openPreviewModal(file, signedUrl);
    } catch (error) {
      console.error("File preview failed:", error);

      alert(
        "Preview failed: " +
          (error.message || "Unknown error")
      );
    }
  }

  async function downloadDealFile(fileId, enquiryId) {
    try {
      const file = await getFileRecord(fileId, enquiryId);
      const signedUrl = await createSignedUrl(
        file.storage_path,
        120
      );

      const anchor = document.createElement("a");

      anchor.href = signedUrl;
      anchor.download = file.file_name || "deal-file";
      anchor.target = "_blank";
      anchor.rel = "noopener";

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("File download failed:", error);

      alert(
        "Download failed: " +
          (error.message || "Unknown error")
      );
    }
  }

  async function deleteDealFile(fileId, enquiryId) {
    let file;

    try {
      file = await getFileRecord(fileId, enquiryId);
    } catch (error) {
      alert(
        "The file could not be found: " +
          (error.message || "Unknown error")
      );
      return;
    }

    const confirmed = confirm(
      'Delete "' +
        file.file_name +
        '" permanently?\n\n' +
        "This removes the file from the deal and cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    const row = document.getElementById(
      "deal-file-row-" + normaliseNumber(fileId)
    );

    if (row) {
      row.style.opacity = ".45";
      row.style.pointerEvents = "none";
    }

    try {
      const client = getSupabaseClient();

      const storageResult = await client.storage
        .from(DEAL_FILES_BUCKET)
        .remove([file.storage_path]);

      if (storageResult.error) {
        throw storageResult.error;
      }

      const metadataResult = await client
        .from("deal_files")
        .delete()
        .eq("id", normaliseNumber(fileId))
        .eq("enquiry_id", normaliseNumber(enquiryId));

      if (metadataResult.error) {
        throw metadataResult.error;
      }

      setUploadStatus(
        enquiryId,
        file.file_name + " deleted.",
        "success"
      );

      await loadDealFiles(enquiryId);

      if (typeof window.loadDealTimeline === "function") {
        window.loadDealTimeline(enquiryId);
      }
    } catch (error) {
      console.error("File delete failed:", error);

      if (row) {
        row.style.opacity = "";
        row.style.pointerEvents = "";
      }

      setUploadStatus(
        enquiryId,
        "Delete failed: " +
          (error.message || "Unknown error"),
        "error"
      );
    }
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeDealFilePreview();
    }
  });

  window.openDealFilePicker = openDealFilePicker;
  window.handleDealFilePickerKey = handleDealFilePickerKey;
  window.handleDealFileDragEnter = handleDealFileDragEnter;
  window.handleDealFileDragOver = handleDealFileDragOver;
  window.handleDealFileDragLeave = handleDealFileDragLeave;
  window.handleDealFileDrop = handleDealFileDrop;
  window.uploadDealFiles = uploadDealFiles;
  window.loadDealFiles = loadDealFiles;
  window.previewDealFile = previewDealFile;
  window.downloadDealFile = downloadDealFile;
  window.deleteDealFile = deleteDealFile;
  window.closeDealFilePreview = closeDealFilePreview;
})();
