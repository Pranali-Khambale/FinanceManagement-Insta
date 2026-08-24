import { BASE_URL as BASE_API } from "@/api/client";
import { DOC_TYPE_META } from "@/Ui/EmployeeMng/ReviewedDocsSection/constants";
import { getAuthHeaders, getPresignedUrl, extractS3Key } from "./presignUtils";

export function getFileType(path = "", mime = "") {
  const p = String(path || "").toLowerCase();
  const m = String(mime || "").toLowerCase();
  if (m.includes("pdf") || p.endsWith(".pdf")) return "pdf";
  if (m.includes("image") || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/.test(p))
    return "image";
  return "other";
}

async function fetchBytesViaProxy(s3KeyOrUrl) {
  if (s3KeyOrUrl.startsWith("blob:")) {
    const resp = await fetch(s3KeyOrUrl);
    if (!resp.ok) throw new Error(`Blob fetch failed: ${resp.status}`);
    return resp.arrayBuffer();
  }
  const rawKey = extractS3Key(s3KeyOrUrl);
  if (rawKey.startsWith("http://") || rawKey.startsWith("https://")) {
    const resp = await fetch(rawKey, { cache: "no-store" });
    if (!resp.ok)
      throw new Error(`Direct fetch HTTP ${resp.status} – ${resp.statusText}`);
    return resp.arrayBuffer();
  }
  const proxyUrl = `${BASE_API}/employees/s3/proxy?key=${encodeURIComponent(rawKey)}`;
  try {
    const resp = await fetch(proxyUrl, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`Proxy ${resp.status}: ${body.slice(0, 120)}`);
    }
    return resp.arrayBuffer();
  } catch {
    const presigned = await getPresignedUrl(rawKey);
    if (!presigned) throw new Error("Could not resolve document URL");
    const resp = await fetch(presigned, { cache: "no-store" });
    if (!resp.ok)
      throw new Error(`S3 direct HTTP ${resp.status} – ${resp.statusText}`);
    return resp.arrayBuffer();
  }
}

async function fetchImageBytes(s3KeyOrUrl) {
  const buf = await fetchBytesViaProxy(s3KeyOrUrl);
  return new Uint8Array(buf);
}

export async function fetchPdfBytes(s3KeyOrUrl) {
  return fetchBytesViaProxy(s3KeyOrUrl);
}

function convertBlobUrlViaCanvas(blobUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("toBlob returned null"));
          return;
        }
        blob
          .arrayBuffer()
          .then((buf) => resolve(new Uint8Array(buf)))
          .catch(reject);
      }, "image/png");
    };
    img.onerror = () => reject(new Error("WebP blob image failed to load"));
    img.src = blobUrl;
  });
}

