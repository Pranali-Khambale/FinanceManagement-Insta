import React, { useState, useRef } from "react";
import { X, Printer, FlipHorizontal, Upload, Loader, Move } from "lucide-react";

import { BASE_URL as API_URL } from "../../../api/client";

import CardFront from "./components/CardFront";
import CardBack from "./components/CardBack";
import PhotoCropEditor from "./components/PhotoCropEditor";

import { addMonths, formatDate, toInputValue } from "./utils/dateUtils";
import { uploadPhotoToDb } from "./utils/photoUtils";

import { CW, CH, LOGO_SRC, SIGNATURE_SRC, VALIDITY_OPTIONS } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// EmployeeIDCardModal
//
// PHOTO URL STRATEGY
//
// Instead of trying to resolve S3 keys on the frontend (which breaks when
// presigned URLs expire or when the backend returns raw keys), we use a
// dedicated backend endpoint:
//
//   GET /api/employees/:id/photo
//
// This endpoint always does a fresh 302 redirect to the latest S3 presigned
// URL, so the <img src> always works regardless of when the employee was
// created or how the photo was uploaded.
//
// manualPhoto (freshly cropped data URL) always takes priority over the
// proxy URL so the user sees their crop immediately before the DB upload
// completes.
// ─────────────────────────────────────────────────────────────────────────────
const EmployeeIDCardModal = ({ employee, onClose, onPhotoUpdated }) => {
  const [flipped, setFlipped] = useState(false);
  const [manualPhoto, setManualPhoto] = useState(null);
  const [rawPhoto, setRawPhoto] = useState(null);
  const [uploadState, setUploadState] = useState("idle");
  const [uploadMsg, setUploadMsg] = useState("");
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [validityDate, setValidityDate] = useState(addMonths(12));
  const [selectedValidity, setSelectedValidity] = useState("1 Year");
  const [customDate, setCustomDate] = useState("");

  // ── Photo state ────────────────────────────────────────────────────────────
  // photoProxyUrl: always points to /api/employees/:id/photo
  // This URL is stable (doesn't expire) — the backend issues a fresh S3
  // redirect on every browser request.
  //
  // photoExists: tracks whether the backend confirmed a photo exists.
  // Starts as true (optimistic) and is set to false on 404.
  const [photoExists, setPhotoExists] = useState(true);

  const employeeDbId = employee.id;
  const employeeDisplayId = employee.employee_id || employee.id;
  const photoProxyUrl = employeeDbId
    ? `${API_URL}/employees/${employeeDbId}/photo`
    : null;

  const firstName = employee.first_name || employee.firstName || "";
  const lastName = employee.last_name || employee.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const empId = employee.employee_id || employee.id || "—";
  // Backend uses `position AS designation` in SELECT — handle both field names
  const designation = employee.designation || employee.position || "—";
  const emergencyContact = employee.emergency_contact_no || "—";

  const hasPhoto = !!(manualPhoto || (photoExists && photoProxyUrl));

  const fileInputRef = useRef(null);

  // ── Photo upload ───────────────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawPhoto(ev.target.result);
      setShowCropEditor(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = async (croppedDataUrl) => {
    setShowCropEditor(false);

    // 1. Show cropped photo immediately (data URL — no network wait)
    setManualPhoto(croppedDataUrl);
    setUploadState("uploading");

    try {
      // 2. Convert data URL → File and upload to S3 via the backend
      const res = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      await uploadPhotoToDb(employeeDbId, file);

      setUploadState("success");
      // Photo now exists in DB — re-enable proxy URL and reset failed state
      setPhotoExists(true);

      if (typeof onPhotoUpdated === "function") onPhotoUpdated();
    } catch (err) {
      setUploadState("error");
      setUploadMsg(err.message || "Upload failed.");
      // Keep manualPhoto so card still shows the photo even on DB error
    }
  };

  // Opens the crop editor on the best available photo source.
  // For the proxy URL we need to fetch the image as a data URL first
  // (because canvas.toDataURL() requires same-origin or CORS-enabled images).
  const handleEditExisting = async () => {
    if (manualPhoto) {
      setRawPhoto(manualPhoto);
      setShowCropEditor(true);
      return;
    }
    if (photoProxyUrl && photoExists) {
      try {
        // Fetch via proxy, convert to blob → data URL for the canvas editor
        const res = await fetch(photoProxyUrl, { credentials: "include" });
        if (!res.ok) throw new Error("Could not fetch photo");
        const blob = await res.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result);
          reader.readAsDataURL(blob);
        });
        setRawPhoto(dataUrl);
        setShowCropEditor(true);
      } catch (_err) {
        // If fetch fails, open crop editor anyway — user can re-upload
        setRawPhoto(null);
        setShowCropEditor(false);
      }
    }
  };

  // Called when the photo img fails to load — proxy returned 404 (no photo)
  const handlePhotoMissing = () => {
    setPhotoExists(false);
  };

  // ── Validity ───────────────────────────────────────────────────────────────
  const handleValidityPill = (opt) => {
    setSelectedValidity(opt.label);
    if (opt.months !== null) setValidityDate(addMonths(opt.months));
  };

  const handleCustomDate = (e) => {
    setCustomDate(e.target.value);
    if (e.target.value) setValidityDate(new Date(e.target.value));
  };

  // ── Print ──────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const fatherName =
      employee.father_husband_name || employee.fatherHusbandName || "";
    const middleName = employee.middle_name || employee.middleName || "";
    const fullPrintName = [firstName, fatherName || middleName, lastName]
      .filter(Boolean)
      .join(" ")
      .toUpperCase();

    // For print: use manualPhoto data URL if available (works offline),
    // otherwise use the proxy URL (requires network at print time).
    const photoSrc =
      manualPhoto || (photoExists && photoProxyUrl ? photoProxyUrl : null);
    const validTill = formatDate(validityDate);
    const logoUrl =
      window.location.origin +
      (LOGO_SRC.startsWith("/") ? LOGO_SRC : "/" + LOGO_SRC);
    const signUrl =
      window.location.origin +
      (SIGNATURE_SRC.startsWith("/") ? SIGNATURE_SRC : "/" + SIGNATURE_SRC);

    const photoHtml = photoSrc
      ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;display:block" crossorigin="anonymous"/>`
      : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
           <span style="font-size:28px;font-weight:bold;color:#bbb">${(firstName[0] || "?").toUpperCase()}</span>
         </div>`;

    const pw = window.open("", "_blank", "width=720,height=660");
    pw.document
      .write(`<!DOCTYPE html><html><head><title>ID Card – ${fullPrintName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0f4f8;display:flex;gap:28px;padding:36px;justify-content:center;align-items:flex-start;font-family:'Calibri','Segoe UI',Arial,sans-serif;flex-wrap:wrap}
