import React from "react";

const Avatar = ({ firstName, lastName, size = "md" }) => {
  const initials = `${(firstName?.[0] || "N").toUpperCase()}${(lastName?.[0] || "A").toUpperCase()}`;
  const sizes = {
    sm: "w-9 h-9 text-sm",
    md: "w-10 h-10 sm:w-12 sm:h-12 text-base",
    lg: "w-12 h-12 sm:w-16 sm:h-16 text-xl",
  };
  return (
    <div
      className={`${sizes[size]} rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{
        background:
          "linear-gradient(135deg,#1d4ed8 0%,#3b82f6 60%,#60a5fa 100%)",
        boxShadow: "0 4px 14px rgba(59,130,246,0.4)",
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
