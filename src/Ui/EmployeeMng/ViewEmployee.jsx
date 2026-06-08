import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  DollarSign,
  TrendingUp,
  Building,
  CreditCard,
  Wallet,
  FileText,
  Image,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { printKYEForm } from "./KYEPrintForm";
import SalaryDetails from "./salaryDetails";

const DOC_LABELS = {
  photo: "Passport Size Photograph",
  idPhoto: "Passport Size Photograph",
  id_photo: "Passport Size Photograph",
  resume: "Resume – Signed Copy",
  medicalCertificate: "Medical Certificate",
  medical_certificate: "Medical Certificate",
  aadharCard: "Aadhaar Card",
  aadhar_card: "Aadhaar Card",
  panCard: "PAN Card",
  pan_card: "PAN Card",
  academicRecords: "Academic Records",
  academic_records: "Academic Records",
  bankPassbook: "Bank Details / Passbook",
  bank_passbook: "Bank Details / Passbook",
  payslip: "Pay Slip / Bank Statement",
  otherCertificates: "Other Certificates",
  other_certificates: "Other Certificates",
  farmToCli: "Farm to CLI",
  farm_to_cli: "Farm to CLI",
};

const getDocLabel = (doc) =>
  DOC_LABELS[doc.type || doc.document_type] ||
  doc.name ||
  doc.file_name ||
  doc.type ||
  doc.document_type ||
  "Document";

const isPdf = (rawPath) =>
  typeof rawPath === "string" && rawPath.toLowerCase().endsWith(".pdf");

const buildFullName = (firstName = "", fatherHusbandName = "", lastName = "") =>
  [firstName, fatherHusbandName, lastName]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

