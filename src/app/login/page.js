"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { LockKeyholeIcon, Mail, ShieldCheck } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const LOGO =
  "https://res.cloudinary.com/khalifrex/image/upload/v1784754383/khalifrex-seller-icon_zroemv.png";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [code, setCode] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKEND}/admin/login`,
        { email, password },
        { withCredentials: true },
      );
      if (res.data.requiresTwoFactor) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND}/verify-2fa`,
        { email, code, accountType: "admin", loginAs: "admin" },
        { withCredentials: true },
      );
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await axios.post(
        `${BACKEND}/resend-2fa`,
        { email, accountType: "admin" },
        { withCredentials: true },
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md min-h-[520px] bg-white rounded-xl shadow-sm border border-gray-200 p-10">
        <div className="flex justify-center mb-3">
          <Image
            src={LOGO}
            alt="Khalifrex"
            width={85}
            height={40}
            className="object-contain"
            priority
          />
        </div>
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            {requires2FA ? "Two-Factor Authentication" : "Welcome Back"}
          </h1>
          <p className="text-sm text-gray-700">
            {requires2FA
              ? `Enter the code sent to ${email}`
              : "Sign in to continue to the Khalifrex Admin Panel"}
          </p>
        </div>
        {error && (
          <p className="text-red-600 mb-4 text-sm text-center">{error}</p>
        )}

        {!requires2FA ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05823F]"
              />
            </div>
            <div className="relative">
              <LockKeyholeIcon
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#05823F]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#05823F] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#046B34] disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="relative">
              <ShieldCheck
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                required
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-[#05823F]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-[#05823F] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#046B34] disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setCode("");
                  setError("");
                }}
                className="text-gray-500 hover:underline"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-[#05823F] hover:underline"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="text-sm text-gray-500 text-center mt-5">
          or{" "}
          <Link
            href="/register"
            className="text-blue-500 font-medium hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
