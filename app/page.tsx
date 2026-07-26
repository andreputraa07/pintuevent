"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CircleUserRound,
  Clock3,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Music2,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trophy,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAccessSession, signOut } from "@/src/services/authorization";

type EventItem = {
  id: number;
  slug: string;
  title: string;
  category: string;
  date: string;
  location: string;
  price: string;
  image: string;
  tag?: string;
};

type AccessSession = {
  id: string;
  email?: string;
  full_name?: string;
  role: "customer" | "organizer" | "admin";
  status: "active";
};

const categories = [
  { name: "Musik", icon: Music2, total: "128 event", color: "purple" },
  { name: "Olahraga", icon: Trophy, total: "76 event", color: "blue" },
  { name: "Seni & Budaya", icon: Palette, total: "94 event", color: "pink" },
  { name: "Workshop", icon: Sparkles, total: "53 event", color: "orange" },
  { name: "Komunitas", icon: Users, total: "61 event", color: "green" },
];

const events: EventItem[] = [
  {
    id: 1,
    slug: "jakarta-music-festival-2026",
    title: "Jakarta Music Festival 2026",
    category: "Musik",
    date: "Sab, 22 Agustus · 19.00",
    location: "Istora Senayan, Jakarta",
    price: "Rp250.000",
    image: "/assets/hero-concert.webp",
    tag: "Paling diminati",
  },
  {
    id: 2,
    slug: "festival-kreatif-nusantara",
    title: "Festival Kreatif Nusantara",
    category: "Seni & Budaya",
    date: "28–30 Agustus · 10.00",
    location: "GBK City Park, Jakarta",
    price: "Rp125.000",
    image: "/assets/festival.webp",
    tag: "Early bird",
  },
  {
    id: 3,
    slug: "workshop-melukis-kanvas",
    title: "Workshop Melukis di Atas Kanvas",
    category: "Workshop",
    date: "Min, 6 September · 10.00",
    location: "Art Space Kemang, Jakarta",
    price: "Rp350.000",
    image: "/assets/workshop.webp",
    tag: "Sisa 12 tiket",
  },
  {
    id: 4,
    slug: "bandung-creative-expo",
    title: "Bandung Creative Expo",
    category: "Komunitas",
    date: "Sab, 12 September · 09.00",
    location: "Sudirman Grand Ballroom",
    price: "Gratis",
    image: "/assets/festival.webp",
    tag: "Gratis",
  },
  {
    id: 5,
    slug: "tech-conference-indonesia",
    title: "Tech Conference Indonesia",
    category: "Workshop",
    date: "19–20 September · 08.30",
    location: "ICE BSD, Tangerang",
    price: "Rp475.000",
    image: "/assets/workshop.webp",
  },
  {
    id: 6,
    slug: "surabaya-fun-run-2026",
    title: "Surabaya Fun Run 2026",
    category: "Olahraga",
    date: "Min, 27 September · 05.30",
    location: "Tugu Pahlawan, Surabaya",
    price: "Rp150.000",
    image: "/assets/festival.webp",
  },
];

const purchaseSteps = [
  {
    title: "Temukan event",
    description:
      "Cari berdasarkan nama, kota, tanggal, atau kategori yang kamu sukai.",
    icon: Search,
  },
  {
    title: "Masuk & pilih tiket",
    description:
      "Masuk ke akun, pilih jenis tiket, lalu tentukan jumlah yang dibutuhkan.",
    icon: Ticket,
  },
  {
    title: "Lengkapi data peserta",
    description:
      "Isi data pemesan dan nama setiap peserta dengan benar sebelum melanjutkan.",
    icon: Users,
  },
  {
    title: "Periksa & bayar",
    description:
      "Gunakan voucher bila tersedia, periksa ringkasan, lalu pilih pembayaran.",
    icon: WalletCards,
  },
  {
    title: "Terima tiket QR",
    description:
      "Setelah pembayaran berhasil, tiket digital tersimpan di menu Tiket Saya.",
    icon: ShieldCheck,
  },
] as const;

function isAccessSession(value: unknown): value is AccessSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AccessSession>;
  return (
    typeof session.id === "string" &&
    session.status === "active" &&
    ["customer", "organizer", "admin"].includes(session.role ?? "")
  );
}

function dashboardHref(role: AccessSession["role"]) {
  if (role === "customer") return "/dashboard";
  return `/${role}`;
}

