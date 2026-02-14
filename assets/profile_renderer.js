function getUsernameFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get("u");
}

function showError(msg) {
  const box = document.getElementById("error-box");
  if (!box) return;
  box.style.display = "block";
  box.textContent = msg;
}

// Compute correct relative base depending on where this page lives.
// - If URL contains "/verified/profile/" (folder route), we need "../../latest/..."
// - Otherwise ("/verified/profile.html"), we need "../latest/..."
function latestBasePath() {
  const path = window.location.pathname;
  if (path.includes("/verified/profile/")) return "../../latest";
  return "../latest";
}

async function fetchAnalytics(username) {
  const base = latestBasePath();
  const url = `${base}/analytics/${username}_analytics_latest.json`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch analytics JSON\nURL: ${url}\nHTTP: ${res.status} ${res.statusText}`
    );
  }
  return await res.json();
}

async function loadProfileDynamic() {
  const username = getUsernameFromQuery();

  if (!username) {
    showError("No user specified.\nExpected URL format:\n  /verified/profile/?u=<username>");
    return;
  }

  try {
    const data = await fetchAnalytics(username);

    if (!data || !data.username) {
      throw new Error("Analytics JSON parsed but missing required fields (username).");
    }

    document.getElementById("username").innerText = data.username;
    document.getElementById("verified-since").innerText =
      "Verified Since: " + (data.verified_since || "");

    document.getElementById("total-units").innerText = data.total_units ?? "";
    document.getElementById("roi").innerText = data.roi ?? "";
    document.getElementById("win-rate").innerText = data.win_rate ?? "";
    document.getElementById("clv").innerText = data.clv ?? "";
    document.getElementById("max-dd").innerText = data.max_drawdown ?? "";

    document.getElementById("seal").innerText =
      "PayloadTreeHash: " + (data.payload_tree_hash || "") +
      " | SealSha256: " + (data.seal_sha256 || "");

    const base = latestBasePath();
    const payloadLink = document.getElementById("payload-link");
    payloadLink.href = `${base}/analytics/${encodeURIComponent(username)}_analytics_latest.json`;

    if (Array.isArray(data.equity_curve) && data.equity_curve.length >= 2) {
      renderLineChart("equityChart", data.equity_curve);
    }

    if (Array.isArray(data.monthly_pnl) && data.monthly_pnl.length >= 2) {
      renderLineChart("monthlyChart", data.monthly_pnl);
    }

    const tbody = document.querySelector("#sport-breakdown tbody");
    tbody.innerHTML = "";

    if (Array.isArray(data.sport_breakdown)) {
      data.sport_breakdown.forEach(sport => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${sport.name ?? ""}</td>
          <td>${sport.units ?? ""}</td>
          <td>${sport.roi ?? ""}</td>
          <td>${sport.win_rate ?? ""}</td>
          <td>${sport.clv ?? ""}</td>
        `;
        tbody.appendChild(row);
      });
    }

    if (typeof generateBadge === "function") {
      generateBadge(username);
    }
  } catch (err) {
    showError(String(err && err.message ? err.message : err));
    console.error(err);
  }
}