// ── Fetch a presigned URL from the backend ────────────────────────────────────
async function fetchPresignedUrl(rawPath) {
  if (!rawPath) return null;
  // Already a full URL — return as-is
  if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
    return rawPath;
  }
  try {
    const res = await fetch(
      `/api/employees/s3/presign?key=${encodeURIComponent(rawPath)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

const ViewEmployee = ({ employee, onClose }) => {
  if (!employee) return null;

  const e = employee;

  const firstName = e.first_name || e.firstName || "";
  const lastName = e.last_name || e.lastName || "";
  const fatherHusbandName = e.father_husband_name || e.fatherHusbandName || "";
  const fullName = buildFullName(firstName, fatherHusbandName, lastName);

  const fmtDate = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const val = (v) => (v && String(v).trim() !== "" ? String(v).trim() : "");

  const fmtCurrency = (v) => {
    const n = parseFloat(v) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);
  };

  const statusMap = {
    active: {
      label: "Active",
      bg: "#dcfce7",
      color: "#15803d",
      dot: "#22c55e",
    },
    approved: {
      label: "Active",
      bg: "#dcfce7",
      color: "#15803d",
      dot: "#22c55e",
    },
    inactive: {
      label: "Inactive",
      bg: "#fee2e2",
      color: "#b91c1c",
      dot: "#ef4444",
    },
    rejected: {
      label: "Inactive",
      bg: "#fee2e2",
      color: "#b91c1c",
      dot: "#ef4444",
    },
    pending: {
      label: "Pending",
      bg: "#fef9c3",
      color: "#92400e",
      dot: "#f59e0b",
    },
  };
  const st = statusMap[(e.status || "").toLowerCase()] || {
    label: e.status || "—",
    bg: "#f1f5f9",
    color: "#475569",
    dot: "#94a3b8",
  };

  // ── Find photo document ───────────────────────────────────────────────────────
  const photoDoc = Array.isArray(e.documents)
    ? e.documents.find((d) =>
        ["idPhoto", "photo", "id_photo"].includes(d.type || d.document_type),
      )
    : null;
  const photoRawPath = photoDoc?.path || photoDoc?.file_path || null;
  const initials =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "NA";

  // ── Resolved photo URL (async) ────────────────────────────────────────────────
  const [photoUrl, setPhotoUrl] = useState(null);
  useEffect(() => {
    fetchPresignedUrl(photoRawPath).then(setPhotoUrl);
  }, [photoRawPath]);

  const basic = parseFloat(e.basic_salary) || 0;
  const hra = parseFloat(e.hra) || 0;
  const otherAllow = parseFloat(e.other_allowances) || 0;
  const totalSalary = basic + hra + otherAllow;

  // ── Renderable docs — deduplicate by file_path ────────────────────────────────
  const allDocs = Array.isArray(e.documents) ? e.documents : [];
  const seenPaths = new Set();
  const renderableDocs = allDocs.filter((doc) => {
    const rawPath = doc.path || doc.file_path || null;
    if (!rawPath) return false;
    if (seenPaths.has(rawPath)) return false;
    seenPaths.add(rawPath);
    return true;
  });

  /* ─── Shared style tokens ────────────────────────────────────────────────── */
  const FONT = "'Calibri', 'Segoe UI', Arial, sans-serif";
  const BORDER = "1px solid #000";

  /* ─── SectionWithVerification ────────────────────────────────────────────── */
  const SectionWithVerification = ({ rows }) => (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "9.5pt",
        fontFamily: FONT,
        marginBottom: "5mm",
        tableLayout: "fixed",
      }}
    >
      <colgroup>
        <col style={{ width: "33%" }} />
        <col style={{ width: "40%" }} />
        <col style={{ width: "3%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "12%" }} />
      </colgroup>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td
              style={{
                border: BORDER,
                borderRight: "none",
                padding: "5px 8px",
                verticalAlign: "top",
                background: "#fff",
                minHeight: row.tall ? 64 : 28,
                height: row.tall ? 64 : 28,
              }}
            >
              {row.label}
            </td>
            <td
              style={{
                border: BORDER,
                borderLeft: BORDER,
                padding: "5px 8px",
                verticalAlign: "top",
                background: "#fff",
                color: row.value === "—" ? "#bbb" : "#000",
                minHeight: row.tall ? 64 : 28,
                height: row.tall ? 64 : 28,
              }}
            >
              {row.value}
            </td>
            <td
              style={{ border: "none", background: "transparent", padding: 0 }}
            />
            <td
              style={{
                border: BORDER,
                borderRight: "none",
                background: "#fff",
                minHeight: row.tall ? 64 : 28,
                height: row.tall ? 64 : 28,
              }}
            />
            <td
              style={{
                border: BORDER,
                background: "#fff",
                minHeight: row.tall ? 64 : 28,
                height: row.tall ? 64 : 28,
              }}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );

  /* ─── Section header WITH inline verification box ────────────────────────── */
  const SectionHeaderWithVer = ({ text }) => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        marginTop: "5mm",
        marginBottom: 0,
      }}
    >
      <div style={{ width: "73%", flexShrink: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "10pt",
            textDecoration: "underline",
            fontFamily: FONT,
            marginBottom: "1mm",
          }}
        >
          {text}
        </div>
      </div>
      <div style={{ width: "3%", flexShrink: 0 }} />
      <div style={{ width: "24%", flexShrink: 0 }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "8.5pt",
            fontFamily: FONT,
            border: BORDER,
          }}
        >
          <tbody>
            <tr>
              <td
                colSpan={2}
                style={{
                  border: "none",
                  borderBottom: BORDER,
                  textAlign: "center",
                  padding: "3px 4px",
                  fontWeight: 700,
                  background: "#fff",
                }}
              >
                Verification Status
              </td>
            </tr>
            <tr>
              <td
                style={{
                  borderRight: BORDER,
                  textAlign: "center",
                  padding: "3px 4px",
                  fontSize: "8pt",
                  width: "50%",
                  background: "#fff",
                  whiteSpace: "nowrap",
                }}
              >
                Verified
                <br />
                Yes/No
              </td>
              <td
                style={{
                  textAlign: "center",
                  padding: "3px 4px",
                  fontSize: "8pt",
                  width: "50%",
                  background: "#fff",
                }}
              >
                Referred Documents name
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const Sec = ({ text }) => (
    <div
      style={{
        fontWeight: 700,
        fontSize: "10pt",
        textDecoration: "underline",
        fontFamily: FONT,
        margin: "5mm 0 1.5mm",
      }}
    >
      {text}
    </div>
  );

  const AddrSub = ({ text }) => (
    <div
      style={{
        fontWeight: 700,
        fontSize: "10pt",
        fontFamily: FONT,
        margin: "3mm 0 1mm",
      }}
    >
      {text}
    </div>
  );

  const Page = ({ children }) => (
    <div
      style={{
        width: "210mm",
        background: "#fff",
        padding: "12mm 14mm",
        boxSizing: "border-box",
        fontFamily: FONT,
        color: "#000",
        fontSize: "10pt",
        marginBottom: 14,
        borderRadius: 2,
        boxShadow: "0 2px 16px rgba(0,0,0,0.14)",
      }}
    >
      {children}
    </div>
  );

  const PageHeader = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "3mm",
      }}
    >
      <span style={{ fontSize: "8pt", color: "#555" }}>
        KYE Form Revision - 1
      </span>
      <img
        src={`${window.location.origin}/assets/Insta-logo1.png`}
        alt="Insta ICT Solutions"
        style={{ height: 44, width: "auto", objectFit: "contain" }}
        onError={(ev) => (ev.target.style.display = "none")}
      />
    </div>
  );

  const PageFooter = ({ n }) => (
    <div
      style={{
        textAlign: "right",
        fontSize: "8pt",
        color: "#555",
        marginTop: "6mm",
      }}
    >
      Page {n} of 4
    </div>
  );

  const docList = [
    { sr: 1, name: "Resume -Signed copy", types: ["resume"] },
    {
      sr: 2,
      name: "2 passport size photographs-Name should be written on backside",
      types: ["idPhoto", "photo", "id_photo"],
    },
    {
      sr: 3,
      name: "Medical Certificate-Latest",
      types: ["medicalCertificate", "medical_certificate"],
    },
    { sr: 4, name: "Aadhaar Card", types: ["aadharCard", "aadhar_card"] },
    { sr: 5, name: "Pan Card", types: ["panCard", "pan_card"] },
    {
      sr: 6,
      name: "Academic records (SSC,ITI,HSC, Diploma, Degree Certificates Copy)",
      types: ["academicRecords", "academic_records"],
    },
    { sr: 7, name: "Bank Details", types: ["bankPassbook", "bank_passbook"] },
    {
      sr: 8,
      name: "Pay slip or bank statement reflecting last drawn salary",
      types: ["payslip"],
    },
    {
      sr: 9,
      name: "Other certificates, if any",
      types: ["otherCertificates", "other_certificates"],
    },
  ];

  const hasDoc = (types) =>
    Array.isArray(e.documents) &&
    e.documents.some((d) => types.includes(d.type || d.document_type));

  const refRows = [
    ["Name", "ref1_name", "ref2_name", "ref3_name"],
    ["Designation", "ref1_designation", "ref2_designation", "ref3_designation"],
    [
      "Name of Organization",
      "ref1_organization",
      "ref2_organization",
      "ref3_organization",
    ],
    ["Address", "ref1_address", "ref2_address", "ref3_address"],
    [
      "City, State, Pin Code",
      "ref1_city_state_pin",
      "ref2_city_state_pin",
      "ref3_city_state_pin",
    ],
    [
      "Contact No. (Mobile/Landline)",
      "ref1_contact_no",
      "ref2_contact_no",
      "ref3_contact_no",
    ],
    [
      "Email ID (Preferably Official)",
      "ref1_email",
      "ref2_email",
      "ref3_email",
    ],
  ];

  /* ─── Uploaded document card — loads presigned URL async ─────────────────── */
  const UploadedDocCard = ({ doc, index }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [url, setUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    const rawPath = doc.path || doc.file_path;
    const label = getDocLabel(doc);
    const pdf = isPdf(rawPath);

    useEffect(() => {
      fetchPresignedUrl(rawPath).then((u) => {
        setUrl(u);
        setLoading(false);
      });
    }, [rawPath]);

    return (
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        <div
          onClick={() => setCollapsed((c) => !c)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#4472c4",
            padding: "8px 14px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {pdf ? (
              <FileText size={14} color="#fff" />
            ) : (
              <Image size={14} color="#fff" />
            )}
          </div>
          <span
            style={{
              fontSize: "10pt",
              fontWeight: 700,
              color: "#fff",
              flex: 1,
            }}
          >
            {index + 1}. {label}
          </span>
          <span
            style={{
              fontSize: "8pt",
              color: "rgba(255,255,255,0.65)",
              marginRight: 6,
            }}
          >
            {pdf ? "PDF" : "Image"}
          </span>
          {collapsed ? (
            <ChevronDown size={16} color="rgba(255,255,255,0.8)" />
          ) : (
            <ChevronUp size={16} color="rgba(255,255,255,0.8)" />
          )}
        </div>

        {!collapsed && (
          <div style={{ background: "#f8fafc", padding: 12 }}>
            {loading ? (
              <div
                style={{
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f1f5f9",
                  borderRadius: 4,
                }}
              >
                <span style={{ fontSize: "9pt", color: "#94a3b8" }}>
                  Loading…
                </span>
              </div>
            ) : !url ? (
              <div
                style={{
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f1f5f9",
                  borderRadius: 4,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <span style={{ fontSize: "9pt", color: "#94a3b8" }}>
                  URL could not be resolved
                </span>
              </div>
            ) : pdf ? (
              <iframe
                src={url}
                title={label}
                style={{
                  width: "100%",
                  height: 520,
                  border: "1px solid #cbd5e1",
                  borderRadius: 4,
                  display: "block",
                  background: "#fff",
                }}
              />
            ) : imgError ? (
              <div
                style={{
                  height: 120,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: "#f1f5f9",
                  borderRadius: 4,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <Image size={28} color="#94a3b8" />
                <span style={{ fontSize: "9pt", color: "#94a3b8" }}>
                  Image could not be loaded
                </span>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "9pt",
                    color: "#6366f1",
                    textDecoration: "underline",
                  }}
                >
                  Open file
                </a>
              </div>
            ) : (
              <img
                src={url}
                alt={label}
                onError={() => setImgError(true)}
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: 520,
                  width: "auto",
                  height: "auto",
                  margin: "0 auto",
                  borderRadius: 4,
                  border: "1px solid #e2e8f0",
                  objectFit: "contain",
                  background: "#fff",
                }}
              />
            )}
            {url && (
              <div style={{ marginTop: 8, textAlign: "right" }}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "9pt",
                    color: "#6366f1",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  ↗ Open in new tab
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const UploadedDocsSection = () => {
    if (!renderableDocs.length) return null;
    return (
      <div
        style={{
          marginTop: "8mm",
          paddingTop: "6mm",
          borderTop: "1.5px solid #000",
        }}
      >
        <Sec text={`10. Uploaded Documents (${renderableDocs.length}) –`} />
        {renderableDocs.map((doc, idx) => (
          <UploadedDocCard
            key={doc.path || doc.file_path || idx}
            doc={doc}
            index={idx}
          />
        ))}
      </div>
    );
  };

  /* ─── Salary card (screen-only) ──────────────────────────────────────────── */
  const SalaryCard = ({
    icon,
    iconBg,
    iconBorder,
    label,
    value,
    subtext,
    accentColor,
  }) => (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: accentColor,
          borderRadius: "10px 10px 0 0",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 2,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: "#0f172a",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>
        {subtext}
      </div>
    </div>
  );

  const SalarySection = () => (
    <div className="no-print" style={{ width: "210mm", marginBottom: 20 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          borderRadius: "12px 12px 0 0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "rgba(99,102,241,0.25)",
            border: "1px solid rgba(99,102,241,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wallet size={16} color="#a5b4fc" />
        </div>
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>
            Salary Details
          </div>
          <div style={{ color: "#94a3b8", fontSize: 11 }}>
            Compensation breakdown — not printed in KYE form
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 20,
            padding: "3px 12px",
            fontSize: 11,
            color: "#a5b4fc",
            fontWeight: 600,
          }}
        >
          🔒 Confidential
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderRadius: "0 0 12px 12px",
          border: "1px solid #e2e8f0",
          borderTop: "none",
          padding: "20px 24px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 16,
        }}
      >
        <SalaryCard
          icon={<DollarSign size={16} color="#6366f1" />}
          iconBg="rgba(99,102,241,0.1)"
          iconBorder="rgba(99,102,241,0.2)"
          label="Basic Salary"
          value={fmtCurrency(basic)}
          subtext={`${totalSalary > 0 ? Math.round((basic / totalSalary) * 100) : 0}% of CTC`}
          accentColor="#6366f1"
        />
        <SalaryCard
          icon={<Building size={16} color="#0891b2" />}
          iconBg="rgba(8,145,178,0.1)"
          iconBorder="rgba(8,145,178,0.2)"
          label="House Rent Allow."
          value={fmtCurrency(hra)}
          subtext={`${totalSalary > 0 ? Math.round((hra / totalSalary) * 100) : 0}% of CTC`}
          accentColor="#0891b2"
        />
        <SalaryCard
          icon={<CreditCard size={16} color="#059669" />}
          iconBg="rgba(5,150,105,0.1)"
          iconBorder="rgba(5,150,105,0.2)"
          label="Other Allowances"
          value={fmtCurrency(otherAllow)}
          subtext={`${totalSalary > 0 ? Math.round((otherAllow / totalSalary) * 100) : 0}% of CTC`}
          accentColor="#059669"
        />
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
            borderRadius: 10,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={14} color="#fff" />
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Total CTC
            </span>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            {fmtCurrency(totalSalary)}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            Per month gross salary
          </div>
          {totalSalary > 0 && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 2,
                borderRadius: 4,
                overflow: "hidden",
                height: 4,
              }}
            >
              <div
                style={{
                  width: `${(basic / totalSalary) * 100}%`,
                  background: "rgba(255,255,255,0.9)",
                }}
              />
              <div
                style={{
                  width: `${(hra / totalSalary) * 100}%`,
                  background: "rgba(255,255,255,0.55)",
                }}
              />
              <div
                style={{
                  width: `${(otherAllow / totalSalary) * 100}%`,
                  background: "rgba(255,255,255,0.3)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {totalSalary > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "8px 24px",
            background: "#f8fafc",
            borderRadius: "0 0 12px 12px",
            border: "1px solid #e2e8f0",
            borderTop: "1px dashed #e2e8f0",
            marginTop: -1,
          }}
        >
          {[
            { color: "#6366f1", label: "Basic", pct: basic },
            { color: "#0891b2", label: "HRA", pct: hra },
            { color: "#059669", label: "Other", pct: otherAllow },
          ].map(({ color, label, pct }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 5 }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                }}
              />
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {label}:{" "}
                <strong style={{ color: "#1e293b" }}>{fmtCurrency(pct)}</strong>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                     */
  /* ═══════════════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1100,
          background: "rgba(2,8,23,0.72)",
          backdropFilter: "blur(6px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflow: "hidden",
        }}
        onClick={(ev) => ev.target === ev.currentTarget && onClose()}
      >
        {/* ── Top bar ── */}
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 20px",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: photoUrl ? "transparent" : "#6366f1",
                border: "2px solid rgba(99,102,241,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                  }}
                />
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  {initials}
                </span>
              )}
            </div>
            <div>
              <span style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14 }}>
                {fullName}
              </span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: st.bg,
                  color: st.color,
                }}
              >
                {st.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 8,
              color: "#94a3b8",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable pages ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "auto",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "8px 16px 40px",
            background: "#cbd5e1",
          }}
        >
          {/* ══ PAGE 1 ══════════════════════════════════════════════════════════ */}
          <Page>
            <PageHeader />
            <div
              style={{
                border: "1.5px solid #000",
                textAlign: "center",
                padding: "10px 0",
                marginBottom: "4mm",
              }}
            >
              <div
                style={{ fontSize: "14pt", fontWeight: 700, fontFamily: FONT }}
              >
                General Information Form for
              </div>
              <div
                style={{ fontSize: "14pt", fontWeight: 700, fontFamily: FONT }}
              >
                KYE
              </div>
            </div>

            {/* Passport photo */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "4mm",
              }}
            >
              <div
                style={{
                  width: "32mm",
                  height: "40mm",
                  border: BORDER,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background: "#fafafa",
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Employee"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center top",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "7pt",
                      color: "#aaa",
                      textAlign: "center",
                      padding: 4,
                      lineHeight: 1.6,
                      fontFamily: FONT,
                    }}
                  >
                    Employee Passport Size
                    <br />
                    Photograph
                    <br />
                    (45cm X 35cm)
                  </span>
                )}
              </div>
            </div>

            <SectionHeaderWithVer text="1. Employee Personal Details -" />
            <SectionWithVerification
              rows={[
                { label: "Employee Name:", value: val(fullName) },
                {
                  label: "Date of birth (DD-MMM-YYYY)",
                  value: fmtDate(e.date_of_birth),
                },
                {
                  label: "Educational qualification",
                  value: val(e.educational_qualification),
                },
                {
                  label: "Name of Father/Husband",
                  value: val(e.father_husband_name),
                },
                {
                  label: "Marital Status (Married/Unmarried)",
                  value: val(e.marital_status),
                },
                { label: "Employee Blood Group", value: val(e.blood_group) },
                { label: "Email ID", value: val(e.email) },
                { label: "PAN Number", value: val(e.pan_number) },
                { label: "Name on PAN", value: val(e.name_on_pan) },
                { label: "Aadhaar No", value: val(e.aadhar_number) },
                { label: "Name on Aadhaar Card", value: val(e.name_on_aadhar) },
                {
                  label: "UAN Number",
                  value: val(e.uan_number || e.uanNumber),
                },
              ]}
            />

            <SectionHeaderWithVer text="2. Employee Family Details -" />
            <SectionWithVerification
              rows={[
                {
                  label: "Father/Mother/Spouse Name",
                  value: val(e.family_member_name),
                },
                {
                  label: "Father/Mother/Spouse contact number",
                  value: val(e.family_contact_no),
                },
                {
                  label: "Father/Mother/Spouse working status",
                  value: val(e.family_working_status),
                },
                {
                  label: "Father/Mother/Spouse Employer name",
                  value: val(e.family_employer_name),
                },
                {
                  label: "Father/Spouse/Mother Employer contact number",
                  value: val(e.family_employer_contact),
                },
              ]}
            />
            <PageFooter n="1" />
          </Page>

          {/* ══ PAGE 2 ══════════════════════════════════════════════════════════ */}
          <Page>
            <PageHeader />

            <SectionHeaderWithVer text="3. Employee Emergency Contact Details –" />
            <SectionWithVerification
              rows={[
                {
                  label: "Emergency Contact Person Name",
                  value: val(e.emergency_contact_name),
                },
                {
                  label: "Emergency Contact Person No",
                  value: val(e.emergency_contact_no),
                },
                {
                  label: "Emergency Contact Person Address",
                  value: val(e.emergency_contact_address),
                  tall: true,
                },
                {
                  label: "Emergency Contact Person Relation with Employee",
                  value: val(e.emergency_contact_relation),
                },
              ]}
            />

            <SectionHeaderWithVer text="4. Employee Bank account Details –" />
            <SectionWithVerification
              rows={[
                { label: "Name of Bank", value: val(e.bank_name) },
                { label: "Bank A/c No", value: val(e.account_number) },
                { label: "IFSC Code", value: val(e.ifsc_code) },
                {
                  label: "Name on bank passbook",
                  value: val(e.account_holder_name),
                },
                {
                  label: "Address of the Bank",
                  value: val(e.bank_branch || e.branch),
                },
              ]}
            />

            <SectionHeaderWithVer text="5. Employee Address Details -" />
            <AddrSub text="A) Permanent Address" />
            <SectionWithVerification
              rows={[
                {
                  label: "Permanent Address",
                  value: val(e.permanent_address),
                  tall: true,
                },
                { label: "Phone/Mobile No", value: val(e.permanent_phone) },
                {
                  label: "Permanent Address Land mark",
                  value: val(e.permanent_landmark),
                },
                {
                  label: "Permanent Address Lat-long",
                  value: val(e.permanent_lat_long),
                },
              ]}
            />

            <AddrSub text="B) Local Address" />
            <SectionWithVerification
              rows={[
                {
                  label: "Local Address",
                  value: e.local_same_as_permanent
                    ? "Same as Permanent Address"
                    : val(e.local_address),
                  tall: true,
                },
                {
                  label: "Phone/Mobile No",
                  value: e.local_same_as_permanent
                    ? val(e.permanent_phone)
                    : val(e.local_phone),
                },
                {
                  label: "Local Address Landmark",
                  value: e.local_same_as_permanent
                    ? val(e.permanent_landmark)
                    : val(e.local_landmark),
                },
                {
                  label: "Local Address Lat-long",
                  value: e.local_same_as_permanent
                    ? val(e.permanent_lat_long)
                    : val(e.local_lat_long),
                },
              ]}
            />
            <PageFooter n="2" />
          </Page>

          {/* ══ PAGE 3 ══════════════════════════════════════════════════════════ */}
          <Page>
            <PageHeader />

            <Sec text="6. Reference Details –" />
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9.5pt",
                fontFamily: FONT,
                marginBottom: "6mm",
                border: BORDER,
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={4}
                    style={{
                      border: BORDER,
                      textAlign: "center",
                      padding: "5px 6px",
                      fontWeight: 700,
                      background: "#fff",
                      color: "#000",
                    }}
                  >
                    Personal References
                  </th>
                </tr>
                <tr>
                  <th
                    style={{
                      border: BORDER,
                      padding: "5px 6px",
                      width: "28%",
                      background: "#fff",
                      color: "#000",
                    }}
                  />
                  {[
                    ["Reference 1", "(Relevant Industry)"],
                    ["Reference 2", "(Local Area)"],
                    ["Reference 3", "(Other than relative)"],
                  ].map(([title, sub]) => (
                    <th
                      key={title}
                      style={{
                        border: BORDER,
                        padding: "5px 6px",
                        textAlign: "center",
                        fontWeight: 700,
                        background: "#fff",
                        color: "#000",
                      }}
                    >
                      {title}
                      <br />
                      <span style={{ fontWeight: 400, fontSize: "8pt" }}>
                        {sub}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {refRows.map(([label, k1, k2, k3]) => (
                  <tr key={label}>
                    {[label, e[k1], e[k2], e[k3]].map((v, ci) => (
                      <td
                        key={ci}
                        style={{
                          border: BORDER,
                          padding: "4px 6px",
                          background: "#fff",
                        }}
                      >
                        {ci === 0 ? v : val(v)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td
                    style={{
                      border: BORDER,
                      padding: "4px 6px",
                      fontSize: "9pt",
                      background: "#fff",
                    }}
                  >
                    Verification Comment
                    <br />
                    <span style={{ fontSize: "7.5pt", color: "#555" }}>
                      (To be recorded by HR Manager)
                    </span>
                  </td>
                  <td
                    style={{
                      border: BORDER,
                      padding: "4px 6px",
                      height: 44,
                      background: "#fff",
                    }}
                  />
                  <td
                    style={{
                      border: BORDER,
                      padding: "4px 6px",
                      background: "#fff",
                    }}
                  />
                  <td
                    style={{
                      border: BORDER,
                      padding: "4px 6px",
                      background: "#fff",
                    }}
                  />
                </tr>
              </tbody>
            </table>

            <Sec text="7. DECLARATION –" />
            <div
              style={{
                fontSize: "9.5pt",
                lineHeight: 1.7,
                marginBottom: "5mm",
                textAlign: "justify",
                fontFamily: FONT,
              }}
            >
              <p style={{ margin: "0 0 8px" }}>
                I
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "110mm",
                    borderBottom: "1px solid #000",
                  }}
                >
                  &nbsp;{fullName}&nbsp;
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
              <div
                style={{ fontWeight: 700, fontSize: "9.5pt", marginBottom: 4 }}
              >
                घोषणा –
              </div>
              <div style={{ fontSize: "9pt", lineHeight: 1.8 }}>
                मैं
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "108mm",
                    borderBottom: "1px dotted #000",
                  }}
                >
                  &nbsp;
                </span>
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginTop: "10mm",
                fontFamily: FONT,
                fontSize: "10pt",
                fontWeight: 700,
              }}
            >
              <div>
                <div style={{ marginBottom: "8mm" }}>
                  Date &nbsp;:&nbsp;
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 55,
                      borderBottom: BORDER,
                    }}
                  >
                    &nbsp;
                  </span>
                </div>
                <div>
                  Place &nbsp;:&nbsp;
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 55,
                      borderBottom: BORDER,
                    }}
                  >
                    &nbsp;
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div>Employee Signature</div>
                <div
                  style={{
                    borderTop: BORDER,
                    width: 200,
                    marginTop: 56,
                    paddingTop: 2,
                    fontSize: "9.5pt",
                    textAlign: "center",
                  }}
                >
                  &nbsp;(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "9.5pt",
                fontWeight: 700,
                marginTop: "8mm",
                fontFamily: FONT,
              }}
            >
              Note: Digitally filled out the KYE form is not acceptable. KYE
              form should be handwritten by the respective employee.
            </div>
            <PageFooter n="3" />
          </Page>

          {/* ══ PAGE 4 ══════════════════════════════════════════════════════════ */}
          <Page>
            <PageHeader />

            <Sec text="8. Please attach the below-listed documents with the KYE form. –" />
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9.5pt",
                fontFamily: FONT,
                marginBottom: "6mm",
                border: BORDER,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: BORDER,
                      textAlign: "center",
                      padding: "5px 8px",
                      fontWeight: 700,
                      background: "#fff",
                      color: "#000",
                      width: "12mm",
                    }}
                  >
                    Sr.
                    <br />
                    No.
                  </th>
                  <th
                    style={{
                      border: BORDER,
                      textAlign: "center",
                      padding: "5px 8px",
                      fontWeight: 700,
                      background: "#fff",
                      color: "#000",
                    }}
                  >
                    Name of Document
                  </th>
                  <th
                    style={{
                      border: BORDER,
                      textAlign: "center",
                      padding: "5px 8px",
                      fontWeight: 700,
                      background: "#fff",
                      color: "#000",
                      width: "34mm",
                    }}
                  >
                    Attached (Yes/No)
                  </th>
                </tr>
              </thead>
              <tbody>
                {docList.map(({ sr, name, types }) => {
                  const attached = hasDoc(types);
                  return (
                    <tr key={sr}>
                      <td
                        style={{
                          border: BORDER,
                          textAlign: "center",
                          padding: "5px 8px",
                          background: "#fff",
                        }}
                      >
                        {sr}
                      </td>
                      <td
                        style={{
                          border: BORDER,
                          padding: "5px 8px",
                          background: "#fff",
                        }}
                      >
                        {name}
                      </td>
                      <td
                        style={{
                          border: BORDER,
                          textAlign: "center",
                          padding: "5px 8px",
                          background: "#fff",
                          color: attached ? "#15803d" : "#000",
                          fontWeight: attached ? 700 : 400,
                        }}
                      >
                        {attached ? "Yes ✓" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Sec text="9. For office Use only." />
            <table
              style={{
                borderCollapse: "collapse",
                fontSize: "9.5pt",
                fontFamily: FONT,
                width: "auto",
              }}
            >
              <tbody>
                {[
                  ["DOJ", null],
                  ["Experience", null],
                  ["UAN", e.uan_number || e.uanNumber || null],
                  ["Member ID", null],
                  ["Remarks", null],
                ].map(([label, value], i) => (
                  <tr key={label}>
                    <td
                      style={{
                        border: BORDER,
                        textAlign: "center",
                        fontWeight: 700,
                        padding: "4px 8px",
                        width: "10mm",
                        background: "#fff",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td
                      style={{
                        border: BORDER,
                        padding: "4px 8px",
                        width: "40mm",
                        background: "#fff",
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        border: BORDER,
                        padding: "4px 8px",
                        width: "80mm",
                        height: label === "Remarks" ? 24 : "auto",
                        background: "#fff",
                        fontWeight: value ? 600 : 400,
                      }}
                    >
                      {value || "\u00a0"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <UploadedDocsSection />
            <PageFooter n="4" />
          </Page>

          {/* ── Salary Details (screen-only) ── */}
          <SalaryDetails employee={e} />

          {/* ── Print button ── */}
          <div
            className="no-print"
            style={{
              width: "210mm",
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 4,
              marginBottom: 8,
            }}
          >
            <button
              onClick={() => printKYEForm(e)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                padding: "12px 28px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(99,102,241,0.45)",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={(ev) => {
                ev.currentTarget.style.transform = "translateY(-2px)";
                ev.currentTarget.style.boxShadow =
                  "0 8px 24px rgba(99,102,241,0.6)";
              }}
              onMouseLeave={(ev) => {
                ev.currentTarget.style.transform = "translateY(0)";
                ev.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(99,102,241,0.45)";
              }}
            >
              <Printer size={16} />
              Print KYE Form
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewEmployee;
