"use client";
/* eslint-disable @next/next/no-html-link-for-pages */
import Image from "next/image";
import { BarChart3, CalendarDays, CircleDollarSign, LayoutDashboard, LogOut, ScanLine, Settings, ShieldCheck, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { authorizeSession, getAccessSession, signOut } from "@/src/services/authorization";

const configs = {
  organizer: {
    title: "Dashboard Organizer", base: "/organizer",
    menu: [["Ringkasan","",LayoutDashboard],["Event Saya","events",CalendarDays],["Penjualan","sales",BarChart3],["Peserta","attendees",Users],["Check-in","check-in",ScanLine],["Keuangan","finance",CircleDollarSign],["Promo","promotions",Ticket],["Tim","team",Users],["Profil","profile",Settings]],
    stats: [["Total event","12"],["Tiket terjual","2.648"],["Pendapatan","Rp386 jt"],["Check-in","428"]],
  },
  admin: {
    title: "Dashboard Admin", base: "/admin",
    menu: [["Ringkasan","",LayoutDashboard],["Pengguna","users",Users],["Organizer","organizers",ShieldCheck],["Verifikasi Event","event-verifications",ShieldCheck],["Pesanan","orders",Ticket],["Pembayaran","payments",CircleDollarSign],["Refund","refunds",CircleDollarSign],["Withdrawal","withdrawals",CircleDollarSign],["Kategori","categories",CalendarDays],["Audit Log","audit-logs",ShieldCheck],["Pengaturan","settings",Settings]],
    stats: [["Total pengguna","52.481"],["Event published","1.284"],["Nilai transaksi","Rp2,8 M"],["Perlu ditinjau","18"]],
  },
} as const;

export default function OperationsDashboard({ role, segments=[] }: { role:keyof typeof configs; segments?:string[] }) {
  const cfg=configs[role]; const [ready,setReady]=useState(false); const section=segments.join("/")||"";
  useEffect(() => {
    getAccessSession().then((session) => {
      const access=authorizeSession(session,role);
      if (!access.allowed) {
        const target=access.redirect==="/login"?`/login?role=${role}&returnTo=${encodeURIComponent(location.pathname)}`:access.redirect!;
        location.replace(target);
      } else setReady(true);
    }).catch(() => location.replace("/login"));
  }, [role]);
  if(!ready) return <div className="loading-portal"><p>Memeriksa akses {role}...</p></div>;
  return <div className="portal-shell">
    <aside className="portal-sidebar"><a className="portal-brand" href="/"><Image src="/pintuevent-favicon.png" alt="" width={38} height={38}/>PintuEvent</a>
      <nav>{cfg.menu.map(([label,path,Icon])=><a className={section===path?"active":""} href={`${cfg.base}/${path}`} key={label}><Icon/>{label}</a>)}</nav>
      <button className="portal-logout" onClick={async()=>{await signOut();location.href="/"}}><LogOut/>Keluar</button>
    </aside>
    <div className="portal-main"><header className="portal-header"><div><small>{role}</small><strong>{role==="admin"?"Platform Admin":"PintuEvent Studio"}</strong></div><span className="portal-avatar">{role==="admin"?"AD":"OR"}</span></header>
      <div className="demo-banner"><strong>Mode demo</strong> · Operasi sensitif aktif setelah Supabase dan RLS diterapkan.</div>
      <main className="portal-content"><div className="portal-title"><small>{role}</small><h1>{section?titleCase(section):cfg.title}</h1><p>Data operasional dan navigasi berbasis permission.</p></div>
        <div className="portal-stats">{cfg.stats.map(([label,value])=><article key={label}><BarChart3/><span>{label}</span><strong>{value}</strong></article>)}</div>
        <section className="portal-panel"><div className="panel-heading"><h2>{section?"Daftar dan tindakan":"Aktivitas terbaru"}</h2><span className="status-badge status-active">Aktif</span></div><OperationsTable role={role}/></section>
      </main>
    </div>
  </div>;
}
function OperationsTable({role}:{role:"organizer"|"admin"}) {
  const rows=role==="organizer"?[["Jakarta Music Festival","Published","834 tiket"],["Festival Kreatif Nusantara","Draft","490 tiket"],["Workshop Melukis","Menunggu verifikasi","28 tiket"]]:[["Organizer Nusantara","Menunggu verifikasi","26 Jul 2026"],["Jakarta Music Festival","Review event","26 Jul 2026"],["Refund PE-2026-00018","Under Review","25 Jul 2026"]];
  return <div className="portal-list">{rows.map(r=><article className="order-row portal-panel" key={r[0]}><strong>{r[0]}</strong><span>{r[1]}</span><small>{r[2]}</small><button>Lihat</button></article>)}</div>;
}
function titleCase(value:string){return value.split(/[/-]/).map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ")}
