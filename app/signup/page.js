"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Enter your name, email, and a password of at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name.trim() } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-sm">
          <div className="font-display text-2xl font-semibold text-ink mb-2">Account created</div>
          <p className="text-sm text-inksoft mb-4">
            You're in. To start, you'll only see the guest list — Aakriti or Riley can open the Admin page
            and turn on whichever sections you should see.
          </p>
          <Link href="/login" className="text-sm underline">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-display text-3xl font-semibold text-ink">Bozos United</div>
          <div className="text-sm text-inksoft mt-1">Create your account</div>
        </div>
        <form onSubmit={submit} className="bg-card border border-line rounded-xl p-5 space-y-3">
          <div>
            <label className="text-xs text-inksoft">Your name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First name is fine"
              className="w-full mt-1 text-sm rounded-lg px-3 py-2 border border-line"
            />
          </div>
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
              placeholder="At least 6 characters"
              className="w-full mt-1 text-sm rounded-lg px-3 py-2 border border-line"
            />
          </div>
          {error && <div className="text-xs text-red-700">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-medium bg-ink text-cream rounded-lg py-2.5 mt-2"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>
        <div className="text-center text-xs text-inksoft mt-4">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
