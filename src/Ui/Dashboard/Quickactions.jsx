import React from "react";
import { useNavigate } from "react-router-dom";
import { Users, CreditCard, DollarSign, FileBarChart } from "lucide-react";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Manage Employees",
      description: "View and edit records",
      icon: Users,
      bgColor: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      path: "/employee/management",
    },
    {
      title: "Advance Payments",
      description: "Process requests",
      icon: CreditCard,
      bgColor: "bg-pink-500",
      hoverColor: "hover:bg-pink-600",
      path: "/employee/payments",
    },
    {
      title: "Payroll Processing",
      description: "Manage salaries",
      icon: DollarSign,
      bgColor: "bg-green-500",
      hoverColor: "hover:bg-green-600",
      path: "/employee/payroll",
    },
    {
      title: "Generate Reports",
      description: "Download analytics",
      icon: FileBarChart,
      bgColor: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      path: "/employee/reports",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-slate-200">
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all duration-300 group border border-slate-200 hover:border-slate-300 hover:shadow-md w-full text-left"
              style={{
                animationDelay: `${index * 100 + 400}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
                opacity: 0,
              }}
            >
              <div
                className={`${action.bgColor} ${action.hoverColor} p-3 sm:p-4 rounded-xl transition-all duration-300 group-hover:scale-110 shadow-md shrink-0`}
              >
                <Icon className="text-white" size={20} />
              </div>

              <div className="text-left min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-indigo-600 transition-colors duration-200 truncate">
                  {action.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default QuickActions;