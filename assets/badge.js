function generateBadge(username) {
  const profileUrl = window.location.href;

  document.getElementById("badge-preview").innerText =
    "TRUEX Verified — " + username;

  const embedCode = `
<a href="${profileUrl}" target="_blank" style="text-decoration:none;">
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

  document.getElementById("badge-embed-code").value = embedCode;
}

function copyBadge() {
  const textarea = document.getElementById("badge-embed-code");
  textarea.select();
  document.execCommand("copy");

  document.getElementById("copy-btn").innerText = "Copied ✓";
}
