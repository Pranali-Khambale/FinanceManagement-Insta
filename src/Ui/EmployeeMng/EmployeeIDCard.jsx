import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Printer, FlipHorizontal, Upload, Loader, ZoomIn, ZoomOut, Move, Check, RotateCcw, Crop, ChevronLeft, ChevronRight } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:5000";

const API_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : "http://localhost:5000/api";

const getPhotoUrl = (employee) => {
  const docs = employee?.documents || [];
  const photoDoc = docs.find(
    (d) => d.document_type === "photo" || d.document_type === "idPhoto"
  );
  if (photoDoc?.file_path) return `${BASE_URL}${photoDoc.file_path}`;
  return null;
};

const addMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

const formatDate = (d) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

const toInputValue = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const VALIDITY_OPTIONS = [
  { label: "6 Months", months: 6 },
  { label: "1 Year",   months: 12 },
  { label: "2 Years",  months: 24 },
  { label: "Custom",   months: null },
];

const LOGO_SRC = "/assets/Insta-logo1.png";
const CW = 260;
const CH = 410;

const uploadPhotoToDb = async (employeeDbId, file) => {
  const formData = new FormData();
  formData.append("photo", file);
  const response = await fetch(`${API_URL}/employees/${employeeDbId}/upload-photo`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "Upload failed");
  return data;
};

