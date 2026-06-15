export const T = {
  font: "'IBM Plex Sans',system-ui,sans-serif",
  mono: "'IBM Plex Mono',monospace",
  n0: "#FFFFFF",
  n50: "#F7F7F6",
  n100: "#EEEEEC",
  n150: "#E3E3E0",
  n200: "#CECEC9",
  n300: "#ADADAA",
  n400: "#888885",
  n500: "#65635F",
  n600: "#4A4845",
  n700: "#323130",
  n800: "#1E1D1C",
  n900: "#111110",
  t100: "#D0EDEE",
  t200: "#A2DADC",
  t400: "#3AABB0",
  t500: "#1E8F94",
  t600: "#14717A",
  t700: "#0C5560",
  g50: "#EEF8F2",
  g100: "#CEEEDD",
  g300: "#5FCA8D",
  g500: "#16A34A",
  g600: "#0F7A36",
  g700: "#0A5827",
  r50: "#FFF0F1",
  r100: "#FFE0E2",
  r300: "#F9A0A9",
  r500: "#E8384F",
  r600: "#BE2238",
  r700: "#95132B",
  a50: "#FFF8EC",
  a100: "#FDECC4",
  a500: "#E08A00",
  a600: "#B86D00",
  a700: "#8F5300",
  v100: "#E6E1FF",
  v500: "#7B61FF",
  v600: "#5A44D4",
  v700: "#4330B0",
  b1: "#2563EB",
  b2: "#1D4ED8",
  b3: "#1E40AF",
  p100: "#EDE9FE",
  p500: "#8B5CF6",
  p700: "#5B21B6",
};

export const STATUS = {
  advance: {
    bg: "#D0EDEE",
    fg: "#0C5560",
    border: "#A2DADC",
    label: "Disbursed",
    dot: "#3AABB0",
  },
  done: {
    bg: "#CEEEDD",
    fg: "#0A5827",
    border: "#5FCA8D",
    label: "Recovered",
    dot: "#16A34A",
  },
  upcoming: {
    bg: "#E6E1FF",
    fg: "#4330B0",
    border: "#C4B5FD",
    label: "Upcoming",
    dot: "#7B61FF",
  },
  skipped: {
    bg: "#EEEEEC",
    fg: "#65635F",
    border: "#CECEC9",
    label: "Skipped",
    dot: "#888885",
  },
  partial: {
    bg: "#FFF8EC",
    fg: "#8F5300",
    border: "#FDECC4",
    label: "Partial",
    dot: "#E08A00",
  },
  pending: {
    bg: "#FFF7ED",
    fg: "#9A3412",
    border: "#FED7AA",
    label: "Pending",
    dot: "#F97316",
  },
};

export const AVP = [
  { bg: "#DBEAFE", fg: "#1E40AF" },
  { bg: "#D1FAE5", fg: "#065F46" },
  { bg: "#FEF3C7", fg: "#92400E" },
  { bg: "#EDE9FE", fg: "#5B21B6" },
  { bg: "#FCE7F3", fg: "#9D174D" },
  { bg: "#CCFBF1", fg: "#0F766E" },
  { bg: "#FFF7ED", fg: "#9A3412" },
  { bg: "#F0FDF4", fg: "#14532D" },
];

