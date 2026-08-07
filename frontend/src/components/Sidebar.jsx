import React from "react";
import {
  FileText,
  ShieldCheck,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";

function Sidebar({
  activeTab,
  setActiveTab,
  adminSection,
  setAdminSection,
  onOpenAdmin,
}) {
  const handleParserClick = () => {
    setActiveTab("parser");
  };

  const handleAdminClick = () => {
    const section = adminSection || "users";

    setAdminSection(section);
    setActiveTab("admin");

    if (onOpenAdmin) {
      onOpenAdmin(section);
    }
  };

  const handleAdminSectionClick = (section) => {
    setAdminSection(section);
    setActiveTab("admin");

    if (onOpenAdmin) {
      onOpenAdmin(section);
    }
  };

  return (
    <aside className="hidden w-[270px] shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 flex h-[calc(100vh-102px)] flex-col">
        {/* =====================================================
            NAVIGATION
        ===================================================== */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* APPLICATION */}
          <p className="mb-3 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Application
          </p>

          {/* =================================================
              STATEMENT PARSER
          ================================================= */}
          <button
            type="button"
            onClick={handleParserClick}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeTab === "parser"
                ? "bg-[#11152a] text-white shadow-md"
                : "text-slate-700 hover:bg-slate-50"
              }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activeTab === "parser"
                  ? "bg-white/10"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              <FileText size={17} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold">
                Statement Parser
              </span>

              <span
                className={`mt-0.5 block text-[11px] ${activeTab === "parser"
                    ? "text-slate-400"
                    : "text-slate-500"
                  }`}
              >
                Upload, extract and validate
              </span>
            </span>

            {activeTab === "parser" && (
              <ChevronRight
                size={15}
                className="shrink-0 text-slate-400"
              />
            )}
          </button>

          {/* =================================================
              ADMINISTRATION
          ================================================= */}
          <p className="mb-3 mt-8 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Administration
          </p>

          {/* =================================================
              ADMIN PANEL
          ================================================= */}
          <button
            type="button"
            onClick={handleAdminClick}
            className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${activeTab === "admin"
                ? "bg-[#11152a] text-white shadow-md"
                : "text-slate-700 hover:bg-slate-50"
              }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activeTab === "admin"
                  ? "bg-white/10"
                  : "bg-slate-100 text-slate-500"
                }`}
            >
              <ShieldCheck size={17} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-extrabold">
                Admin Panel
              </span>

              <span
                className={`mt-0.5 block text-[11px] ${activeTab === "admin"
                    ? "text-slate-400"
                    : "text-slate-500"
                  }`}
              >
                Users, access and system
              </span>
            </span>

            {activeTab === "admin" && (
              <ChevronRight
                size={15}
                className="shrink-0 text-slate-400"
              />
            )}
          </button>

          {/* =================================================
              ADMIN SUB NAVIGATION
          ================================================= */}
          {activeTab === "admin" && (
            <div className="mt-2 space-y-1 border-l border-slate-200 pl-3">
              {/* USER MANAGEMENT */}
              <button
                type="button"
                onClick={() =>
                  handleAdminSectionClick("users")
                }
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${adminSection === "users"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Users
                  size={15}
                  className={
                    adminSection === "users"
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }
                />

                <span className="text-xs font-bold">
                  User Management
                </span>
              </button>

              {/* SYSTEM */}
              <button
                type="button"
                onClick={() =>
                  handleAdminSectionClick("system")
                }
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${adminSection === "system"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <Settings
                  size={15}
                  className={
                    adminSection === "system"
                      ? "text-indigo-600"
                      : "text-slate-400"
                  }
                />

                <span className="text-xs font-bold">
                  System
                </span>
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
            SECURITY FOOTER
        ===================================================== */}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <ShieldCheck size={15} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Secure Processing
                </p>

                <p className="mt-1 text-[10px] leading-4 text-emerald-700/80">
                  Statement data is processed temporarily
                  and is not permanently stored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;