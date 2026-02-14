function generateBadge(username) {
  const profileUrl = window.location.href;

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
  textarea.setSelectionRange(0, 99999);
  document.execCommand("copy");

  const btn = document.getElementById("copy-btn");
  btn.innerText = "Copied ✓";
}
