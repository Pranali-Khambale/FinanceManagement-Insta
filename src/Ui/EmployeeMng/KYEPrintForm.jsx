// src/Ui/EmployeeMng/KYEPrintForm.jsx
// ✅ FIXED:
//   1. UAN Number row added to Section 1 (Employee Personal Details)
//   2. UAN row in Section 9 (For Office Use Only) now filled from employee data
//   3. Reference field keys corrected:
//        ref1_desig → ref1_designation
//        ref1_org   → ref1_organization
//        ref1_addr  → ref1_address
//        ref1_mob   → ref1_contact_no
//        (same for ref2_*, ref3_*)
// ✅ UI SYNC (from ViewEmployee.jsx):
//   - Photo box repositioned to top-right of Page 1 (after title, before Section 1)
//   - Verification status header rendered as two-row box aligned to right 24% of page
//   - Section headings with verification box use flex layout (73% title + 3% gap + 24% ver box)
//   - Plain section headings (no ver box) styled consistently
//   - Data rows use 4-column table layout: label(33%) | value(40%) | gap(3%) | ver-yes-no(12%) | ver-doc(12%)
//   - Page footer "Page N of 4" rendered bottom-right per page
//   - Page header matches: revision label left, logo right

import React from "react";

const fmt = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const val = (v) => v || "";

