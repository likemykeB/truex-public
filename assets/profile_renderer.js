async function fetchAnalytics(username) {
  const response = await fetch(`../latest/analytics/${username}_analytics_latest.json`);
  return await response.json();
}

function loadProfile(username) {
  fetchAnalytics(username).then(data => {
    document.getElementById("username").innerText = data.username;
    document.getElementById("verified-since").innerText =
      "Verified Since: " + data.verified_since;

    document.getElementById("total-units").innerText = data.total_units;
    document.getElementById("roi").innerText = data.roi;
    document.getElementById("win-rate").innerText = data.win_rate;
    document.getElementById("clv").innerText = data.clv;
    document.getElementById("max-dd").innerText = data.max_drawdown;

    document.getElementById("seal").innerText =
      "PayloadTreeHash: " + data.payload_tree_hash +
      " | SealSha256: " + data.seal_sha256;

    document.getElementById("payload-link").href =
      `../latest/analytics/${username}_analytics_latest.json`;

    renderLineChart("equityChart", data.equity_curve);
    renderLineChart("monthlyChart", data.monthly_pnl);

    const table = document.querySelector("#sport-breakdown tbody");
    data.sport_breakdown.forEach(sport => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sport.name}</td>
        <td>${sport.units}</td>
        <td>${sport.roi}</td>
        <td>${sport.win_rate}</td>
        <td>${sport.clv}</td>
      `;
      table.appendChild(row);
    });
  });
}

function loadIndex() {
  fetch("../latest/analytics/verified_index_latest.json")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#verified-table tbody");

      data.users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.username}</td>
          <td>${user.total_units}</td>
          <td>${user.roi}</td>
          <td>${user.sports.join(", ")}</td>
          <td>${user.verified_since}</td>
          <td><a href="${user.username}.html">View</a></td>
        `;
        tbody.appendChild(row);
      });
    });
}
