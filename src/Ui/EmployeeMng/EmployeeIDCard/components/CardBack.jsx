import React from "react";
import { LOGO_SRC, CW, CH } from "../constants";

// ─────────────────────────────────────────────────────────────────────────────
// CardBack
// ─────────────────────────────────────────────────────────────────────────────
const CardBack = ({ emergencyContact }) => (
  <div
    style={{
      width: CW,
      height: CH,
      background: "#ffffff",
      borderRadius: 0,
      border: "1px solid #ddd",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Calibri','Segoe UI',Arial,sans-serif",
      boxShadow: "0 10px 40px rgba(0,0,0,0.22)",
    }}
  >
   <svg style={{ position: "absolute", top: 0, left: 0, zIndex: 1 }} width="230" height="134" viewBox="0 0 230 134">
  <path d="M0 0 L230 0 A152 152 0 0 0 0 134 Z" fill="#F5C100" />
</svg>
<svg style={{ position: "absolute", bottom: 0, right: 0, zIndex: 1 }} width="230" height="134" viewBox="0 0 230 134">
  <path d="M230 134 L0 134 A152 152 0 0 0 230 0 Z" fill="#1565C0" />
</svg>
    {/* Logo — now matches CardFront exactly (same size + position) */}
<div
  style={{
    position: "absolute",
    top: 14,
    right: 50,
    display: "flex",
    justifyContent: "flex-end",
    zIndex: 2,
  }}
>
  <img
    src={LOGO_SRC}
    style={{ width: 110, height: "auto", objectFit: "contain", maxWidth: "99%" }}
    alt="Insta ICT Solutions"
  />
</div>
<div
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    zIndex: 2,
    padding: "0 18px",
    paddingTop: 44, // reduced from 60 — content now sits centered like the reference image, just clear of the logo
  }}
>
      <div
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "#111",
          marginBottom: 2,
        }}
      >
        Insta ICT Solutions Pvt. Ltd.
      </div>
      <div style={{ fontSize: 13, color: "#333", lineHeight: 1.3 }}>
        201 &amp; 202, Imperial Plaza,
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#333",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        Jijai Nagar, Kothrud, Pune 411 038
      </div>
      <div
        style={{
          fontSize: 13,
          color: "#1565C0",
          textDecoration: "underline",
          marginBottom: 2,
          lineHeight: 1.1,
        }}
      >
        www.instagrp.com
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          fontSize: 12,
          color: "#111",
          fontWeight: 600,
          marginBottom: 6,
          lineHeight: 1.1,
          flexWrap: "wrap",
          textAlign: "center",
        }}
      >
        <span>Emergency Contact No :</span>
        <span style={{ color: "#333", fontWeight: 500 }}>
          {emergencyContact}
        </span>
      </div>
      <div
        style={{
          fontSize: 10.5,
          color: "#333",
          lineHeight: 1.25,
          textAlign: "center",
          maxWidth: 210,
          fontWeight: 500,
        }}
      >
        Property of Insta ICT Solutions.
        <br />
        If found, please return to the Admin Team.
      </div>
    </div>
  </div>
);

export default CardBack;