const buildFullName = (e) =>
  [val(e.first_name), val(e.father_husband_name), val(e.last_name)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

const resolveUan = (e) => val(e.uan_number || e.uanNumber || "");

export const printKYEForm = (employee) => {
  const win = window.open("", "_blank", "width=1000,height=900,scrollbars=yes");
  if (!win) {
    alert("Pop-ups are blocked. Please allow pop-ups and try again.");
    return;
  }

  const e = employee || {};
  const employeeFullName = buildFullName(e);
  const uanDisplay = resolveUan(e);
  const LOGO_URL = `${window.location.origin}/assets/Insta-logo1.png`;

  // ── Data row: 5 columns matching ViewEmployee layout ──────────────────────
  // col0=label(33%) | col1=value(40%) | col2=gap(3%) | col3=ver-yes-no(12%) | col4=ver-doc(12%)
  const row = (label, value, tall = false) => `
    <tr>
      <td class="label${tall ? " tall" : ""}">${label}</td>
      <td class="value${tall ? " tall" : ""}">${val(value)}</td>
      <td class="gap-cell"></td>
      <td class="check${tall ? " tall" : ""}"></td>
      <td class="check${tall ? " tall" : ""}"></td>
    </tr>`;

  // ── Section heading WITH verification box (flex: 73% + 3% + 24%) ─────────
  const secWithVer = (text) => `
    <div class="sec-with-ver">
      <div class="sec-title-block">${text}</div>
      <div class="sec-gap-block"></div>
      <div class="sec-ver-block">
        <table class="ver-box-table">
          <tr>
            <td colspan="2" class="ver-box-header">Verification Status</td>
          </tr>
          <tr>
            <td class="ver-box-sub">Verified<br>Yes/No</td>
            <td class="ver-box-sub">Referred Documents name</td>
          </tr>
        </table>
      </div>
    </div>`;

  // ── Plain section heading (no verification box) ───────────────────────────
  const sec = (text) => `<div class="sec-heading">${text}</div>`;

  // ── Page header ───────────────────────────────────────────────────────────
  const pageHeader = () => `
    <div class="page-header">
      <span class="revision-label">KYE Form Revision - 1</span>
      <img src="${LOGO_URL}" alt="Insta ICT Solutions" class="logo-img" onerror="this.style.display='none'" />
    </div>`;

  // ── Page footer ───────────────────────────────────────────────────────────
  const pageFooter = (n) => `<div class="page-num">Page ${n} of 4</div>`;

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>KYE Form - ${employeeFullName}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: 'Calibri', 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; color: #000; background: #cbd5e1; }

    /* ── Page wrapper ── */
    .page {
      width: 210mm;
      background: #fff;
      padding: 12mm 14mm;
      margin: 0 auto 14px;
      position: relative;
      font-size: 10pt;
    }
    .page:not(:last-child) { page-break-after: always; }

    /* ── Page header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2mm;
    }
    .revision-label { font-size: 8pt; color: #555; }
    .logo-img { height: 44px; width: auto; object-fit: contain; }

    /* ── Title box ── */
    .form-title {
      border: 1.5px solid #000;
      text-align: center;
      padding: 10px 0;
      margin-bottom: 2mm;
      font-size: 14pt;
      font-weight: bold;
    }

    /* ── Passport photo box: matches ViewEmployee.jsx layout exactly ── */
    .photo-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 2mm;
    }
    .photo-box {
      width: 32mm;
      height: 36mm;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7pt;
      color: #aaa;
      text-align: center;
      padding: 4px;
      line-height: 1.6;
      background: #fafafa;
      overflow: hidden;
    }

    /* ── Section heading WITH verification box ── */
    .sec-with-ver {
      display: flex;
      align-items: flex-end;
      margin-top: 3mm;
      margin-bottom: 0;
    }
    .sec-title-block {
      width: 73%;
      flex-shrink: 0;
      font-weight: bold;
      font-size: 10pt;
      text-decoration: underline;
      margin-bottom: 1mm;
    }
    .sec-gap-block  { width: 3%;  flex-shrink: 0; }
    .sec-ver-block  { width: 24%; flex-shrink: 0; }

    .ver-box-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      border: 1px solid #000;
    }
    .ver-box-header {
      border: none;
      border-bottom: 1px solid #000;
      text-align: center;
      padding: 3px 4px;
      font-weight: bold;
      background: #fff;
    }
    .ver-box-sub {
      text-align: center;
      padding: 3px 4px;
      font-size: 8pt;
      background: #fff;
      width: 50%;
    }
    .ver-box-sub:first-child { border-right: 1px solid #000; white-space: nowrap; }

    /* ── Plain section heading ── */
    .sec-heading {
      font-weight: bold;
      font-size: 10pt;
      text-decoration: underline;
      margin: 3mm 0 1mm;
    }
    .sub-sec {
      font-weight: bold;
      font-size: 10pt;
      margin: 3mm 0 1mm;
    }

    /* ── Data table (5-column layout matching ViewEmployee) ── */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-bottom: 3mm;
      table-layout: fixed;
    }
    .data-table col.col-label  { width: 33%; }
    .data-table col.col-value  { width: 40%; }
    .data-table col.col-gap    { width: 3%;  }
    .data-table col.col-check1 { width: 12%; }
    .data-table col.col-check2 { width: 12%; }

    .data-table .label {
      border: 1px solid #000;
      border-right: none;
      padding: 5px 8px;
      vertical-align: top;
      background: #fff;
      height: 22px;
      min-height: 22px;
    }
    .data-table .value {
      border: 1px solid #000;
      padding: 5px 8px;
      vertical-align: top;
      background: #fff;
      height: 22px;
      min-height: 22px;
    }
    .data-table .gap-cell {
      border: none;
      background: transparent;
      padding: 0;
    }
    .data-table .check {
      border: 1px solid #000;
      background: #fff;
      height: 22px;
      min-height: 22px;
    }
    /* right ver-yes-no cell: no right border (shared with doc name cell) */
    .data-table .check:first-of-type { border-right: none; }

    .data-table .label.tall,
    .data-table .value.tall,
    .data-table .check.tall { height: 64px; min-height: 64px; }

    /* UAN value style */
    .uan-value { font-family: monospace; font-weight: 600; font-size: 10.5pt; }

    /* ── Reference table ── */
    .ref-table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; border: 1px solid #000; font-size: 9.5pt; }
    .ref-table th, .ref-table td { border: 1px solid #000; padding: 5px 6px; vertical-align: top; background: #fff; color: #000; }
    .ref-table thead tr:first-child th { text-align: center; font-weight: bold; }
    .ref-table thead tr:nth-child(2) th { text-align: center; font-weight: bold; }
    .ref-table .row-label { width: 28%; }

    /* ── Document checklist table ── */
    .doc-table { width: 100%; border-collapse: collapse; margin-bottom: 6mm; border: 1px solid #000; font-size: 9.5pt; }
    .doc-table th, .doc-table td { border: 1px solid #000; padding: 5px 8px; background: #fff; color: #000; }
    .doc-table th:nth-child(1), .doc-table td:nth-child(1) { width: 12mm; text-align: center; }
    .doc-table th:nth-child(3), .doc-table td:nth-child(3) { width: 34mm; text-align: center; }

    /* ── Office use table ── */
    .office-table { width: 130mm; border-collapse: collapse; font-size: 9.5pt; }
    .office-table td { border: 1px solid #000; padding: 4px 8px; background: #fff; }
    .office-table .sr-cell { width: 10mm; text-align: center; font-weight: bold; }
    .office-table .lbl-cell { width: 40mm; }
    .office-table .val-cell { width: 80mm; }
    .office-table .remarks-cell { height: 24px; }

    /* ── Declaration ── */
    .declaration-text { font-size: 9.5pt; line-height: 1.7; margin-bottom: 5mm; text-align: justify; }
    .sig-row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10mm; font-size: 10pt; font-weight: bold; }
    .sig-line { display: inline-block; min-width: 55mm; border-bottom: 1px solid #000; }
    .sig-box { text-align: center; }
    .sig-bar { border-top: 1px solid #000; width: 200px; margin-top: 56px; padding-top: 2px; font-size: 9.5pt; font-weight: bold; text-align: center; }
    .footer-note { font-size: 9.5pt; font-weight: bold; margin-top: 8mm; }

    /* ── Page number ── */
    .page-num { text-align: right; font-size: 8pt; color: #555; margin-top: 3mm; }

    /* ── Print overrides ── */
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; background: none; }
      .page { margin: 0 !important; padding: 12mm 14mm !important; box-shadow: none; page-break-inside: avoid; }
      .page:not(:last-child) { page-break-after: always; }
      .photo-wrap { margin-bottom: 2mm; }
      .photo-box { height: 35mm; }
    }
  </style>
</head>
<body>

  <!-- ═══════════ PAGE 1 ═══════════ -->
  <div class="page">
    ${pageHeader()}

    <div class="form-title">
      General Information Form for<br>KYE
    </div>

    <!-- Passport photo: flex right-aligned, matches ViewEmployee.jsx -->
    <div class="photo-wrap">
      <div class="photo-box">
        Employee Passport Size<br>Photograph<br>(45cm X 35cm)
      </div>
    </div>

    ${secWithVer("1. Employee Personal Details -")}
    <table class="data-table">
      <colgroup>
        <col class="col-label">
        <col class="col-value">
        <col class="col-gap">
        <col class="col-check1">
        <col class="col-check2">
      </colgroup>
      <tbody>
        ${row("Employee Name:", employeeFullName)}
        ${row("Date of birth (DD-MMM-YYYY)", fmt(e.date_of_birth))}
        ${row("Educational qualification", val(e.educational_qualification))}
        ${row("Name of Father/Husband", val(e.father_husband_name))}
        ${row("Marital Status (Married/Unmarried)", val(e.marital_status))}
        ${row("Employee Blood Group", val(e.blood_group))}
        ${row("Email ID", val(e.email))}
        ${row("PAN Number", val(e.pan_number))}
        ${row("Name on PAN", val(e.name_on_pan))}
        ${row("Aadhaar No", "[Aadhaar Redacted]")}
        ${row("Name on Aadhaar Card", val(e.name_on_aadhar))}
        <tr>
          <td class="label">UAN Number</td>
          <td class="${uanDisplay ? "uan-value value" : "value"}">${uanDisplay}</td>
          <td class="gap-cell"></td>
          <td class="check"></td>
          <td class="check"></td>
        </tr>
      </tbody>
    </table>

    <div class="sec-heading">2. Employee Family Details -</div>
    <table class="data-table">
      <colgroup>
        <col class="col-label">
        <col class="col-value">
        <col class="col-gap">
        <col class="col-check1">
        <col class="col-check2">
      </colgroup>
      <tbody>
        ${row("Father/Mother /Spouse Name", val(e.family_member_name))}
        ${row("Father/Mother / Spouse contact number", val(e.family_contact_no))}
        ${row("Father/Mother / Spouse working status", val(e.family_working_status))}
        ${row("Father/Mother / Spouse Employer name", val(e.family_employer_name))}
        ${row("Father/Spouse / Mother Employer contact number", val(e.family_employer_contact))}
      </tbody>
    </table>

    ${pageFooter(1)}
  </div>

  <!-- ═══════════ PAGE 2 ═══════════ -->
  <div class="page">
    ${pageHeader()}

    <div class="sec-heading" style="margin-top:0;">3. Employee Emergency Contact Details –</div>
    <table class="data-table">
      <colgroup>
        <col class="col-label">
        <col class="col-value">
        <col class="col-gap">
        <col class="col-check1">
        <col class="col-check2">
      </colgroup>
      <tbody>
        ${row("Emergency Contact Person Name", val(e.emergency_contact_name))}
        ${row("Emergency Contact Person No", val(e.emergency_contact_no))}
        ${row("Emergency Contact Person Address", val(e.emergency_contact_address), true)}
        ${row("Emergency Contact Person Relation with Employee", val(e.emergency_contact_relation))}
      </tbody>
    </table>

    <div class="sec-heading">4. Employee Bank account Details –</div>
    <table class="data-table">
      <colgroup>
        <col class="col-label">
        <col class="col-value">
        <col class="col-gap">
        <col class="col-check1">
        <col class="col-check2">
      </colgroup>
      <tbody>
        ${row("Name of Bank", val(e.bank_name))}
        ${row("Bank A/c No", val(e.account_number))}
        ${row("IFSC Code", val(e.ifsc_code))}
        ${row("Name on bank passbook", val(e.account_holder_name))}
        ${row("Address of the Bank", val(e.bank_branch || e.branch))}
      </tbody>
    </table>

    ${secWithVer("5. Employee Address Details -")}

    <div class="sub-sec">A) Permanent Address</div>
    <table class="data-table">
      <colgroup>
        <col class="col-label">
        <col class="col-value">
        <col class="col-gap">
        <col class="col-check1">
        <col class="col-check2">
      </colgroup>
      <tbody>
        ${row("Permanent Address", val(e.permanent_address), true)}
        ${row("Phone/Mobile No", val(e.permanent_phone))}
        ${row("Permanent Address Land mark", val(e.permanent_landmark))}
        ${row("Permanent Address Lat-long", val(e.permanent_lat_long))}
      </tbody>
    </table>

    <div class="sub-sec">B) Local Address</div>
    <table class="data-table">
      <colgroup>
        <col class="col-label">
        <col class="col-value">
        <col class="col-gap">
        <col class="col-check1">
        <col class="col-check2">
      </colgroup>
      <tbody>
        ${row(
          "Local Address",
          e.local_same_as_permanent
            ? val(e.permanent_address)
            : val(e.local_address),
          true,
        )}
        ${row(
          "Phone/Mobile No",
          e.local_same_as_permanent
            ? val(e.permanent_phone)
            : val(e.local_phone),
        )}
        ${row(
          "Local Address Landmark",
          e.local_same_as_permanent
            ? val(e.permanent_landmark)
            : val(e.local_landmark),
        )}
        ${row(
          "Local Address Lat-long",
          e.local_same_as_permanent
            ? val(e.permanent_lat_long)
            : val(e.local_lat_long),
        )}
      </tbody>
    </table>

    ${pageFooter(2)}
  </div>

  <!-- ═══════════ PAGE 3 ═══════════ -->
  <div class="page">
    ${pageHeader()}

    ${sec("6. Reference Details –")}
    <table class="ref-table">
      <thead>
        <tr>
          <th colspan="4" style="text-align:center;">Personal References</th>
        </tr>
        <tr>
          <th class="row-label"></th>
          <th>Reference 1<br><span style="font-weight:400;font-size:8pt;">(Relevant Industry)</span></th>
          <th>Reference 2<br><span style="font-weight:400;font-size:8pt;">(Local Area)</span></th>
          <th>Reference 3<br><span style="font-weight:400;font-size:8pt;">(Other than relative)</span></th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="row-label">Name</td>
          <td>${val(e.ref1_name)}</td>
          <td>${val(e.ref2_name)}</td>
          <td>${val(e.ref3_name)}</td>
        </tr>
        <tr>
          <td class="row-label">Designation</td>
          <td>${val(e.ref1_designation)}</td>
          <td>${val(e.ref2_designation)}</td>
          <td>${val(e.ref3_designation)}</td>
        </tr>
        <tr>
          <td class="row-label">Name of Organization</td>
          <td>${val(e.ref1_organization)}</td>
          <td>${val(e.ref2_organization)}</td>
          <td>${val(e.ref3_organization)}</td>
        </tr>
        <tr>
          <td class="row-label">Address</td>
          <td>${val(e.ref1_address)}</td>
          <td>${val(e.ref2_address)}</td>
          <td>${val(e.ref3_address)}</td>
        </tr>
        <tr>
          <td class="row-label">City, State, Pin Code</td>
          <td>${val(e.ref1_city_state_pin)}</td>
          <td>${val(e.ref2_city_state_pin)}</td>
          <td>${val(e.ref3_city_state_pin)}</td>
        </tr>
        <tr>
          <td class="row-label">Contact No. (Mobile/Landline)</td>
          <td>${val(e.ref1_contact_no)}</td>
          <td>${val(e.ref2_contact_no)}</td>
          <td>${val(e.ref3_contact_no)}</td>
        </tr>
        <tr>
          <td class="row-label">Email ID (Preferably Official)</td>
          <td>${val(e.ref1_email)}</td>
          <td>${val(e.ref2_email)}</td>
          <td>${val(e.ref3_email)}</td>
        </tr>
        <tr style="height:44px;">
          <td class="row-label">
            Verification Comment<br>
            <span style="font-size:7.5pt;color:#555;">(To be recorded by HR Manager)</span>
          </td>
          <td></td>
          <td></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    ${sec("7. DECLARATION –")}
    <div class="declaration-text">
      <p style="margin:0 0 8px;">
        I
        <span style="display:inline-block;min-width:110mm;border-bottom:1px solid #000;">
          &nbsp;${employeeFullName}&nbsp;
        </span>
        , Hereby declare that the information furnished above is true,
        complete and correct to the best of my knowledge and belief. I
        understand that in the event of my information being found false
        or incorrect at any stage, my candidature / appointment shall be
        liable to cancellation / termination without notice or any
        compensation in lieu thereof. Information taken is purely for
        employment verification process and I have given my consent to
        Insta ICT Pvt Ltd for verification of it for employment related
        activity.
      </p>
      <div style="font-weight:bold;font-size:9.5pt;margin-bottom:4px;">घोषणा –</div>
      <div style="font-size:9pt;line-height:1.8;">
        मैं
        <span style="display:inline-block;min-width:108mm;border-bottom:1px dotted #000;">&nbsp;</span>
        , एतद्द्वारा घोषणा करता हूं कि ऊपर दी गई जानकारी मेरे सर्वोत्तम
        ज्ञान और विश्वास के अनुसार सत्य, पूर्ण और सही है। मैं समझता हूं
        कि किसी भी स्तर पर मेरी जानकारी के गलत या गलत पाए जाने की स्थिति
        में, मेरी उम्मीदवारी/ बिना किसी सूचना के रद्द/समाप्त की जा सकती
        है या उसके बदले में कोई कटौती की जा सकती है। ली गई जानकारी
        विशुद्ध रूप से रोजगार सत्यापन प्रक्रिया के लिए है और मैंने
        रोजगार संबंधी गतिविधि के लिए इसके सत्यापन के लिए इंस्टा आईसीटी
        प्राइवेट लिमिटेड को अपनी सहमति दी है।
      </div>
    </div>

    <div class="sig-row">
      <div>
        <div style="margin-bottom:8mm;">
          Date &nbsp;:&nbsp;<span class="sig-line">&nbsp;</span>
        </div>
        <div>
          Place &nbsp;:&nbsp;<span class="sig-line">&nbsp;</span>
        </div>
      </div>
      <div class="sig-box">
        <div>Employee Signature</div>
        <div class="sig-bar">
          &nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
        </div>
      </div>
    </div>

    <div class="footer-note">
      Note: Digitally filled out the KYE form is not acceptable. KYE form should be handwritten by the respective employee.
    </div>

    ${pageFooter(3)}
  </div>

  <!-- ═══════════ PAGE 4 ═══════════ -->
  <div class="page">
    ${pageHeader()}

    ${sec("8. Please attach the below-listed documents with the KYE form. –")}
    <table class="doc-table">
      <thead>
        <tr>
          <th>Sr.<br>No.</th>
          <th>Name of Document</th>
          <th>Attached (Yes/No)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>Resume - Signed copy</td><td></td></tr>
        <tr><td>2</td><td>2 passport size photographs - Name should be written on backside</td><td></td></tr>
        <tr><td>3</td><td>Medical Certificate - Latest</td><td></td></tr>
        <tr><td>4</td><td>Aadhaar Card</td><td></td></tr>
        <tr><td>5</td><td>Pan Card</td><td></td></tr>
        <tr><td>6</td><td>Academic records (SSC, ITI, HSC, Diploma, Degree Certificates Copy)</td><td></td></tr>
        <tr><td>7</td><td>Bank Details</td><td></td></tr>
        <tr><td>8</td><td>Pay slip or bank statement reflecting last drawn salary</td><td></td></tr>
        <tr><td>9</td><td>Other certificates, if any</td><td></td></tr>
      </tbody>
    </table>

    ${sec("9. For office Use only.")}
    <table class="office-table">
      <tbody>
        <tr>
          <td class="sr-cell">1</td>
          <td class="lbl-cell">DOJ</td>
          <td class="val-cell"></td>
        </tr>
        <tr>
          <td class="sr-cell">2</td>
          <td class="lbl-cell">Experience</td>
          <td class="val-cell"></td>
        </tr>
        <tr>
          <td class="sr-cell">3</td>
          <td class="lbl-cell">UAN</td>
          <td class="val-cell ${uanDisplay ? "uan-value" : ""}">${uanDisplay}</td>
        </tr>
        <tr>
          <td class="sr-cell">4</td>
          <td class="lbl-cell">Member ID</td>
          <td class="val-cell"></td>
        </tr>
        <tr>
          <td class="sr-cell">5</td>
          <td class="lbl-cell">Remarks</td>
          <td class="val-cell remarks-cell"></td>
        </tr>
      </tbody>
    </table>

    ${pageFooter(4)}
  </div>

</body>
</html>
  `);

  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
};

export default printKYEForm;
