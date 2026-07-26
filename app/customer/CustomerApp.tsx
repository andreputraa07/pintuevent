"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-html-link-for-pages */

import Image from "next/image";
import QRCode from "react-qr-code";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Bell, CalendarDays, ChevronRight, Heart, Home, LogOut, MapPin, Menu,
  Settings, ShoppingBag, Tag, Ticket, User, WalletCards, X,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { getCustomerSnapshot } from "@/src/services/customerService";
import { validateAvatar } from "@/src/services/profileService";
import { authorizeSession, getAccessSession, signOut } from "@/src/services/authorization";

type Snapshot = Awaited<ReturnType<typeof getCustomerSnapshot>>;
type View = "overview" | "tickets" | "ticket" | "orders" | "order" | "favorites" | "vouchers" | "notifications" | "profile" | "settings" | "checkout" | "payment" | "payment-success";

const menu = [
  ["overview", "Ringkasan", "/dashboard", Home],
  ["tickets", "Tiket Saya", "/dashboard/tickets", Ticket],
  ["orders", "Pesanan Saya", "/dashboard/orders", ShoppingBag],
  ["favorites", "Event Favorit", "/dashboard/favorites", Heart],
  ["vouchers", "Voucher Saya", "/dashboard/vouchers", Tag],
  ["notifications", "Notifikasi", "/dashboard/notifications", Bell],
  ["profile", "Profil", "/dashboard/profile", User],
  ["settings", "Pengaturan", "/dashboard/settings", Settings],
] as const;

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getAccessSession().then((session) => {
      if (!session) window.location.replace(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
      else setReady(true);
    }).catch(() => window.location.replace("/login"));
  }, []);
  return ready ? children : <LoadingSkeleton label="Memeriksa sesi..." />;
}

export function RoleBasedRoute({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    getAccessSession().then((session) => {
      const access = authorizeSession(session, "customer");
      if (!access.allowed) window.location.replace(access.redirect!);
      else setAllowed(true);
    }).catch(() => window.location.replace("/login"));
  }, []);
  return allowed ? children : <LoadingSkeleton label="Memeriksa hak akses..." />;
}

export default function CustomerApp({ view, resourceId }: { view: View; resourceId?: string }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { getCustomerSnapshot("demo-customer").then(setData).catch((e) => setError(e.message)); }, []);
  return (
    <ProtectedRoute><RoleBasedRoute>
      <CustomerDashboardLayout view={view}>
        {error ? <ErrorState message={error} /> : !data ? <LoadingSkeleton /> : (
          <CustomerView data={data} view={view} resourceId={resourceId} />
        )}
      </CustomerDashboardLayout>
    </RoleBasedRoute></ProtectedRoute>
  );
}