export const CSS = `
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.25} }
  @keyframes fadeup  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shim    { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  @keyframes grow    { from{width:0} to{width:var(--w)} }

  .ph-root *{box-sizing:border-box;margin:0;padding:0}
  .ph-root{font-family:'IBM Plex Sans',system-ui,sans-serif;color:#323130;-webkit-font-smoothing:antialiased}

  .ph-overlay{
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;
    background:rgba(6,6,14,.65);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    display:flex;align-items:center;justify-content:center;
    padding:12px;
    animation:fadeup .18s ease both;
  }

  .ph-card{
    position:relative;width:100%;max-width:1040px;
    height:calc(100vh - 24px);max-height:960px;
    background:#fff;border-radius:18px;
    display:flex;flex-direction:column;overflow:hidden;
    box-shadow:0 48px 120px rgba(0,0,0,.36),0 10px 32px rgba(0,0,0,.2);
    animation:fadeup .26s cubic-bezier(.16,1,.3,1) both;
  }

  .ph-hdr{flex-shrink:0;background:linear-gradient(135deg,#1D4ED8 0%,#2563EB 55%,#1E8F94 100%);padding:16px 18px 14px;}

  .ph-body{
    flex:1 1 0%;min-height:0;overflow-y:auto;overflow-x:hidden;
    background:#F2F2F0;padding:12px;
    display:flex;flex-direction:column;gap:10px;
  }
  .ph-body::-webkit-scrollbar{width:6px}
  .ph-body::-webkit-scrollbar-track{background:transparent}
  .ph-body::-webkit-scrollbar-thumb{background:#CECEC9;border-radius:99px}
  .ph-body::-webkit-scrollbar-thumb:hover{background:#ADADAA}

  .ph-footer{flex-shrink:0;padding:10px 16px;border-top:1px solid #E3E3E0;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}

  .ph-shim{background:linear-gradient(90deg,#EEEEEC 25%,#E3E3E0 50%,#EEEEEC 75%);background-size:600px 100%;animation:shim 1.5s infinite linear;border-radius:4px;}

  .ph-up{animation:fadeup .2s cubic-bezier(.16,1,.3,1) both}
  .ph-btn{font-family:'IBM Plex Sans',system-ui,sans-serif;cursor:pointer;transition:opacity .12s,transform .1s;border:none;background:none;}
  .ph-btn:hover:not(:disabled){opacity:.72}
  .ph-btn:active:not(:disabled){transform:scale(.97)}
  .ph-btn:disabled{opacity:.35;cursor:not-allowed}

  .ph-kpi{transition:box-shadow .15s,transform .12s;cursor:default}
  .ph-kpi:hover{box-shadow:0 3px 12px rgba(0,0,0,.1)!important;transform:translateY(-1px)}

  .ph-row{transition:background .1s}
  .ph-row:hover{background:#F7F7F6!important}
  .ph-tab:hover:not(.on){background:#EEEEEC!important}
  .ph-chev{transition:transform .2s cubic-bezier(.4,0,.2,1)}
  .ph-chev.open{transform:rotate(180deg)}
  .ph-pbar{--w:0%;animation:grow .9s cubic-bezier(.4,0,.2,1) both;width:var(--w)}
  .ph-inp:focus{outline:none;border-color:#2563EB!important;box-shadow:0 0 0 2.5px rgba(37,99,235,.15);}
  .ph-sc::-webkit-scrollbar{width:4px}
  .ph-sc::-webkit-scrollbar-thumb{background:#CECEC9;border-radius:99px}
  .ph-sc::-webkit-scrollbar-thumb:hover{background:#ADADAA}

  .ph-tag{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
  .ph-badge-count{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 6px;border-radius:10px;font-size:10px;font-weight:700;line-height:1}

  /* ── Responsive ── */
  .ph-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
  .ph-tracker-grid{display:grid;grid-template-columns:repeat(4,1fr);}
  .ph-detail-4{display:grid;grid-template-columns:repeat(4,1fr);}
  .ph-detail-3{display:grid;grid-template-columns:repeat(3,1fr);}
  .ph-detail-2{display:grid;grid-template-columns:1fr 1fr;}
  .ph-detail-5{display:grid;grid-template-columns:repeat(5,1fr);}
  .ph-dept-row{display:grid;grid-template-columns:140px 1fr auto;align-items:center;gap:10px;}
  .ph-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;background:#F7F7F6;border-bottom:1px solid #E3E3E0;flex-wrap:wrap;}
  .ph-ev-row{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;gap:10px;padding:12px 14px;}

  @media (max-width:900px){
    .ph-kpi-grid{grid-template-columns:repeat(2,1fr);}
    .ph-tracker-grid{grid-template-columns:repeat(2,1fr);}
    .ph-detail-5{grid-template-columns:repeat(3,1fr);}
    .ph-dept-row{grid-template-columns:110px 1fr auto;}
  }
  @media (max-width:640px){
    .ph-overlay{padding:0;}
    .ph-card{height:100vh;max-height:100vh;border-radius:0;}
    .ph-kpi-grid{grid-template-columns:1fr 1fr;}
    .ph-tracker-grid{grid-template-columns:1fr 1fr;}
    .ph-detail-4{grid-template-columns:1fr 1fr;}
    .ph-detail-3{grid-template-columns:1fr 1fr;}
    .ph-detail-5{grid-template-columns:1fr 1fr;}
    .ph-dept-row{grid-template-columns:90px 1fr auto;}
    .ph-ev-row{grid-template-columns:auto 1fr auto;gap:6px;padding:10px 10px;}
    .ph-ev-chev{display:none;}
    .ph-hdr{padding:12px 14px 10px;}
    .ph-body{padding:8px;gap:8px;}
    .ph-footer{padding:8px 12px;}
  }
  @media (max-width:420px){
    .ph-kpi-grid{grid-template-columns:1fr;}
    .ph-tracker-grid{grid-template-columns:1fr;}
    .ph-detail-2{grid-template-columns:1fr;}
    .ph-detail-3{grid-template-columns:1fr;}
    .ph-detail-4{grid-template-columns:1fr 1fr;}
    .ph-detail-5{grid-template-columns:1fr 1fr;}
  }
`;
