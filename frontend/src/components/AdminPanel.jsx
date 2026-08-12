import React, { useMemo, useState } from "react";
import {
  Users,
  Settings,
  Search,
  Plus,
  ShieldCheck,
  CheckCircle2,
  X,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";

function AdminPanel({
  currentUser,
  initialSection = "users",
}) {
  const [section, setSection] = useState(
    initialSection === "system" ? "system" : "users"
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [showAddUser, setShowAddUser] = useState(false);

  const [message, setMessage] = useState("");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "USER",
  });

  const [users, setUsers] = useState([
    {
      id: 1,
      name: currentUser?.name || "Poornima Sahu",
      email:
        currentUser?.email || "poornima@universalbank.com",
      role: "ADMIN",
      status: "Active",
    },
    {
      id: 2,
      name: "Parser User",
      email: "user@universalbank.com",
      role: "USER",
      status: "Active",
    },
  ]);

  /* =====================================================
     SECTION
  ===================================================== */

  const handleSectionChange = (nextSection) => {
    setSection(nextSection);
    setMessage("");
  };

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      );
    });
  }, [users, searchTerm]);

  /* =====================================================
     USER ACTIONS
  ===================================================== */

  const handleAddUser = (event) => {
    event.preventDefault();

    const name = newUser.name.trim();
    const email = newUser.email.trim().toLowerCase();

    if (!name || !email) {
      setMessage("Name and email are required.");
      return;
    }

    const alreadyExists = users.some(
      (user) => user.email.toLowerCase() === email
    );

    if (alreadyExists) {
      setMessage("A user with this email already exists.");
      return;
    }

    const createdUser = {
      id: Date.now(),
      name,
      email,
      role: newUser.role,
      status: "Active",
    };

    setUsers((current) => [...current, createdUser]);

    setNewUser({
      name: "",
      email: "",
      role: "USER",
    });

    setShowAddUser(false);
    setMessage("User added successfully.");
  };

  const handleToggleUser = (id) => {
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== id) {
          return user;
        }

        return {
          ...user,
          status:
            user.status === "Active"
              ? "Disabled"
              : "Active",
        };
      })
    );

    setMessage("User status updated.");
  };

  const handleDeleteUser = (id) => {
    if (id === 1) {
      setMessage("The primary administrator cannot be deleted.");
      return;
    }

    setUsers((current) =>
      current.filter((user) => user.id !== id)
    );

    setMessage("User deleted.");
  };

  /* =====================================================
     STATS
  ===================================================== */

  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="w-full">
      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <div className="mb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
          Secure Administration
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          Admin Panel
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Manage application users, access and system
          configuration.
        </p>
      </div>

      {/* ===================================================
          MESSAGE
      =================================================== */}

      {message && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={17} />

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            className="ml-auto"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ===================================================
          SECTION SWITCHER
      =================================================== */}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {/* USERS */}
          <button
            type="button"
            onClick={() => handleSectionChange("users")}
            className={`flex items-center gap-3 rounded-xl px-5 py-4 text-left transition ${section === "users"
                ? "bg-[#11152a] text-white shadow-md"
                : "text-slate-700 hover:bg-slate-50"
              }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${section === "users"
                  ? "bg-white/10"
                  : "bg-slate-100"
                }`}
            >
              <Users size={17} />
            </span>

            <span>
              <span className="block text-sm font-extrabold">
                User Management
              </span>

              <span
                className={`mt-0.5 block text-[11px] ${section === "users"
                    ? "text-slate-400"
                    : "text-slate-500"
                  }`}
              >
                Manage users, roles and access
              </span>
            </span>
          </button>

          {/* SYSTEM */}
          <button
            type="button"
            onClick={() => handleSectionChange("system")}
            className={`flex items-center gap-3 rounded-xl px-5 py-4 text-left transition ${section === "system"
                ? "bg-[#11152a] text-white shadow-md"
                : "text-slate-700 hover:bg-slate-50"
              }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${section === "system"
                  ? "bg-white/10"
                  : "bg-slate-100"
                }`}
            >
              <Settings size={17} />
            </span>

            <span>
              <span className="block text-sm font-extrabold">
                System
              </span>

              <span
                className={`mt-0.5 block text-[11px] ${section === "system"
                    ? "text-slate-400"
                    : "text-slate-500"
                  }`}
              >
                API, security and processing
              </span>
            </span>
          </button>
        </div>
      </section>

      {/* ===================================================
          USER MANAGEMENT
      =================================================== */}

      {section === "users" && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* HEADER */}
          <div className="border-b border-slate-200 p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  User Management
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage application users, roles and access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setShowAddUser(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#11152a] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700"
              >
                <Plus size={15} />
                Add User
              </button>
            </div>

            {/* SEARCH */}
            <div className="mt-5">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search users"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>

          {/* USER TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                    >
                      {/* USER */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-700">
                            {user.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {user.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold ${user.role === "ADMIN"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-blue-50 text-blue-700"
                            }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                          <span
                            className={`h-2 w-2 rounded-full ${user.status === "Active"
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                              }`}
                          />

                          {user.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleUser(user.id)
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-100"
                          >
                            {user.status === "Active" ? (
                              <UserX size={13} />
                            ) : (
                              <UserCheck size={13} />
                            )}

                            {user.status === "Active"
                              ? "Disable"
                              : "Enable"}
                          </button>

                          {user.id !== 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteUser(user.id)
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-[10px] font-bold text-red-500 transition hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center"
                    >
                      <p className="text-sm font-semibold text-slate-500">
                        No users found.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* SUMMARY */}
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
              <span>
                Total users:{" "}
                <strong className="text-slate-800">
                  {users.length}
                </strong>
              </span>

              <span>
                Active users:{" "}
                <strong className="text-emerald-600">
                  {activeUsers}
                </strong>
              </span>

              <span>
                Current session:{" "}
                <strong className="text-slate-800">
                  {currentUser?.name || "User"}
                </strong>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================
          SYSTEM
      =================================================== */}

      {section === "system" && (
        <div className="space-y-5">
          {/* STATUS CARDS */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* SYSTEM */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    System Status
                  </p>

                  <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                    Operational
                  </h3>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={18} />
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Core parser services are available and ready
                for document processing.
              </p>
            </div>

            {/* API */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    API / Backend
                  </p>

                  <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                    Connected
                  </h3>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Settings size={18} />
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Backend API is configured for statement
                processing.
              </p>
            </div>

            {/* STORAGE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Storage Policy
                  </p>

                  <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                    RAM Only
                  </h3>
                </div>

                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <ShieldCheck size={18} />
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Uploaded statements are processed temporarily
                and are not permanently stored.
              </p>
            </div>
          </div>

          {/* SECURITY */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#11152a] text-white">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Security &amp; Compliance
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current application security and processing
                  controls.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                "Zero permanent document storage",
                "AI extraction engine enabled",
                "Transaction validation enabled",
                "Role-based administration enabled",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={14} />
                  </span>

                  <span className="text-xs font-semibold text-slate-600">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SYSTEM CONFIGURATION */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-extrabold text-slate-900">
                System Configuration
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current processing configuration.
              </p>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Backend API
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    API connection used for statement processing.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700">
                  CONNECTED
                </span>
              </div>

              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Maximum Upload Size
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Maximum supported statement size.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold text-slate-700">
                  5 MB
                </span>
              </div>

              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Supported Documents
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Accepted statement formats.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-[10px] font-extrabold text-blue-700">
                  PDF · PNG · JPG
                </span>
              </div>

              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Transaction Validation
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Mathematical consistency checks.
                  </p>
                </div>

                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700">
                  ENABLED
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ===================================================
          ADD USER MODAL
      =================================================== */}

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Add User
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Create a new application user.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleAddUser}
              className="space-y-4 p-6"
            >
              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Name
                </label>

                <input
                  type="text"
                  value={newUser.name}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter user name"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="user@universalbank.com"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Role
                </label>

                <select
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[#11152a] px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;