export async function downloadAllAsPdf(docs, emp) {
  const { PDFDocument, rgb, StandardFonts } =
    await import("https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js");

  const pdf = await PDFDocument.create();
  const BOLD = await pdf.embedFont(StandardFonts.HelveticaBold);
  const NORMAL = await pdf.embedFont(StandardFonts.Helvetica);
  const W = 595.28,
    H = 841.89;
  const WHITE = rgb(1, 1, 1),
    DARK = rgb(0.071, 0.094, 0.133);
  const ACCENT = rgb(0.122, 0.365, 0.902),
    LABEL = rgb(0.749, 0.796, 0.878);
  const NAME_C = rgb(1, 1, 1),
    PAGEBG = rgb(0.98, 0.98, 0.984);
  const BAR = 38;

  const isObj = emp && typeof emp === "object";
  const fullName = isObj
    ? [emp.first_name, emp.father_husband_name, emp.last_name]
        .filter(Boolean)
        .join(" ")
    : String(emp || "Employee");
  const empId = isObj ? emp.emp_id || emp.employee_id || "" : "";

  const getMeta = (doc) =>
    DOC_TYPE_META?.[doc.document_type] || {
      section: "other",
      label: "Document",
    };
  const getLabel = (doc) => doc._regLabel || getMeta(doc).label || "Document";

  function trunc(text, font, size, maxW) {
    let t = String(text ?? "");
    while (t.length > 1 && font.widthOfTextAtSize(t, size) > maxW)
      t = t.slice(0, -1);
    if (t.length < String(text ?? "").length) t = t.slice(0, -1) + "…";
    return t;
  }

  const SEC_ACCENT = {
    kye: rgb(0.122, 0.365, 0.902),
    hr: rgb(0.412, 0.192, 0.843),
    reg: rgb(0.016, 0.6, 0.502),
    other: rgb(0.376, 0.408, 0.455),
  };

  function stampBar(page, doc) {
    const label = getLabel(doc);
    const section = getMeta(doc).section || "other";
    const pip = SEC_ACCENT[section] || SEC_ACCENT.other;
    page.drawRectangle({
      x: 0,
      y: H - BAR,
      width: W,
      height: BAR,
      color: DARK,
    });
    page.drawRectangle({ x: 0, y: H - BAR, width: 3, height: BAR, color: pip });
    page.drawRectangle({
      x: 0,
      y: H - BAR,
      width: W,
      height: 1,
      color: ACCENT,
    });
    const nameStr = trunc(
      fullName + (empId ? `  ·  ${empId}` : ""),
      BOLD,
      11,
      W * 0.55 - 24,
    );
    page.drawText(nameStr, {
      x: 14,
      y: H - BAR + 13,
      size: 11,
      font: BOLD,
      color: NAME_C,
    });
    const labelStr = trunc(label.toUpperCase(), BOLD, 7.5, W * 0.4);
    page.drawText(labelStr, {
      x: W - 14 - BOLD.widthOfTextAtSize(labelStr, 7.5),
      y: H - BAR + 14,
      size: 7.5,
      font: BOLD,
      color: LABEL,
      characterSpacing: 0.9,
    });
  }

  function addErrorPage(doc, errorMsg) {
    const page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
    page.drawRectangle({
      x: 40,
      y: H / 2 - 60,
      width: W - 80,
      height: 100,
      color: rgb(1, 0.95, 0.95),
    });
    page.drawRectangle({
      x: 40,
      y: H / 2 - 60,
      width: 4,
      height: 100,
      color: rgb(0.85, 0.15, 0.15),
    });
    const errTitle = "Could not load this document";
    page.drawText(errTitle, {
      x: (W - BOLD.widthOfTextAtSize(errTitle, 13)) / 2,
      y: H / 2 + 20,
      size: 13,
      font: BOLD,
      color: rgb(0.75, 0.18, 0.18),
    });
    const hint =
      "The file could not be fetched. Check network or S3 permissions.";
    page.drawText(hint, {
      x: (W - NORMAL.widthOfTextAtSize(hint, 9)) / 2,
      y: H / 2 - 2,
      size: 9,
      font: NORMAL,
      color: rgb(0.5, 0.3, 0.3),
    });
    const errDetail = trunc(
      String(errorMsg || "Unknown error"),
      NORMAL,
      7.5,
      W - 100,
    );
    page.drawText(errDetail, {
      x: (W - NORMAL.widthOfTextAtSize(errDetail, 7.5)) / 2,
      y: H / 2 - 22,
      size: 7.5,
      font: NORMAL,
      color: rgb(0.6, 0.35, 0.35),
    });
    stampBar(page, doc);
  }

  const getBytesForDoc = async (doc) => {
    if (doc._stagedFile) return doc._stagedFile.arrayBuffer();
    return fetchBytesViaProxy(doc.file_path);
  };

  const ORDER = ["kye", "hr", "reg", "other"];
  const validDocs = docs.filter((d) => d.file_path || d._stagedFile);
  const sorted = ORDER.flatMap((sKey) =>
    validDocs.filter((d) => (getMeta(d).section || "other") === sKey),
  );

  for (const doc of sorted) {
    const mime = doc.mime_type || doc.mimeType || doc._stagedFile?.type || "";
    const pathForTypeDetection = doc._stagedFile
      ? doc._stagedFile.name
      : extractS3Key(doc.file_path || "");
    const ft = doc._stagedFile
      ? getFileType(doc._stagedFile.name, doc._stagedFile.type)
      : getFileType(pathForTypeDetection, mime);

    try {
      if (ft === "pdf") {
        const bytes = await getBytesForDoc(doc);
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await pdf.copyPages(src, src.getPageIndices());
        for (const p of copied) {
          const { width: ow, height: oh } = p.getSize();
          if (Math.abs(ow - W) > 4 || Math.abs(oh - H) > 4) {
            const s = Math.min(W / ow, H / oh);
            p.setSize(W, H);
            p.scaleContent(s, s);
          }
          p.translateContent(0, -BAR);
          pdf.addPage(p);
          stampBar(p, doc);
        }
      } else if (ft === "image") {
        let uint8;
        try {
          if (doc._stagedFile) {
            const buf = await doc._stagedFile.arrayBuffer();
            uint8 = new Uint8Array(buf);
          } else {
            uint8 = await fetchImageBytes(doc.file_path);
          }
        } catch (imgErr) {
          addErrorPage(doc, imgErr.message);
          continue;
        }

        const isPng = uint8[0] === 0x89 && uint8[1] === 0x50;
        const isJpeg = uint8[0] === 0xff && uint8[1] === 0xd8;
        const isWebp = uint8[8] === 0x57 && uint8[9] === 0x45;
        let img;
        try {
          if (isPng) {
            img = await pdf.embedPng(uint8);
          } else if (isJpeg) {
            img = await pdf.embedJpg(uint8);
          } else if (isWebp) {
            const blob = new Blob([uint8], { type: "image/webp" });
            const blobUrl = URL.createObjectURL(blob);
            try {
              const pngBytes = await convertBlobUrlViaCanvas(blobUrl);
              img = await pdf.embedPng(pngBytes);
            } finally {
              URL.revokeObjectURL(blobUrl);
            }
          } else {
            try {
              img = await pdf.embedPng(uint8);
            } catch {
              img = await pdf.embedJpg(uint8);
            }
          }
        } catch (embedErr) {
          addErrorPage(doc, "Image embed failed: " + embedErr.message);
          continue;
        }

        const { width: iW, height: iH } = img;
        const PAD = 16,
          availW = W - PAD * 2,
          availH = H - BAR - PAD * 2;
        const scale = Math.min(availW / iW, availH / iH, 1);
        const page = pdf.addPage([W, H]);
        page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAGEBG });
        page.drawImage(img, {
          x: (W - iW * scale) / 2,
          y: PAD + (availH - iH * scale) / 2,
          width: iW * scale,
          height: iH * scale,
        });
        stampBar(page, doc);
      } else {
        const page = pdf.addPage([W, H]);
        page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
        const msg = "File preview not available";
        page.drawText(msg, {
          x: (W - BOLD.widthOfTextAtSize(msg, 13)) / 2,
          y: H / 2,
          size: 13,
          font: BOLD,
          color: rgb(0.55, 0.57, 0.62),
        });
        stampBar(page, doc);
      }
    } catch (err) {
      addErrorPage(doc, err.message);
    }
  }

  const blob = new Blob([await pdf.save()], { type: "application/pdf" });
  const href = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href,
    download: `${fullName.replace(/\s+/g, "_")}_Documents.pdf`,
  });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}
