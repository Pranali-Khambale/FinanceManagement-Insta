import React, { useState } from "react";
import {
  X,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Loader,
  Link2,
  Calendar,
  Mail,
  Send,
  ChevronDown,
  Users,
} from "lucide-react";
import employeeService from "../../services/employeeService";
import BulkLinkModal from "./Linkgen/BulklinkMode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PublicLinkModal = ({ onClose, showToast = () => {} }) => {
  const [step, setStep] = useState("input");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [linkData, setLinkData] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendError, setResendError] = useState("");
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showBulk, setShowBulk] = useState(false); // ← NEW

  const validateEmail = (val) => EMAIL_RE.test(val);

  const handleGenerateLink = async () => {
    setEmailError("");
    setGenerateError("");
    if (email.trim() && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    try {
      setStep("generating");
      const response = await employeeService.generateRegistrationLink({
        employeeEmail: email.trim() || null,
        expiresInDays: 7,
      });
      if (response.success) {
        setLinkData(response.data);
        setStep("success");

        // The backend (POST /api/registration-links → generateLink controller)
        // already sends the registration email itself as soon as the link is
        // created — see services/employeeMng sendRegistrationLinkEmail().
        // We do NOT call employeeService.sendRegistrationEmail() here anymore;
        // doing so hit a route that doesn't exist (POST /api/employees/
        // send-registration-email → 404) and, because the old fetch call never
        // checked response.ok, it silently reported success anyway — showing a
        // "link sent" toast even though the request failed.
        //
        // The backend now awaits the actual Mailjet send and returns a real
        // `emailSent` flag + an honest `message` — read those instead of
        // assuming success just because an email address was typed in.
        if (email.trim()) {
          const wasSent = response.emailSent === true;
          setEmailSent(wasSent);
          showToast(
            response.message || "Registration link generated successfully!",
            wasSent ? "success" : "warning",
          );
        } else {
          showToast("Registration link generated successfully!", "success");
        }
      } else {
        throw new Error(response.message || "Failed to generate link");
      }
    } catch (error) {
      console.error("Error generating link:", error);
      setStep("input");
      setGenerateError(
        error.message ||
          "Failed to generate registration link. Please try again.",
      );
    }
  };

  // Manual "resend" action (the Send button shown if emailSent is false).
  // Only wire this up once a real backend route exists at
  // POST /api/employees/send-registration-email. Until then this will
  // throw a clear error instead of showing a false success toast.
  const handleResend = async (recipientEmail, data) => {
    setSendingEmail(true);
    setResendError("");
    try {
      await employeeService.sendRegistrationEmail({
        to: recipientEmail,
        registrationUrl: data.registrationUrl,
        expiresAt: data.expiresAt,
        subject: "Your Registration Link — Insta ICT Solutions",
      });
      setEmailSent(true);
      showToast(`Registration link re-sent to ${recipientEmail}!`, "success");
    } catch (error) {
      console.error("Resend error:", error);
      setResendError(error.message || "Resend failed.");
      showToast(
        "Resend failed — that endpoint isn't set up on the backend yet.",
        "error",
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const handleCopyLink = () => {
    if (!linkData?.registrationUrl) return;
    navigator.clipboard.writeText(linkData.registrationUrl).catch(() => {
      const el = document.createElement("textarea");
      el.value = linkData.registrationUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setLinkCopied(true);
    showToast("Link copied to clipboard!", "success");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1100] p-3 sm:p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
          style={{ maxHeight: "92vh" }}
        >
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-blue-500 rounded-xl p-2 flex-shrink-0">
                <Link2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold leading-tight truncate">
                  {step === "success"
                    ? "Link Generated!"
                    : "Generate Registration Link"}
                </h3>
                <p className="text-blue-100 text-[11px] sm:text-xs mt-0.5 truncate">
                  {step === "success"
                    ? "Share this link for employee self-registration"
                    : "Create a one-time registration link"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-all flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-6">
            {/* Step 1 — Input */}
            {step === "input" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Employee Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                        setGenerateError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleGenerateLink()
                      }
                      placeholder="employee@example.com"
                      autoFocus
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-colors ${
                        emailError
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                      }`}
                    />
                  </div>
                  {emailError && (
                    <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{" "}
                      {emailError}
                    </p>
                  )}
                </div>

                {email.trim() && validateEmail(email) && (
                  <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200 flex items-start sm:items-center gap-2">
                    <Send className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <p className="text-sm text-green-700 break-words">
                      Link will be sent to <strong>{email}</strong>
                    </p>
                  </div>
                )}

                {generateError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800 break-words">
                      {generateError}
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg px-4 py-3 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Expires in 7 days · One-time use ·
                    Requires admin approval
                  </p>
                </div>

                {/* ── Divider + Bulk button ── */}
                <div className="relative flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    or send to multiple
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button
                  onClick={() => setShowBulk(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg font-semibold text-xs sm:text-sm hover:bg-indigo-50 hover:border-indigo-400 transition-all text-center"
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Bulk Send Links — Upload CSV / Excel / Paste Emails
                  </span>
                </button>
              </div>
            )}

            {/* Step 2 — Generating */}
            {step === "generating" && (
              <div className="text-center py-10">
                <Loader className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Generating Link...
                </h3>
                <p className="text-gray-500 text-sm">Please wait</p>
              </div>
            )}

            {/* Step 3 — Success */}
            {step === "success" && linkData && (
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Registration Link
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-0 font-mono text-xs text-blue-600 bg-white px-3 py-2.5 rounded-lg border border-gray-200 truncate">
                      {linkData.registrationUrl}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className={`flex-shrink-0 px-3 py-2.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all text-sm whitespace-nowrap ${
                        linkCopied
                          ? "bg-green-500 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      Expires: {new Date(linkData.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {email.trim() && (
                  <div
                    className={`rounded-xl px-3 sm:px-4 py-3 border flex items-start sm:items-center gap-3 flex-wrap sm:flex-nowrap ${
                      emailSent
                        ? "bg-blue-50 border-blue-200"
                        : sendingEmail
                          ? "bg-gray-50 border-gray-200"
                          : "bg-amber-50 border-amber-200"
                    }`}
                  >
                    {sendingEmail ? (
                      <Loader className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0 mt-0.5 sm:mt-0" />
                    ) : emailSent ? (
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium break-words ${
                          emailSent
                            ? "text-blue-800"
                            : sendingEmail
                              ? "text-gray-600"
                              : "text-amber-800"
                        }`}
                      >
                        {sendingEmail
                          ? "Sending email..."
                          : emailSent
                            ? `Email sent to ${email}`
                            : "Email not sent yet"}
                      </p>
                      {resendError && (
                        <p className="text-xs text-red-600 mt-1 break-words">
                          {resendError}
                        </p>
                      )}
                    </div>
                    {!emailSent && !sendingEmail && (
                      <button
                        onClick={() => handleResend(email.trim(), linkData)}
                        className="text-xs text-blue-600 font-semibold hover:underline flex-shrink-0 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Send
                      </button>
                    )}
                  </div>
                )}

                {email.trim() && emailSent && (
                  <div className="border border-blue-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                      className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 bg-blue-50 text-left hover:bg-blue-100 transition-colors"
                    >
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 min-w-0 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" /> Email
                        Preview
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-blue-500 transition-transform flex-shrink-0 ${showEmailPreview ? "rotate-180" : ""}`}
                      />
                    </button>
                    {showEmailPreview && (
                      <div className="bg-white p-3 sm:p-4 text-sm text-gray-700 space-y-2 border-t border-blue-100">
                        <p className="break-words">
                          <strong>To:</strong> {email}
                        </p>
                        <p className="break-words">
                          <strong>Subject:</strong> Your Registration Link —
                          Insta ICT Solutions
                        </p>
                        <hr className="border-gray-100" />
                        <p>Dear Employee,</p>
                        <p className="text-gray-500 text-xs leading-relaxed">
                          Please use the link below to complete your
                          registration form. Once submitted, our HR team will
                          review and approve your profile within 1–2 business
                          days.
                        </p>
                        <p className="text-blue-600 font-mono text-xs break-all">
                          {linkData.registrationUrl}
                        </p>
                        <p className="text-xs text-gray-400">
                          Expires:{" "}
                          {new Date(linkData.expiresAt).toLocaleString()} ·
                          One-time use only
                        </p>
                        <p className="text-xs">
                          Regards,
                          <br />
                          <strong>HR Team — Insta ICT Solutions</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 sm:px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />{" "}
                    How it works
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Employee fills the form using this link</li>
                    <li>
                      • Submission appears in <strong>Pending Approvals</strong>{" "}
                      tab
                    </li>
                    <li>• Admin reviews and approves or rejects</li>
                    <li>• Approved employees receive an Employee ID</li>
                    <li>
                      • Link expires in <strong>7 days</strong> · can only be
                      used <strong>once</strong>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-100 px-4 sm:px-6 py-4 bg-white rounded-b-2xl">
            {step === "input" && (
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={onClose}
                  className="order-2 sm:order-1 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateLink}
                  className="order-1 sm:order-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <Link2 className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {email.trim() && validateEmail(email)
                      ? "Generate & Send Link"
                      : "Generate Link"}
                  </span>
                </button>
              </div>
            )}
            {step === "success" && (
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() =>
                    linkData?.registrationUrl &&
                    window.open(linkData.registrationUrl, "_blank")
                  }
                  className="order-2 sm:order-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 flex-shrink-0" /> Open Link
                </button>
                <button
                  onClick={onClose}
                  className="order-1 sm:order-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm w-full sm:w-auto"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BulkLinkModal renders on top at z-[1200] */}
      {showBulk && (
        <BulkLinkModal
          onClose={() => setShowBulk(false)}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default PublicLinkModal;
