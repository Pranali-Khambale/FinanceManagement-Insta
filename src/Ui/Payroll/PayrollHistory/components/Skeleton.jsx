import React from "react";

const Skeleton = () => (
  <div
    style={{
      padding: "16px 24px",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "#f1f5f9",
        flexShrink: 0,
      }}
    />
    <div style={{ flex: 1 }}>
      <div
        style={{
          height: 12,
          width: "40%",
          maxWidth: 150,
          background: "#f1f5f9",
          borderRadius: 6,
          marginBottom: 8,
        }}
      />
      <div
        style={{
          height: 11,
          width: "60%",
          maxWidth: 220,
          background: "#f1f5f9",
          borderRadius: 6,
        }}
      />
    </div>
  </div>
);

export default Skeleton;
