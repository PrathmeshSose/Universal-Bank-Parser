import React from "react";
import {
  ShieldCheck,
  Wifi,
  LogOut,
} from "lucide-react";

function Header({
  currentUser,
  onLogout,
  backendConnected = false,
}) {
  return (
    <header className="w-full">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div
        className="
          flex
          min-h-[64px]
          items-center
          justify-between
          gap-4
          border-b
          border-indigo-900/60
          bg-gradient-to-r
          from-[#111936]
          via-[#171d45]
          to-[#10152f]
          px-4
          text-white
          shadow-lg
          md:px-7
        "
      >

        {/* BRAND */}

        <div className="flex min-w-0 items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-indigo-300/20
              bg-gradient-to-br
              from-indigo-500
              to-violet-600
              shadow-lg
              shadow-indigo-900/40
            "
          >
            <span className="text-[11px] font-black tracking-tight">
              UBP
            </span>
          </div>

          <div className="min-w-0 leading-none">

            <div
              className="
                truncate
                text-base
                font-extrabold
                tracking-tight
                md:text-xl
              "
            >
              Universal Bank Parser
            </div>

            <div
              className="
                mt-1
                hidden
                text-[9px]
                font-semibold
                tracking-[0.22em]
                text-slate-400
                sm:block
              "
            >
              FINANCIAL DOCUMENT PROCESSING
            </div>

          </div>

        </div>


        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="flex shrink-0 items-center gap-2 md:gap-3">

          {/* BACKEND STATUS */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-lg
              border
              border-indigo-400/20
              bg-white/5
              px-3
              py-2
              sm:flex
            "
          >

            <Wifi
              className={`h-3.5 w-3.5 ${
                backendConnected
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            />

            <span className="text-[10px] font-bold text-slate-300">
              Backend:
            </span>

            <span
              className={`text-[10px] font-bold ${
                backendConnected
                  ? "text-emerald-300"
                  : "text-amber-300"
              }`}
            >
              {backendConnected
                ? "API Connected"
                : "API Offline"}
            </span>

          </div>


          {/* ZERO STORAGE */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-lg
              border
              border-emerald-400/20
              bg-emerald-500/10
              px-3
              py-2
              lg:flex
            "
          >

            <span
              className="
                h-2
                w-2
                rounded-full
                bg-emerald-400
                shadow
                shadow-emerald-400/60
              "
            />

            <span
              className="
                text-[10px]
                font-bold
                tracking-wide
                text-emerald-300
              "
            >
              ZERO PERMANENT STORAGE
            </span>

          </div>


          {/* USER */}

          <div
            className="
              hidden
              items-center
              gap-2
              border-l
              border-white/10
              pl-3
              md:flex
            "
          >

            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-indigo-500/20
                text-[11px]
                font-black
                text-indigo-200
              "
            >
              {(currentUser?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="max-w-[130px]">

              <p
                className="
                  truncate
                  text-[11px]
                  font-bold
                  text-white
                "
              >
                {currentUser?.name || "User"}
              </p>

              <p
                className="
                  truncate
                  text-[9px]
                  text-slate-400
                "
              >
                {currentUser?.role || "USER"}
              </p>

            </div>

          </div>


          {/* LOGOUT */}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              className="
                inline-flex
                h-9
                items-center
                gap-2
                rounded-lg
                border
                border-white/10
                bg-white/5
                px-3
                text-[10px]
                font-bold
                text-slate-300
                transition
                hover:bg-red-500/10
                hover:text-red-300
              "
            >

              <LogOut className="h-3.5 w-3.5" />

              <span className="hidden sm:inline">
                Logout
              </span>

            </button>
          )}

        </div>

      </div>


      {/* =====================================================
          SECURITY NOTICE
      ===================================================== */}

      <div
        className="
          flex
          min-h-[38px]
          items-center
          justify-center
          border-b
          border-indigo-900/50
          bg-[#171b38]
          px-4
          md:px-7
        "
      >

        <div
          className="
            flex
            items-center
            gap-2
            text-center
            text-[9px]
            text-slate-300
            sm:text-[10px]
            md:text-[11px]
          "
        >

          <ShieldCheck
            className="
              h-3.5
              w-3.5
              shrink-0
              text-emerald-400
            "
          />

          <span>

            <strong className="text-slate-200">
              Security Notice:
            </strong>{" "}

            AI Multimodal Extraction operates strictly
            in temporary server RAM. No bank statement
            PDFs or transactional records are retained
            in database storage.

          </span>

        </div>

      </div>

    </header>
  );
}

export default Header;