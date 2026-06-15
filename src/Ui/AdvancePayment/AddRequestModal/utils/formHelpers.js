export const validateForm = (ptKey, form, screenshotFile) => {
  const er = {};

  if (ptKey === "org_to_vendor") {
    if (!form.toVendorName) er.toVendorName = "Required";
    if (!form.toVendorAmount || Number(form.toVendorAmount) <= 0)
      er.toVendorAmount = "Enter a valid amount";
    if (!form.toVendorReason) er.toVendorReason = "Required";
  } else {
    if (!form.empId) er.empId = "Required";
    if (!form.name) er.name = "Required";
    if (!form.dept) er.dept = "Required";
    if (!form.amount || Number(form.amount) <= 0)
      er.amount = "Enter a valid amount";
    if (!form.reason) er.reason = "Required";
  }

  if (!screenshotFile) er.screenshot = "Payment screenshot is mandatory";

  if (ptKey === "emp_to_emp") {
    if (!form.toEmpId) er.toEmpId = "Required";
    if (!form.toEmpName) er.toEmpName = "Required";
  }

  if (ptKey === "other" && !form.vendorName) er.vendorName = "Required";

  if (!form.approverName) er.approverName = "Required";
  if (!form.approverId) er.approverId = "Required";

  return er;
};

export const buildPayload = (ptKey, form) => ({
  payment_type_key: ptKey,
  emp_id: form.empId || undefined,
  emp_name: form.name || undefined,
  emp_dept: form.dept || undefined,
  amount: form.amount || undefined,
  reason: form.reason || undefined,
  to_emp_id: form.toEmpId || undefined,
  to_emp_name: form.toEmpName || undefined,
  to_emp_dept: form.toEmpDept || undefined,
  vendor_name: form.vendorName || undefined,
  vendor_ref: form.vendorRef || undefined,
  to_vendor_name: form.toVendorName || undefined,
  to_vendor_gst: form.toVendorGST || undefined,
  to_vendor_ref: form.toVendorRef || undefined,
  to_vendor_amount: form.toVendorAmount || undefined,
  to_vendor_reason: form.toVendorReason || undefined,
  approver_name: form.approverName || undefined,
  approver_id: form.approverId || undefined,
  approver_designation: form.approverDesignation || undefined,
});

export const buildReceipt = (
  ptKey,
  form,
  res,
  screenshotName,
  screenshotFile,
  proofName,
  proofFile,
) => {
  const finalAmount =
    ptKey === "org_to_vendor" ? form.toVendorAmount : form.amount;
  const finalReason =
    ptKey === "org_to_vendor" ? form.toVendorReason : form.reason;

  return {
    id: res.data?.requestCode || res.data?.request_code || "ADV-" + Date.now(),
    request_code: res.data?.requestCode || res.data?.request_code,
    status: "pending",
    date: new Date().toISOString().slice(0, 10),
    paymentType: ptKey,
    payment_type_key: ptKey,
    empId: form.empId || null,
    emp_id: form.empId || null,
    name: form.name || null,
    emp_name: form.name || null,
    dept: form.dept || null,
    emp_dept: form.dept || null,
    toEmpId: form.toEmpId || null,
    to_emp_id: form.toEmpId || null,
    toEmpName: form.toEmpName || null,
    to_emp_name: form.toEmpName || null,
    toEmpDept: form.toEmpDept || null,
    to_emp_dept: form.toEmpDept || null,
    vendorName: form.vendorName || null,
    vendor_name: form.vendorName || null,
    vendorRef: form.vendorRef || null,
    vendor_ref: form.vendorRef || null,
    toVendorName: form.toVendorName || null,
    to_vendor_name: form.toVendorName || null,
    toVendorGST: form.toVendorGST || null,
    to_vendor_gst: form.toVendorGST || null,
    toVendorRef: form.toVendorRef || null,
    to_vendor_ref: form.toVendorRef || null,
    approverName: form.approverName || null,
    approver_name: form.approverName || null,
    approverId: form.approverId || null,
    approver_id: form.approverId || null,
    approverDesignation: form.approverDesignation || null,
    approver_designation: form.approverDesignation || null,
    amount: finalAmount,
    reason: finalReason,
    screenshotName: screenshotName || null,
    screenshotFile: screenshotFile || null,
    screenshotUrl: null,
    proofName: proofName || null,
    proofFile: proofFile || null,
    proofUrl: null,
    screenshot: screenshotName || null,
    proof: proofName || null,
  };
};
