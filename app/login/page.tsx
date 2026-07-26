"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const params = useSearchParams(); const requestedRole = params.get("role") || "customer"; const [role, setRole] = useState(requestedRole); const [email, setEmail] = useState(`${requestedRole}@pintuevent.my.id`);
  function submit(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem("pintuevent_session", JSON.stringify({ id: `demo-${role}`, email, role, status: "active" }));
    location.href = params.get("returnTo") || (role === "customer" ? "/dashboard" : `/${role}`);
  }
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><a href="/" className="portal-brand"><Image src="/pintuevent-favicon.png" alt="" width={44} height={44} /> PintuEvent</a><span className="demo-chip">Mode demo</span><h1>Masuk ke PintuEvent</h1><p>Supabase Auth akan digunakan otomatis setelah environment dikonfigurasi.</p><label>Role<select value={role} onChange={(e)=>{setRole(e.target.value);setEmail(`${e.target.value}@pintuevent.my.id`)}}><option value="customer">Customer</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input type="password" defaultValue="pintuevent-demo" required /></label><button className="portal-button">Masuk</button><small>Akun demo tidak membuat transaksi nyata.</small></form></main>;
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