.card{width:260px;height:430px;background:#fff;border:1px solid #ddd;position:relative;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);page-break-inside:avoid;flex-shrink:0}
@media print{body{background:#fff;padding:10px;gap:20px}.card{box-shadow:none}}
</style></head><body>

<!-- FRONT CARD -->
<div class="card">
  <svg style="position:absolute;top:0;left:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100"/></svg>
  <svg style="position:absolute;bottom:0;right:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0"/></svg>
  <div style="position:absolute;top:30px;right:45px;z-index:2">
    <img src="${logoUrl}" style="height:100px;object-fit:contain;max-width:99%" onerror="this.style.display='none'" alt="Logo"/>
  </div>
  <div style="position:absolute;top:148px;left:50%;transform:translateX(-50%);z-index:2;width:90px;height:108px;border:2px solid #aaa;border-radius:2px;overflow:hidden;background:#f5f5f5">
    ${photoHtml}
  </div>
  <div style="position:absolute;top:275px;left:50%;transform:translateX(-50%);font-weight:700;font-size:15px;letter-spacing:0.2px;line-height:1.2;color:#111;z-index:2;text-align:center;white-space:nowrap">
    ${fullPrintName || "EMPLOYEE NAME"}
  </div>
  <div style="position:absolute;top:292px;left:50%;transform:translateX(-50%);font-size:13px;color:#111;z-index:2;line-height:1.35;white-space:nowrap">
    <div style="display:flex"><span style="width:78px">Employee ID</span><span style="width:14px;text-align:center">:</span><span>${empId}</span></div>
    <div style="display:flex"><span style="width:78px">Designation</span><span style="width:14px;text-align:center">:</span><span>${designation}</span></div>
    <div style="display:flex"><span style="width:78px">Valid Till</span><span style="width:14px;text-align:center">:</span><span>${validTill}</span></div>
    <div style="margin-top:14px">
      <img src="${signUrl}" style="width:130px;height:50px;object-fit:contain;display:block;margin-bottom:-12px" onerror="this.style.display='none'" alt="Signature"/>
      <div style="font-size:13px;color:#111;line-height:1.2;font-weight:500">Authorised Sign</div>
    </div>
  </div>
</div>

<!-- BACK CARD -->
<div class="card">
  <svg style="position:absolute;top:0;left:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100"/></svg>
  <svg style="position:absolute;bottom:0;right:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0"/></svg>
  <div style="position:absolute;top:30px;right:45px;z-index:2">
    <img src="${logoUrl}" style="height:100px;object-fit:contain;max-width:99%" onerror="this.style.display='none'" alt="Logo"/>
  </div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:2;padding:0 18px;padding-top:100px">
    <div style="font-weight:700;font-size:16px;color:#111;margin-bottom:2px">Insta ICT Solutions Pvt. Ltd.</div>
    <div style="font-size:13px;color:#333;line-height:1.3">201 &amp; 202, Imperial Plaza,</div>
    <div style="font-size:13px;color:#333;line-height:1.3;margin-bottom:4px">Jijai Nagar, Kothrud, Pune 411 038</div>
    <div style="font-size:13px;color:#1565C0;text-decoration:underline;margin-bottom:2px">www.instagrp.com</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;color:#111;font-weight:600;margin-bottom:6px;flex-wrap:wrap">
      <span>Emergency Contact No :</span><span style="color:#333;font-weight:500">${emergencyContact}</span>
    </div>
    <div style="font-size:10.5px;color:#333;line-height:1.25;text-align:center;max-width:210px;font-weight:500">
      Property of Insta ICT Solutions.<br/>If found, please return to the Admin Team.
    </div>
  </div>
</div>

<script>setTimeout(()=>window.print(),400)</script>
</body></html>`);
    pw.document.close();
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const statusConfig = (() => {
    if (uploadState === "uploading")
      return {
        icon: "⏳",
        label: "Saving photo…",
        color: "#1d4ed8",
        bg: "#eff6ff",
        border: "#bfdbfe",
      };
    if (uploadState === "error")
      return {
        icon: "✕",
        label: uploadMsg || "Upload failed",
        color: "#991b1b",
        bg: "#fef2f2",
        border: "#fecaca",
      };
    if (manualPhoto || uploadState === "success")
      return {
        icon: "✓",
        label: "Photo saved successfully",
        color: "#166534",
        bg: "#f0fdf4",
        border: "#bbf7d0",
      };
    if (photoExists && photoProxyUrl)
      return {
        icon: "✓",
        label: "Photo loaded from database",
        color: "#166534",
        bg: "#f0fdf4",
        border: "#bbf7d0",
      };
    return {
      icon: "!",
      label: "No photo — hover card to upload",
      color: "#92400e",
      bg: "#fefce8",
      border: "#fde68a",
    };
  })();

  // ── Styles ─────────────────────────────────────────────────────────────────
  const styles = {
    overlay: {
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "rgba(10,14,26,0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modal: {
      background: "#ffffff",
      borderRadius: 20,
      width: 680,
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "calc(100vh - 40px)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)",
    },
    header: {
      background: "linear-gradient(135deg,#0d47a1 0%,#1565C0 50%,#1976D2 100%)",
      borderRadius: "20px 20px 0 0",
      padding: "20px 24px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    body: { display: "flex", flexDirection: "row", gap: 0, flex: 1 },
    leftPanel: {
      width: CW + 40,
      minWidth: CW + 40,
      background: "#f1f4f9",
      borderRight: "1px solid #e5e9f0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "28px 20px 20px",
      gap: 16,
    },
    rightPanel: {
      flex: 1,
      padding: "24px 24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      overflowY: "auto",
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1.2,
      color: "#94a3b8",
      textTransform: "uppercase",
      marginBottom: 8,
    },
    pill: (active) => ({
      padding: "6px 14px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      cursor: "pointer",
      border: active ? "1.5px solid #1565C0" : "1.5px solid #e2e8f0",
      background: active ? "#1565C0" : "#fff",
      color: active ? "#fff" : "#64748b",
      transition: "all .16s",
      boxShadow: active ? "0 2px 8px rgba(21,101,192,.25)" : "none",
    }),
    actionBtn: (primary) => ({
      flex: primary ? 2 : 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
      padding: "11px 0",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      border: primary ? "none" : "1.5px solid #e2e8f0",
      background: primary ? "linear-gradient(135deg,#1565C0,#1E88E5)" : "#fff",
      color: primary ? "#fff" : "#475569",
      boxShadow: primary ? "0 4px 14px rgba(21,101,192,.35)" : "none",
      transition: "all .16s",
    }),
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {showCropEditor && rawPhoto && (
        <PhotoCropEditor
          src={rawPhoto}
          onDone={handleCropDone}
          onCancel={() => setShowCropEditor(false)}
        />
      )}

      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={styles.overlay}
      >
        <div style={styles.modal}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {(firstName[0] || "?").toUpperCase()}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                  }}
                >
                  Employee ID Card
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.65)",
                    marginTop: 2,
                  }}
                >
                  {fullName || "—"} &nbsp;·&nbsp; {empId}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {designation !== "—" && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {designation}
                </div>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 10,
                  width: 34,
                  height: 34,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={styles.body}>
            {/* LEFT — card preview */}
            <div style={styles.leftPanel}>
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  background: "#e2e8f0",
                  borderRadius: 30,
                  padding: 3,
                  width: "100%",
                }}
              >
                {[
                  ["Front", false],
                  ["Back", true],
                ].map(([label, side]) => (
                  <button
                    key={label}
                    onClick={() => setFlipped(side)}
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      borderRadius: 24,
                      border: "none",
                      cursor: "pointer",
                      background: flipped === side ? "#1565C0" : "transparent",
                      color: flipped === side ? "#fff" : "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all .2s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ perspective: 1200, width: CW, height: CH }}>
                <div
                  style={{
                    width: CW,
                    height: CH,
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
                    transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <CardFront
                      employee={employee}
                      photoProxyUrl={photoProxyUrl}
                      manualPhoto={manualPhoto}
                      onUpload={handlePhotoUpload}
                      uploading={uploadState === "uploading"}
                      onEditClick={handleEditExisting}
                      onPhotoMissing={handlePhotoMissing}
                      validityDate={validityDate}
                    />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    <CardBack emergencyContact={emergencyContact} />
                  </div>
                </div>
              </div>

              <div
                style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}
              >
                Click Front / Back to preview both sides
              </div>
            </div>

            {/* RIGHT — controls */}
            <div style={styles.rightPanel}>
              {/* Photo section */}
              <div>
                <div style={styles.sectionLabel}>Photo</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: statusConfig.bg,
                    border: `1px solid ${statusConfig.border}`,
                    borderRadius: 10,
                    padding: "9px 12px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: statusConfig.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {statusConfig.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: statusConfig.color,
                      fontWeight: 500,
                      flex: 1,
                    }}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {hasPhoto && (
                    <button
                      onClick={handleEditExisting}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: "#fff",
                        border: "1.5px solid #1565C0",
                        color: "#1565C0",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <Move size={13} /> Edit Photo
                    </button>
                  )}
                  <label
                    style={{
                      flex: hasPhoto ? 1 : 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "9px 12px",
                      borderRadius: 10,
                      background:
                        uploadState === "uploading" ? "#93c5fd" : "#1565C0",
                      border: "none",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: uploadState === "uploading" ? "wait" : "pointer",
                      pointerEvents:
                        uploadState === "uploading" ? "none" : "auto",
                      transition: "background .2s",
                    }}
                  >
                    {uploadState === "uploading" ? (
                      <>
                        <Loader
                          size={13}
                          style={{ animation: "spin 1s linear infinite" }}
                        />{" "}
                        Saving…
                      </>
                    ) : (
                      <>
                        <Upload size={13} />{" "}
                        {hasPhoto ? "Replace Photo" : "Upload Photo"}
                      </>
                    )}
                    {uploadState !== "uploading" && (
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handlePhotoUpload}
                      />
                    )}
                  </label>
                </div>
              </div>

              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* Validity section */}
              <div>
                <div style={styles.sectionLabel}>Validity Period</div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  {VALIDITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleValidityPill(opt)}
                      style={styles.pill(selectedValidity === opt.label)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {selectedValidity === "Custom" && (
                  <input
                    type="date"
                    value={customDate}
                    min={toInputValue(new Date())}
                    onChange={handleCustomDate}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1.5px solid #e2e8f0",
                      fontSize: 13,
                      color: "#334155",
                      outline: "none",
                      background: "#fff",
                      boxSizing: "border-box",
                      marginBottom: 8,
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: "10px 14px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}
                  >
                    Card expires on
                  </span>
                  <span
                    style={{ fontSize: 14, color: "#1565C0", fontWeight: 700 }}
                  >
                    {formatDate(validityDate)}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* Employee details */}
              <div>
                <div style={styles.sectionLabel}>Employee Details</div>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    overflow: "hidden",
                  }}
                >
                  {[
                    ["Full Name", fullName || "—"],
                    ["Employee ID", empId],
                    ["Designation", designation],
                    ["Emergency No", emergencyContact],
                  ].map(([label, value], i) => (
                    <div
                      key={label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "9px 14px",
                        borderTop: i === 0 ? "none" : "1px solid #e2e8f0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          fontWeight: 600,
                          width: 100,
                          flexShrink: 0,
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#1e293b",
                          fontWeight: 500,
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }} />

              {/* Action buttons */}
              <div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setFlipped((f) => !f)}
                    style={styles.actionBtn(false)}
                  >
                    <FlipHorizontal size={14} /> Flip Card
                  </button>
                  <button onClick={handlePrint} style={styles.actionBtn(true)}>
                    <Printer size={14} /> Print / Save PDF
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  Both front &amp; back printed side by side
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmployeeIDCardModal;