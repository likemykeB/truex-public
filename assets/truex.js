/* C:\TRUEX\...\assets\truex.js
   TRUEX v1 UI (LOCKED) — static site helper
   - Read-only
   - No derived metrics, no inferred verdicts
   - Renders API outputs verbatim
*/

(function(){
  const STORAGE_SCOPE = "truex_scope_v1";
  const STORAGE_PROPTHIN = "truex_include_prop_thin_v1";
  const DEFAULT_SCOPE = "all_models";
  const DEFAULT_PROPTHIN = false;

  function $(id){ return document.getElementById(id); }

  function setVerdictChip(el, verdict){
    if(!el) return;
    el.classList.remove("pass","warn","fail");
    const v = (verdict||"").toUpperCase();
    if(v==="PASS") el.classList.add("pass");
    else if(v==="WARN") el.classList.add("warn");
    else if(v==="FAIL") el.classList.add("fail");
    const lab = el.querySelector(".label");
    if(lab) lab.textContent = v || "—";
  }

  function getSavedScope(){ return localStorage.getItem(STORAGE_SCOPE) || DEFAULT_SCOPE; }
  function saveScope(scope){ localStorage.setItem(STORAGE_SCOPE, scope || DEFAULT_SCOPE); }

  function getSavedIncludePropThin(){
    const v = localStorage.getItem(STORAGE_PROPTHIN);
    if(v === null) return DEFAULT_PROPTHIN;
    return v === "true";
  }
  function saveIncludePropThin(flag){ localStorage.setItem(STORAGE_PROPTHIN, flag ? "true" : "false"); }

  async function apiGet(path){
    const res = await fetch(path, { method:"GET", headers:{ "Accept":"application/json" } });
    if(!res.ok){
      const t = await res.text().catch(()=> "");
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${t}`.trim());
    }
    return res.json();
  }

  async function loadModels(){ return apiGet("/api/v1/models"); }
  async function loadLatest(scope){ return apiGet(`/api/v1/evaluation/latest?scope=${encodeURIComponent(scope)}`); }
  async function loadCharts(scope, includePropThin){
    return apiGet(`/api/v1/charts?scope=${encodeURIComponent(scope)}&include_prop_thin=${includePropThin ? "true" : "false"}`);
  }
  async function loadSummary(scope, includePropThin){
    return apiGet(`/api/v1/integrity-summary?scope=${encodeURIComponent(scope)}&include_prop_thin=${includePropThin ? "true" : "false"}&format=json`);
  }

  function setNotice(msg){
    const box = $("notice");
    if(!box) return;
    if(msg){
      box.textContent = msg;
      box.classList.add("show");
    } else {
      box.textContent = "";
      box.classList.remove("show");
    }
  }

  function renderModelsIntoSelector(modelsPayload){
    const sel = $("scopeSelect");
    if(!sel) return;

    const current = getSavedScope();
    sel.innerHTML = "";

    const optAll = document.createElement("option");
    optAll.value = "all_models";
    optAll.textContent = "All Models";
    sel.appendChild(optAll);

    const models = (modelsPayload && modelsPayload.models) ? modelsPayload.models : [];
    for(const m of models){
      if(!m || !m.model_id) continue;
      const opt = document.createElement("option");
      opt.value = `model:${m.model_id}`;
      opt.textContent = m.display_name ? `${m.display_name} (${m.model_id})` : m.model_id;
      sel.appendChild(opt);
    }

    const exists = Array.from(sel.options).some(o => o.value === current);
    sel.value = exists ? current : "all_models";
    saveScope(sel.value);

    sel.onchange = async () => {
      saveScope(sel.value);
      if($("dashboardRoot")) await refreshDashboard();
      if($("chartsRoot")) await refreshCharts();
      if($("summaryRoot")) await refreshSummary();
      if($("modelsListRoot")) await refreshModelsList();
      if($("modelDetailRoot")) await refreshModelDetail();
    };
  }

  /* ---- Canvas chart utils ---- */
  function fitCanvasToDisplay(c){
    const rect = c.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(220, Math.floor(rect.height));
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function drawAxes(ctx, w, h, pad){
    ctx.strokeStyle = "rgba(231,234,240,.20)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();
  }
  function drawZeroLine(ctx, w, h, pad, yZero){
    ctx.strokeStyle = "rgba(231,234,240,.18)";
    ctx.setLineDash([4,4]);
    ctx.beginPath();
    ctx.moveTo(pad, yZero);
    ctx.lineTo(w - pad, yZero);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function renderClvVsTime(canvas, points){
    const ctx = canvas.getContext("2d");
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const pad = 28;

    ctx.clearRect(0,0,w,h);
    drawAxes(ctx,w,h,pad);

    if(!Array.isArray(points) || points.length === 0){
      ctx.fillStyle = "rgba(165,173,189,.9)";
      ctx.fillText("No data", pad, pad+14);
      return;
    }

    const xs = points.map(p => new Date(p.timestamp_utc).getTime()).filter(t=>!isNaN(t));
    const ys = points.map(p => (typeof p.clv_points==="number" ? p.clv_points : 0));

    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    let ymin = Math.min(...ys), ymax = Math.max(...ys);
    ymin = Math.min(ymin, 0);
    ymax = Math.max(ymax, 0);
    if(ymin === ymax){ ymin -= 1; ymax += 1; }

    const xScale = (t)=> pad + ( (t - xmin) / (xmax - xmin || 1) ) * (w - 2*pad);
    const yScale = (v)=> (h - pad) - ( (v - ymin) / (ymax - ymin || 1) ) * (h - 2*pad);

    drawZeroLine(ctx,w,h,pad,yScale(0));

    ctx.fillStyle = "rgba(231,234,240,.55)";
    for(let i=0;i<points.length;i++){
      const t = new Date(points[i].timestamp_utc).getTime();
      if(isNaN(t)) continue;
      const x = xScale(t);
      const y = yScale(typeof points[i].clv_points==="number" ? points[i].clv_points : 0);
      ctx.beginPath();
      ctx.arc(x,y,2.2,0,Math.PI*2);
      ctx.fill();
    }
  }
  function renderSlippage(canvas, points){
    const ctx = canvas.getContext("2d");
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const pad = 28;

    ctx.clearRect(0,0,w,h);
    drawAxes(ctx,w,h,pad);

    if(!Array.isArray(points) || points.length === 0){
      ctx.fillStyle = "rgba(165,173,189,.9)";
      ctx.fillText("No data", pad, pad+14);
      return;
    }

    const xs = points.map(p => new Date(p.timestamp_utc).getTime()).filter(t=>!isNaN(t));
    const ys = points.map(p => (typeof p.slippage_rate==="number" ? p.slippage_rate : 0));

    const xmin = Math.min(...xs), xmax = Math.max(...xs);
    let ymin = 0, ymax = Math.max(...ys, 1e-6);
    ymax = Math.max(ymax, 0.05);

    const xScale = (t)=> pad + ( (t - xmin) / (xmax - xmin || 1) ) * (w - 2*pad);
    const yScale = (v)=> (h - pad) - ( (v - ymin) / (ymax - ymin || 1) ) * (h - 2*pad);

    ctx.strokeStyle = "rgba(231,234,240,.55)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for(let i=0;i<points.length;i++){
      const t = new Date(points[i].timestamp_utc).getTime();
      if(isNaN(t)) continue;
      const x = xScale(t);
      const y = yScale(typeof points[i].slippage_rate==="number" ? points[i].slippage_rate : 0);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  function renderOutcomesBuckets(canvas, buckets){
    const ctx = canvas.getContext("2d");
    const w = canvas.getBoundingClientRect().width;
    const h = canvas.getBoundingClientRect().height;
    const pad = 28;

    ctx.clearRect(0,0,w,h);
    drawAxes(ctx,w,h,pad);

    if(!Array.isArray(buckets) || buckets.length === 0){
      ctx.fillStyle = "rgba(165,173,189,.9)";
      ctx.fillText("No data", pad, pad+14);
      return;
    }

    const totals = buckets.map(b => (b.wins||0)+(b.losses||0)+(b.pushes||0));
    const maxT = Math.max(...totals, 1);

    const barW = (w - 2*pad) / buckets.length;
    for(let i=0;i<buckets.length;i++){
      const b = buckets[i];
      const total = (b.wins||0)+(b.losses||0)+(b.pushes||0);
      const height = ( (total / maxT) ) * (h - 2*pad);

      const x = pad + i*barW + 6;
      const y = (h - pad) - height;
      const bw = Math.max(10, barW - 12);

      ctx.fillStyle = "rgba(231,234,240,.45)";
      ctx.fillRect(x,y,bw,height);
    }
  }

  /* ---- Dashboard ---- */
  function fmtTs(ts){
    if(!ts) return "—";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return String(ts);
    return d.toISOString().replace("T"," ").replace("Z"," UTC");
  }

  function renderDashboard(latestPayload){
    const integrity = latestPayload?.integrity || {};
    const progress  = latestPayload?.progress || {};
    const lastUp    = latestPayload?.last_update || {};

    setVerdictChip($("verdictChip"), integrity.verdict);
    if($("evidenceStatus")) $("evidenceStatus").textContent = integrity.evidence_status || "—";
    if($("consistency")) $("consistency").textContent = integrity.consistency || "—";

    const badgeWrap = $("marketBadges");
    if(badgeWrap){
      badgeWrap.innerHTML = "";
      const mcs = Array.isArray(integrity.active_market_classes) ? integrity.active_market_classes : [];
      if(mcs.length === 0){
        const b = document.createElement("span"); b.className="badge"; b.textContent="—";
        badgeWrap.appendChild(b);
      } else {
        for(const mc of mcs){
          const b = document.createElement("span"); b.className="badge"; b.textContent=String(mc);
          badgeWrap.appendChild(b);
        }
      }
    }

    if($("guardrailText")) $("guardrailText").textContent = integrity.guardrail_text || "Verdicts evaluate process integrity, not outcomes.";

    const bets = (typeof progress.bets_count === "number") ? progress.bets_count : 0;
    const target = (typeof progress.evidence_target_bets === "number") ? progress.evidence_target_bets : 100;

    if($("progressLabel")) $("progressLabel").textContent = progress.progress_label || `${bets} / ${target} bets toward evidence`;
    const prog = $("progressBar");
    if(prog){
      prog.max = target;
      prog.value = bets;
    }
    if($("operationalFlag")) $("operationalFlag").textContent = progress.operational_flag ? "Evidence threshold met" : "";

    if($("lastUpdate")) $("lastUpdate").textContent = fmtTs(lastUp.last_update_ts_utc);
  }

  async function refreshDashboard(){
    setNotice("");
    const scope = getSavedScope();
    try{
      const latest = await loadLatest(scope);
      renderDashboard(latest);
    } catch(e){
      setNotice(`API unavailable for /api/v1/evaluation/latest (scope=${scope}). ${e.message}`);
    }
  }

  /* ---- Charts ---- */
  async function refreshCharts(){
    setNotice("");
    const scope = getSavedScope();
    const includePropThin = getSavedIncludePropThin();
    try{
      const payload = await loadCharts(scope, includePropThin);
      if($("chartsCaption")) $("chartsCaption").textContent =
        (payload.captions && payload.captions.static_caption) ? payload.captions.static_caption : "Outcomes may mask poor pricing. Charts are descriptive.";

      const c1 = $("clvCanvas");
      const c2 = $("slipCanvas");
      const c3 = $("outCanvas");

      if(c1){ fitCanvasToDisplay(c1); renderClvVsTime(c1, payload.series?.clv_vs_time?.points || []); }
      if(c2){ fitCanvasToDisplay(c2); renderSlippage(c2, payload.series?.slippage_frequency_over_time?.points || []); }
      if(c3){ fitCanvasToDisplay(c3); renderOutcomesBuckets(c3, payload.series?.outcomes_vs_price_quality?.buckets || []); }
    } catch(e){
      setNotice(`API unavailable for /api/v1/charts (scope=${scope}). ${e.message}`);
    }
  }

  /* ---- Summary page ---- */
  function renderSummary(p){
    const eq = p?.evidence_qualification || {};
    if($("eqBets")) $("eqBets").textContent = (eq.bets_count ?? "—");
    if($("eqWeeks")) $("eqWeeks").textContent = (eq.weeks_span ?? "—");
    if($("eqDays")) $("eqDays").textContent = (eq.active_days ?? "—");
    if($("eqStatus")) $("eqStatus").textContent = (eq.status ?? "—");

    const iv = p?.integrity_verdict || {};
    setVerdictChip($("sumVerdict"), iv.verdict);
    if($("sumVerdictDef")) $("sumVerdictDef").textContent = (iv.definition ?? "—");

    const pc = p?.process_consistency || {};
    if($("sumCons")) $("sumCons").textContent = (pc.consistency ?? "—");
    if($("sumConsExpl")) $("sumConsExpl").textContent = (pc.explanation ?? "—");
    if($("sumGuardrail")) $("sumGuardrail").textContent = (pc.guardrail ?? "TRUEX does not identify strategies.");

    const rows = $("sportRows");
    if(rows){
      rows.innerHTML = "";
      const arr = Array.isArray(p?.cross_sport_breakdown) ? p.cross_sport_breakdown : [];
      if(arr.length === 0){
        const tr = document.createElement("tr");
        tr.innerHTML = "<td colspan='3' class='small'>—</td>";
        rows.appendChild(tr);
      } else {
        for(const r of arr){
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${r.sport ?? "—"}</td><td>${r.signal ?? "—"}</td><td>${r.notes ?? ""}</td>`;
          rows.appendChild(tr);
        }
      }
    }

    if($("plainEnglish")) $("plainEnglish").textContent = (p?.plain_english ?? "—");

    const dnd = Array.isArray(p?.what_truex_does_not_do) ? p.what_truex_does_not_do : [];
    if($("doesNotDo")){
      $("doesNotDo").innerHTML = dnd.length ? ("<ul>" + dnd.map(x => `<li>${x}</li>`).join("") + "</ul>") : "—";
    }
  }

  async function refreshSummary(){
    setNotice("");
    const scope = getSavedScope();
    const includePropThin = getSavedIncludePropThin();
    try{
      const payload = await loadSummary(scope, includePropThin);
      renderSummary(payload);
    } catch(e){
      setNotice(`API unavailable for /api/v1/integrity-summary (scope=${scope}). ${e.message}`);
    }
  }

  /* ---- Models list ---- */
  async function refreshModelsList(){
    setNotice("");
    try{
      const p = await loadModels();
      const rows = $("modelsRows");
      if(!rows) return;
      rows.innerHTML = "";

      const models = Array.isArray(p?.models) ? p.models : [];
      if(models.length === 0){
        const tr=document.createElement("tr");
        tr.innerHTML="<td colspan='6' class='mini'>—</td>";
        rows.appendChild(tr);
        return;
      }

      for(const m of models){
        const latest = m.latest_evaluation || {};
        const tr = document.createElement("tr");
        const name = m.display_name ? `${m.display_name} (${m.model_id})` : m.model_id;
        tr.innerHTML = `
          <td><a class="link" href="./model.html?model_id=${encodeURIComponent(m.model_id)}">${name}</a></td>
          <td>${m.primary_market_class || "—"}</td>
          <td>${latest.verdict || "—"}</td>
          <td>${latest.consistency || "—"}</td>
          <td>${(latest.bets_count ?? "—")}</td>
          <td>${latest.evidence_status || "—"}</td>
        `;
        rows.appendChild(tr);
      }
    } catch(e){
      setNotice(`API unavailable for /api/v1/models. ${e.message}`);
    }
  }

  function getQueryParam(name){
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  async function refreshModelDetail(){
    setNotice("");
    const modelId = getQueryParam("model_id");
    if(!modelId){
      setNotice("Missing model_id in URL. Use /models/index.html to select a model.");
      return;
    }

    // Set scope selector to this model
    saveScope(`model:${modelId}`);
    const sel = $("scopeSelect");
    if(sel){
      // selector options are rendered during boot; we set value later if possible
    }

    // Load model metadata from /models
    try{
      const mp = await loadModels();
      const models = Array.isArray(mp?.models) ? mp.models : [];
      const m = models.find(x => x.model_id === modelId) || null;
      if($("modelId")) $("modelId").textContent = modelId;
      if($("modelName")) $("modelName").textContent = m?.display_name || modelId;
      if($("modelPrimary")) $("modelPrimary").textContent = m?.primary_market_class || "—";
    } catch(e){
      // non-fatal
    }

    const scope = `model:${modelId}`;
    const includePropThin = getSavedIncludePropThin();

    // Charts scoped
    try{
      const cp = await loadCharts(scope, includePropThin);
      if($("chartsCaption")) $("chartsCaption").textContent =
        (cp.captions && cp.captions.static_caption) ? cp.captions.static_caption : "Outcomes may mask poor pricing. Charts are descriptive.";

      const c1 = $("clvCanvas");
      const c2 = $("slipCanvas");
      const c3 = $("outCanvas");
      if(c1){ fitCanvasToDisplay(c1); renderClvVsTime(c1, cp.series?.clv_vs_time?.points || []); }
      if(c2){ fitCanvasToDisplay(c2); renderSlippage(c2, cp.series?.slippage_frequency_over_time?.points || []); }
      if(c3){ fitCanvasToDisplay(c3); renderOutcomesBuckets(c3, cp.series?.outcomes_vs_price_quality?.buckets || []); }
    } catch(e){
      setNotice(`API unavailable for /api/v1/charts (scope=${scope}). ${e.message}`);
    }

    // Summary scoped
    try{
      const sp = await loadSummary(scope, includePropThin);
      const eq = sp?.evidence_qualification || {};
      if($("sumEvidence")) $("sumEvidence").textContent = `${eq.bets_count ?? "—"} bets · ${eq.weeks_span ?? "—"} weeks · ${eq.active_days ?? "—"} days · ${eq.status ?? "—"}`;
      setVerdictChip($("sumVerdict"), sp?.integrity_verdict?.verdict);
      if($("sumCons")) $("sumCons").textContent = sp?.process_consistency?.consistency || "—";
      if($("sumPlain")) $("sumPlain").textContent = sp?.plain_english || "—";
    } catch(e){
      setNotice(`API unavailable for /api/v1/integrity-summary (scope=${scope}). ${e.message}`);
    }
  }

  async function boot(){
    setNotice("");

    try{
      const models = await loadModels();
      renderModelsIntoSelector(models);
    } catch(e){
      // minimal selector fallback
      const sel = $("scopeSelect");
      if(sel){
        sel.innerHTML = "";
        const optAll = document.createElement("option");
        optAll.value = "all_models";
        optAll.textContent = "All Models";
        sel.appendChild(optAll);
        sel.value = "all_models";
        saveScope("all_models");
      }
      setNotice(`API unavailable for /api/v1/models. ${e.message}`);
    }

    if($("dashboardRoot")) await refreshDashboard();
    if($("chartsRoot")) await refreshCharts();
    if($("summaryRoot")) await refreshSummary();
    if($("modelsListRoot")) await refreshModelsList();
    if($("modelDetailRoot")) await refreshModelDetail();

    // Try to set selector value after model detail sets scope
    const sel = $("scopeSelect");
    if(sel){
      const cur = getSavedScope();
      const exists = Array.from(sel.options).some(o => o.value === cur);
      if(exists) sel.value = cur;
    }
  }

  window.TRUEX = {
    boot, refreshDashboard, refreshCharts, refreshSummary,
    refreshModelsList, refreshModelDetail,
    getSavedScope, saveScope
  };

  document.addEventListener("DOMContentLoaded", boot);
})();
