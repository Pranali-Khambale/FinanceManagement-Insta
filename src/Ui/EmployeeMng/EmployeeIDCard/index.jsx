import React, { useState, useRef, useEffect } from "react";
import { X, Printer, FlipHorizontal, Upload, Loader, Move } from "lucide-react";

import { BASE_URL as API_URL } from "../../../api/client";

import CardFront from "./components/CardFront";
import CardBack from "./components/CardBack";
import PhotoCropEditor from "./components/PhotoCropEditor";

import { addMonths, formatDate, toInputValue } from "./utils/dateUtils";
import { uploadPhotoToDb } from "./utils/photoUtils";

import { CW, CH, LOGO_SRC, SIGNATURE_SRC, SIGNATURE_WIDTH, VALIDITY_OPTIONS } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// useCardScale
//
// The ID card has fixed pixel dimensions (CW × CH) because every child
// (CardFront/CardBack) uses absolute positioning calibrated to those exact
// numbers — that's also what gets reused verbatim in the print HTML, so it
// must stay pixel-accurate for printing.
//
// Instead of touching those internals, we scale the *rendered preview* down
// with CSS transform on small screens so nothing clips or causes the modal
// to overflow horizontally. Print output is unaffected since handlePrint
// builds its own un-scaled HTML.
// ─────────────────────────────────────────────────────────────────────────────
const useCardScale = (maxWidth) => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      const available = Math.min(window.innerWidth - 48, maxWidth);
      setScale(Math.min(1, available / CW));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [maxWidth]);
  return scale;
};

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
  const [printing, setPrinting] = useState(false);

  // ── Responsive card preview scale ──────────────────────────────────────────
  const cardScale = useCardScale(CW);

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
  // NOTE: these pixel positions must stay in lockstep with CardFront/CardBack
  // (CW/CH). If you change the preview layout, mirror it here.
  //
  // FIX: previously the photo <img> had crossorigin="anonymous", which makes
  // the browser require a proper Access-Control-Allow-Origin header from the
  // photo proxy endpoint — if that header isn't present the image silently
  // fails to render (blank box) in the print window. We don't draw this image
  // to a canvas in the print popup, so crossorigin isn't needed here at all.
  //
  // FIX: previously we called window.print() on a blind setTimeout(400ms).
  // If the photo/logo/signature hadn't finished loading yet (especially the
  // photoProxyUrl, which requires a network round trip + redirect), the
  // print/PDF output could be missing images even though the on-screen
  // preview looked correct a moment later. Now we explicitly wait for every
  // <img> in the print document to finish loading (or fail) before calling
  // window.print(), with a safety-net timeout so it never hangs forever.
  const handlePrint = () => {
    setPrinting(true);
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

    // No crossorigin attribute — we're just displaying the image in a plain
    // print window, not reading its pixels via canvas, so CORS headers on
    // the photo proxy endpoint are irrelevant here and shouldn't gate
    // whether the image renders.
    const photoHtml = photoSrc
      ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;display:block" onerror="this.style.display='none'"/>`
      : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px">
           <span style="font-size:28px;font-weight:bold;color:#bbb">${(firstName[0] || "?").toUpperCase()}</span>
         </div>`;

    const pw = window.open("", "_blank", "width=720,height=580");
    pw.document
      .write(`<!DOCTYPE html><html><head><title>ID Card – ${fullPrintName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#f0f4f8;display:flex;gap:28px;padding:36px;justify-content:center;align-items:flex-start;font-family:'Calibri','Segoe UI',Arial,sans-serif;flex-wrap:wrap}
.card{width:${CW}px;height:${CH}px;background:#fff;border:1px solid #ddd;position:relative;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);page-break-inside:avoid;flex-shrink:0}
@media print{body{background:#fff;padding:10px;gap:20px}.card{box-shadow:none}}
</style></head><body>

<!-- FRONT CARD -->
<div class="card">
  <svg style="position:absolute;top:0;left:0;z-index:1" width="230" height="134" viewBox="0 0 230 134"><path d="M0 0 L230 0 A152 152 0 0 0 0 134 Z" fill="#F5C100"/></svg>
  <svg style="position:absolute;bottom:0;right:0;z-index:1" width="230" height="134" viewBox="0 0 230 134"><path d="M230 134 L0 134 A152 152 0 0 0 230 0 Z" fill="#1565C0"/></svg>
<div style="position:absolute;top:14px;right:50px;z-index:2">
    <img src="${logoUrl}" style="width:110px;height:auto;object-fit:contain;max-width:99%" onerror="this.style.display='none'" alt="Logo"/>
</div>
  <!-- FIXED — matches PhotoBox.jsx (80×100) -->
<div style="position:absolute;top:122px;left:50%;transform:translateX(-50%);z-index:2;width:80px;height:100px;border:2px solid #aaa;border-radius:2px;overflow:hidden;background:#f5f5f5">
  ${photoHtml}
</div>
<div style="position:absolute;top:229px;left:50%;transform:translateX(-50%);font-weight:700;font-size:15px;letter-spacing:0.2px;line-height:1.2;color:#111;z-index:2;text-align:center;white-space:nowrap">
  ${fullPrintName || "EMPLOYEE NAME"}
</div>
<div style="position:absolute;top:250px;left:50%;transform:translateX(-50%);font-size:13px;color:#111;z-index:2;line-height:1.2;white-space:nowrap">
  <div style="display:flex"><span style="width:78px">Employee ID</span><span style="width:14px;text-align:center">:</span><span>${empId}</span></div>
  <div style="display:flex"><span style="width:78px">Designation</span><span style="width:14px;text-align:center">:</span><span>${designation}</span></div>
  <div style="display:flex"><span style="width:78px">Valid Till</span><span style="width:14px;text-align:center">:</span><span>${validTill}</span></div>
  <div style="margin-top:8px">
    <img src="${signUrl}" style="width:${SIGNATURE_WIDTH}px;height:34px;object-fit:contain;display:block;margin-bottom:-8px" onerror="this.style.display='none'" alt="Signature"/>
    <div style="font-size:13px;color:#111;line-height:1.2;font-weight:500">Authorised Sign</div>
  </div>
</div>
</div>

<!-- BACK CARD -->
<div class="card">
  <svg style="position:absolute;top:0;left:0;z-index:1" width="230" height="134" viewBox="0 0 230 134"><path d="M0 0 L230 0 A152 152 0 0 0 0 134 Z" fill="#F5C100"/></svg>
  <svg style="position:absolute;bottom:0;right:0;z-index:1" width="230" height="134" viewBox="0 0 230 134"><path d="M230 134 L0 134 A152 152 0 0 0 230 0 Z" fill="#1565C0"/></svg>
<div style="position:absolute;top:14px;right:50px;z-index:2">
    <img src="${logoUrl}" style="width:110px;height:auto;object-fit:contain;max-width:99%" onerror="this.style.display='none'" alt="Logo"/>
</div>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:2;padding:0 18px;padding-top:54px">
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

<script>
  // Wait for every image on the page (photo, logo, signature — front & back)
  // to finish loading (success OR error) before opening the print dialog.
  // This guarantees the printed/PDF output always matches what was visible
  // on screen, instead of racing a fixed timeout against network latency.
  window.addEventListener('load', function () {
    var imgs = Array.prototype.slice.call(document.images);
    var pending = imgs.filter(function (img) { return !img.complete; });

    function go() {
      // Small extra delay so the browser has time to finish layout/paint
      // after the last image swaps in, before the print dialog steals focus.
      setTimeout(function () { window.print(); }, 150);
    }

    if (pending.length === 0) {
      go();
      return;
    }

    var remaining = pending.length;
    function done() {
      remaining -= 1;
      if (remaining <= 0) go();
    }
    pending.forEach(function (img) {
      img.addEventListener('load', done);
      img.addEventListener('error', done); // don't hang forever on a broken image
    });

    // Safety net in case an image never fires load/error (e.g. a stalled
    // redirect from the photo proxy endpoint).
    setTimeout(go, 2500);
  });
</script>
</body></html>`);
    pw.document.close();

    // Reset the "Printing…" state on the button once the popup regains
    // control (best-effort — some browsers block visibility on cross-window
    // print dialogs, so this also gets a timeout fallback).
    const resetPrinting = () => setPrinting(false);
    if (pw) {
      pw.addEventListener?.("afterprint", resetPrinting);
    }
    setTimeout(resetPrinting, 4000);
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
  // NOTE: layout-critical responsive rules (panel stacking, widths, paddings)
  // are handled via the injected <style> media queries below using the
  // `idcard-*` class hooks, since inline styles can't express breakpoints.
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
      padding: 12,
    },
    modal: {
      background: "#ffffff",
      borderRadius: 20,
      width: 680,
      maxWidth: "calc(100vw - 24px)",
      maxHeight: "calc(100vh - 24px)",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 32px 80px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.06)",
    },
    header: {
      background: "linear-gradient(135deg,#0d47a1 0%,#1565C0 50%,#1976D2 100%)",
      borderRadius: "20px 20px 0 0",
      padding: "16px 16px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      flexWrap: "wrap",
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

      {/* Responsive layout rules — breakpoints can't be expressed via inline
          styles, so the structural (stacking/width) behavior lives here while
          all color/visual styling stays inline as in the original. */}
      <style>{`
        .idcard-body {
          display: flex;
          flex-direction: row;
          gap: 0;
          flex: 1;
        }
        .idcard-left {
          width: ${CW + 40}px;
          min-width: ${CW + 40}px;
          background: #f1f4f9;
          border-right: 1px solid #e5e9f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 28px 20px 20px;
          gap: 16px;
        }
        .idcard-right {
          flex: 1;
          min-width: 0;
          padding: 24px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }
        .idcard-stage {
          width: ${CW}px;
          height: ${CH}px;
        }
        .idcard-flip-row {
          display: flex;
          gap: 10px;
        }
        @media (max-width: 720px) {
          .idcard-body { flex-direction: column; }
          .idcard-left {
            width: 100%;
            min-width: 0;
            border-right: none;
            border-bottom: 1px solid #e5e9f0;
            padding: 20px 16px 18px;
          }
          .idcard-right { padding: 20px 16px 18px; }
        }
        @media (max-width: 420px) {
          .idcard-flip-row { flex-direction: column; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={styles.overlay}
      >
        <div style={styles.modal}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  border: "2px solid rgba(255,255,255,0.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                {(firstName[0] || "?").toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  Employee ID Card
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.65)",
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fullName || "—"} &nbsp;·&nbsp; {empId}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {designation !== "—" && (
                <div
                  className="idcard-designation-chip"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 8,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#fff",
                    whiteSpace: "nowrap",
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
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="idcard-body">
            {/* LEFT — card preview */}
            <div className="idcard-left">
              <div
                style={{
                  display: "flex",
                  gap: 0,
                  background: "#e2e8f0",
                  borderRadius: 30,
                  padding: 3,
                  width: "100%",
                  maxWidth: CW,
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

              {/* Scaling wrapper: reserves the real (scaled-down) footprint
                  via width/height so surrounding flex layout doesn't leave a
                  gap, while the inner .idcard-stage keeps true CW×CH pixels
                  for CardFront/CardBack's absolute-positioned children. */}
              <div
                style={{
                  width: CW * cardScale,
                  height: CH * cardScale,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ perspective: 1200 }} className="idcard-stage">
                  <div
                    style={{
                      width: CW,
                      height: CH,
                      position: "relative",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
                      transform: `scale(${cardScale}) ${flipped ? "rotateY(180deg)" : "rotateY(0deg)"}`,
                      transformOrigin: "center center",
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
              </div>

              <div
                style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}
              >
                Click Front / Back to preview both sides
              </div>
            </div>

            {/* RIGHT — controls */}
            <div className="idcard-right">
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
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {hasPhoto && (
                    <button
                      onClick={handleEditExisting}
                      style={{
                        flex: "1 1 120px",
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
                      flex: hasPhoto ? "1 1 120px" : "2 1 200px",
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
                    flexWrap: "wrap",
                    gap: 6,
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
                        flexWrap: "wrap",
                        gap: 4,
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
                          wordBreak: "break-word",
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
                <div className="idcard-flip-row">
                  <button
                    onClick={() => setFlipped((f) => !f)}
                    style={styles.actionBtn(false)}
                  >
                    <FlipHorizontal size={14} /> Flip Card
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={printing}
                    style={{
                      ...styles.actionBtn(true),
                      opacity: printing ? 0.75 : 1,
                      cursor: printing ? "wait" : "pointer",
                    }}
                  >
                    {printing ? (
                      <>
                        <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
                        Preparing…
                      </>
                    ) : (
                      <>
                        <Printer size={14} /> Print / Save PDF
                      </>
                    )}
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