function CustomerDashboardLayout({ view, children }: { view: View; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const active = menu.find(([key]) => key === view)?.[0] || "overview";
  return <div className="portal-shell">
    <aside className={`portal-sidebar ${open ? "open" : ""}`}>
      <a className="portal-brand" href="/"><Image src="/pintuevent-favicon.png" alt="" width={38} height={38} /> PintuEvent</a>
      <button className="portal-close" onClick={() => setOpen(false)}><X /></button>
      <nav>{menu.map(([key, label, href, Icon]) => <a key={key} href={href} className={active === key ? "active" : ""}><Icon />{label}</a>)}</nav>
      <button className="portal-logout" onClick={async () => { await signOut(); location.href = "/"; }}><LogOut /> Keluar</button>
    </aside>
    <div className="portal-main">
      <header className="portal-header"><button onClick={() => setOpen(true)}><Menu /></button><div><small>Customer</small><strong>André Putra</strong></div><span className="portal-avatar">AP</span></header>
      {dataModeBanner()}
      <main className="portal-content">{children}</main>
      <nav className="portal-mobile-nav">{menu.slice(0, 4).map(([key, label, href, Icon]) => <a key={key} href={href} className={active === key ? "active" : ""}><Icon /><span>{label}</span></a>)}</nav>
    </div>
  </div>;
}

function dataModeBanner() {
  return <div className="demo-banner"><strong>Mode demo</strong> · Hubungkan Supabase untuk data akun dan transaksi nyata.</div>;
}

function CustomerView({ data, view, resourceId }: { data: Snapshot; view: View; resourceId?: string }) {
  if (view === "tickets") return <TicketsPage data={data} />;
  if (view === "ticket") return <TicketDetail ticket={data.tickets.find((item: any) => item.id === resourceId) || data.tickets[0]} />;
  if (view === "orders") return <OrdersPage data={data} />;
  if (view === "order") return <OrderDetail order={data.orders.find((item: any) => item.id === resourceId) || data.orders[0]} />;
  if (view === "favorites") return <EventCards events={data.events.slice(0, 2)} favorite />;
  if (view === "vouchers") return <VoucherPage vouchers={data.vouchers} />;
  if (view === "notifications") return <NotificationPage notifications={data.notifications} />;
  if (view === "profile") return <ProfilePage profile={data.profile} />;
  if (view === "settings") return <SettingsPage />;
  if (view === "checkout") return <CheckoutPage event={data.events.find((item: any) => item.slug === resourceId) || data.events[0]} />;
  if (view === "payment") return <PaymentPage orderId={resourceId || "demo"} />;
  if (view === "payment-success") return <PaymentSuccess orderId={resourceId || "demo"} />;
  return <Overview data={data} />;
}

function Overview({ data }: { data: Snapshot }) {
  const stats = [
    ["Tiket aktif", data.tickets.length, Ticket], ["Event mendatang", 2, CalendarDays],
    ["Belum dibayar", data.orders.filter((o: any) => o.status === "pending").length, WalletCards], ["Favorit", 2, Heart],
  ] as const;
  return <><PageTitle eyebrow="Dashboard Customer" title="Selamat datang, André!" description="Semua tiket, pesanan, dan event favoritmu dalam satu tempat." />
    <div className="portal-stats">{stats.map(([label, value, Icon]) => <article key={label}><Icon /><span>{label}</span><strong>{value}</strong></article>)}</div>
    <section className="portal-panel"><div className="panel-heading"><div><small>Event terdekat</small><h2>{data.events[0].title}</h2></div><StatusBadge status="Aktif" /></div>
      <div className="next-event"><Image src={data.events[0].image} alt="" width={180} height={110} /><div><p><CalendarDays />{data.events[0].date}</p><p><MapPin />{data.events[0].location}</p><a className="portal-button" href="/dashboard/tickets/tkt-1">Buka tiket <ChevronRight /></a></div></div>
    </section>
    <section><div className="panel-heading"><h2>Rekomendasi event</h2><a href="/#event-pilihan">Lihat semua</a></div><EventCards events={data.events} /></section>
  </>;
}

function TicketsPage({ data }: { data: Snapshot }) {
  return <><PageTitle eyebrow="Tiket Saya" title="Tiket digital" description="QR tiket hanya ditampilkan kepada pemilik akun." /><div className="tab-row">{["Aktif", "Mendatang", "Selesai", "Dibatalkan", "Refunded"].map((x, i) => <button className={i === 0 ? "active" : ""} key={x}>{x}</button>)}</div>
    <div className="portal-grid">{data.tickets.map((ticket: any) => <TicketCard key={ticket.id} ticket={ticket} />)}</div></>;
}
function TicketCard({ ticket }: { ticket: any }) {
  return <article className="portal-card ticket-card"><Image src={ticket.event.image} alt="" width={420} height={180} /><div><StatusBadge status={ticket.status} /><h3>{ticket.event.title}</h3><p>{ticket.type} · {ticket.attendee}</p><code>{ticket.code}</code><a className="portal-button" href={`/dashboard/tickets/${ticket.id}`}>Lihat tiket</a></div></article>;
}
function TicketDetail({ ticket }: { ticket: any }) {
  return <><PageTitle eyebrow="Detail Tiket" title={ticket.event.title} description="Tunjukkan QR ini kepada petugas saat check-in." /><section className="portal-panel ticket-detail"><div className="qr-box"><QRCode value={ticket.qrValue} size={220} /><code>{ticket.code}</code></div><div><StatusBadge status="active" /><h2>{ticket.attendee}</h2><p>{ticket.type}</p><hr/><p><CalendarDays /> {ticket.event.date}</p><p><MapPin /> {ticket.event.location}</p><button className="portal-button" onClick={() => window.print()}>Cetak / Simpan PDF</button></div></section></>;
}
function OrdersPage({ data }: { data: Snapshot }) { return <><PageTitle eyebrow="Pesanan Saya" title="Riwayat transaksi" description="Status pembayaran dan tiket dari akunmu." /><div className="portal-list">{data.orders.map((order: any) => <OrderCard key={order.id} order={order} />)}</div></>; }
function OrderCard({ order }: { order: any }) { return <article className="portal-panel order-row"><div><small>{order.number}</small><h3>{order.event.title}</h3><p>{order.createdAt} · {order.quantity} tiket</p></div><div><StatusBadge status={order.status} /><strong>{formatCurrency(order.total)}</strong><a href={`/dashboard/orders/${order.id}`}>Detail</a></div></article>; }
function OrderDetail({ order }: { order: any }) { return <><PageTitle eyebrow={order.number} title={order.event.title} description="Rincian pesanan dan pembayaran." /><section className="portal-panel summary-lines"><p><span>Status</span><StatusBadge status={order.status} /></p><p><span>Metode</span><strong>{order.payment}</strong></p><p><span>Jumlah tiket</span><strong>{order.quantity}</strong></p><p className="total"><span>Total</span><strong>{formatCurrency(order.total)}</strong></p>{order.status === "pending" && <a className="portal-button" href={`/payment/${order.id}`}>Bayar sekarang</a>}</section></>; }
function EventCards({ events, favorite = false }: { events: any[]; favorite?: boolean }) { return events.length ? <div className="portal-grid">{events.map((event) => <article className="portal-card" key={event.id}><div className="card-image"><Image src={event.image} alt="" fill /><button className="favorite-mini" aria-label="Favorit"><Heart fill={favorite ? "currentColor" : "none"} /></button></div><div><small>{event.category}</small><h3>{event.title}</h3><p><CalendarDays />{event.date}</p><p><MapPin />{event.city}</p><strong>{formatCurrency(event.price)}</strong><a className="portal-button" href={`/checkout/${event.slug}`}>Beli tiket</a></div></article>)}</div> : <EmptyState title="Belum ada event" />; }
function VoucherPage({ vouchers }: { vouchers: any[] }) { return <><PageTitle eyebrow="Voucher Saya" title="Hemat di event favorit" description="Voucher aktif dan riwayat penggunaan." /><div className="portal-grid">{vouchers.map((v) => <article className="voucher-card" key={v.id}><Tag /><small>Diskon hingga</small><strong>{v.value}%</strong><code>{v.code}</code><p>Min. {formatCurrency(v.minimum)} · s.d. {v.validUntil}</p></article>)}</div></>; }
function NotificationPage({ notifications }: { notifications: any[] }) { const [items, setItems] = useState(notifications); return <><PageTitle eyebrow="Notifikasi" title="Kabar terbaru" description="Pembaruan transaksi dan event." /><button className="text-button" onClick={() => setItems(items.map((x) => ({ ...x, read: true })))}>Tandai semua dibaca</button><div className="portal-list">{items.map((n) => <article key={n.id} className={`notification-item ${n.read ? "" : "unread"}`}><Bell /><div><h3>{n.title}</h3><p>{n.body}</p><small>{n.createdAt}</small></div></article>)}</div></>; }

const profileSchema = z.object({ full_name: z.string().min(3, "Nama minimal 3 karakter"), phone: z.string().min(9, "Nomor telepon tidak valid") });
function ProfilePage({ profile }: { profile: any }) {
  const [notice, setNotice] = useState(""); const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { full_name: profile.full_name, phone: profile.phone } });
  return <><PageTitle eyebrow="Profil" title="Informasi pribadi" description="Email hanya dapat diubah melalui alur autentikasi aman." /><form className="portal-panel profile-form" onSubmit={handleSubmit(() => setNotice("Profil berhasil diperbarui."))}><div className="avatar-upload">{preview ? <Image src={preview} alt="Preview avatar" width={90} height={90} unoptimized /> : <span>AP</span>}<label>Ganti avatar<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; const error = validateAvatar(file); if (error) setNotice(error); else if (file) setPreview(URL.createObjectURL(file)); }} /></label><small>JPG, PNG, WebP · maks. 2 MB</small></div><label>Nama lengkap<input {...register("full_name")} />{errors.full_name && <em>{String(errors.full_name.message)}</em>}</label><label>Email<input value={profile.email} disabled /></label><label>Nomor telepon<input {...register("phone")} />{errors.phone && <em>{String(errors.phone.message)}</em>}</label><button className="portal-button">Simpan perubahan</button>{notice && <p className="form-notice">{notice}</p>}</form></>;
}
function SettingsPage() { return <><PageTitle eyebrow="Pengaturan" title="Preferensi akun" description="Atur notifikasi dan keamanan akun." /><section className="portal-panel settings-list">{["Email transaksi", "Pengingat event", "Promo pilihan", "Notifikasi perubahan jadwal"].map((x) => <label key={x}><span>{x}</span><input type="checkbox" defaultChecked /></label>)}</section></>; }
function CheckoutPage({ event }: { event: any }) { const [qty, setQty] = useState(1); const [step, setStep] = useState(1); const total = qty * event.price; return <><PageTitle eyebrow="Checkout aman" title={event.title} description={`Langkah ${step} dari 5`} /><div className="checkout-layout"><section className="portal-panel"><CheckoutStepper current={step} /><h2>{["Pilih tiket", "Data pemesan", "Data peserta", "Voucher", "Pembayaran"][step - 1]}</h2>{step === 1 && <TicketQuantitySelector quantity={qty} setQuantity={setQty} remaining={event.quota - event.sold} />}{step === 2 && <div className="simple-form"><input defaultValue="André Putra" /><input defaultValue="customer@pintuevent.my.id" /><input defaultValue="0812-0000-2026" /></div>}{step === 3 && <div className="simple-form">{Array.from({ length: qty }).map((_, i) => <input key={i} placeholder={`Nama peserta ${i + 1}`} />)}</div>}{step === 4 && <div className="voucher-input"><input placeholder="Kode voucher" /><button>Terapkan</button></div>}{step === 5 && <p>Simulasi pembayaran aktif. Total dihitung ulang oleh RPC pada mode Supabase.</p>}<div className="checkout-actions"><button disabled={step === 1} onClick={() => setStep(step - 1)}>Kembali</button>{step < 5 ? <button className="portal-button" onClick={() => setStep(step + 1)}>Lanjut</button> : <a className="portal-button" href="/payment/demo-order">Buat pesanan</a>}</div></section><PaymentSummary subtotal={total} /></div></>; }
function CheckoutStepper({ current }: { current: number }) { return <div className="stepper">{[1,2,3,4,5].map((x) => <span className={x <= current ? "active" : ""} key={x}>{x}</span>)}</div>; }
function TicketQuantitySelector({ quantity, setQuantity, remaining }: { quantity: number; setQuantity: (x: number) => void; remaining: number }) { return <div className="quantity"><button disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>−</button><strong>{quantity}</strong><button disabled={quantity >= Math.min(5, remaining)} onClick={() => setQuantity(quantity + 1)}>+</button><small>Sisa {remaining} tiket · maks. 5</small></div>; }
function PaymentSummary({ subtotal }: { subtotal: number }) { const fee = Math.round(subtotal * .05); return <aside className="portal-panel payment-summary"><h2>Ringkasan</h2><p><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></p><p><span>Biaya layanan</span><strong>{formatCurrency(fee)}</strong></p><p className="total"><span>Total</span><strong>{formatCurrency(subtotal + fee)}</strong></p></aside>; }
function PaymentPage({ orderId }: { orderId: string }) { return <><PageTitle eyebrow="Simulasi pembayaran" title={`Pesanan ${orderId}`} description="Hanya tersedia untuk development hingga provider pembayaran terhubung." /><section className="portal-panel payment-actions"><a className="portal-button" href={`/payment-success/${orderId}`}>Simulasikan pembayaran berhasil</a><button>Simulasikan pembayaran gagal</button><button>Simulasikan pembayaran kedaluwarsa</button></section></>; }
function PaymentSuccess({ orderId }: { orderId: string }) { return <section className="success-state"><Ticket /><h1>Pembayaran berhasil</h1><p>Pesanan {orderId} telah diproses secara idempotent.</p><a className="portal-button" href="/dashboard/tickets">Lihat tiket</a></section>; }

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="portal-title"><small>{eyebrow}</small><h1>{title}</h1><p>{description}</p></div>; }
export function StatusBadge({ status }: { status: string }) { return <span className={`status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>; }
export function EmptyState({ title }: { title: string }) { return <div className="empty-portal"><Ticket /><h3>{title}</h3><p>Data akan muncul di sini setelah tersedia.</p></div>; }
export function ErrorState({ message }: { message: string }) { return <div className="error-portal"><h3>Terjadi kesalahan</h3><p>{message}</p><button onClick={() => location.reload()}>Coba lagi</button></div>; }
export function LoadingSkeleton({ label = "Memuat data customer..." }: { label?: string }) { return <div className="loading-portal"><span /><span /><span /><p>{label}</p></div>; }
function formatCurrency(value: number) { return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value); }
