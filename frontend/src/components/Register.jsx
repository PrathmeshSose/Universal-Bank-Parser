import React, { useState } from "react";
import {
    User,
    Mail,
    LockKeyhole,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";
import { registerApi } from "../services/api";

function Register({ onRegister, onLogin }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");


        if (!name.trim() || !email.trim() || !password) {
            setError("Please complete all required fields.");
            return;
        }

        if (password.length < 4) {
            setError("Password must contain at least 4 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            const result = await registerApi(
                name.trim(),
                email.trim(),
                password
            );

            if (!result?.success) {
                throw new Error(
                    result?.message || "Registration failed."
                );
            }

            onRegister?.(result.user);
        } catch (err) {
            console.error("Registration error:", err);

            setError(
                err?.message ||
                "Unable to create account."
            );
        } finally {
            setLoading(false);
        }


    };

    return (<div className="min-h-screen bg-slate-950 px-4 py-10"> <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center justify-center"> <div className="w-full"> <div className="mb-7 text-center"> <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-900/30"> <ShieldCheck
        size={28}
        className="text-white"
    /> </div>


        <h1 className="mt-5 text-2xl font-black tracking-tight text-white">
            Universal Bank Parser
        </h1>

        <p className="mt-2 text-sm text-slate-400">
            Create your secure workspace account
        </p>
    </div>

        <div className="rounded-2xl border border-slate-800 bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="text-2xl font-black text-slate-900">
                Create account
            </h2>

            <p className="mt-1 text-sm text-slate-500">
                Set up your account to access the parser.
            </p>

            {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
            >
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                        Name
                    </label>

                    <div className="relative">
                        <User
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Your name"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                        Email
                    </label>

                    <div className="relative">
                        <Mail
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                        Password
                    </label>

                    <div className="relative">
                        <LockKeyhole
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Create a password"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                        Confirm Password
                    </label>

                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                        placeholder="Confirm your password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading
                        ? "Creating account..."
                        : "Create Account"}

                    {!loading && (
                        <ArrowRight size={17} />
                    )}
                </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-6 text-center">
                <p className="text-sm text-slate-500">
                    Already have an account?
                </p>

                <button
                    type="button"
                    onClick={onLogin}
                    className="mt-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-700"
                >
                    Back to Sign In
                </button>
            </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-500">
            Universal Bank Parser • Secure Workspace
        </p>
    </div>
    </div>
    </div>

    );
}

export default Register;
