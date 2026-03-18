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
} from "lucide-react";
import employeeService from "../../services/employeeService";

const PublicLinkModal = ({ onClose, showToast = () => {} }) => {
  const [step, setStep] = useState("input");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [linkData, setLinkData] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

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
        showToast("Registration link generated successfully!", "success");
        if (email.trim()) {
          await sendConfirmationEmail(email.trim(), response.data);
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

  const sendConfirmationEmail = async (recipientEmail, data) => {
    setSendingEmail(true);
    try {
      await employeeService.sendRegistrationEmail({
        to: recipientEmail,
        registrationUrl: data.registrationUrl,
        expiresAt: data.expiresAt,
        subject: "Your Registration Link — Insta ICT Solutions",
      });
      setEmailSent(true);
      showToast(`Registration link sent to ${recipientEmail}!`, "success");
    } catch (error) {
      console.error("Email send error:", error);
      showToast("Link generated but email delivery failed.", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendEmailManually = async () => {
    if (!email.trim() || !linkData) return;
    await sendConfirmationEmail(email.trim(), linkData);
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

  const handleOpenLink = () => {
    if (linkData?.registrationUrl)
      window.open(linkData.registrationUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1100] p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 sm:my-8">
        {/* ── Header ── */}
        <div className="bg-blue-600 text-white px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-xl p-2 flex-shrink-0">
              <Link2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">
                {step === "success"
                  ? "Link Generated!"
                  : "Generate Registration Link"}
              </h3>
              <p className="text-blue-100 text-xs sm:text-sm mt-0.5">
                {step === "success"
                  ? "Share this link for employee self-registration"
                  : "Create a one-time registration link for an employee"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded-lg transition-all flex-shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 sm:p-8">
          {/* ── Step 1: Input ── */}
          {step === "input" && (
            <>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Email Address{" "}
                  <span className="text-gray-400 font-normal">
                    (Optional — used to send the link)
                  </span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                      setGenerateError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateLink()}
                    placeholder="employee@example.com (optional)"
                    autoFocus
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm ${
                      emailError
                        ? "border-red-400 bg-red-50"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {emailError}
                  </p>
                )}
              </div>

              {email.trim() && validateEmail(email) && (
                <div className="bg-green-50 rounded-lg p-3 mb-4 border border-green-200 flex items-start gap-2">
                  <Send className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">
                    Registration link will be automatically sent to{" "}
                    <strong>{email}</strong>
                  </p>
                </div>
              )}

              {generateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{generateError}</p>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The link expires in 7 days and can only
                  be used once. The employee's submission will require admin
                  approval before they are added to the system.
                  {email.trim() &&
                    validateEmail(email) &&
                    " A confirmation email with the link will be sent to the employee."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateLink}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Link2 className="w-4 h-4" />
                  Generate{" "}
                  {email.trim() && validateEmail(email)
                    ? "& Send Link"
                    : "Link"}
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Generating ── */}
          {step === "generating" && (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 sm:w-14 sm:h-14 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                {sendingEmail ? "Sending Email..." : "Generating Link..."}
              </h3>
              <p className="text-gray-500 text-sm">Please wait</p>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === "success" && linkData && (
            <>
              {/* Success banner */}
              <div className="bg-green-50 rounded-lg p-4 mb-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Link Generated Successfully!
                    </p>
                    {linkData.employeeEmail && (
                      <p className="text-xs text-green-600 mt-0.5">
                        For: {linkData.employeeEmail}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email status banner */}
              {email.trim() && (
                <div
                  className={`rounded-lg p-4 mb-4 border flex items-start gap-3 ${
                    emailSent
                      ? "bg-blue-50 border-blue-200"
                      : sendingEmail
                        ? "bg-gray-50 border-gray-200"
                        : "bg-amber-50 border-amber-200"
                  }`}
                >
                  {sendingEmail ? (
                    <Loader className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0 mt-0.5" />
                  ) : emailSent ? (
                    <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        emailSent
                          ? "text-blue-800"
                          : sendingEmail
                            ? "text-gray-600"
                            : "text-amber-800"
                      }`}
                    >
                      {sendingEmail
                        ? "Sending confirmation email..."
                        : emailSent
                          ? `Confirmation email sent to ${email}`
                          : "Email not sent yet"}
                    </p>
                    {emailSent && (
                      <p className="text-xs text-blue-600 mt-0.5">
                        Employee will receive the registration link and
                        submission confirmation
                      </p>
                    )}
                  </div>
                  {!emailSent && !sendingEmail && email.trim() && (
                    <button
                      onClick={handleSendEmailManually}
                      className="text-xs text-blue-600 font-semibold hover:underline flex-shrink-0 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Send Now
                    </button>
                  )}
                </div>
              )}

              {/* Link display */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-5 mb-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Registration Link
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                  <div className="flex-1 font-mono text-xs text-blue-600 bg-white px-4 py-3 rounded-lg border border-gray-200 break-all">
                    {linkData.registrationUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-sm ${
                      linkCopied
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Expires: {new Date(linkData.expiresAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Email content preview */}
              {email.trim() && emailSent && (
                <div className="bg-blue-50 rounded-xl p-4 sm:p-5 mb-4 border border-blue-200">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email Sent to Employee
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-blue-100 text-sm text-gray-700 space-y-2">
                    <p>
                      <strong>To:</strong> {email}
                    </p>
                    <p>
                      <strong>Subject:</strong> Your Registration Link — Insta
                      ICT Solutions
                    </p>
                    <hr className="border-gray-100" />
                    <p>Dear Employee,</p>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Please use the link below to complete your registration
                      form. Once submitted, our HR team will review your
                      information and approve your profile within 1–2 business
                      days.
                    </p>
                    <p className="text-blue-600 font-mono text-xs break-all">
                      {linkData.registrationUrl}
                    </p>
                    <p className="text-xs text-gray-400">
                      This link expires on{" "}
                      {new Date(linkData.expiresAt).toLocaleString()} and can
                      only be used once.
                    </p>
                    <p className="text-xs">
                      Regards,
                      <br />
                      <strong>HR Team — Insta ICT Solutions</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* On form submit — employee gets confirmation + copy */}
              <div className="bg-indigo-50 rounded-xl p-4 sm:p-5 mb-4 border border-indigo-200">
                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5" /> When Employee Submits the
                  Form
                </p>
                <div className="space-y-2">
                  {[
                    {
                      icon: "✅",
                      text: 'Employee receives a confirmation email: "Your form has been successfully submitted"',
                    },
                    {
                      icon: "📋",
                      text: "A copy of the submitted form details is sent to the employee's email",
                    },
                    {
                      icon: "👤",
                      text: "HR team receives a notification with the full form data for review",
                    },
                    {
                      icon: "🪪",
                      text: "Once approved, employee is notified with their assigned Employee ID",
                    },
                  ].map(({ icon, text }, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sm flex-shrink-0">{icon}</span>
                      <p className="text-xs text-indigo-700 leading-relaxed">
                        {text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">
                    How it works
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Employee fills the form using this link</li>
                    <li>
                      • Submission appears in <strong>Pending Approvals</strong>{" "}
                      tab
                    </li>
                    <li>• Admin reviews and approves or rejects</li>
                    <li>
                      • Approved employees get an Employee ID and appear in the
                      dashboard
                    </li>
                    <li>
                      • Link expires in <strong>7 days</strong> and can only be
                      used <strong>once</strong>
                    </li>
                    {email.trim() && (
                      <li>
                        • Employee receives a{" "}
                        <strong>confirmation email</strong> once the form is
                        submitted
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleOpenLink}
                  className="w-full sm:w-auto px-5 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicLinkModal;
