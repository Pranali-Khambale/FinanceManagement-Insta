import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  FileText,
  CreditCard,
  DollarSign,
  Calendar,
  Menu,
  X,
  LayoutDashboard,
  Settings,
  Bell,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "employees", label: "Employees", icon: Users },
  { id: "payroll", label: "Payroll", icon: DollarSign },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ activeItem, onItemClick, isOpen, onClose }) => (
  <>
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/40 z-30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    )}
    <aside
      className={`
        fixed md:static top-0 left-0 h-full z-40
        bg-white border-r border-gray-200 flex flex-col shrink-0
        transition-transform duration-200 ease-in-out
        w-64 md:w-16 lg:w-64
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
    >
      <div className="flex items-center gap-2 px-3 lg:px-5 h-14 border-b border-gray-200 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold shrink-0">
          E
        </div>
        <span className="font-semibold text-gray-800 hidden lg:inline">
          EmpDesk
        </span>
        <button
          className="ml-auto md:hidden text-gray-500"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeItem === id;
          return (
            <button
              key={id}
              onClick={() => {
                onItemClick(id);
                onClose();
              }}
              title={label}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors justify-start md:justify-center lg:justify-start
                ${active ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:bg-gray-50"}
              `}
            >
              <Icon size={18} className="shrink-0" />
              <span className="md:hidden lg:inline">{label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  </>
);

const Header = ({ title, user, onMenuClick }) => (
  <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sm:px-6 shrink-0">
    <div className="flex items-center gap-3 min-w-0">
      <button
        className="md:hidden text-gray-600 shrink-0"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
        {title}
      </h1>
    </div>
    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
      <button className="hidden sm:flex text-gray-500 hover:text-gray-700">
        <Bell size={20} />
      </button>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="hidden sm:block text-sm leading-tight">
          <p className="font-medium text-gray-800">{user.name}</p>
          <p className="text-gray-500 text-xs truncate max-w-[140px]">
            {user.email}
          </p>
        </div>
      </div>
    </div>
  </header>
);

const StatCard = ({ icon: Icon, label, value, bgColor, iconColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex items-center gap-3">
    <div
      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}
    >
      <Icon className={iconColor} size={20} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-lg sm:text-xl font-semibold text-gray-800">
        {value.toLocaleString()}
      </p>
    </div>
  </div>
);

const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  bgColor,
  iconColor,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-200
               hover:border-gray-300 hover:bg-gray-50 transition-all text-left w-full group"
  >
    <div
      className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0
                     group-hover:scale-105 transition-transform duration-200`}
    >
      <Icon className={iconColor} size={18} />
    </div>
    <div className="min-w-0">
      <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
        {title}
      </p>
      <p className="text-xs sm:text-sm text-gray-500 truncate">{description}</p>
    </div>
  </button>
);

const stats = [
  {
    id: 1,
    icon: Users,
    label: "Total employees",
    value: 1254,
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: 2,
    icon: UserCheck,
    label: "Active",
    value: 78,
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 3,
    icon: Calendar,
    label: "On leave",
    value: 352,
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
  },
  {
    id: 4,
    icon: UserX,
    label: "Inactive",
    value: 293,
    bgColor: "bg-red-50",
    iconColor: "text-red-600",
  },
];

const quickActions = [
  {
    id: 1,
    icon: Users,
    title: "Manage employees",
    description: "View and edit records",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: 2,
    icon: CreditCard,
    title: "Advance payments",
    description: "Process requests",
    bgColor: "bg-pink-50",
    iconColor: "text-pink-600",
  },
  {
    id: 3,
    icon: DollarSign,
    title: "Payroll processing",
    description: "Manage salaries",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: 4,
    icon: FileText,
    title: "Generate reports",
    description: "Download analytics",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
  },
];

const user = { name: "Admin User", email: "adminuser@gmail.com" };

const EmployeeDashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeItem={activeMenuItem}
        onItemClick={setActiveMenuItem}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Dashboard"
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-3 sm:p-5">
          {/* 1 col → 2 col sm → 4 col lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
            {stats.map((s) => (
              <StatCard key={s.id} {...s} />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">
              Quick actions
            </h3>
            {/* 1 col → 2 col sm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {quickActions.map((a) => (
                <QuickActionCard key={a.id} {...a} onClick={() => {}} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
