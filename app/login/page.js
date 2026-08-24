"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-semibold text-ink">Bozos United</div>
          <div className="text-sm text-inksoft mt-1">Sign in to your wedding planning hub</div>
        </div>
        <form onSubmit={submit} className="bg-card border border-line rounded-xl p-5 space-y-3">
          <div>
            <label className="text-xs text-inksoft">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full mt-1 text-sm rounded-lg px-3 py-2 border border-line"
            />
          </div>
          <div>
            <label className="text-xs text-inksoft">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full mt-1 text-sm rounded-lg px-3 py-2 border border-line"
            />
          </div>
          {error && <div className="text-xs text-red-700">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-medium bg-ink text-cream rounded-lg py-2.5 mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <div className="text-center text-xs text-inksoft mt-4">
          New to the family?{" "}
          <Link href="/signup" className="underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
