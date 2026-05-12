import React from "react";

/**
 * KYEPrintForm.jsx
 * Updated to exactly match the 4-page Blank_KYE_Form.pdf layout and content.
 */

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

export const printKYEForm = (employee) => {
  const win = window.open("", "_blank", "width=1000,height=900,scrollbars=yes");
  if (!win) {
    alert("Pop-ups are blocked. Please allow pop-ups and try again.");
    return;
  }

  const e = employee || {};
  const employeeFullName = buildFullName(e);
  const LOGO_URL = `${window.location.origin}/assets/Insta-logo1.png`;

  // Row helper for data tables with Verification columns
  const row = (label, value) => `
    <tr>
      <td class="label">${label}</td>
      <td class="value">${val(value)}</td>
      <td class="check"></td>
      <td class="check"></td>
    </tr>`;

  const verHeader = `
    <table class="ver-header">
      <tr>
        <td class="spacer" style="width:136mm;"></td>
        <td colspan="2" class="ver-group">Verification Status</td>
      </tr>
      <tr>
        <td class="spacer" style="width:136mm;"></td>
        <td class="ver-sub">Verified Yes/No</td>
        <td class="ver-sub">Referred Documents name</td>
      </tr>
    </table>`;

  const pageHeader = (pageNum) => `
    <div class="page-header">
      <span class="revision-label">KYE Form Revision - 1</span>
      <div class="logo-block">
        <img src="${LOGO_URL}" alt="Insta ICT Solutions" class="logo-img" onerror="this.style.display='none'" />
      </div>
    </div>`;

  win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>KYE Form - ${employeeFullName}</title>
  <style>
    body { font-family: 'Calibri', sans-serif; margin: 0; padding: 0; color: #000; }
    .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: auto; position: relative; page-break-after: always; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5mm; }
    .revision-label { font-size: 9pt; }
    .logo-img { height: 50px; }
    .form-title { border: 1.5px solid #000; text-align: center; padding: 10px; margin-bottom: 20px; font-size: 14pt; font-weight: bold; }
    .sec-heading { font-weight: bold; text-decoration: underline; margin: 15px 0 5px 0; font-size: 11pt; }
    
    .ver-header { width: 100%; border-collapse: collapse; }
    .ver-header td { text-align: center; font-size: 8pt; font-weight: bold; border: 1px solid #000; padding: 2px; }
    .ver-header .spacer { border: none; height: 0; }
    .ver-header .ver-group { border: 1px solid #000; }
    
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .data-table td { border: 1px solid #000; padding: 5px; font-size: 10pt; vertical-align: top; }
    .data-table .label { width: 60mm; background: #f8f8f8; }
    .data-table .value { width: 75mm; }
    .data-table .check { width: 23mm; height: 25px; }
    
    .ref-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .ref-table th, .ref-table td { border: 1px solid #000; padding: 5px; font-size: 9pt; text-align: left; vertical-align: top; }
    .ref-table th { background: #f2f2f2; font-weight: bold; }
    
    .declaration-box { margin-top: 20px; font-size: 10pt; line-height: 1.5; border: 1px solid #000; padding: 15px; }
    .footer-note { margin-top: 30px; font-weight: bold; font-size: 10pt; }
    .page-num { position: absolute; bottom: 15mm; right: 15mm; font-size: 9pt; }
    
    .photo-box { border: 1px solid #000; width: 35mm; height: 45mm; float: right; margin-top: -10mm; margin-right: 15mm; display: flex; align-items: center; justify-content: center; text-align: center; font-size: 7pt; }
    
    .sub-sec { font-weight: bold; margin-top: 10px; margin-bottom: 5px; font-size: 10pt; }
    
    .office-table { width: 100mm; border-collapse: collapse; }
    .office-table td { border: 1px solid #000; padding: 5px; font-size: 9pt; }
    
    .doc-table th:nth-child(1) { width: 10mm; }
    .doc-table th:nth-child(3) { width: 30mm; }
    
    @media print {
      body { background: none; }
      .page { margin: 0; padding: 15mm; border: none; box-shadow: none; }
    }
  </style>
</head>
<body>

  <div class="page">
    ${pageHeader(1)}
    <div class="form-title">General Information Form for KYE</div>
    
    <div class="sec-heading">1. Employee Personal Details -</div>
    ${verHeader}
    <table class="data-table">
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
    </table>

    <div class="sec-heading">2. Employee Family Details -</div>
    ${verHeader}
    <table class="data-table">
      ${row("Father/Mother /Spouse Name", val(e.family_member_name))}
      ${row("Father/Mother / Spouse contact number", val(e.family_contact_no))}
      ${row("Father/Mother / Spouse working status", val(e.family_working_status))}
      ${row("Employer name", val(e.family_employer_name))}
      ${row("Employer contact number", val(e.family_employer_contact))}
    </table>
    <div class="photo-box">Employee Passport Size<br>Photograph<br>(45cm X 35cm)</div>
    <div class="page-num">Page 1 of 4</div>
  </div>

  <div class="page">
    ${pageHeader(2)}
    <div class="sec-heading">3. Employee Emergency Contact Details -</div>
    ${verHeader}
    <table class="data-table">
      ${row("Emergency Contact Person Name", val(e.emergency_contact_name))}
      ${row("Emergency Contact Person No", val(e.emergency_contact_no))}
      ${row("Emergency Contact Person Address", val(e.emergency_contact_address))}
      ${row("Emergency Contact Person Relation with Employee", val(e.emergency_contact_relation))}
    </table>

    <div class="sec-heading">4. Employee Bank account Details -</div>
    ${verHeader}
    <table class="data-table">
      ${row("Name of Bank", val(e.bank_name))}
      ${row("Bank A/c No", val(e.account_number))}
      ${row("IFSC Code", val(e.ifsc_code))}
      ${row("Name on bank passbook", val(e.account_holder_name))}
      ${row("Address of the Bank", val(e.bank_branch))}
    </table>

    <div class="sec-heading">5. Employee Address Details -</div>
    <div class="sub-sec">A) Permanent Address</div>
    ${verHeader}
    <table class="data-table">
      ${row("Permanent Address", val(e.permanent_address))}
      ${row("Phone/Mobile No", val(e.permanent_phone))}
      ${row("Permanent Address Land mark", val(e.permanent_landmark))}
      ${row("Permanent Address Lat-long", val(e.permanent_lat_long))}
    </table>

    <div class="sub-sec">B) Local Address</div>
    ${verHeader}
    <table class="data-table">
      ${row("Local Address", val(e.local_address))}
      ${row("Phone/Mobile No", val(e.local_phone))}
      ${row("Local Address Landmark", val(e.local_landmark))}
      ${row("Local Address Lat-long", val(e.local_lat_long))}
    </table>
    <div class="page-num">Page 2 of 4</div>
  </div>

  <div class="page">
    ${pageHeader(3)}
    <div class="sec-heading">6. Reference Details -</div>
    <table class="ref-table">
      <tr>
        <th>Personal References</th>
        <th>Reference 1<br>(Relevant Industry)</th>
        <th>Reference 2<br>(Local Area)</th>
        <th>Reference 3<br>(Other than relative)</th>
      </tr>
      <tr><td>Name</td><td>${val(e.ref1_name)}</td><td>${val(e.ref2_name)}</td><td>${val(e.ref3_name)}</td></tr>
      <tr><td>Designation</td><td>${val(e.ref1_desig)}</td><td>${val(e.ref2_desig)}</td><td>${val(e.ref3_desig)}</td></tr>
      <tr><td>Name of Organization</td><td>${val(e.ref1_org)}</td><td>${val(e.ref2_org)}</td><td>${val(e.ref3_org)}</td></tr>
      <tr><td>Address</td><td>${val(e.ref1_addr)}</td><td>${val(e.ref2_addr)}</td><td>${val(e.ref3_addr)}</td></tr>
      <tr><td>Contact No.<br>Mobile/Landline</td><td>${val(e.ref1_mob)}</td><td>${val(e.ref2_mob)}</td><td>${val(e.ref3_mob)}</td></tr>
      <tr><td>Email ID<br>(Preferably Official)</td><td>${val(e.ref1_email)}</td><td>${val(e.ref2_email)}</td><td>${val(e.ref3_email)}</td></tr>
      <tr style="height:40px;"><td>Verification Comment<br>To be recorded by HR Manager</td><td colspan="3"></td></tr>
    </table>

    <div class="sec-heading">7. DECLARATION -</div>
    <div class="declaration-box">
      I ${employeeFullName} hereby declare that the information furnished above is true, complete and correct to the best of my knowledge and belief.
      <br><br>
      <strong>घोषणा:</strong> मैं ${employeeFullName} एतद्द्वारा घोषणा करता/करती हूं कि ऊपर दी गई जानकारी सत्य, पूर्ण और मेरी जानकारी के अनुसार सही है।
    </div>

    <div style="margin-top:40px; display:flex; justify-content:space-between;">
      <div>Date: ___________<br><br>Place: ___________</div>
      <div style="text-align:center;">__________________________<br>Employee Signature</div>
    </div>

    <div class="footer-note">Note: Digitally filled out the KYE form is not acceptable. KYE form should be handwritten by the respective employee.</div>
    <div class="page-num">Page 3 of 4</div>
  </div>

  <div class="page">
    ${pageHeader(4)}
    <div class="sec-heading">8. Please attach the below-listed documents with the KYE form.</div>
    <table class="ref-table doc-table">
      <tr><th>Sr.</th><th>Name of Document</th><th>Attached (Yes/No)</th></tr>
      <tr><td>1</td><td>Resume - Signed copy</td><td></td></tr>
      <tr><td>2</td><td>2 passport size photographs<br>-Name should be written on backside</td><td></td></tr>
      <tr><td>3</td><td>Medical Certificate - Latest</td><td></td></tr>
      <tr><td>4</td><td>Aadhaar Card</td><td></td></tr>
      <tr><td>5</td><td>Pan Card</td><td></td></tr>
      <tr><td>6</td><td>Academic records<br>SSC,ITI,HSC, Diploma, Degree Certificates Copy</td><td></td></tr>
      <tr><td>7</td><td>Bank Details</td><td></td></tr>
      <tr><td>8</td><td>Pay slip or bank statement reflecting last drawn salary</td><td></td></tr>
      <tr><td>9</td><td>Other certificates, if any</td><td></td></tr>
    </table>

    <div style="margin-top: 20px; font-size: 9pt;">
      <strong>Attachment Status (Yes/No):</strong> __________________
    </div>

    <div class="sec-heading" style="margin-top: 30px;">9. For office Use only.</div>
    <table class="office-table">
      <tr><td>1</td><td>DOJ</td><td></td></tr>
      <tr><td>2</td><td>Experience</td><td></td></tr>
      <tr><td>3</td><td>UAN</td><td></td></tr>
      <tr><td>4</td><td>Member ID</td><td></td></tr>
      <tr><td>5</td><td>Remarks</td><td></td></tr>
    </table>
    <div class="page-num">Page 4 of 4</div>
  </div>

</body>
</html>
  `);
  win.document.close();
  win.print();
};

export default printKYEForm;
