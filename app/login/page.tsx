"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const params = useSearchParams(); const [email, setEmail] = useState("customer@pintuevent.my.id");
  function submit(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem("pintuevent_session", JSON.stringify({ id: "demo-customer", email, role: "customer", status: "active" }));
    location.href = params.get("returnTo") || "/dashboard";
  }
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><a href="/" className="portal-brand"><Image src="/pintuevent-favicon.png" alt="" width={44} height={44} /> PintuEvent</a><span className="demo-chip">Mode demo</span><h1>Masuk sebagai customer</h1><p>Supabase Auth akan digunakan otomatis setelah environment dikonfigurasi.</p><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" defaultValue="pintuevent-demo" required /></label><button className="portal-button">Masuk</button><small>Akun demo tidak membuat transaksi nyata.</small></form></main>;
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