// ── Photo Crop Editor (unchanged) ─────────────────────────────────────────────
const PhotoCropEditor = ({ src, onDone, onCancel }) => {
  const canvasRef  = useRef(null);
  const overlayRef = useRef(null);
  const imgRef     = useRef(new Image());
  const dragging = useRef(false);
  const lastPos  = useRef({ x: 0, y: 0 });
  const [zoom,   setZoom]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("move");
  const cropDragging  = useRef(false);
  const cropHandle    = useRef(null);
  const cropStart     = useRef({ x: 0, y: 0 });
  const cropBoxStart  = useRef(null);
  const MIN_CROP = 30;
  // High-res output: 4× the card's physical photo slot (90×108) for crisp rendering
  const OUTPUT_W      = 360;
  const OUTPUT_H      = 432;
  // Display canvas is smaller for UI ergonomics; we scale DOWN for display only
  const DISPLAY_W     = 225;
  const DISPLAY_H     = 270;
  const DISPLAY_SCALE = OUTPUT_W / DISPLAY_W; // 1.6 — used when exporting from move mode
  const DW = DISPLAY_W;
  const DH = DISPLAY_H;
  const initCropBox = useCallback(() => ({ x: 0, y: 0, w: DW, h: DH }), [DW, DH]);
  const [cropBox, setCropBox] = useState(() => ({ x: 0, y: 0, w: DW, h: DH }));

  const drawImage = useCallback((z = zoom, off = offset) => {
    if (!loaded) return;
    const img    = imgRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, DW, DH);
    const baseScale = Math.max(DW / img.naturalWidth, DH / img.naturalHeight);
    const scale     = baseScale * z;
    const sw = img.naturalWidth  * scale;
    const sh = img.naturalHeight * scale;
    const minX = DW - sw, maxX = 0;
    const minY = DH - sh, maxY = 0;
    const cx = Math.min(maxX, Math.max(minX, off.x));
    const cy = Math.min(maxY, Math.max(minY, off.y));
    ctx.drawImage(img, cx, cy, sw, sh);
  }, [loaded, zoom, offset, DW, DH]);

  useEffect(() => { drawImage(); }, [drawImage]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, DW, DH);
    if (mode !== "crop") return;
    const { x, y, w, h } = cropBox;
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, DW, DH);
    ctx.clearRect(x, y, w, h);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth   = 0.7;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(x + w * i / 3, y); ctx.lineTo(x + w * i / 3, y + h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + h * i / 3); ctx.lineTo(x + w, y + h * i / 3); ctx.stroke();
    }
    const HS = 8;
    const corners = [
      { hx: x,         hy: y,         id: "tl" },
      { hx: x + w - HS, hy: y,        id: "tr" },
      { hx: x,         hy: y + h - HS, id: "bl" },
      { hx: x + w - HS, hy: y + h - HS, id: "br" },
    ];
    corners.forEach(({ hx, hy }) => { ctx.fillStyle = "#fff"; ctx.fillRect(hx, hy, HS, HS); });
    const edges = [
      { hx: x + w / 2 - HS / 2, hy: y,          id: "t" },
      { hx: x + w / 2 - HS / 2, hy: y + h - HS, id: "b" },
      { hx: x,                   hy: y + h / 2 - HS / 2, id: "l" },
      { hx: x + w - HS,         hy: y + h / 2 - HS / 2, id: "r" },
    ];
    edges.forEach(({ hx, hy }) => { ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fillRect(hx, hy, HS, HS); });
  }, [mode, cropBox, DW, DH]);

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => { setLoaded(true); setZoom(1); setOffset({ x: 0, y: 0 }); setCropBox({ x: 0, y: 0, w: DW, h: DH }); };
    img.src = src;
    img.crossOrigin = "anonymous";
  }, [src, DW, DH]);

  const getHandle = (px, py) => {
    const { x, y, w, h } = cropBox;
    const HS = 12;
    const checks = [
      { id: "tl", hx: x,           hy: y           },
      { id: "tr", hx: x + w - HS,  hy: y           },
      { id: "bl", hx: x,           hy: y + h - HS  },
      { id: "br", hx: x + w - HS,  hy: y + h - HS  },
      { id: "t",  hx: x + w/2 - HS/2, hy: y        },
      { id: "b",  hx: x + w/2 - HS/2, hy: y+h-HS   },
      { id: "l",  hx: x,           hy: y+h/2-HS/2  },
      { id: "r",  hx: x+w-HS,     hy: y+h/2-HS/2  },
    ];
    for (const c of checks) {
      if (px >= c.hx && px <= c.hx + HS && py >= c.hy && py <= c.hy + HS) return c.id;
    }
    if (px >= x && px <= x + w && py >= y && py <= y + h) return "move";
    return null;
  };

  const getXY = (e, ref) => {
    const r     = ref.current.getBoundingClientRect();
    const touch = e.touches?.[0] ?? e;
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  };

  const onMoveDown = (e) => { if (mode !== "move") return; e.preventDefault(); dragging.current = true; lastPos.current = getXY(e, canvasRef); };
  const onMoveUp   = () => { dragging.current = false; };
  const onMoveMove = (e) => {
    if (mode !== "move" || !dragging.current) return;
    e.preventDefault();
    const pos = getXY(e, canvasRef);
    const dx  = pos.x - lastPos.current.x;
    const dy  = pos.y - lastPos.current.y;
    lastPos.current = pos;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onCropDown = (e) => {
    if (mode !== "crop") return;
    e.preventDefault();
    const pos = getXY(e, overlayRef);
    const handle = getHandle(pos.x, pos.y);
    if (!handle) return;
    cropDragging.current = true;
    cropHandle.current   = handle;
    cropStart.current    = pos;
    cropBoxStart.current = { ...cropBox };
  };
  const onCropUp = () => { cropDragging.current = false; cropHandle.current = null; };
  const onCropMove = (e) => {
    if (mode !== "crop" || !cropDragging.current) return;
    e.preventDefault();
    const pos = getXY(e, overlayRef);
    const dx  = pos.x - cropStart.current.x;
    const dy  = pos.y - cropStart.current.y;
    const { x: bx, y: by, w: bw, h: bh } = cropBoxStart.current;
    const h = cropHandle.current;
    let nx = bx, ny = by, nw = bw, nh = bh;
    if (h === "move") { nx = Math.max(0, Math.min(DW - bw, bx + dx)); ny = Math.max(0, Math.min(DH - bh, by + dy)); }
    else {
      if (h === "tl" || h === "l" || h === "bl") { const raw = bx + dx; nx = Math.max(0, Math.min(bx + bw - MIN_CROP, raw)); nw = bx + bw - nx; }
      if (h === "tr" || h === "r" || h === "br") { nw = Math.max(MIN_CROP, Math.min(DW - bx, bw + dx)); }
      if (h === "tl" || h === "t" || h === "tr") { const raw = by + dy; ny = Math.max(0, Math.min(by + bh - MIN_CROP, raw)); nh = by + bh - ny; }
      if (h === "bl" || h === "b" || h === "br") { nh = Math.max(MIN_CROP, Math.min(DH - by, bh + dy)); }
    }
    setCropBox({ x: nx, y: ny, w: nw, h: nh });
  };

  const getCropCursor = (e) => {
    if (mode !== "crop" || !overlayRef.current) return;
    const pos = getXY(e, overlayRef);
    const h = getHandle(pos.x, pos.y);
    const map = { tl: "nw-resize", tr: "ne-resize", bl: "sw-resize", br: "se-resize", t: "n-resize", b: "s-resize", l: "w-resize", r: "e-resize", move: "move" };
    overlayRef.current.style.cursor = h ? map[h] : "default";
  };

  const handleDone = () => {
    const out = document.createElement("canvas");
    out.width  = OUTPUT_W;
    out.height = OUTPUT_H;
    const ctx = out.getContext("2d");
    const img = imgRef.current;
    const upscale = OUTPUT_W / DW;

    if (mode === "crop") {
      // Render full pan/zoom into high-res intermediate, then crop from it
      const intermediate = document.createElement("canvas");
      intermediate.width  = OUTPUT_W;
      intermediate.height = OUTPUT_H;
      const ictx = intermediate.getContext("2d");
      const baseScale = Math.max(DW / img.naturalWidth, DH / img.naturalHeight);
      const scale = baseScale * zoom * upscale;
      const sw = img.naturalWidth  * scale;
      const sh = img.naturalHeight * scale;
      const cx = Math.min(0, Math.max(OUTPUT_W - sw, offset.x * upscale));
      const cy = Math.min(0, Math.max(OUTPUT_H - sh, offset.y * upscale));
      ictx.drawImage(img, cx, cy, sw, sh);
      ctx.drawImage(
        intermediate,
        cropBox.x * upscale, cropBox.y * upscale,
        cropBox.w * upscale, cropBox.h * upscale,
        0, 0, OUTPUT_W, OUTPUT_H
      );
    } else {
      // Move/zoom: draw original image directly at full output resolution
      const baseScale = Math.max(DW / img.naturalWidth, DH / img.naturalHeight);
      const scale = baseScale * zoom * upscale;
      const sw = img.naturalWidth  * scale;
      const sh = img.naturalHeight * scale;
      const cx = Math.min(0, Math.max(OUTPUT_W - sw, offset.x * upscale));
      const cy = Math.min(0, Math.max(OUTPUT_H - sh, offset.y * upscale));
      ctx.drawImage(img, cx, cy, sw, sh);
    }
    onDone(out.toDataURL("image/jpeg", 0.97));
  };

  const hint = mode === "move" ? "Drag to pan · Scroll or slider to zoom" : "Drag corners/edges to crop · Drag inside to move box";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10100, background: "rgba(0,0,0,0.86)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1a1a2e", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 32px 80px rgba(0,0,0,0.7)", border: "1px solid #2a2a4a", width: DW + 48 }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Edit Photo</div>
            <div style={{ color: "#8888aa", fontSize: 11, marginTop: 2 }}>{hint}</div>
          </div>
          <button onClick={onCancel} style={{ background: "#2a2a4a", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", color: "#8888aa", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
        </div>
        <div style={{ display: "flex", gap: 0, background: "#12122a", borderRadius: 10, padding: 3, width: "100%" }}>
          {[{ id: "move", label: "Move & Zoom", icon: <Move size={13} /> }, { id: "crop", label: "Crop", icon: <Crop size={13} /> }].map(tab => {
            const active = mode === tab.id;
            return (
              <button key={tab.id} onClick={() => { setMode(tab.id); if (tab.id === "crop") setCropBox({ x: 0, y: 0, w: DW, h: DH }); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "7px 0", borderRadius: 8, border: "none", cursor: "pointer", background: active ? "#1565C0" : "transparent", color: active ? "#fff" : "#8888aa", fontWeight: 600, fontSize: 12, transition: "all .18s", boxShadow: active ? "0 2px 8px rgba(21,101,192,.4)" : "none" }}>
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative", width: DW, height: DH, borderRadius: 4, overflow: "hidden", border: "2px solid #3a3a6a", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
          <canvas ref={canvasRef} width={DW} height={DH} style={{ display: "block", position: "absolute", top: 0, left: 0, touchAction: "none" }} onMouseDown={onMoveDown} onMouseUp={onMoveUp} onMouseLeave={onMoveUp} onMouseMove={onMoveMove} onTouchStart={onMoveDown} onTouchEnd={onMoveUp} onTouchMove={onMoveMove} onWheel={(e) => { if (mode !== "move") return; e.preventDefault(); setZoom(z => Math.min(4, Math.max(1, z - e.deltaY * 0.002))); }} />
          <canvas ref={overlayRef} width={DW} height={DH} style={{ display: "block", position: "absolute", top: 0, left: 0, touchAction: "none", pointerEvents: mode === "crop" ? "auto" : "none", cursor: mode === "crop" ? "default" : "grab" }} onMouseDown={onCropDown} onMouseUp={onCropUp} onMouseLeave={onCropUp} onMouseMove={(e) => { onCropMove(e); getCropCursor(e); }} onTouchStart={onCropDown} onTouchEnd={onCropUp} onTouchMove={onCropMove} />
        </div>
        {mode === "move" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            <ZoomOut size={14} color="#8888aa" />
            <input type="range" min="1" max="4" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))} style={{ flex: 1, accentColor: "#1565C0", cursor: "pointer" }} />
            <ZoomIn size={14} color="#8888aa" />
            <span style={{ color: "#8888aa", fontSize: 11, width: 36, textAlign: "right" }}>{Math.round(zoom * 100)}%</span>
          </div>
        )}
        {mode === "crop" && (
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", background: "#12122a", borderRadius: 8, padding: "6px 12px" }}>
            {[["X", Math.round(cropBox.x)], ["Y", Math.round(cropBox.y)], ["W", Math.round(cropBox.w)], ["H", Math.round(cropBox.h)]].map(([label, val]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ color: "#8888aa", fontSize: 9, fontWeight: 700 }}>{label}</div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{val}</div>
              </div>
            ))}
            <button onClick={() => setCropBox({ x: 0, y: 0, w: DW, h: DH })} style={{ background: "none", border: "1px solid #3a3a6a", borderRadius: 6, color: "#8888aa", fontSize: 10, fontWeight: 600, cursor: "pointer", padding: "2px 8px", alignSelf: "center" }}>Full</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); setCropBox({ x: 0, y: 0, w: DW, h: DH }); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 10, border: "1.5px solid #3a3a6a", background: "transparent", color: "#8888aa", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={handleDone} style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 0", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#1565C0,#1E88E5)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 14px rgba(21,101,192,.45)" }}>
            <Check size={14} /> Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Photo overlay (on card) ───────────────────────────────────────────────────
