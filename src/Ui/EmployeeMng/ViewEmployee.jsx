import React, { useState } from "react";
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
  resume: "Resume – Signed Copy",
  idPhoto: "Passport Size Photograph",
  photo: "Passport Size Photograph",
  medicalCertificate: "Medical Certificate",
  aadharCard: "Aadhaar Card",
  panCard: "PAN Card",
  academicRecords: "Academic Records",
  bankPassbook: "Bank Details / Passbook",
  payslip: "Pay Slip / Bank Statement",
  otherCertificates: "Other Certificates",
};

const getDocLabel = (doc) =>
  DOC_LABELS[doc.type || doc.document_type] ||
  doc.name ||
  doc.file_name ||
  doc.type ||
  doc.document_type ||
  "Document";

const isPdf = (rawPath) => rawPath?.toLowerCase().endsWith(".pdf");

// ── Full name helper: First + Father/Husband + Last ───────────────────────────
const buildFullName = (firstName = "", fatherHusbandName = "", lastName = "") =>
  [firstName, fatherHusbandName, lastName]
    .map((s) => String(s || "").trim())
    .filter(Boolean)
    .join(" ");

const ViewEmployee = ({ employee, onClose }) => {
  if (!employee) return null;

  const e = employee;

  const firstName        = e.first_name        || e.firstName        || "";
  const lastName         = e.last_name         || e.lastName         || "";
  const fatherHusbandName = e.father_husband_name || e.fatherHusbandName || "";

  // Full name: First + Father/Husband + Last
  const fullName = buildFullName(firstName, fatherHusbandName, lastName);

  const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const val = (v) => (v && String(v).trim() !== "" ? v : "—");

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

  /* ─── employee photo ─────────────────────────────────────────────────── */
  const BASE_URL =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_API_URL?.replace("/api", "")) ||
    "http://localhost:5000";

  const resolveUrl = (rawPath) => {
    if (!rawPath) return null;
    return rawPath.startsWith("http") ? rawPath : `${BASE_URL}${rawPath}`;
  };

  const photoDoc = Array.isArray(e.documents)
    ? e.documents.find((d) =>
        ["idPhoto", "photo"].includes(d.type || d.document_type),
      )
    : null;
  const photoPath = photoDoc?.path || photoDoc?.file_path || null;
  const photoUrl = resolveUrl(photoPath);
  const initials =
    `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase() || "NA";

  /* ─── Salary numbers ─────────────────────────────────────────────────── */
  const basic = parseFloat(e.basic_salary) || 0;
  const hra = parseFloat(e.hra) || 0;
  const otherAllow = parseFloat(e.other_allowances) || 0;
  const totalSalary = basic + hra + otherAllow;

  /* ─── Uploaded documents (deduped) ──────────────────────────────────── */
  const allDocs = Array.isArray(e.documents) ? e.documents : [];
  const seenPaths = new Set();
  const renderableDocs = allDocs.filter((doc) => {
    const rawPath = doc.path || doc.file_path || null;
    if (!rawPath) return false;
    if (seenPaths.has(rawPath)) return false;
    seenPaths.add(rawPath);
    return true;
  });

  /* ─── KYE table helpers ───────────────────────────────────────────────── */
  const tdLabel = {
    width: "42%",
    fontWeight: 400,
    verticalAlign: "top",
    padding: "5px 8px",
    fontSize: "9.5pt",
    border: "1px solid #000",
    background: "#fff",
  };
  const tdValue = {
    verticalAlign: "top",
    padding: "5px 8px",
    fontSize: "9.5pt",
    border: "1px solid #000",
  };
  const tdCheck = {
    width: "16%",
    textAlign: "center",
    border: "1px solid #000",
    padding: "4px 2px",
  };

  const Row = ({ label, value, tall = false }) => (
    <tr>
      <td style={{ ...tdLabel, height: tall ? 56 : "auto" }}>{label}</td>
      <td style={{ ...tdValue, color: value === "—" ? "#bbb" : "#000" }}>
        {value}
      </td>
      <td style={tdCheck}></td>
      <td style={{ ...tdCheck, borderRight: "1px solid #000" }}></td>
    </tr>
  );

  const VerHeader = () => (
    <div
      style={{ display: "flex", justifyContent: "flex-end", marginBottom: 0 }}
    >
      <table
        style={{ borderCollapse: "collapse", width: "34%", fontSize: "8.5pt" }}
      >
        <tbody>
          <tr>
            <td
              colSpan={2}
              style={{
                border: "1px solid #000",
                textAlign: "center",
                padding: "3px 4px",
                fontWeight: 700,
              }}
            >
              Verification Status
            </td>
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #000",
                textAlign: "center",
                padding: "3px 4px",
                fontSize: "8pt",
                width: "50%",
              }}
            >
              Verified
              <br />
              Yes/No
            </td>
            <td
              style={{
                border: "1px solid #000",
                textAlign: "center",
                padding: "3px 4px",
                fontSize: "8pt",
                width: "50%",
              }}
            >
              Referred Documents name
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const DataTable = ({ children }) => (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: 0,
        marginBottom: "5mm",
        border: "1px solid #000",
      }}
    >
      <tbody>{children}</tbody>
    </table>
  );

  const Sec = ({ text }) => (
    <div
      style={{
        fontWeight: 700,
        fontSize: "10.5pt",
        textDecoration: "underline",
        margin: "5mm 0 1.5mm",
        color: "#000",
      }}
    >
      {text}
    </div>
  );

  const AddrSub = ({ text }) => (
    <div style={{ fontWeight: 700, fontSize: "10pt", margin: "3mm 0 1mm" }}>
      {text}
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
      <span style={{ fontSize: "8pt", color: "#888" }}>
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
        color: "#888",
        marginTop: "6mm",
      }}
    >
      Page {n} of 4
    </div>
  );

  const Page = ({ children }) => (
    <div
      style={{
        width: "210mm",
        background: "#fff",
        padding: "12mm 14mm",
        boxSizing: "border-box",
        fontFamily: "'Calibri','Segoe UI',Arial,sans-serif",
        color: "#000",
        fontSize: "10pt",
        marginBottom: 14,
        borderRadius: 4,
        boxShadow: "0 2px 16px rgba(0,0,0,0.14)",
      }}
    >
      {children}
    </div>
  );

  const docList = [
    { sr: 1, name: "Resume - Signed copy", types: ["resume"] },
    {
      sr: 2,
      name: "2 passport size photographs - Name should be written on backside",
      types: ["idPhoto", "photo"],
    },
    {
      sr: 3,
      name: "Medical Certificate - Latest",
      types: ["medicalCertificate"],
    },
    { sr: 4, name: "Aadhaar Card", types: ["aadharCard"] },
    { sr: 5, name: "Pan Card", types: ["panCard"] },
    {
      sr: 6,
      name: "Academic records (SSC, ITI, HSC, Diploma, Degree Certificates Copy)",
      types: ["academicRecords"],
    },
    { sr: 7, name: "Bank Details", types: ["bankPassbook"] },
    {
      sr: 8,
      name: "Pay slip or bank statement reflecting last drawn salary",
      types: ["payslip"],
    },
    { sr: 9, name: "Other certificates, if any", types: ["otherCertificates"] },
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

  /* ─── Uploaded Documents Section ────────────────────────────────────── */
  const UploadedDocCard = ({ doc, index }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [imgError, setImgError] = useState(false);

    const rawPath = doc.path || doc.file_path;
    const url = resolveUrl(rawPath);
    const label = getDocLabel(doc);
    const pdf = isPdf(rawPath);

    return (
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        {/* Card header */}
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

        {/* Card body */}
        {!collapsed && (
          <div style={{ background: "#f8fafc", padding: 12 }}>
            {pdf ? (
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

            {/* Open-in-new-tab link */}
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

  /* ─── Salary card component (screen-only) ─────────────────────────────── */
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
          <div
            style={{
              color: "#f1f5f9",
              fontWeight: 700,
              fontSize: 15,
              fontFamily: "inherit",
            }}
          >
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
          label="House Rent Allowance"
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

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

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
        {/* ── Slim top bar ─────────────────────────────────────────── */}
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
              {/* ✅ FIX: Full name = First + Father/Husband + Last */}
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

        {/* ── Scrollable pages ─────────────────────────────────────── */}
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
          {/* ══ PAGE 1 ══ */}
          <Page>
            <PageHeader />
            <div
              style={{
                border: "1.5px solid #000",
                textAlign: "center",
                padding: "8px 0",
                marginBottom: "6mm",
              }}
            >
              <div style={{ fontSize: "14pt", fontWeight: 700 }}>
                General Information Form for
              </div>
              <div style={{ fontSize: "14pt", fontWeight: 700 }}>KYE</div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "3mm",
                marginTop: "-5mm",
              }}
            >
              <div
                style={{
                  width: "32mm",
                  height: "40mm",
                  border: "1px solid #999",
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

            <Sec text="1. Employee Personal Details -" />
            <VerHeader />
            <DataTable>
              {/* ✅ FIX: Employee Name = First + Father/Husband + Last */}
              <Row
                label="Employee Name:"
                value={val(fullName)}
              />
              <Row
                label="Date of birth (DD-MMM-YYYY)"
                value={fmtDate(e.date_of_birth)}
              />
              <Row
                label="Educational qualification"
                value={val(e.educational_qualification)}
              />
              <Row
                label="Name of Father/Husband"
                value={val(e.father_husband_name)}
              />
              <Row
                label="Marital Status (Married/Unmarried)"
                value={val(e.marital_status)}
              />
              <Row label="Employee Blood Group" value={val(e.blood_group)} />
              <Row label="Email ID" value={val(e.email)} />
              <Row label="PAN Number" value={val(e.pan_number)} />
              <Row label="Name on PAN" value={val(e.name_on_pan)} />
              <Row label="Aadhaar No" value={val(e.aadhar_number)} />
              <Row label="Name on Aadhaar Card" value={val(e.name_on_aadhar)} />
            </DataTable>

            <Sec text="2. Employee Family Details -" />
            <VerHeader />
            <DataTable>
              <Row
                label="Father/Mother /Spouse Name"
                value={val(e.family_member_name)}
              />
              <Row
                label="Father/Mother / Spouse contact number"
                value={val(e.family_contact_no)}
              />
              <Row
                label="Father/Mother / Spouse working status"
                value={val(e.family_working_status)}
              />
              <Row
                label="Father/Mother / Spouse Employer name"
                value={val(e.family_employer_name)}
              />
              <Row
                label="Father/Spouse / Mother Employer contact number"
                value={val(e.family_employer_contact)}
              />
            </DataTable>
            <PageFooter n="1" />
          </Page>

          {/* ══ PAGE 2 ══ */}
          <Page>
            <PageHeader />
            <Sec text="3. Employee Emergency Contact Details –" />
            <VerHeader />
            <DataTable>
              <Row
                label="Emergency Contact Person Name"
                value={val(e.emergency_contact_name)}
              />
              <Row
                label="Emergency Contact Person No"
                value={val(e.emergency_contact_no)}
              />
              <Row
                label="Emergency Contact Person Address"
                value={val(e.emergency_contact_address)}
                tall
              />
              <Row
                label="Emergency Contact Person Relation with Employee"
                value={val(e.emergency_contact_relation)}
              />
            </DataTable>

            <Sec text="4. Employee Bank account Details –" />
            <VerHeader />
            <DataTable>
              <Row label="Name of Bank" value={val(e.bank_name)} />
              <Row label="Bank A/c No" value={val(e.account_number)} />
              <Row label="IFSC Code" value={val(e.ifsc_code)} />
              <Row
                label="Name on bank passbook"
                value={val(e.account_holder_name)}
              />
              <Row
                label="Address of the Bank"
                value={val(e.bank_branch || e.branch)}
              />
            </DataTable>

            <Sec text="5. Employee Address Details -" />
            <VerHeader />
            <AddrSub text="A) Permanent Address" />
            <DataTable>
              <Row
                label="Permanent Address"
                value={val(e.permanent_address)}
                tall
              />
              <Row label="Phone/Mobile No" value={val(e.permanent_phone)} />
              <Row
                label="Permanent Address Land mark"
                value={val(e.permanent_landmark)}
              />
              <Row
                label="Permanent Address Lat-long"
                value={val(e.permanent_lat_long)}
              />
            </DataTable>

            <AddrSub text="B) Local Address" />
            <DataTable>
              <Row
                label="Local Address"
                value={
                  e.local_same_as_permanent
                    ? "Same as Permanent Address"
                    : val(e.local_address)
                }
                tall
              />
              <Row
                label="Phone/Mobile No"
                value={
                  e.local_same_as_permanent
                    ? val(e.permanent_phone)
                    : val(e.local_phone)
                }
              />
              <Row
                label="Local Address Landmark"
                value={
                  e.local_same_as_permanent
                    ? val(e.permanent_landmark)
                    : val(e.local_landmark)
                }
              />
              <Row
                label="Local Address Lat-long"
                value={
                  e.local_same_as_permanent
                    ? val(e.permanent_lat_long)
                    : val(e.local_lat_long)
                }
              />
            </DataTable>
            <PageFooter n="2" />
          </Page>

          {/* ══ PAGE 3 ══ */}
          <Page>
            <PageHeader />
            <Sec text="6. Reference Details –" />
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9.5pt",
                marginBottom: "6mm",
                border: "1px solid #000",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "5px 6px",
                      border: "1px solid #000",
                      textAlign: "left",
                      width: "28%",
                    }}
                  >
                    Personal References
                  </th>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "5px 6px",
                      border: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Reference 1<br />
                    <span style={{ fontWeight: 400, fontSize: "8pt" }}>
                      (Relevant Industry)
                    </span>
                  </th>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "5px 6px",
                      border: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Reference 2<br />
                    <span style={{ fontWeight: 400, fontSize: "8pt" }}>
                      (Local Area)
                    </span>
                  </th>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "5px 6px",
                      border: "1px solid #000",
                      textAlign: "center",
                    }}
                  >
                    Reference 3<br />
                    <span style={{ fontWeight: 400, fontSize: "8pt" }}>
                      (Other than relative)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {refRows.map(([label, k1, k2, k3]) => (
                  <tr key={label}>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px 6px",
                        background: "#fff",
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px 6px",
                        color: e[k1] ? "#000" : "#bbb",
                      }}
                    >
                      {val(e[k1])}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px 6px",
                        color: e[k2] ? "#000" : "#bbb",
                      }}
                    >
                      {val(e[k2])}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "4px 6px",
                        color: e[k3] ? "#000" : "#bbb",
                      }}
                    >
                      {val(e[k3])}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "4px 6px",
                      fontSize: "9pt",
                    }}
                  >
                    Verification Comment
                    <br />
                    <span style={{ fontSize: "7.5pt", color: "#666" }}>
                      (To be recorded by HR Manager)
                    </span>
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "4px 6px",
                      height: 44,
                    }}
                  ></td>
                  <td
                    style={{ border: "1px solid #000", padding: "4px 6px" }}
                  ></td>
                  <td
                    style={{ border: "1px solid #000", padding: "4px 6px" }}
                  ></td>
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
              }}
            >
              <p>
                I
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "110mm",
                    borderBottom: "1px solid #000",
                  }}
                >
                  {/* ✅ FIX: Declaration uses First + Father/Husband + Last */}
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
              <div style={{ fontSize: "9pt", marginTop: 10, lineHeight: 1.8 }}>
                <strong>घोषणा –</strong>
                <br />
                मैं
                <span
                  style={{
                    display: "inline-block",
                    minWidth: "108mm",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  &nbsp;
                </span>
                , एतद्द्वारा घोषणा करता हूं कि ऊपर दी गई जानकारी मेरे सर्वोत्तम
                ज्ञान और विश्वास के अनुसार सत्य, पूर्ण और सही है। मैं समझता हूं
                कि किसी भी स्तर पर मेरी जानकारी के गलत पाए जाने की स्थिति में,
                मेरी उम्मीदवारी/ बिना किसी सूचना के रद्द/समाप्त की जा सकती है।
                ली गई जानकारी विशुद्ध रूप से रोजगार सत्यापन प्रक्रिया के लिए है
                और मैंने इंस्टा आईसीटी प्राइवेट लिमिटेड को अपनी सहमति दी है।
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginTop: "10mm",
                fontSize: "10pt",
                fontWeight: 700,
              }}
            >
              <div>
                <div style={{ marginBottom: "8mm" }}>
                  Date &nbsp;:&nbsp;{" "}
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 55,
                      borderBottom: "1px solid #000",
                    }}
                  >
                    &nbsp;
                  </span>
                </div>
                <div>
                  Place &nbsp;:&nbsp;{" "}
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 55,
                      borderBottom: "1px solid #000",
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
                    borderTop: "1px solid #000",
                    width: 180,
                    marginTop: 56,
                    paddingTop: 2,
                    fontSize: "9.5pt",
                  }}
                >
                  &nbsp;(
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  )
                </div>
              </div>
            </div>
            <div
              style={{ fontSize: "9.5pt", fontWeight: 700, marginTop: "8mm" }}
            >
              <strong>
                Note: Digitally filled out the KYE form is not acceptable. KYE
                form should be handwritten by the respective employee.
              </strong>
            </div>
            <PageFooter n="3" />
          </Page>

          {/* ══ PAGE 4 ══ */}
          <Page>
            <PageHeader />
            <Sec text="8. Please attach the below-listed documents with the KYE form. –" />
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "9.5pt",
                marginBottom: "6mm",
                border: "1px solid #000",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      textAlign: "center",
                      padding: "5px 8px",
                      fontWeight: 700,
                      border: "1px solid #000",
                      width: "12mm",
                    }}
                  >
                    Sr.
                    <br />
                    No.
                  </th>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      textAlign: "left",
                      padding: "5px 8px",
                      fontWeight: 700,
                      border: "1px solid #000",
                    }}
                  >
                    Name of Document
                  </th>
                  <th
                    style={{
                      background: "#4472c4",
                      color: "#fff",
                      textAlign: "center",
                      padding: "5px 8px",
                      fontWeight: 700,
                      border: "1px solid #000",
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
                          border: "1px solid #000",
                          textAlign: "center",
                          padding: "5px 8px",
                        }}
                      >
                        {sr}
                      </td>
                      <td
                        style={{ border: "1px solid #000", padding: "5px 8px" }}
                      >
                        {name}
                      </td>
                      <td
                        style={{
                          border: "1px solid #000",
                          textAlign: "center",
                          padding: "5px 8px",
                          color: attached ? "#15803d" : "#aaa",
                          fontWeight: attached ? 700 : 400,
                        }}
                      >
                        {attached ? "Yes ✓" : "No"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Sec text="9. For office Use only." />
            <table
              style={{
                width: "80mm",
                borderCollapse: "collapse",
                fontSize: "9.5pt",
              }}
            >
              <tbody>
                {[
                  ["DOJ"],
                  ["Experience"],
                  ["UAN"],
                  ["Member ID"],
                  ["Remarks"],
                ].map(([label], i) => (
                  <tr key={label}>
                    <td
                      style={{
                        border: "1px solid #000",
                        textAlign: "center",
                        fontWeight: 700,
                        width: "8mm",
                        padding: "4px 8px",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        width: "40mm",
                        padding: "4px 8px",
                      }}
                    >
                      {label}
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        minWidth: "30mm",
                        height: label === "Remarks" ? 24 : "auto",
                        padding: "4px 8px",
                      }}
                    ></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ── Uploaded Documents ── */}
            <UploadedDocsSection />

            <PageFooter n="4" />
          </Page>

          <SalaryDetails employee={e} />

          {/* ── Print button ─────────────────────────────── */}
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
        {/* end scrollable */}
      </div>
    </>
  );
};

export default ViewEmployee;