import React, { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import employeeService from "../../services/employeeService";

const cardConfig = [
  {
    key: "total",
    title: "Total employees",
    icon: Users,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    trend: "All registered",
    trendColor: "text-blue-500",
  },
  {
    key: "active",
    title: "Active",
    icon: UserCheck,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    trend: "Currently working",
    trendColor: "text-green-500",
  },
  {
    key: "pending",
    title: "Pending",
    icon: Clock,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    trend: "Awaiting approval",
    trendColor: "text-amber-500",
  },
  {
    key: "inactive",
    title: "Inactive",
    icon: UserX,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    trend: "Deactivated",
    trendColor: "text-red-400",
  },
];

const StatsCards = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [empRes, pendingRes] = await Promise.all([
        employeeService.getAllEmployees(),
        employeeService.getPendingSubmissions(),
      ]);
      const employees = empRes.success ? (empRes.data ?? []) : [];
      const pending = pendingRes.success ? (pendingRes.data?.length ?? 0) : 0;
      setStats({
        total: employees.length + pending,
        active: employees.filter((e) =>
          ["active", "approved"].includes(e.status?.toLowerCase()),
        ).length,
        pending,
        inactive: employees.filter((e) =>
          ["inactive", "rejected"].includes(e.status?.toLowerCase()),
        ).length,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    /* 1 col → 2 col sm → 4 col lg */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
      {cardConfig.map(
        ({ key, title, icon: Icon, iconBg, iconColor, trend, trendColor }) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4
                     hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div
                className={`${iconBg} w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                             group-hover:scale-110 transition-transform duration-200 shrink-0`}
              >
                <Icon className={iconColor} size={16} />
              </div>
              {loading && (
                <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
              )}
            </div>

            <p className="text-xs text-slate-500 font-medium mb-0.5 truncate">
              {title}
            </p>

            <p className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight">
              {loading ? (
                <span className="inline-block w-8 h-5 bg-gray-200 animate-pulse rounded" />
              ) : (
                stats[key].toLocaleString()
              )}
            </p>

            <p className={`text-xs mt-1 truncate ${trendColor}`}>{trend}</p>
          </div>
        ),
      )}
    </div>
  );
};

export default StatsCards;