const PhotoUploadOverlay = ({ onUpload, onEdit, uploading, hasPhoto }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 9, gap: 4, opacity: 0, transition: "opacity 0.2s", borderRadius: 2 }} className="photo-upload-overlay">
    {uploading ? (
      <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
    ) : (
      <div style={{ display: "flex", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer" }}>
          <Upload size={13} />
          <span style={{ fontSize: 9 }}>Upload</span>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={onUpload} />
        </label>
        {hasPhoto && (
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} style={{ background: "none", border: "none", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", padding: 0 }}>
            <Move size={13} />
            <span style={{ fontSize: 9 }}>Edit</span>
          </button>
        )}
      </div>
    )}
  </div>
);

// ── Photo box (unchanged) ─────────────────────────────────────────────────────
const PhotoBox = ({ photoUrl, manualPhoto, firstName, onUpload, uploading, onEditClick }) => {
  const displayPhoto = manualPhoto || photoUrl;
  return (
    <div className="photo-box" style={{ width: 90, height: 108, border: "2px solid #aaa", borderRadius: 2, overflow: "hidden", background: "#f5f5f5", position: "relative" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .photo-box:hover .photo-upload-overlay { opacity: 1; }`}</style>
      {displayPhoto ? (
      <img src={displayPhoto} style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "auto", display: "block" }} alt="Employee" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: "bold", color: "#bbb" }}>{(firstName?.[0] || "?").toUpperCase()}</span>
          <span style={{ fontSize: 8, color: "#bbb", textAlign: "center", lineHeight: 1.3, padding: "0 4px" }}>Click to upload</span>
        </div>
      )}
      <PhotoUploadOverlay onUpload={onUpload} onEdit={onEditClick} uploading={uploading} hasPhoto={!!displayPhoto} />
    </div>
  );
};

// ── FRONT CARD (unchanged) ────────────────────────────────────────────────────
const CardFront = ({ employee, manualPhoto, onUpload, uploading, onEditClick, validityDate }) => {
  const firstName  = employee.first_name  || employee.firstName  || "";
  const fatherName = employee.father_husband_name || employee.fatherHusbandName || "";
  const middleName = employee.middle_name || employee.middleName || "";
  const lastName   = employee.last_name   || employee.lastName   || "";
  const fullName    = [firstName, fatherName || middleName, lastName].filter(Boolean).join(" ").toUpperCase();
  const empId       = employee.employee_id || employee.id       || "—";
  const designation = employee.designation || employee.position || "—";
  const photoUrl    = getPhotoUrl(employee);
  const validTill   = formatDate(validityDate);

  return (
    <div style={{ width: CW, height: CH, background: "#fff", borderRadius: 0, border: "1px solid #ddd", position: "relative", overflow: "hidden", fontFamily: "'Calibri', 'Segoe UI', Arial", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
      <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width="230" height="170"><path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100"/></svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }} width="230" height="170"><path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0"/></svg>
      <div style={{ position: "absolute", top: 30, right: 45, display: "flex", justifyContent: "flex-end", zIndex: 2 }}>
        <img src={LOGO_SRC} style={{ height: 100, objectFit: "contain", maxWidth: "99%" }} alt="Insta ICT Solutions" />
      </div>
      <div style={{ position: "absolute", top: 148, left: "50%", transform: "translateX(-50%)", zIndex: 2 }}>
        <PhotoBox photoUrl={photoUrl} manualPhoto={manualPhoto} firstName={firstName} onUpload={onUpload} uploading={uploading} onEditClick={onEditClick} />
      </div>
      <div style={{ position: "absolute", top: 260, left: "50%", transform: "translateX(-50%)", fontWeight: 700, fontSize: 15, letterSpacing: 0.2, lineHeight: 1.2, color: "#111", zIndex: 2, textAlign: "center", whiteSpace: "nowrap" }}>
        {fullName || "EMPLOYEE NAME"}
      </div>
      <div style={{ position: "absolute", top: 285, left: "50%", transform: "translateX(-50%)", fontSize: 15, color: "#111", zIndex: 2, fontFamily: "'Calibri', 'Segoe UI', Arial", lineHeight: 1.2, whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", gap: 0 }}><span style={{ width: 78 }}>Employee ID</span><span style={{ width: 14, textAlign: "center" }}>:</span><span>{empId}</span></div>
        <div style={{ display: "flex", gap: 0 }}><span style={{ width: 78 }}>Designation</span><span style={{ width: 14, textAlign: "center" }}>:</span><span>{designation}</span></div>
        <div style={{ display: "flex", gap: 0 }}><span style={{ width: 78 }}>Valid Till</span><span style={{ width: 14, textAlign: "center" }}>:</span><span>{validTill}</span></div>
        <div style={{ marginTop: 6 }}>
          <div style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: 18, color: "#1a237e", lineHeight: 1.1, marginBottom: 1 }}>Akshay Shelke</div>
          <div style={{ fontSize: 10, color: "#333", fontFamily: "'Calibri', Arial" }}>Authorised Sign</div>
        </div>
      </div>
    </div>
  );
};

// ── BACK CARD ─────────────────────────────────────────────────────────────────
const CardBack = () => (
  <div style={{ width: CW, height: CH, background: "#ffffff", borderRadius: 0, border: "1px solid #ddd", position: "relative", overflow: "hidden", fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", boxShadow: "0 10px 40px rgba(0,0,0,0.22)" }}>
    <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width="230" height="170" viewBox="0 0 230 170"><path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100"/></svg>
    <svg style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }} width="230" height="170" viewBox="0 0 230 170"><path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0"/></svg>
    <div style={{ position: "absolute", top: 30, right: 45, display: "flex", justifyContent: "flex-end", zIndex: 2 }}>
      <img src={LOGO_SRC} style={{ height: 100, objectFit: "contain", maxWidth: "99%" }} alt="Insta ICT Solutions" />
    </div>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", zIndex: 2, padding: "0 20px", paddingTop: 60 }}>
      <div style={{ fontWeight: 700, fontSize: 16, color: "#111", marginBottom: 1 }}>Insta ICT Solutions Pvt. Ltd.</div>
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.25 }}>201 &amp; 202, Imperial Plaza,</div>
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.25, marginBottom: 1 }}>Jijai Nagar, Kothrud, Pune 411 038</div>
      <div style={{ fontSize: 14, color: "#1565C0", textDecoration: "underline" }}>www.instagrp.com</div>
    </div>
  </div>
);

// ── MODAL — Professional Redesign ─────────────────────────────────────────────
const EmployeeIDCardModal = ({ employee, onClose, onPhotoUpdated }) => {
  const [flipped, setFlipped]               = useState(false);
  const [manualPhoto, setManualPhoto]       = useState(null);
  const [rawPhoto, setRawPhoto]             = useState(null);
  const [uploadState, setUploadState]       = useState("idle");
  const [uploadMsg, setUploadMsg]           = useState("");
  const [showCropEditor, setShowCropEditor] = useState(false);
  const [validityDate, setValidityDate]     = useState(addMonths(12));
  const [selectedValidity, setSelectedValidity] = useState("1 Year");
  const [customDate, setCustomDate]         = useState("");
  const fileInputRef = useRef(null);

  const employeeDbId = employee.id || employee.employee_id;
  const firstName    = employee.first_name  || employee.firstName  || "";
  const lastName     = employee.last_name   || employee.lastName   || "";
  const fullName     = [firstName, lastName].filter(Boolean).join(" ");
  const empId        = employee.employee_id || employee.id || "—";
  const designation  = employee.designation || employee.position || "—";
  const dbPhotoUrl   = getPhotoUrl(employee);
  const hasPhoto     = !!(manualPhoto || dbPhotoUrl);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setRawPhoto(ev.target.result); setShowCropEditor(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = async (croppedDataUrl) => {
    setShowCropEditor(false);
    setManualPhoto(croppedDataUrl);
    setUploadState("uploading");
    try {
      const res  = await fetch(croppedDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      const result = await uploadPhotoToDb(employeeDbId, file);
      setUploadState("success");
      if (typeof onPhotoUpdated === "function") onPhotoUpdated(result.data);
    } catch (err) {
      setUploadState("error");
      setUploadMsg(err.message || "Upload failed.");
    }
  };

  const handleEditExisting = () => {
    const src = manualPhoto || dbPhotoUrl;
    if (src) { setRawPhoto(src); setShowCropEditor(true); }
  };

  const handleValidityPill = (opt) => {
    setSelectedValidity(opt.label);
    if (opt.months !== null) setValidityDate(addMonths(opt.months));
  };

  const handleCustomDate = (e) => {
    setCustomDate(e.target.value);
    if (e.target.value) setValidityDate(new Date(e.target.value));
  };

  const handlePrint = () => {
    const fatherName = employee.father_husband_name || employee.fatherHusbandName || "";
    const middleName = employee.middle_name || employee.middleName || "";
    const fullPrintName = [firstName, fatherName || middleName, lastName].filter(Boolean).join(" ").toUpperCase();
    const photoSrc   = manualPhoto || dbPhotoUrl;
    const validTill  = formatDate(validityDate);
    const logoUrl    = window.location.origin + (LOGO_SRC.startsWith("/") ? LOGO_SRC : "/" + LOGO_SRC);
    const photoHtml  = photoSrc
      ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover"/>`
      : `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;"><span style="font-size:28px;font-weight:bold;color:#bbb">${(firstName[0] || "?").toUpperCase()}</span></div>`;
    const pw = window.open("", "_blank", "width=720,height=620");
    pw.document.write(`<!DOCTYPE html><html><head><title>ID Card – ${fullPrintName}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f0f4f8;display:flex;gap:28px;padding:36px;justify-content:center;align-items:flex-start;font-family:'Calibri','Segoe UI',Arial,sans-serif;flex-wrap:wrap}.card{width:260px;height:410px;background:#fff;border-radius:0;border:1px solid #ddd;position:relative;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.2);page-break-inside:avoid;flex-shrink:0}@media print{body{background:#fff;padding:10px;gap:20px}.card{box-shadow:none}}</style></head><body><div class="card"><svg style="position:absolute;top:0;left:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100"/></svg><svg style="position:absolute;bottom:0;right:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0"/></svg><div style="position:absolute;top:30px;right:45px;display:flex;justify-content:flex-end;z-index:2"><img src="${logoUrl}" style="height:100px;object-fit:contain;max-width:99%" onerror="this.style.display='none'" alt="Logo"/></div><div style="position:absolute;top:148px;left:50%;transform:translateX(-50%);z-index:2;width:90px;height:108px;border:2px solid #aaa;border-radius:2px;overflow:hidden;background:#f5f5f5">${photoHtml}</div><div style="position:absolute;top:260px;left:50%;transform:translateX(-50%);font-weight:700;font-size:15px;letter-spacing:0.2px;line-height:1.2;color:#111;z-index:2;text-align:center;white-space:nowrap">${fullPrintName || "EMPLOYEE NAME"}</div><div style="position:absolute;top:285px;left:50%;transform:translateX(-50%);font-size:15px;color:#111;z-index:2;font-family:'Calibri','Segoe UI',Arial;line-height:1.2;white-space:nowrap"><div style="display:flex;gap:0"><span style="width:78px">Employee ID</span><span style="width:14px;text-align:center">:</span><span>${empId}</span></div><div style="display:flex;gap:0"><span style="width:78px">Designation</span><span style="width:14px;text-align:center">:</span><span>${designation}</span></div><div style="display:flex;gap:0"><span style="width:78px">Valid Till</span><span style="width:14px;text-align:center">:</span><span>${validTill}</span></div><div style="margin-top:6px"><div style="font-family:'Brush Script MT','Segoe Script',cursive;font-size:18px;color:#1a237e;line-height:1.1;margin-bottom:1px">Akshay Shelke</div><div style="font-size:10px;color:#333">Authorised Sign</div></div></div></div><div class="card"><svg style="position:absolute;top:0;left:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100"/></svg><svg style="position:absolute;bottom:0;right:0;z-index:1" width="230" height="170" viewBox="0 0 230 170"><path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0"/></svg><div style="position:absolute;top:30px;right:45px;display:flex;justify-content:flex-end;z-index:2"><img src="${logoUrl}" style="height:100px;object-fit:contain;max-width:99%" onerror="this.style.display='none'" alt="Logo"/></div><div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;z-index:2;padding:0 20px"><div style="font-weight:700;font-size:16px;color:#111;margin-bottom:1px">Insta ICT Solutions Pvt. Ltd.</div><div style="font-size:14px;color:#333;line-height:1.25">201 &amp; 202, Imperial Plaza,</div><div style="font-size:14px;color:#333;line-height:1.25;margin-bottom:1px">Jijai Nagar, Kothrud, Pune 411 038</div><div style="font-size:14px;color:#1565C0;text-decoration:underline">www.instagrp.com</div></div></div><script>setTimeout(()=>window.print(),400)</script></body></html>`);
    pw.document.close();
  };

  // Status config
  const statusConfig = (() => {
    if (uploadState === "uploading") return { icon: "⏳", label: "Saving photo…", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" };
    if (uploadState === "error")    return { icon: "✕",  label: uploadMsg || "Upload failed", color: "#991b1b", bg: "#fef2f2", border: "#fecaca" };
    if (uploadState === "success" || manualPhoto) return { icon: "✓", label: "Photo saved", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" };
    if (dbPhotoUrl) return { icon: "✓", label: "Photo from database", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0" };
    return { icon: "!", label: "No photo — hover card to upload", color: "#92400e", bg: "#fefce8", border: "#fde68a" };
  })();

  const styles = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(10, 14, 26, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
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
    // Top header band
    header: {
      background: "linear-gradient(135deg, #0d47a1 0%, #1565C0 50%, #1976D2 100%)",
      borderRadius: "20px 20px 0 0",
      padding: "20px 24px 18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    body: {
      display: "flex",
      flexDirection: "row",
      gap: 0,
      flex: 1,
    },
    // Left panel: card preview
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
    // Right panel: controls
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

  return (
    <>
      {showCropEditor && rawPhoto && (
        <PhotoCropEditor src={rawPhoto} onDone={handleCropDone} onCancel={() => setShowCropEditor(false)} />
      )}

      <div onClick={(e) => e.target === e.currentTarget && onClose()} style={styles.overlay}>
        <div style={styles.modal}>

          {/* ── Header ── */}
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Avatar circle */}
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "rgba(255,255,255,0.18)",
                border: "2px solid rgba(255,255,255,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff",
                flexShrink: 0,
              }}>
                {(firstName[0] || "?").toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                  Employee ID Card
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                  {fullName || "—"} &nbsp;·&nbsp; {empId}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Designation badge */}
              {designation !== "—" && (
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 8, padding: "4px 10px",
                  fontSize: 11, fontWeight: 600, color: "#fff",
                }}>
                  {designation}
                </div>
              )}
              <button onClick={onClose} style={{
                background: "rgba(255,255,255,0.15)", border: "none",
                borderRadius: 10, width: 34, height: 34, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}>
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Body: left + right ── */}
          <div style={styles.body}>

            {/* ── LEFT: card preview ── */}
            <div style={styles.leftPanel}>
              {/* Side label */}
              <div style={{ display: "flex", gap: 0, background: "#e2e8f0", borderRadius: 30, padding: 3, width: "100%" }}>
                {[["Front", false], ["Back", true]].map(([label, side]) => (
                  <button key={label} onClick={() => setFlipped(side)} style={{
                    flex: 1, padding: "5px 0", borderRadius: 24,
                    border: "none", cursor: "pointer",
                    background: flipped === side ? "#1565C0" : "transparent",
                    color: flipped === side ? "#fff" : "#64748b",
                    fontSize: 12, fontWeight: 600, transition: "all .2s",
                  }}>{label}</button>
                ))}
              </div>

              {/* 3D flip card */}
              <div style={{ perspective: 1200, width: CW, height: CH }}>
                <div style={{
                  width: CW, height: CH, position: "relative",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.6s cubic-bezier(.4,0,.2,1)",
                  transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}>
                  <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                    <CardFront employee={employee} manualPhoto={manualPhoto} onUpload={handlePhotoUpload} uploading={uploadState === "uploading"} onEditClick={handleEditExisting} validityDate={validityDate} />
                  </div>
                  <div style={{ position: "absolute", width: "100%", height: "100%", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <CardBack />
                  </div>
                </div>
              </div>

              {/* Flip hint */}
              <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
                Click Front / Back to preview both sides
              </div>
            </div>

            {/* ── RIGHT: controls ── */}
            <div style={styles.rightPanel}>

              {/* Photo section */}
              <div>
                <div style={styles.sectionLabel}>Photo</div>
                {/* Status row */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: statusConfig.bg,
                  border: `1px solid ${statusConfig.border}`,
                  borderRadius: 10, padding: "9px 12px",
                  marginBottom: 12,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: statusConfig.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0,
                  }}>
                    {statusConfig.icon}
                  </div>
                  <span style={{ fontSize: 12, color: statusConfig.color, fontWeight: 500, flex: 1 }}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Upload / Edit buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  {hasPhoto && (
                    <button onClick={handleEditExisting} style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "9px 12px", borderRadius: 10,
                      background: "#fff", border: "1.5px solid #1565C0",
                      color: "#1565C0", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>
                      <Move size={13} /> Edit Photo
                    </button>
                  )}
                  <label style={{
                    flex: hasPhoto ? 1 : 2,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "9px 12px", borderRadius: 10,
                    background: uploadState === "uploading" ? "#93c5fd" : "#1565C0",
                    border: "none", color: "#fff", fontSize: 12, fontWeight: 600,
                    cursor: uploadState === "uploading" ? "wait" : "pointer",
                    pointerEvents: uploadState === "uploading" ? "none" : "auto",
                    transition: "background .2s",
                  }}>
                    {uploadState === "uploading"
                      ? <><Loader size={13} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                      : <><Upload size={13} /> {hasPhoto ? "Replace Photo" : "Upload Photo"}</>
                    }
                    {uploadState !== "uploading" && (
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
                    )}
                  </label>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* Validity section */}
              <div>
                <div style={styles.sectionLabel}>Validity Period</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {VALIDITY_OPTIONS.map((opt) => (
                    <button key={opt.label} onClick={() => handleValidityPill(opt)} style={styles.pill(selectedValidity === opt.label)}>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {selectedValidity === "Custom" && (
                  <input type="date" value={customDate} min={toInputValue(new Date())} onChange={handleCustomDate} style={{
                    width: "100%", padding: "8px 12px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155",
                    outline: "none", background: "#fff", boxSizing: "border-box",
                    marginBottom: 8,
                  }} />
                )}

                {/* Expiry display */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#f8fafc", borderRadius: 10, padding: "10px 14px",
                  border: "1px solid #e2e8f0",
                }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Card expires on</span>
                  <span style={{ fontSize: 14, color: "#1565C0", fontWeight: 700 }}>{formatDate(validityDate)}</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#f1f5f9" }} />

              {/* Employee details summary */}
              <div>
                <div style={styles.sectionLabel}>Employee Details</div>
                <div style={{
                  background: "#f8fafc", borderRadius: 10,
                  border: "1px solid #e2e8f0", overflow: "hidden",
                }}>
                  {[
                    ["Full Name", fullName || "—"],
                    ["Employee ID", empId],
                    ["Designation", designation],
                  ].map(([label, value], i) => (
                    <div key={label} style={{
                      display: "flex", alignItems: "center",
                      padding: "9px 14px",
                      borderTop: i === 0 ? "none" : "1px solid #e2e8f0",
                    }}>
                      <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, width: 90, flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Action buttons */}
              <div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setFlipped(f => !f)} style={styles.actionBtn(false)}>
                    <FlipHorizontal size={14} /> Flip Card
                  </button>
                  <button onClick={handlePrint} style={styles.actionBtn(true)}>
                    <Printer size={14} /> Print / Save PDF
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>
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