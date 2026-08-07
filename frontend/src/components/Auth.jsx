import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

import {
  loginApi,
  registerApi,
} from '../services/api';

export const Auth = ({ onLogin }) => {
  const [mode, setMode] = useState('login');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError('');
    setLoading(true);

    try {
      let response;

      if (mode === 'register') {
        response = await registerApi(
          name.trim(),
          email.trim(),
          password
        );

        // Registration successful.
        // Login immediately using the same credentials.
        response = await loginApi(
          email.trim(),
          password
        );
      } else {
        response = await loginApi(
          email.trim(),
          password
        );
      }

      if (!response || !response.token) {
        throw new Error(
          'Login succeeded but the server did not return a token.'
        );
      }

      const user =
        response.user || {
          name: name.trim(),
          email: email.trim(),
        };

      if (typeof onLogin !== 'function') {
        throw new Error(
          'Authentication is not connected to the application.'
        );
      }

      onLogin(user);

    } catch (err) {
      console.error('AUTH ERROR:', err);

      let message =
        err?.message ||
        'Authentication failed. Please try again.';

      if (
        message.toLowerCase().includes('invalid credentials')
      ) {
        message =
          'Invalid email or password.';
      }

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) =>
      current === 'login'
        ? 'register'
        : 'login'
    );

    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        {/* BRAND */}

        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl mb-5">

            <ShieldCheck className="w-9 h-9 text-white" />

          </div>

          <h1 className="text-3xl font-extrabold text-white">
            Universal Bank Parser
          </h1>

          <p className="text-slate-400 mt-2 text-sm">
            Secure financial document intelligence
          </p>

        </div>

        {/* CARD */}

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="px-7 pt-7 pb-4">

            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login'
                ? 'Welcome back'
                : 'Create your account'}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login'
                ? 'Sign in to access your workspace.'
                : 'Create an account to access the parser.'}
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mx-7 mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">

              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />

              <span>{error}</span>

            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="px-7 pb-7 space-y-4"
          >

            {mode === 'register' && (
              <div>

                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>

                <div className="relative">

                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

                  <input
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    autoComplete="name"
                    className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                    required
                  />

                </div>

              </div>
            )}

            {/* EMAIL */}

            <div>

              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div>

              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>

              <div className="relative">

                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value
                    )
                  }
                  placeholder="••••••••"
                  autoComplete={
                    mode === 'login'
                      ? 'current-password'
                      : 'new-password'
                  }
                  className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                  required
                />

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-bold rounded-lg py-3 text-sm transition shadow-lg"
            >

              {loading
                ? 'Please wait...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}

              {!loading && (
                <ArrowRight className="w-4 h-4" />
              )}

            </button>

          </form>

          {/* SWITCH */}

          <div className="border-t border-slate-100 px-7 py-5 text-center">

            <span className="text-sm text-slate-500">
              {mode === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
            </span>

            <button
              type="button"
              onClick={switchMode}
              className="ml-2 text-sm font-bold text-purple-600 hover:text-purple-700"
            >
              {mode === 'login'
                ? 'Create one'
                : 'Sign in'}
            </button>

          </div>

        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">

          <ShieldCheck className="w-4 h-4 text-emerald-400" />

          Secure JWT authentication

        </div>

      </div>

    </div>
  );
};

export default Auth;
