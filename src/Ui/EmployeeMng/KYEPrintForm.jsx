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

  const LOGO_URL = `${window.location.origin}/assets/Insta-logo1.png`;

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

  // ── Photo box HTML ─────────────────────────────────────────────────────────────
  const photoBoxContent = photoUrl
    ? `<img src="${photoUrl}" alt="Employee Photo"
           style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
       <div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;
                   flex-direction:column;gap:4px;padding:6px;text-align:center;
                   position:absolute;top:0;left:0;">
         <span style="font-size:7pt;color:#999;">Employee Passport Size<br>Photograph<br>(45cm X 35cm)</span>
       </div>`
    : `<div style="display:flex;width:100%;height:100%;align-items:center;justify-content:center;
                   flex-direction:column;gap:4px;padding:6px;text-align:center;">
         <span style="font-size:7pt;color:#999;">Employee Passport Size<br>Photograph<br>(45cm X 35cm)</span>
       </div>`;

  // ── Row helper — label col | value col | verified | referred docs ─────────────
  const row = (label, value) => `
    <tr>
      <td class="label">${label}</td>
      <td class="value">${val(value)}</td>
      <td class="check"></td>
      <td class="check"></td>
    </tr>`;

  // ── Verification status header block (reusable) ───────────────────────────────
  const verHeader = `
    <table class="ver-header" style="margin-bottom:0;">
      <tr>
        <td class="spacer" style="width:136mm;border:none;background:none;"></td>
        <td colspan="2" class="ver-group" style="width:46mm;">Verification Status</td>
      </tr>
      <tr>
        <td class="spacer" style="width:136mm;border:none;background:none;"></td>
        <td class="ver-sub" style="width:23mm;">Verified<br>Yes/No</td>
        <td class="ver-sub" style="width:23mm;">Referred Documents name</td>
      </tr>
    </table>`;

  // ── Page header ───────────────────────────────────────────────────────────────
  const pageHeader = `
    <div class="page-header">
      <span class="revision-label">KYE Form Revision - 1</span>
      <div class="logo-block">
        <img src="${LOGO_URL}" alt="Insta ICT Solutions" class="logo-img"
             onerror="this.style.display='none'" />
      </div>
    </div>`;

  // ── Reference rows ─────────────────────────────────────────────────────────────
  const refRows = `
    <tr>
      <td class="ref-label">Name</td>
      <td class="ref-val">${val(e.ref1_name)}</td>
      <td class="ref-val">${val(e.ref2_name)}</td>
      <td class="ref-val">${val(e.ref3_name)}</td>
    </tr>
    <tr>
      <td class="ref-label">Designation</td>
      <td class="ref-val">${val(e.ref1_designation)}</td>
      <td class="ref-val">${val(e.ref2_designation)}</td>
      <td class="ref-val">${val(e.ref3_designation)}</td>
    </tr>
    <tr>
      <td class="ref-label">Name of Organization</td>
      <td class="ref-val">${val(e.ref1_organization)}</td>
      <td class="ref-val">${val(e.ref2_organization)}</td>
      <td class="ref-val">${val(e.ref3_organization)}</td>
    </tr>
    <tr>
      <td class="ref-label">Address</td>
      <td class="ref-val" style="height:32px;">${val(e.ref1_address)}</td>
      <td class="ref-val">${val(e.ref2_address)}</td>
      <td class="ref-val">${val(e.ref3_address)}</td>
    </tr>
    <tr>
      <td class="ref-label">City, State, Pin Code</td>
      <td class="ref-val">${val(e.ref1_city_state_pin)}</td>
      <td class="ref-val">${val(e.ref2_city_state_pin)}</td>
      <td class="ref-val">${val(e.ref3_city_state_pin)}</td>
    </tr>
    <tr>
      <td class="ref-label">Contact No. (Mobile/Landline)</td>
      <td class="ref-val">${val(e.ref1_contact_no)}</td>
      <td class="ref-val">${val(e.ref2_contact_no)}</td>
      <td class="ref-val">${val(e.ref3_contact_no)}</td>
    </tr>
    <tr>
      <td class="ref-label">Email ID (Preferably Official)</td>
      <td class="ref-val">${val(e.ref1_email)}</td>
      <td class="ref-val">${val(e.ref2_email)}</td>
      <td class="ref-val">${val(e.ref3_email)}</td>
    </tr>
    <tr>
      <td class="ref-label">
        Verification Comment<br>
        <span style="font-size:7.5pt;font-weight:400;">(To be recorded by HR Manager)</span>
      </td>
      <td class="ref-val" style="height:44px;"></td>
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
      font-size: 10pt;
      color: #000;
      background: #fff;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 14mm 12mm 14mm;
      position: relative;
    }

    /* ─── Header ─── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 3mm;
    }
    .revision-label {
      font-size: 8pt;
      color: #666;
      margin-top: 2px;
    }
    .page-num {
      font-size: 8pt;
      color: #666;
      text-align: right;
      margin-top: 2px;
    }
    .logo-img {
      height: 48px;
      width: auto;
      object-fit: contain;
      display: block;
    }

    /* ─── Form title ─── */
    .form-title-box {
      border: 1.5px solid #000;
      text-align: center;
      padding: 8px 0;
      margin-bottom: 6mm;
    }
    .form-title-box h1 {
      font-size: 14pt;
      font-weight: 700;
      color: #000;
    }

    /* ─── Photo box ─── */
    .photo-box {
      border: 1px solid #999;
      background: #fff;
      position: relative;
      overflow: hidden;
    }

    /* ─── Section heading ─── */
    .sec-heading {
      font-size: 10pt;
      font-weight: 700;
      text-decoration: underline;
      margin: 4mm 0 1.5mm 0;
      color: #000;
    }

    /* ─── Verification header ─── */
    .ver-header {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
    }
    .ver-header td {
      font-size: 8.5pt;
      font-weight: 700;
      text-align: center;
      color: #000;
      padding: 3px 4px;
    }
    .ver-header .spacer { border: none; background: none; }
    .ver-header .ver-group {
      border: 1px solid #000;
    }
    .ver-header .ver-sub {
      border: 1px solid #000;
      font-size: 8pt;
    }

    /* ─── Main data table ─── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4mm;
      margin-top: 0;
    }
    .data-table td {
      border: 1px solid #000;
      padding: 3px 6px;
      vertical-align: top;
    }
    .data-table .label {
      width: 62mm;
      font-weight: 400;
      color: #000;
      background: #fff;
    }
    .data-table .value  { min-width: 70mm; }
    .data-table .check  { width: 22mm; text-align: center; }

    /* ─── Address sub-heading ─── */
    .addr-sub {
      font-weight: 700;
      font-size: 10pt;
      margin: 2mm 0 1mm 0;
      color: #000;
    }

    /* ─── Reference table ─── */
    .ref-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4mm;
    }
    .ref-table td, .ref-table th {
      border: 1px solid #000;
      padding: 3px 6px;
      vertical-align: top;
    }
    .ref-table thead th {
      background: #4472c4;
      color: #fff;
      font-size: 9pt;
      font-weight: 700;
      text-align: center;
      padding: 5px 6px;
    }
    .ref-table thead .ref-lbl-hdr {
      background: #dae3f3;
      color: #000;
      text-align: left;
      font-weight: 700;
    }
    .ref-label {
      width: 58mm;
      font-weight: 400;
      background: #fff;
    }
    .ref-val   { min-width: 30mm; }

    /* ─── Declaration ─── */
    .declaration {
      font-size: 9.5pt;
      line-height: 1.7;
      margin-bottom: 5mm;
      text-align: justify;
    }
    .declaration-hindi {
      font-size: 9pt;
      color: #000;
      margin-top: 6px;
      line-height: 1.8;
      text-align: justify;
    }
    .sig-area {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 10mm;
      font-size: 10pt;
      font-weight: 700;
    }
    .sig-date-place div {
      margin-bottom: 8mm;
    }
    .sig-underline {
      display: inline-block;
      min-width: 55mm;
      border-bottom: 1px solid #000;
    }
    .sig-right {
      text-align: center;
    }
    .sig-line-box {
      border-top: 1px solid #000;
      width: 65mm;
      text-align: center;
      padding-top: 2px;
      font-size: 9.5pt;
      margin-top: 14mm;
    }
    .note-box {
      font-size: 9.5pt;
      font-weight: 700;
      color: #000;
      margin-top: 8mm;
    }

    /* ─── Documents checklist ─── */
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 4mm;
    }
    .doc-table th {
      background: #4472c4;
      color: #fff;
      text-align: center;
      padding: 5px 8px;
      font-weight: 700;
      border: 1px solid #000;
    }
    .doc-table td {
      border: 1px solid #000;
      padding: 5px 8px;
      vertical-align: middle;
    }
    .doc-table td.sr  { text-align: center; width: 12mm; }
    .doc-table td.att { text-align: center; width: 32mm; }

    /* ─── Office use ─── */
    .office-table {
      width: 80mm;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    .office-table td {
      border: 1px solid #000;
      padding: 4px 8px;
    }
    .office-table .num {
      width: 8mm;
      text-align: center;
      font-weight: 700;
    }
    .office-table .lbl {
      width: 40mm;
      font-weight: 400;
    }
    .office-table .val { min-width: 30mm; height: 20px; }

    /* ─── Page footer ─── */
    .page-footer {
      text-align: right;
      font-size: 8pt;
      color: #666;
      margin-top: 6mm;
    }

    /* ─── Page break ─── */
    .page-break { page-break-before: always; break-before: page; }

    /* ─── Print ─── */
    @media print {
      @page { size: A4; margin: 0; }
      body  { padding: 0; }
      .page { page-break-after: always; padding: 12mm 14mm; }
    }
  </style>
</head>
<body>

<!-- ══════════════════════════════════════════════════
     PAGE 1 — Personal Details + Family Details
══════════════════════════════════════════════════ -->
<div class="page">
  ${pageHeader}

  <div class="form-title-box">
    <h1>General Information Form for<br>KYE</h1>
  </div>

  <!-- Photo box top-right -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:3mm;margin-top:-5mm;">
    <div class="photo-box" style="width:32mm;height:40mm;display:flex;align-items:center;justify-content:center;">
      ${photoBoxContent}
    </div>
  </div>

  <div class="sec-heading">1. Employee Personal Details -</div>

  <!-- Verification status header aligned to right columns -->
  ${verHeader}

  <table class="data-table" style="margin-top:0;">
    ${row('Employee Name:', val(e.first_name) + (e.last_name ? ' ' + e.last_name : ''))}
    ${row('Date of birth<br><span style="font-size:8pt;font-weight:400;">(DD-MMM-YYYY)</span>', fmt(e.date_of_birth))}
    ${row('Educational qualification', val(e.educational_qualification))}
    ${row('Name of Father/Husband', val(e.father_husband_name))}
    ${row('Marital Status<br><span style="font-size:8pt;font-weight:400;">(Married/Unmarried)</span>', val(e.marital_status))}
    ${row('Employee Blood Group', val(e.blood_group))}
    ${row('Email ID', val(e.email))}
    ${row('PAN Number', val(e.pan_number))}
    ${row('Name on PAN', val(e.name_on_pan))}
    ${row('Aadhaar No', val(e.aadhar_number))}
    ${row('Name on Aadhaar Card', val(e.name_on_aadhar))}
  </table>

  <div class="sec-heading">2. Employee Family Details -</div>

  ${verHeader}

  <table class="data-table" style="margin-top:0;">
    ${row('Father/Mother /Spouse Name', val(e.family_member_name))}
    ${row('Father/Mother / Spouse contact number', val(e.family_contact_no))}
    ${row('Father/Mother / Spouse working status', val(e.family_working_status))}
    ${row('Father/Mother / Spouse Employer name', val(e.family_employer_name))}
    ${row('Father/Spouse / Mother Employer contact number', val(e.family_employer_contact))}
  </table>

  <div class="page-footer">Page 1 of 4</div>
</div>

<!-- ══════════════════════════════════════════════════
     PAGE 2 — Emergency + Bank + Address
══════════════════════════════════════════════════ -->
<div class="page page-break">
  ${pageHeader}

  <div class="sec-heading">3. Employee Emergency Contact Details –</div>

  ${verHeader}

  <table class="data-table" style="margin-top:0;">
    ${row('Emergency Contact Person Name', val(e.emergency_contact_name))}
    ${row('Emergency Contact Person No', val(e.emergency_contact_no))}
    ${row('Emergency Contact Person Address', val(e.emergency_contact_address))}
    ${row('Emergency Contact Person Relation with Employee', val(e.emergency_contact_relation))}
  </table>

  <div class="sec-heading">4. Employee Bank account Details –</div>

  ${verHeader}

  <table class="data-table" style="margin-top:0;">
    ${row('Name of Bank', val(e.bank_name))}
    ${row('Bank A/c No', val(e.account_number))}
    ${row('IFSC Code', val(e.ifsc_code))}
    ${row('Name on bank passbook', val(e.account_holder_name))}
    ${row('Address of the Bank', val(e.bank_branch))}
  </table>

  <div class="sec-heading">5. Employee Address Details -</div>

  <!-- Verification status header -->
  ${verHeader}

  <div class="addr-sub">A) Permanent Address</div>
  <table class="data-table" style="margin-top:0;">
    <tr>
      <td class="label" style="height:24mm;vertical-align:top;">Permanent Address</td>
      <td class="value" style="vertical-align:top;">${val(e.permanent_address)}</td>
      <td class="check"></td>
      <td class="check"></td>
    </tr>
    ${row('Phone/Mobile No', val(e.permanent_phone))}
    ${row('Permanent Address Land mark', val(e.permanent_landmark))}
    ${row('Permanent Address Lat-long', val(e.permanent_lat_long))}
  </table>

  <div class="addr-sub">B) Local Address</div>
  <table class="data-table">
    <tr>
      <td class="label" style="height:24mm;vertical-align:top;">Local Address</td>
      <td class="value" style="vertical-align:top;">${e.local_same_as_permanent ? 'Same as Permanent Address' : val(e.local_address)}</td>
      <td class="check"></td>
      <td class="check"></td>
    </tr>
    ${row('Phone/Mobile No', e.local_same_as_permanent ? val(e.permanent_phone) : val(e.local_phone))}
    ${row('Local Address Landmark', e.local_same_as_permanent ? val(e.permanent_landmark) : val(e.local_landmark))}
    ${row('Local Address Lat-long', e.local_same_as_permanent ? val(e.permanent_lat_long) : val(e.local_lat_long))}
  </table>

  <div class="page-footer">Page 2 of 4</div>
</div>

<!-- ══════════════════════════════════════════════════
     PAGE 3 — References + Declaration
══════════════════════════════════════════════════ -->
<div class="page page-break">
  ${pageHeader}

  <div class="sec-heading">6. Reference Details –</div>
  <table class="ref-table">
    <thead>
      <tr>
        <th class="ref-lbl-hdr">Personal References</th>
        <th>Reference 1<br><span style="font-weight:400;font-size:8pt;">(Relevant Industry)</span></th>
        <th>Reference 2<br><span style="font-weight:400;font-size:8pt;">(Local Area)</span></th>
        <th>Reference 3<br><span style="font-weight:400;font-size:8pt;">(Other than relative)</span></th>
      </tr>
    </thead>
    <tbody>${refRows}</tbody>
  </table>

  <div class="sec-heading">7. DECLARATION –</div>
  <div class="declaration">
    <p>
      I<span style="display:inline-block;min-width:115mm;border-bottom:1px solid #000;">&nbsp;${val(e.first_name)} ${val(e.last_name)}&nbsp;</span>,
      Hereby declare that the information furnished above is true, complete and correct to the best of my knowledge and belief.
      I understand that in the event of my information being found false or incorrect at any stage, my candidature / appointment
      shall be liable to cancellation / termination without notice or any compensation in lieu thereof. Information taken is purely
      for employment verification process and I have given my consent to Insta ICT Pvt Ltd for verification of it for employment
      related activity.
    </p>
    <div class="declaration-hindi">
      <strong>घोषणा –</strong><br>
      मैं<span style="display:inline-block;min-width:108mm;border-bottom:1px solid #999;">&nbsp;</span>,
      एतद्द्वारा घोषणा करता हूं कि ऊपर दी गई जानकारी मेरे सर्वोत्तम ज्ञान
      और विश्वास के अनुसार सत्य, पूर्ण और सही है। मैं समझता हूं कि किसी भी स्तर पर मेरी जानकारी के गलत या गलत पाए जाने की स्थिति में, मेरी उम्मीदवारी/
      बिना किसी सूचना के रद्द/समाप्त की जा सकती है या उसके बदले में कोई कटौती की जा सकती है। ली गई जानकारी विशुद्ध रूप से रोजगार सत्यापन प्रक्रिया के लिए है
      और मैंने रोजगार संबंधी गतिविधि के लिए इसके सत्यापन के लिए इंस्टा आईसीटी प्राइवेट लिमिटेड को अपनी सहमति दी है।
    </div>
  </div>

  <div class="sig-area">
    <div class="sig-date-place">
      <div>Date &nbsp;: &nbsp; <span class="sig-underline">&nbsp;</span></div>
      <div>Place &nbsp;: &nbsp; <span class="sig-underline">&nbsp;</span></div>
    </div>
    <div class="sig-right">
      <div style="font-size:10pt;font-weight:700;">Employee Signature</div>
      <div class="sig-line-box">&nbsp;( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>
    </div>
  </div>

  <div class="note-box">
    <strong>Note: Digitally filled out the KYE form is not acceptable. KYE form should be handwritten
    by the respective employee.</strong>
  </div>

  <div class="page-footer">Page 3 of 4</div>
</div>

<!-- ══════════════════════════════════════════════════
     PAGE 4 — Documents Checklist + Office Use
══════════════════════════════════════════════════ -->
<div class="page page-break">
  ${pageHeader}

  <div class="sec-heading" style="margin-top:4mm;">
    8. Please attach the below-listed documents with the KYE form. –
  </div>

  <table class="doc-table">
    <thead>
      <tr>
        <th style="width:14mm;">Sr.<br>No.</th>
        <th style="text-align:left;">Name of Document</th>
        <th style="width:34mm;">Attached (Yes/No)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="sr">1</td>
        <td>Resume - Signed copy</td>
        <td class="att">${e.documents?.find?.(d => d.type==='resume'||d.document_type==='resume') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">2</td>
        <td>2 passport size photographs - Name should be written on backside</td>
        <td class="att">${e.documents?.find?.(d => d.type==='idPhoto'||d.document_type==='idPhoto'||d.type==='photo'||d.document_type==='photo') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">3</td>
        <td>Medical Certificate - Latest</td>
        <td class="att">${e.documents?.find?.(d => d.type==='medicalCertificate'||d.document_type==='medicalCertificate') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">4</td>
        <td>Aadhaar Card</td>
        <td class="att">${e.documents?.find?.(d => d.type==='aadharCard'||d.document_type==='aadharCard') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">5</td>
        <td>Pan Card</td>
        <td class="att">${e.documents?.find?.(d => d.type==='panCard'||d.document_type==='panCard') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">6</td>
        <td>Academic records (SSC, ITI, HSC, Diploma, Degree Certificates Copy)</td>
        <td class="att">${e.documents?.find?.(d => d.type==='academicRecords'||d.document_type==='academicRecords') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">7</td>
        <td>Bank Details</td>
        <td class="att">${e.documents?.find?.(d => d.type==='bankPassbook'||d.document_type==='bankPassbook') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">8</td>
        <td>Pay slip or bank statement reflecting last drawn salary</td>
        <td class="att">${e.documents?.find?.(d => d.type==='payslip'||d.document_type==='payslip') ? 'Yes ✓' : ''}</td>
      </tr>
      <tr>
        <td class="sr">9</td>
        <td>Other certificates, if any</td>
        <td class="att">${e.documents?.find?.(d => d.type==='otherCertificates'||d.document_type==='otherCertificates') ? 'Yes ✓' : ''}</td>
      </tr>
    </tbody>
  </table>

  <div class="sec-heading" style="margin-top:6mm;">9. For office Use only.</div>
  <table class="office-table">
    <tr><td class="num">1</td><td class="lbl">DOJ</td><td class="val"></td></tr>
    <tr><td class="num">2</td><td class="lbl">Experience</td><td class="val"></td></tr>
    <tr><td class="num">3</td><td class="lbl">UAN</td><td class="val"></td></tr>
    <tr><td class="num">4</td><td class="lbl">Member ID</td><td class="val"></td></tr>
    <tr><td class="num">5</td><td class="lbl">Remarks</td><td class="val" style="height:24px;"></td></tr>
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