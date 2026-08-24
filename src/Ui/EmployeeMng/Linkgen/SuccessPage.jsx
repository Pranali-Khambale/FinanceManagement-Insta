// src/Ui/EmployeeMng/Linkgen/SuccessPage.jsx

import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

/**
 * SuccessPage — only accessible after a real form submission.
 *
 * React Router's location.state is set programmatically by navigate() and is
 * NOT part of the URL, so a user typing "/success" in the browser gets
 * state = null and is immediately redirected away.
 */
const SuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // No verified state → someone arrived directly; send them home.
    if (!state?.verified) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  // Prevent flash of content before the redirect fires.
  if (!state?.verified) return null;

  const isRejoin = state.type === "rejoin";
  const isResubmit = state.type === "resubmit";

  const title = isRejoin
    ? "Rejoin Request Submitted!"
    : isResubmit
      ? "Resubmission Received!"
      : "Registration Submitted!";

  const message = isRejoin
    ? "Your rejoin request has been received. HR will review it and get back to you shortly."
    : isResubmit
      ? "Your corrected registration has been received and is under review."
      : "Your registration has been received and is currently under review. You will be notified once it is processed.";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
        {/* Icon — always green */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        {/* Heading — always green */}
        <h2 className="text-2xl font-bold text-green-600 mb-2">{title}</h2>

        {/* Body */}
        <p className="text-slate-600 text-sm leading-relaxed">{message}</p>

        {/* Divider */}
        <div className="border-t border-slate-100 my-6" />

        {/* Footer note */}
        <p className="text-xs text-slate-400">
          You may now close this tab. If you have any questions, please contact
          your HR representative.
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;
