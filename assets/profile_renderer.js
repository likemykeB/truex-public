async function loadSeal() {
  try {
    const res = await fetch("../../latest/payload_seal.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Seal fetch failed");
    return await res.json();
  } catch (err) {
    console.error("Seal load error:", err);
    return null;
  }
}

function renderSealBlock(seal) {
  if (!seal) {
    return `
      <div class="seal-block">
        <h3>Verification Seal</h3>
        <p style="color:red;"><b>Seal not found.</b></p>
        <p>This profile cannot be verified because payload_seal.json is missing.</p>
      </div>
    `;
  }

  return `
    <div class="seal-block" style="margin-top:30px; padding:16px; border:1px solid #000; border-radius:8px;">
      <h3>Verification Seal</h3>
      <p><b>Seal Version:</b> ${seal.SealVersion}</p>
      <p><b>Engine:</b> ${seal.Engine}</p>
      <p><b>Run Timestamp (UTC):</b> ${seal.RunTsUtc}</p>
      <p><b>PayloadTreeHash:</b></p>
      <code style="word-break:break-all;">${seal.PayloadTreeHash}</code>
      <p style="margin-top:10px;"><b>SealSha256:</b></p>
      <code style="word-break:break-all;">${seal.SealSha256}</code>
      <p style="margin-top:10px;"><b>Baseline Commit:</b></p>
      <code style="word-break:break-all;">${seal.BaselineCommit}</code>
      <div style="margin-top:14px; font-size:13px; color:#444;">
        This seal proves that all public artifacts were deterministically generated and hash-locked at publish time.
        Anyone can independently recompute the PayloadTreeHash from the /latest directory.
      </div>
    </div>
  `;
}

async function initProfileSeal() {
  const container = document.getElementById("seal-container");
  if (!container) return;

  const seal = await loadSeal();
  container.innerHTML = renderSealBlock(seal);
}

document.addEventListener("DOMContentLoaded", initProfileSeal);
