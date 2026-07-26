"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Clock3,
  Heart,
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
import { FormEvent, useDeferredValue, useMemo, useState } from "react";

type EventItem = {
  id: number;
  title: string;
  category: string;
  date: string;
  location: string;
  price: string;
  image: string;
  tag?: string;
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
    title: "Tech Conference Indonesia",
    category: "Workshop",
    date: "19–20 September · 08.30",
    location: "ICE BSD, Tangerang",
    price: "Rp475.000",
    image: "/assets/workshop.webp",
  },
  {
    id: 6,
    title: "Surabaya Fun Run 2026",
    category: "Olahraga",
    date: "Min, 27 September · 05.30",
    location: "Tugu Pahlawan, Surabaya",
    price: "Rp150.000",
    image: "/assets/festival.webp",
  },
];

function Logo() {
  return (
    <a className="brand" href="#beranda" aria-label="PintuEvent beranda">
      <span className="brand-mark">
        <Image src="/assets/pintuevent-logo.png" alt="" width={46} height={46} priority unoptimized />
      </span>
      <span>Pintu<span>Event</span></span>
    </a>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [notice, setNotice] = useState("");
  const deferredQuery = useDeferredValue(query);
  const deferredLocation = useDeferredValue(location);

  const visibleEvents = useMemo(() => {
    const normalizedQuery = deferredQuery.toLowerCase().trim();
    const normalizedLocation = deferredLocation.toLowerCase().trim();
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "Semua" || event.category === activeCategory;
      const matchesQuery =
        !normalizedQuery ||
        `${event.title} ${event.category}`.toLowerCase().includes(normalizedQuery);
      const matchesLocation =
        !normalizedLocation ||
        event.location.toLowerCase().includes(normalizedLocation);
      return matchesCategory && matchesQuery && matchesLocation;
    });
  }, [activeCategory, deferredLocation, deferredQuery]);

  function searchEvents(event: FormEvent) {
    event.preventDefault();
    document.querySelector("#event-pilihan")?.scrollIntoView({ behavior: "smooth" });
    setNotice(
      visibleEvents.length
        ? `${visibleEvents.length} event ditemukan untukmu.`
        : "Belum ada event yang cocok. Coba kata kunci lain.",
    );
    window.setTimeout(() => setNotice(""), 3500);
  }

  function toggleFavorite(id: number) {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <main>
      <header className="site-header">
        <div className="container nav-wrap">
          <Logo />
          <nav className="desktop-nav" aria-label="Navigasi utama">
            <a className="active" href="#beranda">Beranda</a>
            <a href="#event-pilihan">Jelajahi Event</a>
            <a href="#kategori">Kategori</a>
            <a href="#promo">Promo</a>
            <a href="#buat-event">Buat Event</a>
            <a href="#bantuan">Bantuan</a>
          </nav>
          <div className="nav-actions">
            <a className="btn btn-ghost" href="/login">
              Masuk
            </a>
            <a className="btn btn-primary" href="/login">
              Daftar
            </a>
          </div>
          <button
            className="menu-button"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="mobile-menu" aria-label="Navigasi mobile">
            {["Beranda", "Jelajahi Event", "Kategori", "Promo", "Buat Event", "Bantuan"].map((item) => (
              <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} onClick={() => setMobileMenuOpen(false)}>
                {item}<ChevronRight size={18} />
              </a>
            ))}
            <div className="mobile-actions">
              <a className="btn btn-ghost" href="/login">Masuk</a>
              <a className="btn btn-primary" href="/login">Daftar Gratis</a>
            </div>
          </nav>
        )}
      </header>

      <section className="hero" id="beranda">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={16} /> Jelajahi pengalaman baru</div>
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
                <div><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari event atau artis" /></div>
              </label>
              <label>
                <span>Lokasi</span>
                <div><MapPin size={19} /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Semua kota" /></div>
              </label>
              <label className="date-field">
                <span>Tanggal</span>
                <div><CalendarDays size={19} /><input type="date" aria-label="Pilih tanggal event" /></div>
              </label>
              <button className="search-button" type="submit">Cari Event <ArrowRight size={18} /></button>
            </form>
            <div className="hero-proof">
              <div className="avatar-stack" aria-hidden="true">
                <span>R</span><span>D</span><span>A</span><span>+</span>
              </div>
              <p><strong>50.000+</strong> pencinta event sudah bergabung</p>
            </div>
          </div>
          <div className="hero-visual" aria-label="Suasana event pilihan PintuEvent">
            <div className="main-photo">
              <Image src="/assets/hero-concert.webp" alt="Penonton menikmati konser dengan pencahayaan ungu" fill priority unoptimized sizes="(max-width: 900px) 100vw, 46vw" />
              <div className="photo-badge"><Ticket size={17} /> 2.000+ event aktif</div>
            </div>
            <div className="side-photos">
              <div><Image src="/assets/festival.webp" alt="Teman-teman menikmati festival luar ruang" fill unoptimized sizes="(max-width: 900px) 45vw, 20vw" /></div>
              <div><Image src="/assets/workshop.webp" alt="Peserta mengikuti workshop kreatif" fill unoptimized sizes="(max-width: 900px) 45vw, 20vw" /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Keunggulan PintuEvent">
        <div className="container trust-grid">
          <div><ShieldCheck /><span><strong>Tiket resmi & aman</strong><small>100% terverifikasi</small></span></div>
          <div><WalletCards /><span><strong>Pembayaran mudah</strong><small>Banyak pilihan pembayaran</small></span></div>
          <div><CircleHelp /><span><strong>Dukungan pelanggan</strong><small>Siap membantu 24/7</small></span></div>
        </div>
      </section>

      <section className="section categories-section" id="kategori">
        <div className="container">
          <div className="section-heading">
            <div><span className="kicker">Temukan kesukaanmu</span><h2>Jelajahi berdasarkan kategori</h2></div>
            <a href="#event-pilihan">Lihat semua <ArrowRight size={17} /></a>
          </div>
          <div className="category-grid">
            {categories.map(({ name, icon: Icon, total, color }, index) => (
              <button
                key={name}
                className={`category-card ${color}${activeCategory === name ? " is-active" : ""}`}
                aria-pressed={activeCategory === name}
                onClick={() => { setActiveCategory(name); document.querySelector("#event-pilihan")?.scrollIntoView({ behavior: "smooth" }); }}
              >
                <span className="category-orb" aria-hidden="true" />
                <span className="category-top">
                  <span className="category-icon"><Icon /></span>
                  <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
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
            <div><span className="kicker">Paling ramai minggu ini</span><h2>Event pilihan untukmu</h2></div>
            <a href="#event-pilihan">Lihat semua <ArrowRight size={17} /></a>
          </div>
          <div className="filter-chips" aria-label="Filter kategori">
            {["Semua", ...categories.map((category) => category.name)].map((name) => (
              <button key={name} className={activeCategory === name ? "active" : ""} onClick={() => setActiveCategory(name)}>{name}</button>
            ))}
          </div>
          {visibleEvents.length ? (
            <div className="event-grid">
              {visibleEvents.map((event) => (
                <article className="event-card" key={event.id}>
                  <div className="event-image">
                    <Image src={event.image} alt="" fill unoptimized sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                    <span className="event-category">{event.category}</span>
                    {event.tag && <span className="event-tag">{event.tag}</span>}
                    <button
                      className={`favorite-button ${favorites.includes(event.id) ? "active" : ""}`}
                      onClick={() => toggleFavorite(event.id)}
                      aria-label={favorites.includes(event.id) ? `Hapus ${event.title} dari favorit` : `Simpan ${event.title} ke favorit`}
                    >
                      <Heart fill={favorites.includes(event.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="event-content">
                    <div className="event-date"><CalendarDays size={16} /> {event.date}</div>
                    <h3>{event.title}</h3>
                    <p><MapPin size={16} /> {event.location}</p>
                    <div className="event-footer">
                      <div><small>Mulai dari</small><strong>{event.price}</strong></div>
                      <a aria-label={`Beli tiket ${event.title}`} href={`/checkout/${event.title.toLowerCase().replaceAll(" ", "-").replaceAll("2026", "2026")}`}><ArrowRight size={19} /></a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Search /><h3>Event belum ditemukan</h3><p>Coba ubah kata kunci, lokasi, atau pilihan kategori.</p>
              <button className="btn btn-primary" onClick={() => { setQuery(""); setLocation(""); setActiveCategory("Semua"); }}>Reset pencarian</button>
            </div>
          )}
        </div>
      </section>

      <section className="section promo-section" id="promo">
        <div className="container promo-card">
          <div className="promo-copy">
            <span className="promo-pill"><Clock3 size={15} /> Promo terbatas</span>
            <h2>Lebih banyak cerita,<br />lebih hemat <span>20%.</span></h2>
            <p>Gunakan kode <strong>PINTUMOMEN</strong> untuk event pilihan dan nikmati pengalaman terbaikmu.</p>
            <button className="btn btn-light" onClick={() => { navigator.clipboard?.writeText("PINTUMOMEN"); setNotice("Kode PINTUMOMEN berhasil disalin!"); }}>Salin kode promo <ArrowRight size={18} /></button>
          </div>
          <div className="promo-ticket" aria-label="Voucher diskon 20 persen">
            <div className="ticket-hole top" /><div className="ticket-hole bottom" />
            <span>PINTUEVENT SPECIAL</span><strong>20%</strong><small>OFF</small><code>PINTUMOMEN</code>
          </div>
        </div>
      </section>

      <section className="section organizer-section" id="buat-event">
        <div className="container organizer-card">
          <div>
            <span className="kicker light">Untuk organizer</span>
            <h2>Punya event menarik?<br />Buka pintunya bersama kami.</h2>
            <p>Kelola tiket, pantau penjualan, dan sambut peserta—semuanya dari satu dashboard yang mudah digunakan.</p>
          </div>
          <div className="organizer-actions">
            <button className="btn btn-light" onClick={() => setNotice("Form organizer akan segera tersedia.")}>Mulai Buat Event <ArrowRight size={18} /></button>
            <span>Gratis untuk memulai · Tanpa biaya tersembunyi</span>
          </div>
        </div>
      </section>

      <footer id="bantuan">
        <div className="container footer-main">
          <div className="footer-brand"><Logo /><p>Satu pintu untuk semua pengalaman terbaikmu.</p></div>
          <div><h3>PintuEvent</h3><a href="#event-pilihan">Jelajahi Event</a><a href="#kategori">Kategori</a><a href="#promo">Promo</a></div>
          <div><h3>Organizer</h3><a href="#buat-event">Buat Event</a><a href="#buat-event">Pusat Organizer</a><a href="#bantuan">Panduan</a></div>
          <div><h3>Bantuan</h3><a href="#bantuan">Pusat Bantuan</a><a href="#bantuan">Syarat & Ketentuan</a><a href="#bantuan">Kebijakan Privasi</a></div>
        </div>
        <div className="container footer-bottom"><span>© 2026 PintuEvent. Semua hak dilindungi.</span><span>Dibuat untuk pengalaman yang berkesan.</span></div>
      </footer>

      <nav className="mobile-bottom-nav" aria-label="Navigasi bawah">
        <a className="active" href="#beranda"><Sparkles /><span>Beranda</span></a>
        <a href="#event-pilihan"><Search /><span>Jelajahi</span></a>
        <a href="/dashboard/tickets"><Ticket /><span>Tiket Saya</span></a>
        <a href="#buat-event"><Users /><span>Buat Event</span></a>
      </nav>

      {notice && <div className="toast" role="status"><ShieldCheck size={19} /> {notice}</div>}
    </main>
  );
}
