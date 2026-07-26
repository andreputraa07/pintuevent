"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import Image from "next/image";
import {
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Settings,
  ShieldCheck,
  Ticket,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  authorizeSession,
  getAccessSession,
  signOut,
} from "@/src/services/authorization";

type OperationsRole = "organizer" | "admin";

type MenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

type DashboardConfig = {
  title: string;
  base: string;
  menu: MenuItem[];
  stats: Array<{ label: string; value: string }>;
};

const configs: Record<OperationsRole, DashboardConfig> = {
  organizer: {
    title: "Dashboard Organizer",
    base: "/organizer",
    menu: [
      { label: "Ringkasan", path: "", icon: LayoutDashboard },
      { label: "Event Saya", path: "events", icon: CalendarDays },
      { label: "Penjualan", path: "sales", icon: BarChart3 },
      { label: "Peserta", path: "attendees", icon: Users },
      { label: "Check-in", path: "check-in", icon: ScanLine },
      { label: "Keuangan", path: "finance", icon: CircleDollarSign },
      { label: "Promo", path: "promotions", icon: Ticket },
      { label: "Tim", path: "team", icon: Users },
      { label: "Profil", path: "profile", icon: Settings },
    ],
    stats: [
      { label: "Total event", value: "12" },
      { label: "Tiket terjual", value: "2.648" },
      { label: "Pendapatan", value: "Rp386 jt" },
      { label: "Check-in", value: "428" },
    ],
  },
  admin: {
    title: "Dashboard Admin",
    base: "/admin",
    menu: [
      { label: "Ringkasan", path: "", icon: LayoutDashboard },
      { label: "Pengguna", path: "users", icon: Users },
      { label: "Organizer", path: "organizers", icon: ShieldCheck },
      {
        label: "Verifikasi Event",
        path: "event-verifications",
        icon: ShieldCheck,
      },
      { label: "Pesanan", path: "orders", icon: Ticket },
      { label: "Pembayaran", path: "payments", icon: CircleDollarSign },
      { label: "Refund", path: "refunds", icon: CircleDollarSign },
      {
        label: "Withdrawal",
        path: "withdrawals",
        icon: CircleDollarSign,
      },
      { label: "Kategori", path: "categories", icon: CalendarDays },
      { label: "Audit Log", path: "audit-logs", icon: ShieldCheck },
      { label: "Pengaturan", path: "settings", icon: Settings },
    ],
    stats: [
      { label: "Total pengguna", value: "52.481" },
      { label: "Event published", value: "1.284" },
      { label: "Nilai transaksi", value: "Rp2,8 M" },
      { label: "Perlu ditinjau", value: "18" },
    ],
  },
};

export default function OperationsDashboard({
  role,
  segments = [],
}: {
  role: OperationsRole;
  segments?: string[];
}) {
  const config = configs[role];
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const section = segments.join("/");
  const workspaceName =
    role === "admin" ? "Platform Admin" : "PintuEvent Studio";

  useEffect(() => {
    getAccessSession()
      .then((session) => {
        const access = authorizeSession(session, role);
        if (!access.allowed) {
          const target =
            access.redirect === "/login"
              ? `/login?role=${role}&returnTo=${encodeURIComponent(location.pathname)}`
              : (access.redirect ?? "/unauthorized");
          location.replace(target);
          return;
        }
        setReady(true);
      })
      .catch(() => location.replace("/login"));
  }, [role]);

  if (!ready) {
    return (
      <div className="loading-portal">
        <p>Memeriksa akses {role}...</p>
      </div>
    );
  }

  return (
    <div className="portal-shell">
      <aside className={`portal-sidebar ${open ? "open" : ""}`}>
        <a className="portal-brand" href="/">
          <Image src="/pintuevent-favicon.png" alt="" width={38} height={38} />
          PintuEvent
        </a>
        <button
          type="button"
          className="portal-close"
          aria-label="Tutup navigasi"
          onClick={() => setOpen(false)}
        >
          <X />
        </button>
        <nav aria-label={`Navigasi ${role}`}>
          {config.menu.map(({ label, path, icon: Icon }) => (
            <a
              className={section === path ? "active" : ""}
              href={path ? `${config.base}/${path}` : config.base}
              key={label}
              onClick={() => setOpen(false)}
            >
              <Icon />
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          className="portal-logout"
          onClick={async () => {
            await signOut();
            location.href = "/";
          }}
        >
          <LogOut />
          Keluar
        </button>
      </aside>

      <div className="portal-main">
        <header className="portal-header">
          <button
            type="button"
            aria-label="Buka navigasi"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <small>{role}</small>
            <strong>{workspaceName}</strong>
          </div>
          <span className="portal-avatar">
            {role === "admin" ? "AD" : "OR"}
          </span>
        </header>

        <div className="demo-banner">
          <strong>Mode demo</strong> · Operasi sensitif aktif setelah Supabase
          dan RLS diterapkan.
        </div>

        <main className="portal-content">
          <div className="portal-title">
            <small>{role}</small>
            <h1>{section ? titleCase(section) : config.title}</h1>
            <p>Data operasional dan navigasi berbasis permission.</p>
          </div>
          <div className="portal-stats">
            {config.stats.map(({ label, value }) => (
              <article key={label}>
                <BarChart3 />
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <section className="portal-panel">
            <div className="panel-heading">
              <h2>{section ? "Daftar dan tindakan" : "Aktivitas terbaru"}</h2>
              <span className="status-badge status-active">Aktif</span>
            </div>
            <OperationsTable role={role} />
          </section>
        </main>
      </div>
    </div>
  );
}

function OperationsTable({ role }: { role: OperationsRole }) {
  const rows =
    role === "organizer"
      ? [
          {
            name: "Jakarta Music Festival",
            status: "Published",
            detail: "834 tiket",
          },
          {
            name: "Festival Kreatif Nusantara",
            status: "Draft",
            detail: "490 tiket",
          },
          {
            name: "Workshop Melukis",
            status: "Menunggu verifikasi",
            detail: "28 tiket",
          },
        ]
      : [
          {
            name: "Organizer Nusantara",
            status: "Menunggu verifikasi",
            detail: "26 Jul 2026",
          },
          {
            name: "Jakarta Music Festival",
            status: "Review event",
            detail: "26 Jul 2026",
          },
          {
            name: "Refund PE-2026-00018",
            status: "Under Review",
            detail: "25 Jul 2026",
          },
        ];

  return (
    <div className="portal-list">
      {rows.map((row) => (
        <article className="order-row portal-panel" key={row.name}>
          <strong>{row.name}</strong>
          <span>{row.status}</span>
          <small>{row.detail}</small>
          <button type="button">Lihat</button>
        </article>
      ))}
    </div>
  );
}

function titleCase(value: string) {
  return value
    .split(/[/-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
