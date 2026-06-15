import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Move, Check, RotateCcw, Crop } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PhotoCropEditor
//
// Full-screen modal that lets the user pan/zoom the source image and
// (optionally) crop a region of it, then renders the result onto an
// output canvas and returns a JPEG data URL via onDone().
// ─────────────────────────────────────────────────────────────────────────────
const PhotoCropEditor = ({ src, onDone, onCancel }) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const imgRef = useRef(new Image());
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const cropDragging = useRef(false);
  const cropHandle = useRef(null);
  const cropStart = useRef({ x: 0, y: 0 });
  const cropBoxStart = useRef(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("move");
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, w: 225, h: 270 });

  const MIN_CROP = 30;
  const OUTPUT_W = 360;
  const OUTPUT_H = 432;
  const DW = 225;
  const DH = 270;

  const drawImage = useCallback(
    (z = zoom, off = offset) => {
      if (!loaded) return;
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, DW, DH);
      const baseScale = Math.max(DW / img.naturalWidth, DH / img.naturalHeight);
      const scale = baseScale * z;
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      const cx = Math.min(0, Math.max(DW - sw, off.x));
      const cy = Math.min(0, Math.max(DH - sh, off.y));
      ctx.drawImage(img, cx, cy, sw, sh);
    },
    [loaded, zoom, offset, DW, DH],
  );

  useEffect(() => {
    drawImage();
  }, [drawImage]);

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
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 0.7;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * i) / 3, y);
      ctx.lineTo(x + (w * i) / 3, y + h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + (h * i) / 3);
      ctx.lineTo(x + w, y + (h * i) / 3);
      ctx.stroke();
    }
    const HS = 8;
    [
      [x, y],
      [x + w - HS, y],
      [x, y + h - HS],
      [x + w - HS, y + h - HS],
    ].forEach(([hx, hy]) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(hx, hy, HS, HS);
    });
    [
      [x + w / 2 - HS / 2, y],
      [x + w / 2 - HS / 2, y + h - HS],
      [x, y + h / 2 - HS / 2],
      [x + w - HS, y + h / 2 - HS / 2],
    ].forEach(([hx, hy]) => {
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillRect(hx, hy, HS, HS);
    });
  }, [mode, cropBox, DW, DH]);

  useEffect(() => {
    const img = imgRef.current;
    img.onload = () => {
      setLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setCropBox({ x: 0, y: 0, w: DW, h: DH });
    };
    img.crossOrigin = "anonymous";
    img.src = src;
  }, [src, DW, DH]);

  const getHandle = (px, py) => {
    const { x, y, w, h } = cropBox;
    const HS = 12;
    const checks = [
      { id: "tl", hx: x, hy: y },
      { id: "tr", hx: x + w - HS, hy: y },
      { id: "bl", hx: x, hy: y + h - HS },
      { id: "br", hx: x + w - HS, hy: y + h - HS },
      { id: "t", hx: x + w / 2 - HS / 2, hy: y },
      { id: "b", hx: x + w / 2 - HS / 2, hy: y + h - HS },
      { id: "l", hx: x, hy: y + h / 2 - HS / 2 },
      { id: "r", hx: x + w - HS, hy: y + h / 2 - HS / 2 },
    ];
    for (const c of checks) {
      if (px >= c.hx && px <= c.hx + HS && py >= c.hy && py <= c.hy + HS)
        return c.id;
    }
    if (px >= x && px <= x + w && py >= y && py <= y + h) return "move";
    return null;
  };

  const getXY = (e, ref) => {
    const r = ref.current.getBoundingClientRect();
    const touch = e.touches?.[0] ?? e;
    return { x: touch.clientX - r.left, y: touch.clientY - r.top };
  };

  const onMoveDown = (e) => {
    if (mode !== "move") return;
    e.preventDefault();
    dragging.current = true;
    lastPos.current = getXY(e, canvasRef);
  };
  const onMoveUp = () => {
    dragging.current = false;
  };
  const onMoveMove = (e) => {
    if (mode !== "move" || !dragging.current) return;
    e.preventDefault();
    const pos = getXY(e, canvasRef);
    const dx = pos.x - lastPos.current.x;
    const dy = pos.y - lastPos.current.y;
    lastPos.current = pos;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const onCropDown = (e) => {
    if (mode !== "crop") return;
    e.preventDefault();
    const pos = getXY(e, overlayRef);
    const handle = getHandle(pos.x, pos.y);
    if (!handle) return;
    cropDragging.current = true;
    cropHandle.current = handle;
    cropStart.current = pos;
    cropBoxStart.current = { ...cropBox };
  };
  const onCropUp = () => {
    cropDragging.current = false;
    cropHandle.current = null;
  };
  const onCropMove = (e) => {
    if (mode !== "crop" || !cropDragging.current) return;
    e.preventDefault();
    const pos = getXY(e, overlayRef);
    const dx = pos.x - cropStart.current.x;
    const dy = pos.y - cropStart.current.y;
    const { x: bx, y: by, w: bw, h: bh } = cropBoxStart.current;
    const hnd = cropHandle.current;
    let nx = bx,
      ny = by,
      nw = bw,
      nh = bh;
    if (hnd === "move") {
      nx = Math.max(0, Math.min(DW - bw, bx + dx));
      ny = Math.max(0, Math.min(DH - bh, by + dy));
    } else {
      if (hnd === "tl" || hnd === "l" || hnd === "bl") {
        const raw = bx + dx;
        nx = Math.max(0, Math.min(bx + bw - MIN_CROP, raw));
        nw = bx + bw - nx;
      }
      if (hnd === "tr" || hnd === "r" || hnd === "br") {
        nw = Math.max(MIN_CROP, Math.min(DW - bx, bw + dx));
      }
      if (hnd === "tl" || hnd === "t" || hnd === "tr") {
        const raw = by + dy;
        ny = Math.max(0, Math.min(by + bh - MIN_CROP, raw));
        nh = by + bh - ny;
      }
      if (hnd === "bl" || hnd === "b" || hnd === "br") {
        nh = Math.max(MIN_CROP, Math.min(DH - by, bh + dy));
      }
    }
    setCropBox({ x: nx, y: ny, w: nw, h: nh });
  };

  const getCropCursor = (e) => {
    if (mode !== "crop" || !overlayRef.current) return;
    const pos = getXY(e, overlayRef);
    const hnd = getHandle(pos.x, pos.y);
    const map = {
      tl: "nw-resize",
      tr: "ne-resize",
      bl: "sw-resize",
      br: "se-resize",
      t: "n-resize",
      b: "s-resize",
      l: "w-resize",
      r: "e-resize",
      move: "move",
    };
    overlayRef.current.style.cursor = hnd ? map[hnd] : "default";
  };

  const handleDone = () => {
    const out = document.createElement("canvas");
    out.width = OUTPUT_W;
    out.height = OUTPUT_H;
    const ctx = out.getContext("2d");
    const img = imgRef.current;
    const upscale = OUTPUT_W / DW;

    if (mode === "crop") {
      const mid = document.createElement("canvas");
      mid.width = OUTPUT_W;
      mid.height = OUTPUT_H;
      const mctx = mid.getContext("2d");
      const base = Math.max(DW / img.naturalWidth, DH / img.naturalHeight);
      const scale = base * zoom * upscale;
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      const cx = Math.min(0, Math.max(OUTPUT_W - sw, offset.x * upscale));
      const cy = Math.min(0, Math.max(OUTPUT_H - sh, offset.y * upscale));
      mctx.drawImage(img, cx, cy, sw, sh);
      ctx.drawImage(
        mid,
        cropBox.x * upscale,
        cropBox.y * upscale,
        cropBox.w * upscale,
        cropBox.h * upscale,
        0,
        0,
        OUTPUT_W,
        OUTPUT_H,
      );
    } else {
      const base = Math.max(DW / img.naturalWidth, DH / img.naturalHeight);
      const scale = base * zoom * upscale;
      const sw = img.naturalWidth * scale;
      const sh = img.naturalHeight * scale;
      const cx = Math.min(0, Math.max(OUTPUT_W - sw, offset.x * upscale));
      const cy = Math.min(0, Math.max(OUTPUT_H - sh, offset.y * upscale));
      ctx.drawImage(img, cx, cy, sw, sh);
    }
    onDone(out.toDataURL("image/jpeg", 0.97));
  };

  const hint =
    mode === "move"
      ? "Drag to pan · Scroll or slider to zoom"
      : "Drag corners/edges to crop · Drag inside to move box";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10100,
        background: "rgba(0,0,0,0.86)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: 18,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          border: "1px solid #2a2a4a",
          width: DW + 48,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
              Edit Photo
            </div>
            <div style={{ color: "#8888aa", fontSize: 11, marginTop: 2 }}>
              {hint}
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "#2a2a4a",
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              cursor: "pointer",
              color: "#8888aa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 0,
            background: "#12122a",
            borderRadius: 10,
            padding: 3,
            width: "100%",
          }}
        >
          {[
            { id: "move", label: "Move & Zoom", icon: <Move size={13} /> },
            { id: "crop", label: "Crop", icon: <Crop size={13} /> },
          ].map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setMode(tab.id);
                  if (tab.id === "crop")
                    setCropBox({ x: 0, y: 0, w: DW, h: DH });
                }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "7px 0",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "#1565C0" : "transparent",
                  color: active ? "#fff" : "#8888aa",
                  fontWeight: 600,
                  fontSize: 12,
                  transition: "all .18s",
                  boxShadow: active ? "0 2px 8px rgba(21,101,192,.4)" : "none",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            position: "relative",
            width: DW,
            height: DH,
            borderRadius: 4,
            overflow: "hidden",
            border: "2px solid #3a3a6a",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={DW}
            height={DH}
            style={{
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              touchAction: "none",
            }}
            onMouseDown={onMoveDown}
            onMouseUp={onMoveUp}
            onMouseLeave={onMoveUp}
            onMouseMove={onMoveMove}
            onTouchStart={onMoveDown}
            onTouchEnd={onMoveUp}
            onTouchMove={onMoveMove}
            onWheel={(e) => {
              if (mode !== "move") return;
              e.preventDefault();
              setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.002)));
            }}
          />
          <canvas
            ref={overlayRef}
            width={DW}
            height={DH}
            style={{
              display: "block",
              position: "absolute",
              top: 0,
              left: 0,
              touchAction: "none",
              pointerEvents: mode === "crop" ? "auto" : "none",
              cursor: mode === "crop" ? "default" : "grab",
            }}
            onMouseDown={onCropDown}
            onMouseUp={onCropUp}
            onMouseLeave={onCropUp}
            onMouseMove={(e) => {
              onCropMove(e);
              getCropCursor(e);
            }}
            onTouchStart={onCropDown}
            onTouchEnd={onCropUp}
            onTouchMove={onCropMove}
          />
        </div>

        {mode === "move" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
            }}
          >
            <ZoomOut size={14} color="#8888aa" />
            <input
              type="range"
              min="1"
              max="4"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: "#1565C0", cursor: "pointer" }}
            />
            <ZoomIn size={14} color="#8888aa" />
            <span
              style={{
                color: "#8888aa",
                fontSize: 11,
                width: 36,
                textAlign: "right",
              }}
            >
              {Math.round(zoom * 100)}%
            </span>
          </div>
        )}

        {mode === "crop" && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              background: "#12122a",
              borderRadius: 8,
              padding: "6px 12px",
            }}
          >
            {[
              ["X", Math.round(cropBox.x)],
              ["Y", Math.round(cropBox.y)],
              ["W", Math.round(cropBox.w)],
              ["H", Math.round(cropBox.h)],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ color: "#8888aa", fontSize: 9, fontWeight: 700 }}>
                  {label}
                </div>
                <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>
                  {val}
                </div>
              </div>
            ))}
            <button
              onClick={() => setCropBox({ x: 0, y: 0, w: DW, h: DH })}
              style={{
                background: "none",
                border: "1px solid #3a3a6a",
                borderRadius: 6,
                color: "#8888aa",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                padding: "2px 8px",
                alignSelf: "center",
              }}
            >
              Full
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
              setCropBox({ x: 0, y: 0, w: DW, h: DH });
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "9px 0",
              borderRadius: 10,
              border: "1.5px solid #3a3a6a",
              background: "transparent",
              color: "#8888aa",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleDone}
            style={{
              flex: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "9px 0",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg,#1565C0,#1E88E5)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(21,101,192,.45)",
            }}
          >
            <Check size={14} /> Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCropEditor;