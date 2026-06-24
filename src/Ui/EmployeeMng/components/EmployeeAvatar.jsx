// photo / initials avatar
import { getS3Url } from "../../../utils/s3Utils";

const EmployeeAvatar = ({ emp }) => {
  const firstName = emp?.first_name || emp?.firstName || "";
  const lastName = emp?.last_name || emp?.lastName || "";

  const docs = Array.isArray(emp?.documents) ? emp.documents : [];
  const photoDoc = docs.find(
    (d) => d?.document_type === "photo" || d?.document_type === "idPhoto",
  );
  const photoUrl = photoDoc?.file_path ? getS3Url(photoDoc.file_path) : null;

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`${firstName} ${lastName}`}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0 border-2 border-indigo-100"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.nextSibling?.style.removeProperty("display");
        }}
      />
    );
  }

  return (
    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
      {firstName[0] || "N"}
      {lastName[0] || "A"}
    </div>
  );
};

export default EmployeeAvatar;