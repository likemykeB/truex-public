function sanitizeProfileUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    url.searchParams.delete("v");
    return url.toString();
  } catch (e) {
    return urlStr;
  }
}

function generateBadge(username) {
  const profileUrlClean = sanitizeProfileUrl(window.location.href);

  const preview = document.getElementById("badge-preview");
  if (preview) preview.innerText = "TRUEX Verified — " + username;

  const embedCode = `
<a href="${profileUrlClean}" target="_blank" style="text-decoration:none;">
  <div style="
    display:inline-block;
    padding:10px 14px;
    border:1px solid #000;
    font-family:Arial,sans-serif;
    font-size:14px;
    background:#fff;
  ">
    TRUEX Verified — ${username}
  </div>
</a>`.trim();

  const ta = document.getElementById("badge-embed-code");
  if (ta) ta.value = embedCode;

  const btn = document.getElementById("copy-btn");
  if (btn) btn.innerText = "Copy Embed Code";
}

function copyBadge() {
  const textarea = document.getElementById("badge-embed-code");
  if (!textarea) return;

  textarea.select();
  textarea.setSelectionRange(0, 99999);
  document.execCommand("copy");

  const btn = document.getElementById("copy-btn");
  if (btn) btn.innerText = "Copied ✓";
}
