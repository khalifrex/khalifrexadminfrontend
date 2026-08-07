"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { KeyRound, MailCheck } from "lucide-react";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL;
const LOGO =
  "https://res.cloudinary.com/khalifrex/image/upload/v1762704364/logo_ufb5hc.png";

export default function AdminRegister() {
  const [form, setForm] = useState({
    registrationKey: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const router = useRouter();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const input =
    "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(`${BACKEND}/admin/register-admin`, form, {
        withCredentials: true,
      });
      setVerifying(true);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await axios.post(
        `${BACKEND}/verify-email`,
        { email: form.email, code },
        { withCredentials: true },
      );
      router.push("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await axios.post(`${BACKEND}/resend-verification`, { email: form.email });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <Image
            src={LOGO}
            alt="Khalifrex"
            width={140}
            height={40}
            className="object-contain"
            priority
          />
        </div>

        {!verifying ? (
          <>
            <h1 className="text-xl font-semibold mb-6 text-center text-gray-900">
              Admin registration
            </h1>
            {error && (
              <p className="text-red-600 mb-4 text-sm text-center">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="First name"
                  value={form.firstName}
                  onChange={set("firstName")}
                  required
                  className={input}
                />
                <input
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={set("lastName")}
                  required
                  className={input}
                />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={set("email")}
                required
                className={input}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={set("password")}
                required
                className={input}
              />
              <div className="border-t border-gray-100 pt-4">
                <label className="text-sm font-medium text-gray-700 mb-1 inline-flex items-center gap-1.5">
                  <KeyRound size={14} /> Registration key
                </label>
                <input
                  type="password"
                  placeholder="Admin registration key"
                  value={form.registrationKey}
                  onChange={set("registrationKey")}
                  required
                  className={input}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Registering…" : "Register admin"}
              </button>
            </form>
            <p className="text-sm text-gray-500 text-center mt-5">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-gray-900 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <MailCheck className="text-gray-700" size={32} />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-center text-gray-900">
              Verify your email
            </h1>
            <p className="text-sm text-gray-600 text-center mb-6">
              We sent a 6-digit code to{" "}
              <span className="font-medium">{form.email}</span>
            </p>
            {error && (
              <p className="text-red-600 mb-4 text-sm text-center">{error}</p>
            )}
            <form onSubmit={handleVerify} className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                placeholder="000000"
                required
                className={`${input} text-center text-2xl tracking-widest font-mono`}
              />
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify email"}
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="w-full text-sm text-gray-500 hover:underline"
              >
                Resend code
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
