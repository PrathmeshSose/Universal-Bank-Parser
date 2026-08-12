import React, { useState } from "react";

export default function Login({ onLogin, onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();

    ```
if (!email.trim() || !password.trim()) {
  return;
}

onLogin({
  email: email.trim(),
  password,
});
```

  };

  return (<div className="min-h-screen bg-[#f6f7fb] flex items-center justify-center px-4"> <div className="w-full max-w-md"> <div className="mb-8 text-center"> <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#11152a] text-2xl shadow-lg">
    🏦 </div>

    ```
    <h1 className="text-2xl font-black tracking-tight text-slate-900">
      Universal Bank Parser
    </h1>

    <p className="mt-2 text-sm text-slate-500">
      AI-powered bank statement processing
    </p>
  </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
          Secure Workspace
        </p>

        <h2 className="mt-2 text-2xl font-black text-slate-900">
          Welcome back
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Sign in to continue to your banking workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 block text-xs font-bold text-slate-700"
          >
            Email address
          </label>

          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block text-xs font-bold text-slate-700"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-20 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#11152a] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.99]"
        >
          Sign In
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          New here?
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={onRegister}
        className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
      >
        Create an account
      </button>
    </div>

    <p className="mt-6 text-center text-[11px] text-slate-400">
      Your financial documents are processed securely.
    </p>
  </div>
  </div>

  );
}
