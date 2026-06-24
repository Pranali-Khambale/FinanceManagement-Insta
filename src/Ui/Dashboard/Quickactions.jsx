import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, DollarSign, FileBarChart } from "lucide-react";

const actions = [
  {
    title: "Manage Employees",
    description: "View and edit records",
    icon: Users,
    iconClass: "bg-violet-500",
    active: false,
    path: "/employee/management", // ✅ path lives in the data
  },
  {
    title: "Advance Payments",
    description: "Process requests",
    icon: CreditCard,
    iconClass: "bg-gradient-to-br from-rose-500 to-pink-500",
    active: true,
    path: "/employee/payments",
  },
  {
    title: "Payroll Processing",
    description: "Manage salaries",
    icon: DollarSign,
    iconClass: "bg-green-500",
    active: false,
    path: "/employee/payroll",
  },
  {
    title: "Generate Reports",
    description: "Download analytics",
    icon: FileBarChart,
    iconClass: "bg-blue-500",
    active: false,
    path: "/employee/reports",
  },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Quick Actions</h2>

      <div className="flex flex-col gap-3">
        {actions.map(
          (
            { title, description, icon: Icon, iconClass, active, path }, // ✅ path destructured here
          ) => (
            <button
              key={title}
              onClick={() => navigate(path)} // ✅ now uses the correct path string
              className={`
              flex items-center gap-4 w-full
              px-4 py-4 rounded-2xl border
              transition-all duration-150 text-left
              ${
                active
                  ? "bg-indigo-50/60 border-indigo-100"
                  : "bg-white border-gray-200 hover:bg-slate-50 hover:border-slate-300"
              }
            `}
            >
              <div
                className={`${iconClass} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0`}
              >
                <Icon className="text-white w-7 h-7" />
              </div>
              <div>
                <p
                  className={`font-semibold text-[15px] leading-snug
                ${active ? "text-indigo-500" : "text-gray-900"}`}
                >
                  {title}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">{description}</p>
              </div>
            </button>
          ),
        )}
      </div>
    </div>
  );
};

export default QuickActions;
