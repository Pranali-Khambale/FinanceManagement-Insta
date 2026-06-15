import React from "react";
import PhotoBox from "./PhotoBox";
import { formatDate } from "../utils/dateUtils";
import { LOGO_SRC, SIGNATURE_SRC, CW, CH } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// CardFront
// ─────────────────────────────────────────────────────────────────────────────
const CardFront = ({
  employee,
  photoProxyUrl,
  manualPhoto,
  onUpload,
  uploading,
  onEditClick,
  onPhotoMissing,
  validityDate,
}) => {
  const firstName = employee.first_name || employee.firstName || "";
  const fatherName =
    employee.father_husband_name || employee.fatherHusbandName || "";
  const middleName = employee.middle_name || employee.middleName || "";
  const lastName = employee.last_name || employee.lastName || "";
  const fullName = [firstName, fatherName || middleName, lastName]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
  const empId = employee.employee_id || employee.id || "—";
  // Backend aliases position AS designation; handle both
  const designation = employee.designation || employee.position || "—";
  const validTill = formatDate(validityDate);

  return (
    <div
      style={{
        width: CW,
        height: CH,
        background: "#fff",
        borderRadius: 0,
        border: "1px solid #ddd",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Calibri','Segoe UI',Arial",
        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
      }}
    >
      <svg
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }}
        width="230"
        height="170"
      >
        <path d="M0 0 L230 0 A190 190 0 0 0 0 170 Z" fill="#F5C100" />
      </svg>
      <svg
        style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }}
        width="230"
        height="170"
      >
        <path d="M230 170 L0 170 A190 190 0 0 0 230 0 Z" fill="#1565C0" />
      </svg>

      <div
        style={{
          position: "absolute",
          top: 30,
          right: 45,
          display: "flex",
          justifyContent: "flex-end",
          zIndex: 2,
        }}
      >
        <img
          src={LOGO_SRC}
          style={{ height: 100, objectFit: "contain", maxWidth: "99%" }}
          alt="Insta ICT Solutions"
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 148,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
        }}
      >
        <PhotoBox
          photoProxyUrl={photoProxyUrl}
          manualPhoto={manualPhoto}
          firstName={firstName}
          onUpload={onUpload}
          uploading={uploading}
          onEditClick={onEditClick}
          onPhotoMissing={onPhotoMissing}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 275,
          left: "50%",
          transform: "translateX(-50%)",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 0.2,
          lineHeight: 1.2,
          color: "#111",
          zIndex: 2,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {fullName || "EMPLOYEE NAME"}
      </div>

      <div
        style={{
          position: "absolute",
          top: 292,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 13,
          color: "#111",
          zIndex: 2,
          fontFamily: "'Calibri','Segoe UI',Arial",
          lineHeight: 1.35,
          whiteSpace: "nowrap",
        }}
      >
        {[
          ["Employee ID", empId],
          ["Designation", designation],
          ["Valid Till", validTill],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", gap: 0 }}>
            <span style={{ width: 78 }}>{label}</span>
            <span style={{ width: 14, textAlign: "center" }}>:</span>
            <span>{value}</span>
          </div>
        ))}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <img
            src={SIGNATURE_SRC}
            alt="Signature"
            style={{
              width: 130,
              height: 50,
              objectFit: "contain",
              display: "block",
              marginBottom: -12,
            }}
          />
          <div
            style={{
              fontSize: 13,
              color: "#111",
              fontFamily: "'Calibri','Segoe UI',Arial",
              lineHeight: 1.2,
              fontWeight: 500,
            }}
          >
            Authorised Sign
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardFront;