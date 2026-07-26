"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { signIn, signUp } from "@/src/services/authorization";

function LoginForm() {
  const params = useSearchParams(); const requestedRole = params.get("role") || "customer"; const [role, setRole] = useState(requestedRole); const [email, setEmail] = useState(`${requestedRole}@pintuevent.my.id`);
  const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const [registering,setRegistering]=useState(false); const [hydrated,setHydrated]=useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);setError("");
    try {
      const password=(event.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
      if(registering){await signUp(email,password,(event.currentTarget.elements.namedItem("fullName") as HTMLInputElement).value);location.href="/dashboard";return}
      const session=await signIn(email,password,role);
      location.href=params.get("returnTo")||(session.role==="customer"?"/dashboard":`/${session.role}`);
    } catch(error) {
      setError(error instanceof Error?error.message:"Login gagal.");setBusy(false);
    }
  }
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><a href="/" className="portal-brand"><Image src="/pintuevent-favicon.png" alt="" width={44} height={44} /> PintuEvent</a><span className="demo-chip">Mode demo</span><h1>{registering?"Daftar Customer":"Masuk ke PintuEvent"}</h1><p>Supabase Auth digunakan otomatis setelah environment dikonfigurasi.</p>{registering&&<label>Nama lengkap<input name="fullName" minLength={3} required /></label>}{!registering&&<label>Role<select value={role} onChange={(e)=>{setRole(e.target.value);setEmail(`${e.target.value}@pintuevent.my.id`)}}><option value="customer">Customer</option><option value="organizer">Organizer</option><option value="admin">Admin</option></select></label>}<label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label>Password<input name="password" type="password" defaultValue="pintuevent-demo" minLength={8} required /></label>{error&&<p className="form-notice">{error}</p>}<button className="portal-button" disabled={busy||!hydrated}>{!hydrated?"Menyiapkan...":busy?"Memproses...":registering?"Daftar":"Masuk"}</button><button type="button" className="text-button" onClick={()=>{setRegistering(!registering);setRole("customer")}}>{registering?"Sudah punya akun? Masuk":"Belum punya akun? Daftar"}</button><small>Akun demo tidak membuat transaksi nyata.</small></form></main>;
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
