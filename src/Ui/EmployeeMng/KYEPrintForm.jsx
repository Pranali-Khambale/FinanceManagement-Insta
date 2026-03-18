// src/Ui/EmployeeMng/KYEPrintForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Call handlePrint() from PendingApprovals to open this as a print window.
// Usage in PendingApprovals.jsx — replace handlePrint body with:
//
//   import { printKYEForm } from './KYEPrintForm';
//   const handlePrint = () => printKYEForm(employee);
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const val = (v) => v || '';

export const printKYEForm = (employee) => {
  const win = window.open('', '_blank', 'width=1000,height=900,scrollbars=yes');
  if (!win) {
    alert('Pop-ups are blocked. Please allow pop-ups and try again.');
    return;
  }

  const e = employee || {};

  // ── IMPORTANT: use absolute URL so the popup (about:blank) can load the image ──
  // window.location.origin = e.g. http://localhost:5173
  const ORIGIN   = window.location.origin;
  const LOGO_URL = `${ORIGIN}/assets/Insta-logo.png`;

  // ── Brand colors from the real logo ──────────────────────────────────────────
  // Blue arc  → #2196d3   Yellow arc → #f5a623   Text → #1a1a1a
  const BRAND_BLUE   = '#2196d3';
  const BRAND_YELLOW = '#f5a623';
  const BRAND_DARK   = '#1a1a1a';

  // ── API base for employee photo ───────────────────────────────────────────────
  const BASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) ||
    'http://localhost:5000';

  // ── Resolve employee photo ────────────────────────────────────────────────────
  const photoDoc = Array.isArray(e.documents)
    ? e.documents.find(
        (d) =>
          d.type === 'idPhoto'  || d.document_type === 'idPhoto' ||
          d.type === 'photo'    || d.document_type === 'photo'
      )
    : null;

  const photoRawPath = photoDoc?.path || photoDoc?.file_path || null;
  const photoUrl = photoRawPath
    ? photoRawPath.startsWith('http') ? photoRawPath : `${BASE_URL}${photoRawPath}`
    : null;

  // ── Photo box HTML ─────────────────────────────────────────────────────────
  const photoBoxContent = photoUrl
    ? `<img src="${photoUrl}" alt="Employee Photo"
           style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
       <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;
                   flex-direction:column;gap:4px;padding:6px;text-align:center;
                   position:absolute;top:0;left:0;">
         <span style="font-size:7pt;color:#888;">Employee Passport Size<br>Photograph<br>(45mm × 35mm)</span>
       </div>`
    : `<div style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;
                   flex-direction:column;gap:4px;padding:6px;text-align:center;">
         <span style="font-size:7pt;color:#888;">Employee Passport Size<br>Photograph<br>(45mm × 35mm)</span>
       </div>`;

  // ── Row helper ─────────────────────────────────────────────────────────────
  const row = (label, value) => `
    <tr>
      <td class="label">${label}</td>
      <td class="value">${val(value)}</td>
      <td class="check"></td>
      <td class="check"></td>
    </tr>`;

  // ── Reusable page header ───────────────────────────────────────────────────
  // Logo uses absolute URL — works in popup window (about:blank)
  // Falls back to styled text if image fails
  const pageHeader = `
    <div class="page-header">
      <span class="revision-label">KYE Form Revision - 1</span>
      <div class="logo-block">
        <img
          src="${LOGO_URL}"
          alt="Insta ICT Solutions"
          class="logo-img"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        />
        <!-- Fallback logo when image cannot load -->
        <div style="display:none; flex-direction:column; align-items:flex-end; gap:2px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <!-- Mini SVG matching blue/yellow arc brand -->
            <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 5 A45 45 0 0 1 95 50 L78 50 A28 28 0 0 0 50 22 Z" fill="${BRAND_BLUE}"/>
              <path d="M55 15 A35 35 0 0 1 88 48 L72 46 A20 20 0 0 0 56 28 Z" fill="white" opacity="0.6"/>
              <path d="M50 95 A45 45 0 0 1 5 50 L22 50 A28 28 0 0 0 50 78 Z" fill="${BRAND_YELLOW}"/>
              <path d="M45 85 A35 35 0 0 1 12 52 L28 54 A20 20 0 0 0 44 72 Z" fill="white" opacity="0.6"/>
            </svg>
            <span style="font-size:13pt;font-weight:800;color:${BRAND_DARK};letter-spacing:-0.5px;">Insta ICT Solutions</span>
          </div>
        </div>
      </div>
    </div>`;

  // ── Watermark — real logo image, falls back to full SVG brand logo ───────────
  // SVG fallback replicates the actual Insta ICT logo:
  //   • Blue arc (top-right)  → #2196d3
  //   • Yellow arc (bottom-right) → #f5a623
  //   • Bold "Insta ICT Solutions" text → #1a1a1a
  const watermarkFallbackSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" width="420" height="320">
      <!-- Blue arc — top right, two segments with gap -->
      <path d="M260,20 A120,120 0 0,1 370,160 L340,160 A90,90 0 0,0 260,50 Z"
            fill="#2196d3"/>
      <path d="M263,58 A86,86 0 0,1 336,158 L310,156 A60,60 0 0,0 261,82 Z"
            fill="white" opacity="0.55"/>
      <!-- gap stripe in blue arc -->
      <path d="M258,20 L270,20 L268,52 L256,50 Z" fill="white"/>

      <!-- Yellow arc — bottom right, two segments with gap -->
      <path d="M310,180 A110,110 0 0,1 370,280 L340,278 A80,80 0 0,0 308,208 Z"
            fill="#f5a623"/>
      <path d="M312,215 A60,60 0 0,1 336,274 L310,272 A34,34 0 0,0 286,218 Z"
            fill="white" opacity="0.55"/>
      <!-- gap stripe in yellow arc -->
      <path d="M308,180 L320,182 L316,210 L304,208 Z" fill="white"/>

      <!-- Company name text -->
      <text x="18" y="230"
            font-family="Arial,sans-serif"
            font-weight="800"
            font-size="52"
            fill="#1a1a1a"
            letter-spacing="-1">Insta ICT</text>
      <text x="18" y="290"
            font-family="Arial,sans-serif"
            font-weight="800"
            font-size="52"
            fill="#1a1a1a"
            letter-spacing="-1">Solutions</text>
    </svg>`;

  const watermark = `
    <div class="watermark" aria-hidden="true">
      <img
        src="${LOGO_URL}"
        alt=""
        style="width:100%;height:auto;filter:grayscale(100%);"
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='block';
        "
      />
      <!-- SVG fallback — full brand logo, shown only if image fails -->
      <div style="display:none; width:100%; opacity:0.85;">
        ${watermarkFallbackSVG}
      </div>
    </div>`;

  // ── Reference rows ─────────────────────────────────────────────────────────
  const refRows = `
    <tr><td class="ref-label">Name</td>
      <td class="ref-val">${val(e.ref1_name)}</td>
      <td class="ref-val">${val(e.ref2_name)}</td>
      <td class="ref-val">${val(e.ref3_name)}</td></tr>
    <tr><td class="ref-label">Designation</td>
      <td class="ref-val">${val(e.ref1_designation)}</td>
      <td class="ref-val">${val(e.ref2_designation)}</td>
      <td class="ref-val">${val(e.ref3_designation)}</td></tr>
    <tr><td class="ref-label">Name of Organization</td>
      <td class="ref-val">${val(e.ref1_organization)}</td>
      <td class="ref-val">${val(e.ref2_organization)}</td>
      <td class="ref-val">${val(e.ref3_organization)}</td></tr>
    <tr><td class="ref-label">Address</td>
      <td class="ref-val">${val(e.ref1_address)}</td>
      <td class="ref-val">${val(e.ref2_address)}</td>
      <td class="ref-val">${val(e.ref3_address)}</td></tr>
    <tr><td class="ref-label">City, State, Pin Code</td>
      <td class="ref-val">${val(e.ref1_city_state_pin)}</td>
      <td class="ref-val">${val(e.ref2_city_state_pin)}</td>
      <td class="ref-val">${val(e.ref3_city_state_pin)}</td></tr>
    <tr><td class="ref-label">Contact No. (Mobile/Landline)</td>
      <td class="ref-val">${val(e.ref1_contact_no)}</td>
      <td class="ref-val">${val(e.ref2_contact_no)}</td>
      <td class="ref-val">${val(e.ref3_contact_no)}</td></tr>
    <tr><td class="ref-label">Email ID (Preferably Official)</td>
      <td class="ref-val">${val(e.ref1_email)}</td>
      <td class="ref-val">${val(e.ref2_email)}</td>
      <td class="ref-val">${val(e.ref3_email)}</td></tr>
    <tr>
      <td class="ref-label">Verification Comment<br>
        <span style="font-size:8px;color:#6b7280">(To be recorded by HR Manager)</span>
      </td>
      <td class="ref-val" style="height:40px"></td>
      <td class="ref-val"></td>
      <td class="ref-val"></td>
    </tr>`;

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>KYE Form – ${val(e.first_name)} ${val(e.last_name)}</title>
  <style>
    /* ─── Reset ─── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ─── Page ─── */
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 10.5pt;
      color: #111;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 14mm 16mm 14mm 16mm;
      position: relative;
      overflow: hidden;
    }

    /* ─── Watermark ─── */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      pointer-events: none;
      z-index: 0;
      opacity: 0.07;
      width: 150mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* All content sits above watermark */
    .page > *:not(.watermark) { position: relative; z-index: 1; }

    /* ─── Header ─── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4mm;
      border-bottom: 2px solid ${BRAND_BLUE};
      padding-bottom: 3mm;
    }
    .revision-label { font-size: 8pt; color: #888; }
    .logo-block {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0;
    }
    /* Real logo image — tall enough to be clear */
    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
      display: block;
    }

    /* ─── Form title ─── */
    .form-title-box {
      border: 2px solid ${BRAND_BLUE};
      text-align: center;
      padding: 7px 0;
      margin-bottom: 6mm;
      background: linear-gradient(135deg, #f0f9ff 0%, #fffbf0 100%);
    }
    .form-title-box h1 {
      font-size: 14pt;
      font-weight: 800;
      color: ${BRAND_DARK};
      letter-spacing: 0.2px;
    }

    /* ─── Photo box ─── */
    .photo-box {
      border: 1.5px solid ${BRAND_BLUE};
      background: #f8fbff;
      position: relative;
      overflow: hidden;
    }

    /* ─── Section heading ─── */
    .sec-heading {
      font-size: 10.5pt;
      font-weight: 700;
      text-decoration: underline;
      margin: 4mm 0 2mm 0;
      color: ${BRAND_DARK};
    }

    /* ─── Data tables ─── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4mm;
    }
    .data-table td {
      border: 1px solid #c5d8e8;
      padding: 3px 6px;
      vertical-align: top;
    }
    .data-table .label  { width: 52mm; background: #eef6fb; font-weight: 600; color: ${BRAND_DARK}; }
    .data-table .value  { min-width: 60mm; }
    .data-table .check  { width: 20mm; text-align: center; }

    /* ─── Verification header ─── */
    .ver-header { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    .ver-header td {
      border: 1px solid #c5d8e8;
      padding: 3px 6px;
      font-size: 9pt;
      font-weight: 700;
      text-align: center;
      background: #daedf8;
      color: ${BRAND_DARK};
    }
    .ver-header .spacer { border: none; background: none; }

    /* ─── Reference table ─── */
    .ref-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4mm;
    }
    .ref-table td, .ref-table th {
      border: 1px solid #c5d8e8;
      padding: 3px 6px;
      vertical-align: top;
    }
    .ref-table thead th {
      background: ${BRAND_BLUE};
      color: #fff;
      font-size: 9pt;
      font-weight: 700;
      text-align: center;
      padding: 4px 6px;
    }
    .ref-table thead .ref-lbl-hdr { background: #daedf8; color: ${BRAND_DARK}; text-align: left; }
    .ref-label { width: 52mm; background: #eef6fb; font-weight: 600; }
    .ref-val   { min-width: 35mm; }

    /* ─── Declaration ─── */
    .declaration {
      font-size: 9.5pt;
      line-height: 1.6;
      margin-bottom: 5mm;
      border: 1px solid #c5d8e8;
      border-left: 4px solid ${BRAND_YELLOW};
      padding: 8px 10px;
      border-radius: 4px;
      background: #fffdf5;
    }
    .declaration-hindi { font-size: 9pt; color: #374151; margin-top: 6px; line-height: 1.7; }
    .sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 8mm;
      font-size: 10pt;
      font-weight: 600;
    }
    .sig-line {
      border-top: 1.5px solid ${BRAND_DARK};
      width: 55mm;
      text-align: center;
      padding-top: 2px;
      font-size: 9pt;
    }
    .note-box {
      border: 1.5px solid ${BRAND_YELLOW};
      background: #fffbf0;
      padding: 6px 10px;
      font-size: 9pt;
      font-weight: 600;
      color: #7a4f00;
      margin-top: 5mm;
      border-radius: 4px;
      border-left: 4px solid ${BRAND_YELLOW};
    }

    /* ─── Documents checklist ─── */
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4mm;
    }
    .doc-table th {
      background: ${BRAND_BLUE};
      color: #fff;
      text-align: center;
      padding: 4px 8px;
      font-weight: 700;
    }
    .doc-table td { border: 1px solid #c5d8e8; padding: 4px 8px; vertical-align: middle; }
    .doc-table td.sr  { text-align: center; width: 10mm; }
    .doc-table td.att { text-align: center; width: 28mm; }
    .doc-table tr:nth-child(even) td { background: #eef6fb; }

    /* ─── Office use ─── */
    .office-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
    .office-table td { border: 1px solid #c5d8e8; padding: 4px 8px; }
    .office-table .num { width: 8mm; text-align: center; background: #daedf8; font-weight: 700; }
    .office-table .lbl { width: 40mm; font-weight: 600; background: #eef6fb; }

    /* ─── Page footer ─── */
    .page-footer {
      position: absolute;
      bottom: 8mm; right: 16mm;
      font-size: 8pt; color: #888;
    }

    /* ─── Page break ─── */
    .page-break { page-break-before: always; break-before: page; }

    /* ─── Print ─── */
    @media print {
      @page { size: A4; margin: 0; }
      body  { padding: 0; }
      .page { page-break-after: always; padding: 12mm 14mm; }
      .watermark { opacity: 0.05 !important; }
    }
  </style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════
     PAGE 1 — Personal Details + Family Details
══════════════════════════════════════════════════════ -->
<div class="page">
  ${watermark}
  ${pageHeader}

  <div class="form-title-box">
    <h1>General Information Form for KYE</h1>
  </div>

  <!-- Photo box (top right) -->
  <div style="display:flex; justify-content:flex-end; margin-bottom:3mm; margin-top:-3mm;">
    <div class="photo-box" style="width:30mm; height:38mm; display:flex; align-items:center; justify-content:center;">
      ${photoBoxContent}
    </div>
  </div>

  <div class="sec-heading">1. Employee Personal Details -</div>

  <table class="ver-header" style="margin-bottom:0">
    <tr>
      <td class="spacer" style="width:120mm; border:none; background:none;"></td>
      <td colspan="2" style="width:44mm; background:#daedf8; font-weight:700; font-size:9pt; text-align:center; border:1px solid #c5d8e8;">
        Verification Status
      </td>
    </tr>
    <tr>
      <td style="width:120mm; border:none; background:none;"></td>
      <td style="width:22mm; border:1px solid #c5d8e8; background:#daedf8; font-size:8.5pt; font-weight:700; text-align:center; padding:3px;">Verified<br>Yes/No</td>
      <td style="width:22mm; border:1px solid #c5d8e8; background:#daedf8; font-size:8.5pt; font-weight:700; text-align:center; padding:3px;">Referred Documents name</td>
    </tr>
  </table>

  <table class="data-table" style="margin-top:0">
    ${row('Employee Name:', val(e.first_name) + (e.last_name ? ' ' + e.last_name : ''))}
    ${row('Date of birth<br><span style="font-size:8pt;color:#555">(DD-MMM-YYYY)</span>', fmt(e.date_of_birth))}
    ${row('Educational qualification', val(e.educational_qualification))}
    ${row('Name of Father/Husband', val(e.father_husband_name))}
    ${row('Marital Status<br><span style="font-size:8pt;color:#555">(Married/Unmarried)</span>', val(e.marital_status))}
    ${row('Employee Blood Group', val(e.blood_group))}
    ${row('Email ID', val(e.email))}
    ${row('PAN Number', val(e.pan_number))}
    ${row('Name on PAN', val(e.name_on_pan))}
    ${row('Aadhaar No', val(e.aadhar_number))}
    ${row('Name on Aadhaar Card', val(e.name_on_aadhar))}
  </table>

  <div class="sec-heading">2. Employee Family Details -</div>
  <table class="data-table">
    ${row('Father/Mother /Spouse Name', val(e.family_member_name))}
    ${row('Father/Mother / Spouse contact number', val(e.family_contact_no))}
    ${row('Father/Mother / Spouse working status', val(e.family_working_status))}
    ${row('Father/Mother / Spouse Employer name', val(e.family_employer_name))}
    ${row('Father/Spouse / Mother Employer contact number', val(e.family_employer_contact))}
  </table>

  <div class="page-footer">Page 1 of 4</div>
</div>

<!-- ══════════════════════════════════════════════════════
     PAGE 2 — Emergency + Bank + Address
══════════════════════════════════════════════════════ -->
<div class="page page-break">
  ${watermark}
  ${pageHeader}

  <div class="sec-heading">3. Employee Emergency Contact Details –</div>
  <table class="data-table">
    ${row('Emergency Contact Person Name', val(e.emergency_contact_name))}
    ${row('Emergency Contact Person No', val(e.emergency_contact_no))}
    ${row('Emergency Contact Person Address', val(e.emergency_contact_address))}
    ${row('Emergency Contact Person Relation with Employee', val(e.emergency_contact_relation))}
  </table>

  <div class="sec-heading">&nbsp;4. Employee Bank account Details –</div>
  <table class="data-table">
    ${row('Name of Bank', val(e.bank_name))}
    ${row('Bank A/c No', val(e.account_number))}
    ${row('IFSC Code', val(e.ifsc_code))}
    ${row('Name on bank passbook', val(e.account_holder_name))}
    ${row('Address of the Bank', val(e.bank_branch))}
  </table>

  <div class="sec-heading">5. Employee Address Details -</div>

  <table class="ver-header" style="margin-bottom:0">
    <tr>
      <td style="width:120mm; border:none; background:none;"></td>
      <td colspan="2" style="width:44mm; background:#daedf8; font-weight:700; font-size:9pt; text-align:center; border:1px solid #c5d8e8;">Verification Status</td>
    </tr>
    <tr>
      <td style="width:120mm; border:none; background:none;"></td>
      <td style="width:22mm; border:1px solid #c5d8e8; background:#daedf8; font-size:8.5pt; font-weight:700; text-align:center; padding:3px;">Verified<br>Yes/No</td>
      <td style="width:22mm; border:1px solid #c5d8e8; background:#daedf8; font-size:8.5pt; font-weight:700; text-align:center; padding:3px;">Referred Documents name</td>
    </tr>
  </table>

  <div style="font-weight:700; font-size:10pt; margin:2mm 0 1mm 0; color:${BRAND_DARK};">A) Permanent Address</div>
  <table class="data-table" style="margin-top:0">
    <tr>
      <td class="label" style="height:22mm; vertical-align:top;">Permanent Address</td>
      <td class="value" style="vertical-align:top;">${val(e.permanent_address)}</td>
      <td class="check"></td><td class="check"></td>
    </tr>
    ${row('Phone/Mobile No', val(e.permanent_phone))}
    ${row('Permanent Address Land mark', val(e.permanent_landmark))}
    ${row('Permanent Address Lat-long', val(e.permanent_lat_long))}
  </table>

  <div style="font-weight:700; font-size:10pt; margin:2mm 0 1mm 0; color:${BRAND_DARK};">B) Local Address</div>
  <table class="data-table">
    <tr>
      <td class="label" style="height:22mm; vertical-align:top;">Local Address</td>
      <td class="value" style="vertical-align:top;">${e.local_same_as_permanent ? 'Same as Permanent Address' : val(e.local_address)}</td>
      <td class="check"></td><td class="check"></td>
    </tr>
    ${row('Phone/Mobile No', e.local_same_as_permanent ? val(e.permanent_phone) : val(e.local_phone))}
    ${row('Local Address Landmark', e.local_same_as_permanent ? val(e.permanent_landmark) : val(e.local_landmark))}
    ${row('Local Address Lat-long', e.local_same_as_permanent ? val(e.permanent_lat_long) : val(e.local_lat_long))}
  </table>

  <div class="page-footer">Page 2 of 4</div>
</div>

<!-- ══════════════════════════════════════════════════════
     PAGE 3 — References + Declaration
══════════════════════════════════════════════════════ -->
<div class="page page-break">
  ${watermark}
  ${pageHeader}

  <div class="sec-heading">6. Reference Details –</div>
  <table class="ref-table">
    <thead>
      <tr>
        <th class="ref-lbl-hdr" style="text-align:left; background:#daedf8; color:${BRAND_DARK};">Personal References</th>
        <th>Reference 1<br><span style="font-weight:400;font-size:8pt">(Relevant Industry)</span></th>
        <th>Reference 2<br><span style="font-weight:400;font-size:8pt">(Local Area)</span></th>
        <th>Reference 3<br><span style="font-weight:400;font-size:8pt">(Other than relative)</span></th>
      </tr>
    </thead>
    <tbody>${refRows}</tbody>
  </table>

  <div class="sec-heading">7. DECLARATION –</div>
  <div class="declaration">
    <p>
      I<span style="display:inline-block;min-width:120mm;border-bottom:1px dotted #555;">&nbsp;${val(e.first_name)} ${val(e.last_name)}&nbsp;</span>,
      Hereby declare that the information furnished above is true, complete and correct to the best of my knowledge and belief.
      I understand that in the event of my information being found false or incorrect at any stage, my candidature / appointment
      shall be liable to cancellation / termination without notice or any compensation in lieu thereof. Information taken is purely
      for employment verification process and I have given my consent to Insta ICT Pvt Ltd for verification of it for employment
      related activity.
    </p>
    <div class="declaration-hindi" style="margin-top:8px;">
      <strong>घोषणा –</strong><br>
      मैं <span style="display:inline-block;min-width:100mm;border-bottom:1px dotted #999;">&nbsp;</span>,
      एतद्द्वारा घोषणा करता हूं कि ऊपर दी गई जानकारी मेरे सर्वोत्तम ज्ञान और विश्वास के अनुसार सत्य, पूर्ण और सही है।
      मैं समझता हूं कि किसी भी स्तर पर मेरी जानकारी के गलत या गलत पाए जाने की स्थिति में, मेरी उम्मीदवारी /
      बिना किसी सूचना के रद्द/समाप्त की जा सकती है या उसके बदले में कोई कटौती की जा सकती है।
      ली गई जानकारी विशुद्ध रूप से रोजगार सत्यापन प्रक्रिया के लिए है
      और मैंने रोजगार संबंधी गतिविधि के लिए इसके सत्यापन के लिए इंस्टा आईसीटी प्राइवेट लिमिटेड को अपनी सहमति दी है।
    </div>
  </div>

  <div class="sig-row">
    <div>
      <div>Date &nbsp;: &nbsp; <span style="display:inline-block;min-width:50mm;border-bottom:1px solid #555;">&nbsp;</span></div>
      <div style="margin-top:8mm;">Place &nbsp;: &nbsp; <span style="display:inline-block;min-width:50mm;border-bottom:1px solid #555;">&nbsp;</span></div>
    </div>
    <div style="text-align:center;">
      <div style="font-size:10pt; font-weight:700; margin-bottom:20mm;">Employee Signature</div>
      <div class="sig-line">&nbsp;( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
    </div>
  </div>

  <div class="note-box" style="margin-top:10mm;">
    <strong>Note:</strong> Digitally filled out the KYE form is not acceptable. KYE form should be handwritten
    by the respective employee.
  </div>

  <div class="page-footer">Page 3 of 4</div>
</div>

<!-- ══════════════════════════════════════════════════════
     PAGE 4 — Documents Checklist + Office Use
══════════════════════════════════════════════════════ -->
<div class="page page-break">
  ${watermark}
  ${pageHeader}

  <div class="sec-heading" style="margin-top:4mm;">
    8. Please attach the below-listed documents with the KYE form. –
  </div>

  <table class="doc-table">
    <thead>
      <tr>
        <th style="width:12mm; border:1px solid #c5d8e8;">Sr. No.</th>
        <th style="border:1px solid #c5d8e8; text-align:left;">Name of Document</th>
        <th style="width:30mm; border:1px solid #c5d8e8;">Attached (Yes/No)</th>
      </tr>
    </thead>
    <tbody>
      <tr><td class="sr">1</td><td>Resume - Signed copy</td>
        <td class="att">${e.documents?.find?.(d => d.type==='resume'||d.document_type==='resume') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">2</td><td>2 passport size photographs - Name should be written on backside</td>
        <td class="att">${e.documents?.find?.(d => d.type==='idPhoto'||d.document_type==='idPhoto'||d.type==='photo'||d.document_type==='photo') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">3</td><td>Medical Certificate - Latest</td>
        <td class="att">${e.documents?.find?.(d => d.type==='medicalCertificate'||d.document_type==='medicalCertificate') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">4</td><td>Aadhaar Card</td>
        <td class="att">${e.documents?.find?.(d => d.type==='aadharCard'||d.document_type==='aadharCard') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">5</td><td>Pan Card</td>
        <td class="att">${e.documents?.find?.(d => d.type==='panCard'||d.document_type==='panCard') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">6</td><td>Academic records (SSC, ITI, HSC, Diploma, Degree Certificates Copy)</td>
        <td class="att">${e.documents?.find?.(d => d.type==='academicRecords'||d.document_type==='academicRecords') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">7</td><td>Bank Details</td>
        <td class="att">${e.documents?.find?.(d => d.type==='bankPassbook'||d.document_type==='bankPassbook') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">8</td><td>Pay slip or bank statement reflecting last drawn salary</td>
        <td class="att">${e.documents?.find?.(d => d.type==='payslip'||d.document_type==='payslip') ? 'Yes ✓' : ''}</td></tr>
      <tr><td class="sr">9</td><td>Other certificates, if any</td>
        <td class="att">${e.documents?.find?.(d => d.type==='otherCertificates'||d.document_type==='otherCertificates') ? 'Yes ✓' : ''}</td></tr>
    </tbody>
  </table>

  <div class="sec-heading" style="margin-top:6mm;">9. For office Use only.</div>
  <table class="office-table" style="width:80mm;">
    <tr><td class="num">1</td><td class="lbl">DOJ</td><td></td></tr>
    <tr><td class="num">2</td><td class="lbl">Experience</td><td></td></tr>
    <tr><td class="num">3</td><td class="lbl">UAN</td><td></td></tr>
    <tr><td class="num">4</td><td class="lbl">Member ID</td><td></td></tr>
    <tr><td class="num">5</td><td class="lbl">Remarks</td><td style="height:20px;"></td></tr>
  </table>

  <div class="page-footer">Page 4 of 4</div>
</div>

<script>
  window.onload = () => { setTimeout(() => window.print(), 400); };
</script>
</body>
</html>`);

  win.document.close();
};

export default printKYEForm;