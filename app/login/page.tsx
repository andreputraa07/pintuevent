"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { normalizeRole, signIn, signUp } from "@/src/services/authorization";
import { safeReturnTo } from "@/src/services/navigation";

type AccessRole = "customer" | "organizer" | "admin";

function LoginForm() {
  const params = useSearchParams();
  const requestedRole = normalizeRole(params.get("role")) as AccessRole;
  const [role, setRole] = useState<AccessRole>(requestedRole);
  const [email, setEmail] = useState(`${requestedRole}@pintuevent.my.id`);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const form = event.currentTarget;
      const password = (form.elements.namedItem("password") as HTMLInputElement)
        .value;

      if (registering) {
        const fullName = (
          form.elements.namedItem("fullName") as HTMLInputElement
        ).value;
        await signUp(email, password, fullName);
        location.href = "/dashboard";
        return;
      }

      const session = await signIn(email, password, role);
      const fallback =
        session.role === "customer" ? "/dashboard" : `/${session.role}`;
      location.href = safeReturnTo(params.get("returnTo"), fallback);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Login gagal.",
      );
      setBusy(false);
    }
  }

  function selectRole(value: string) {
    const nextRole = normalizeRole(value) as AccessRole;
    setRole(nextRole);
    setEmail(`${nextRole}@pintuevent.my.id`);
  }

  function toggleRegistration() {
    setRegistering((current) => !current);
    setRole("customer");
    setEmail("customer@pintuevent.my.id");
    setError("");
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <a href="/" className="portal-brand">
          <Image src="/pintuevent-favicon.png" alt="" width={44} height={44} />
          PintuEvent
        </a>
        <span className="demo-chip">Mode demo</span>
        <h1>{registering ? "Daftar Customer" : "Masuk ke PintuEvent"}</h1>
        <p>
          Supabase Auth digunakan otomatis setelah environment dikonfigurasi.
        </p>

        {registering && (
          <label>
            Nama lengkap
            <input name="fullName" minLength={3} required />
          </label>
        )}

        {!registering && (
          <label>
            Role
            <select
              value={role}
              onChange={(event) => selectRole(event.target.value)}
            >
              <option value="customer">Customer</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            defaultValue="pintuevent-demo"
            minLength={8}
            required
          />
        </label>

        {error && <p className="form-notice">{error}</p>}

        <button className="portal-button" disabled={busy || !hydrated}>
          {!hydrated
            ? "Menyiapkan..."
            : busy
              ? "Memproses..."
              : registering
                ? "Daftar"
                : "Masuk"}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={toggleRegistration}
        >
          {registering ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
        </button>
        <small>Akun demo tidak membuat transaksi nyata.</small>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="auth-page">Menyiapkan login...</main>}>
      <LoginForm />
    </Suspense>
  );
}