function Logo() {
  return (
    <a className="brand" href="#beranda" aria-label="PintuEvent beranda">
      <span className="brand-mark">
        <Image
          src="/assets/pintuevent-logo.png"
          alt=""
          width={46}
          height={46}
          priority
          unoptimized
        />
      </span>
      <span>
        Pintu<span>Event</span>
      </span>
    </a>
  );
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [session, setSession] = useState<AccessSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);
  const deferredLocation = useDeferredValue(location);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHydrated(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    getAccessSession()
      .then((currentSession) => {
        setSession(isAccessSession(currentSession) ? currentSession : null);
      })
      .catch(() => setSession(null))
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeAccountMenu(event: PointerEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function closeAccountMenuWithKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeAccountMenu);
    document.addEventListener("keydown", closeAccountMenuWithKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeAccountMenu);
      document.removeEventListener("keydown", closeAccountMenuWithKeyboard);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const visibleEvents = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase().trim();
    const normalizedLocation = deferredLocation.toLowerCase().trim();
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "Semua" || event.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${event.title} ${event.category}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesLocation =
        !normalizedLocation ||
        event.location.toLowerCase().includes(normalizedLocation);
      return matchesCategory && matchesQuery && matchesLocation;
    });
  }, [activeCategory, deferredLocation, deferredQuery]);

  function searchEvents(event: FormEvent) {
    event.preventDefault();
    document
      .querySelector("#event-pilihan")
      ?.scrollIntoView({ behavior: "smooth" });
    setNotice(
      visibleEvents.length
        ? `${visibleEvents.length} event ditemukan untukmu.`
        : "Belum ada event yang cocok. Coba kata kunci lain.",
    );
  }

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function copyPromoCode() {
    try {
      await navigator.clipboard?.writeText("PINTUMOMEN");
      setNotice("Kode PINTUMOMEN berhasil disalin!");
    } catch {
      setNotice("Kode promo: PINTUMOMEN");
    }
  }

  async function handleSignOut() {
    await signOut();
    setSession(null);
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setNotice("Kamu berhasil keluar dari akun.");
  }

  const accountDashboard = session ? dashboardHref(session.role) : "/login";
  const accountName =
    session?.full_name || session?.email?.split("@")[0] || "Pengguna";
  const accountInitials = accountName
    .split(/[\s._-]+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
  const roleLabel = session
    ? {
        customer: "Customer",
        organizer: "Organizer",
        admin: "Admin",
      }[session.role]
    : "";

  return (
    <main data-hydrated={hydrated}>
      <header className="site-header">
        <div className="container nav-wrap">
          <Logo />
          <nav className="desktop-nav" aria-label="Navigasi utama">
            <a className="active" href="#beranda">
              Beranda
            </a>
            <a href="#event-pilihan">Jelajahi Event</a>
            <a href="#kategori">Kategori</a>
            <a href="#promo">Promo</a>
            <a href="#cara-beli">Cara Beli</a>
            <a href="#buat-event">Buat Event</a>
          </nav>
          <div className="nav-actions">
            {!sessionReady ? (
              <span className="nav-auth-loading" aria-label="Memeriksa akun" />
            ) : session ? (
              <div className="account-menu" ref={accountMenuRef}>
                <button
                  className="account-trigger"
                  type="button"
                  aria-label="Buka menu akun"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((current) => !current)}
                >
                  <span className="account-avatar">{accountInitials}</span>
                  <span className="account-trigger-copy">
                    <small>{roleLabel}</small>
                    <strong>{accountName}</strong>
                  </span>
                  <ChevronDown size={17} />
                </button>
                {accountMenuOpen && (
                  <div className="account-dropdown" role="menu">
                    <div className="account-identity">
                      <span className="account-avatar large">
                        {accountInitials}
                      </span>
                      <span>
                        <strong>{accountName}</strong>
                        <small>{session.email || roleLabel}</small>
                      </span>
                    </div>
                    <a role="menuitem" href={accountDashboard}>
                      <LayoutDashboard /> Dasbor Saya
                    </a>
                    {session.role === "customer" && (
                      <>
                        <a role="menuitem" href="/dashboard/tickets">
                          <Ticket /> Tiket Saya
                        </a>
                        <a role="menuitem" href="/dashboard/orders">
                          <WalletCards /> Pesanan Saya
                        </a>
                      </>
                    )}
                    <a
                      role="menuitem"
                      href={
                        session.role === "customer"
                          ? "/dashboard/profile"
                          : `${accountDashboard}/${session.role === "admin" ? "settings" : "profile"}`
                      }
                    >
                      <CircleUserRound /> Profil & Pengaturan
                    </a>
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleSignOut}
                    >
                      <LogOut /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a className="btn btn-ghost" href="/login">
                  Masuk
                </a>
                <a className="btn btn-primary" href="/login">
                  Daftar
                </a>
              </>
            )}
          </div>
          <button
            className="menu-button"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            disabled={!hydrated}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="mobile-menu" aria-label="Navigasi mobile">
            {[
              ["Beranda", "#beranda"],
              ["Jelajahi Event", "#event-pilihan"],
              ["Kategori", "#kategori"],
              ["Promo", "#promo"],
              ["Cara Beli", "#cara-beli"],
              ["Buat Event", "#buat-event"],
              ["Bantuan", "#bantuan"],
            ].map(([item, href]) => (
              <a
                key={item}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
                <ChevronRight size={18} />
              </a>
            ))}
            {sessionReady &&
              (session ? (
                <div className="mobile-account-card">
                  <div className="mobile-account-identity">
                    <span className="account-avatar">{accountInitials}</span>
                    <span>
                      <small>{roleLabel}</small>
                      <strong>{accountName}</strong>
                    </span>
                  </div>
                  <a href={accountDashboard}>
                    <LayoutDashboard /> Dasbor Saya
                  </a>
                  {session.role === "customer" && (
                    <a href="/dashboard/tickets">
                      <Ticket /> Tiket Saya
                    </a>
                  )}
                  <button type="button" onClick={handleSignOut}>
                    <LogOut /> Keluar
                  </button>
                </div>
              ) : (
                <div className="mobile-actions">
                  <a className="btn btn-ghost" href="/login">
                    Masuk
                  </a>
                  <a className="btn btn-primary" href="/login">
                    Daftar Gratis
                  </a>
                </div>
              ))}
          </nav>
        )}
      </header>

      <section className="hero" id="beranda">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={16} /> Jelajahi pengalaman baru
            </div>
            <h1>
              Temukan event yang bikin momen <span>tak terlupakan.</span>
            </h1>
            <p>
              Dari konser paling seru hingga workshop inspiratif—semua tiket
              favoritmu ada dalam satu pintu.
            </p>
            <form className="search-panel" onSubmit={searchEvents}>
              <label>
                <span>Event apa?</span>
                <div>
                  <Search size={19} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari event atau artis"
                  />
                </div>
              </label>
              <label>
                <span>Lokasi</span>
                <div>
                  <MapPin size={19} />
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Semua kota"
                  />
                </div>
              </label>
              <label className="date-field">
                <span>Tanggal</span>
                <div>
                  <CalendarDays size={19} />
                  <input type="date" aria-label="Pilih tanggal event" />
                </div>
              </label>
              <button className="search-button" type="submit">
                Cari Event <ArrowRight size={18} />
              </button>
            </form>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>R</span>
                <span>D</span>
                <span>A</span>
                <span>+</span>
              </div>
              <p>
                <strong>50.000+</strong> pencinta event sudah bergabung
              </p>
            </div>
          </div>
          <div
            className="hero-visual"
            aria-label="Suasana event pilihan PintuEvent"
          >
            <div className="main-photo">
              <Image
                src="/assets/hero-concert.webp"
                alt="Penonton menikmati konser dengan pencahayaan ungu"
                fill
                priority
                unoptimized
                sizes="(max-width: 900px) 100vw, 46vw"
              />
              <div className="photo-badge">
                <Ticket size={17} /> 2.000+ event aktif
              </div>
            </div>
            <div className="side-photos">
              <div>
                <Image
                  src="/assets/festival.webp"
                  alt="Teman-teman menikmati festival luar ruang"
                  fill
                  unoptimized
                  sizes="(max-width: 900px) 45vw, 20vw"
                />
              </div>
              <div>
                <Image
                  src="/assets/workshop.webp"
                  alt="Peserta mengikuti workshop kreatif"
                  fill
                  unoptimized
                  sizes="(max-width: 900px) 45vw, 20vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Keunggulan PintuEvent">
        <div className="container trust-grid">
          <div>
            <ShieldCheck />
            <span>
              <strong>Tiket resmi & aman</strong>
              <small>100% terverifikasi</small>
            </span>
          </div>
          <div>
            <WalletCards />
            <span>
              <strong>Pembayaran mudah</strong>
              <small>Banyak pilihan pembayaran</small>
            </span>
          </div>
          <div>
            <CircleHelp />
            <span>
              <strong>Dukungan pelanggan</strong>
              <small>Siap membantu 24/7</small>
            </span>
          </div>
        </div>
      </section>

      <section className="section purchase-guide" id="cara-beli">
        <div className="container">
          <div className="purchase-guide-heading">
            <div>
              <span className="kicker">Mudah, aman, dan transparan</span>
              <h2>Cara beli tiket di PintuEvent</h2>
              <p>
                Ikuti lima langkah sederhana ini. Status pesanan dan tiket
                digitalmu selalu dapat dilihat dari menu akun.
              </p>
            </div>
            <div className="purchase-guide-actions">
              <a className="btn btn-primary" href="#event-pilihan">
                Pilih Event <ArrowRight size={18} />
              </a>
              <a
                className="btn btn-ghost"
                href={
                  session ? accountDashboard : "/login?returnTo=%2Fdashboard"
                }
              >
                {session ? "Buka Akun Saya" : "Masuk untuk Membeli"}
              </a>
            </div>
          </div>
          <ol className="purchase-steps" aria-label="Alur pembelian tiket">
            {purchaseSteps.map(({ title, description, icon: Icon }, index) => (
              <li key={title}>
                <span className="purchase-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="purchase-step-icon">
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
                {index < purchaseSteps.length - 1 && (
                  <ChevronRight
                    className="purchase-step-arrow"
                    aria-hidden="true"
                  />
                )}
              </li>
            ))}
          </ol>
          <div className="purchase-guide-note">
            <ShieldCheck />
            <div>
              <strong>Tiket tersimpan aman di akunmu</strong>
              <p>
                Buka <b>Akun → Tiket Saya</b> untuk melihat QR tiket. Tunjukkan
                QR tersebut kepada petugas saat check-in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section categories-section" id="kategori">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="kicker">Temukan kesukaanmu</span>
              <h2>Jelajahi berdasarkan kategori</h2>
            </div>
            <a href="#event-pilihan">
              Lihat semua <ArrowRight size={17} />
            </a>
          </div>
          <div className="category-grid">
            {categories.map(({ name, icon: Icon, total, color }, index) => (
              <button
                key={name}
                className={`category-card ${color}${activeCategory === name ? " is-active" : ""}`}
                aria-pressed={activeCategory === name}
                onClick={() => {
                  setActiveCategory(name);
                  document
                    .querySelector("#event-pilihan")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="category-orb" aria-hidden="true" />
                <span className="category-top">
                  <span className="category-icon">
                    <Icon />
                  </span>
                  <span className="category-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="category-copy">
                  <strong>{name}</strong>
                  <small>{total} tersedia</small>
                </span>
                <span className="category-arrow">
                  <span>Jelajahi</span>
                  <ArrowRight size={17} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section event-section" id="event-pilihan">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="kicker">Paling ramai minggu ini</span>
              <h2>Event pilihan untukmu</h2>
            </div>
            <a href="#event-pilihan">
              Lihat semua <ArrowRight size={17} />
            </a>
          </div>
          <div className="filter-chips" aria-label="Filter kategori">
            {["Semua", ...categories.map((category) => category.name)].map(
              (name) => (
                <button
                  key={name}
                  className={activeCategory === name ? "active" : ""}
                  onClick={() => setActiveCategory(name)}
                >
                  {name}
                </button>
              ),
            )}
          </div>
          {visibleEvents.length ? (
            <div className="event-grid">
              {visibleEvents.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-image">
                    <Image
                      src={event.image}
                      alt=""
                      fill
                      unoptimized
                      sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw"
                    />
                    <span className="event-category">{event.category}</span>
                    {event.tag && (
                      <span className="event-tag">{event.tag}</span>
                    )}
                    <button
                      className={`favorite-button ${favorites.includes(event.id) ? "active" : ""}`}
                      onClick={() => toggleFavorite(event.id)}
                      aria-label={
                        favorites.includes(event.id)
                          ? `Hapus ${event.title} dari favorit`
                          : `Simpan ${event.title} ke favorit`
                      }
                    >
                      <Heart
                        fill={
                          favorites.includes(event.id) ? "currentColor" : "none"
                        }
                      />
                    </button>
                  </div>
                  <div className="event-content">
                    <div className="event-date">
                      <CalendarDays size={16} /> {event.date}
                    </div>
                    <h3>{event.title}</h3>
                    <p>
                      <MapPin size={16} /> {event.location}
                    </p>
                    <div className="event-footer">
                      <div>
                        <small>Mulai dari</small>
                        <strong>{event.price}</strong>
                      </div>
                      <a
                        aria-label={`Beli tiket ${event.title}`}
                        href={`/checkout/${event.slug}`}
                      >
                        <ArrowRight size={19} />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search />
              <h3>Event belum ditemukan</h3>
              <p>Coba ubah kata kunci, lokasi, atau pilihan kategori.</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setQuery("");
                  setLocation("");
                  setActiveCategory("Semua");
                }}
              >
                Reset pencarian
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="section promo-section" id="promo">
        <div className="container promo-card">
          <div className="promo-copy">
            <span className="promo-pill">
              <Clock3 size={15} /> Promo terbatas
            </span>
            <h2>
              Lebih banyak cerita,
              <br />
              lebih hemat <span>20%.</span>
            </h2>
            <p>
              Gunakan kode <strong>PINTUMOMEN</strong> untuk event pilihan dan
              nikmati pengalaman terbaikmu.
            </p>
            <button className="btn btn-light" onClick={copyPromoCode}>
              Salin kode promo <ArrowRight size={18} />
            </button>
          </div>
          <div className="promo-ticket" aria-label="Voucher diskon 20 persen">
            <div className="ticket-hole top" />
            <div className="ticket-hole bottom" />
            <span>PINTUEVENT SPECIAL</span>
            <strong>20%</strong>
            <small>OFF</small>
            <code>PINTUMOMEN</code>
          </div>
        </div>
      </section>

      <section className="section organizer-section" id="buat-event">
        <div className="container organizer-card">
          <div>
            <span className="kicker light">Untuk organizer</span>
            <h2>
              Punya event menarik?
              <br />
              Buka pintunya bersama kami.
            </h2>
            <p>
              Kelola tiket, pantau penjualan, dan sambut peserta—semuanya dari
              satu dashboard yang mudah digunakan.
            </p>
          </div>
          <div className="organizer-actions">
            <button
              className="btn btn-light"
              onClick={() => setNotice("Form organizer akan segera tersedia.")}
            >
              Mulai Buat Event <ArrowRight size={18} />
            </button>
            <span>Gratis untuk memulai · Tanpa biaya tersembunyi</span>
          </div>
        </div>
      </section>

      <footer id="bantuan">
        <div className="container footer-main">
          <div className="footer-brand">
            <Logo />
            <p>Satu pintu untuk semua pengalaman terbaikmu.</p>
          </div>
          <div>
            <h3>PintuEvent</h3>
            <a href="#event-pilihan">Jelajahi Event</a>
            <a href="#kategori">Kategori</a>
            <a href="#promo">Promo</a>
          </div>
          <div>
            <h3>Organizer</h3>
            <a href="#buat-event">Buat Event</a>
            <a href="#buat-event">Pusat Organizer</a>
            <a href="#bantuan">Panduan</a>
          </div>
          <div>
            <h3>Bantuan</h3>
            <a href="#bantuan">Pusat Bantuan</a>
            <a href="#bantuan">Syarat & Ketentuan</a>
            <a href="#bantuan">Kebijakan Privasi</a>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 PintuEvent. Semua hak dilindungi.</span>
          <span>Dibuat untuk pengalaman yang berkesan.</span>
        </div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Navigasi bawah">
        <a className="active" href="#beranda">
          <Sparkles />
          <span>Beranda</span>
        </a>
        <a href="#event-pilihan">
          <Search />
          <span>Jelajahi</span>
        </a>
        <a href="/dashboard/tickets">
          <Ticket />
          <span>Tiket Saya</span>
        </a>
        <a href="#buat-event">
          <Users />
          <span>Buat Event</span>
        </a>
      </nav>

      {notice && (
        <div className="toast" role="status">
          <ShieldCheck size={19} /> {notice}
        </div>
      )}
    </main>
  );
}
