import { useState, useEffect, useRef, useCallback } from "react";

// ─── PERSISTENT STORAGE HELPERS ─────────────────────────────────────────────
const STORAGE_KEYS = {
  photos: "luminary:photos",
  albums: "luminary:albums",
  requests: "luminary:requests",
  messages: "luminary:messages",
  notifications: "luminary:notifications",
  likes: "luminary:likes",
};

async function dbGet(key) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : null;
  } catch { return null; }
}
async function dbSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_PHOTOS = [
  { id: "p1", title: "Golden Hour", album: "a1", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", date: "2024-06-15", tags: ["nature", "sunset"], likes: 12 },
  { id: "p2", title: "City Lights", album: "a1", url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", thumb: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400", date: "2024-07-20", tags: ["city", "night"], likes: 8 },
  { id: "p3", title: "Morning Fog", album: "a2", url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", thumb: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", date: "2024-08-01", tags: ["mountain", "fog"], likes: 23 },
  { id: "p4", title: "Ocean Calm", album: "a2", url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800", thumb: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400", date: "2024-09-10", tags: ["ocean", "calm"], likes: 15 },
  { id: "p5", title: "Forest Path", album: "a3", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400", date: "2024-10-05", tags: ["forest", "path"], likes: 19 },
  { id: "p6", title: "Desert Dunes", album: "a3", url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800", thumb: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400", date: "2024-11-12", tags: ["desert", "travel"], likes: 31 },
  { id: "p7", title: "Starry Night", album: "a1", url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800", thumb: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400", date: "2024-12-01", tags: ["stars", "night"], likes: 44 },
  { id: "p8", title: "Cherry Blossoms", album: "a4", url: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800", thumb: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400", date: "2025-03-20", tags: ["spring", "japan"], likes: 56 },
  { id: "p9", title: "Rainy Window", album: "a4", url: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800", thumb: "https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400", date: "2025-01-08", tags: ["rain", "moody"], likes: 27 },
];

const SEED_ALBUMS = [
  { id: "a1", name: "Cosmos & Cities", cover: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400", count: 3 },
  { id: "a2", name: "Wild Horizons", cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", count: 2 },
  { id: "a3", name: "Earth's Palette", cover: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400", count: 2 },
  { id: "a4", name: "Quiet Moments", cover: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400", count: 2 },
];

const SEED_REQUESTS = [
  { id: "r1", photoId: "p1", photoTitle: "Golden Hour", name: "Samuel Tesfaye", from: "University friend", message: "Han, you helped me through my first year at Addis Ababa University. This photo reminds me of the evenings we'd study together. You were always the calm I needed.", social: "@samuelT", status: "pending", date: "2025-06-01T14:32:00Z" },
  { id: "r2", photoId: "p7", photoTitle: "Starry Night", name: "Meron Alemu", from: "Childhood neighbor", message: "I never got the chance to tell you how much your kindness meant to me growing up. We used to stare at the stars from the roof and dream about the future.", social: "@meron_a", status: "approved", approvedAt: "2025-06-02T10:00:00Z", expiresAt: new Date(Date.now() + 12 * 3600000).toISOString(), date: "2025-06-01T09:15:00Z" },
  { id: "r3", photoId: "p8", photoTitle: "Cherry Blossoms", name: "Abel Girma", from: "Work colleague", message: "This photo is stunning, Han. You always had an eye for beauty that most of us walk right past. Thank you for sharing your world with us.", social: "", status: "rejected", date: "2025-05-30T16:45:00Z" },
];

const SEED_MESSAGES = [
  { id: "m1", name: "Samuel Tesfaye", text: "You helped me through my first year at college. I don't think I would have made it without you.", from: "University", date: "2025-06-01" },
  { id: "m2", name: "Meron Alemu", text: "I never got the chance to say thank you. These photos remind me of our best memories together.", from: "Childhood", date: "2025-06-01" },
  { id: "m3", name: "Abel Girma", text: "You always saw the world differently. Thank you for letting us see it through your lens.", from: "Work", date: "2025-05-30" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
`;

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --void: #0a0610;
    --deep: #110d1a;
    --surface: #1a1428;
    --card: #211936;
    --border: rgba(180,140,255,0.12);
    --border-med: rgba(180,140,255,0.22);
    --purple-50: #f0ebff;
    --purple-100: #d4bfff;
    --purple-200: #b89aff;
    --purple-400: #9b6dff;
    --purple-600: #7c3aed;
    --purple-700: #6d28d9;
    --purple-800: #4c1d95;
    --rose: #ff6eb4;
    --amber: #ffd166;
    --teal: #4dd9ac;
    --text-primary: #f0ebff;
    --text-secondary: rgba(240,235,255,0.65);
    --text-muted: rgba(240,235,255,0.38);
    --glow: 0 0 40px rgba(155,109,255,0.15);
    --glow-sm: 0 0 20px rgba(155,109,255,0.12);
    --radius: 16px;
    --radius-sm: 10px;
  }

  body { background: var(--void); color: var(--text-primary); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

  .font-display { font-family: 'Cormorant Garamond', serif; }

  .grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E");
    opacity: 0.4;
  }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(10,6,16,0.82); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    padding: 0 2rem; height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; letter-spacing: 0.08em; color: var(--purple-100); }
  .nav-logo span { color: var(--purple-400); }
  .nav-actions { display: flex; gap: 0.75rem; align-items: center; }

  /* ── BUTTONS ── */
  .btn {
    padding: 0.5rem 1.25rem; border-radius: 50px; font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s ease;
    border: 1px solid transparent; display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-ghost { background: transparent; border-color: var(--border-med); color: var(--text-secondary); }
  .btn-ghost:hover { background: rgba(155,109,255,0.1); border-color: var(--purple-400); color: var(--purple-200); }
  .btn-primary { background: linear-gradient(135deg, var(--purple-600), var(--purple-800)); color: #fff; border-color: var(--purple-600); box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 30px rgba(124,58,237,0.55); }
  .btn-danger { background: rgba(220,38,38,0.15); border-color: rgba(220,38,38,0.4); color: #fca5a5; }
  .btn-danger:hover { background: rgba(220,38,38,0.25); }
  .btn-success { background: rgba(77,217,172,0.12); border-color: rgba(77,217,172,0.4); color: var(--teal); }
  .btn-success:hover { background: rgba(77,217,172,0.22); }
  .btn-sm { padding: 0.35rem 0.9rem; font-size: 0.8rem; }
  .btn-icon { padding: 0.5rem; width: 36px; height: 36px; justify-content: center; }

  /* ── CARDS ── */
  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1.5rem;
    transition: all 0.3s ease;
  }
  .card:hover { border-color: var(--border-med); box-shadow: var(--glow-sm); }
  .card-glass {
    background: rgba(33,25,54,0.6); backdrop-filter: blur(20px);
    border: 1px solid var(--border); border-radius: var(--radius);
  }

  /* ── HERO ── */
  .hero {
    min-height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    padding: 6rem 2rem 4rem; position: relative; overflow: hidden;
  }
  .hero-orbs { position: absolute; inset: 0; pointer-events: none; }
  .orb {
    position: absolute; border-radius: 50%;
    filter: blur(80px); opacity: 0.25;
    animation: pulse 8s ease-in-out infinite;
  }
  .orb-1 { width: 600px; height: 600px; top: -200px; right: -100px; background: radial-gradient(circle, #7c3aed, transparent 70%); }
  .orb-2 { width: 500px; height: 500px; bottom: -150px; left: -100px; background: radial-gradient(circle, #4c1d95, transparent 70%); animation-delay: -4s; }
  .orb-3 { width: 300px; height: 300px; top: 40%; left: 40%; background: radial-gradient(circle, #ff6eb4, transparent 70%); opacity: 0.1; animation-delay: -2s; }

  @keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.25; } 50% { transform: scale(1.1); opacity: 0.35; } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes shimmer { from { background-position: -200% center; } to { background-position: 200% center; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes modalIn { from { opacity: 0; transform: scale(0.93) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  .hero-eyebrow {
    font-size: 0.75rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--purple-400); margin-bottom: 1.5rem;
    background: linear-gradient(90deg, var(--purple-400), var(--rose), var(--purple-400));
    background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }
  .hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(3rem, 8vw, 6.5rem); font-weight: 300;
    line-height: 1.05; color: var(--purple-50); margin-bottom: 1.5rem;
    animation: fadeUp 1s ease both;
  }
  .hero-title em { font-style: italic; color: var(--purple-200); }
  .hero-subtitle {
    font-size: 1.1rem; color: var(--text-secondary); max-width: 500px;
    line-height: 1.7; margin-bottom: 2.5rem;
    animation: fadeUp 1s ease 0.2s both;
  }
  .hero-actions { display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; animation: fadeUp 1s ease 0.4s both; }

  /* ── GALLERY ── */
  .masonry {
    columns: 3; gap: 1rem;
    column-fill: balance;
  }
  @media (max-width: 900px) { .masonry { columns: 2; } }
  @media (max-width: 550px) { .masonry { columns: 1; } }

  .photo-tile {
    break-inside: avoid; margin-bottom: 1rem;
    position: relative; border-radius: var(--radius-sm); overflow: hidden;
    cursor: pointer; group: true;
  }
  .photo-tile img { width: 100%; display: block; transition: transform 0.5s ease; }
  .photo-tile:hover img { transform: scale(1.04); }
  .photo-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,6,16,0.9) 0%, transparent 60%);
    opacity: 0; transition: opacity 0.3s ease;
    display: flex; align-items: flex-end; padding: 1rem;
  }
  .photo-tile:hover .photo-overlay { opacity: 1; }
  .photo-overlay-actions { display: flex; gap: 0.5rem; width: 100%; justify-content: space-between; align-items: flex-end; }

  /* ── MODAL ── */
  .modal-backdrop {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(5,3,10,0.9); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; padding: 1rem;
  }
  .modal {
    background: var(--card); border: 1px solid var(--border-med);
    border-radius: 20px; max-height: 90vh; overflow-y: auto;
    animation: modalIn 0.3s ease both;
  }
  .modal-sm { width: 100%; max-width: 480px; }
  .modal-lg { width: 100%; max-width: 700px; }
  .modal-xl { width: 100%; max-width: 900px; }

  /* ── DASHBOARD ── */
  .sidebar {
    position: fixed; left: 0; top: 64px; bottom: 0; width: 240px;
    background: var(--deep); border-right: 1px solid var(--border);
    padding: 1.5rem 1rem; overflow-y: auto;
    display: flex; flex-direction: column; gap: 0.25rem;
  }
  .sidebar-item {
    padding: 0.6rem 1rem; border-radius: var(--radius-sm);
    display: flex; align-items: center; gap: 0.75rem;
    font-size: 0.88rem; color: var(--text-secondary); cursor: pointer;
    transition: all 0.2s; border: 1px solid transparent;
  }
  .sidebar-item:hover { background: rgba(155,109,255,0.08); color: var(--text-primary); }
  .sidebar-item.active { background: rgba(155,109,255,0.15); color: var(--purple-200); border-color: rgba(155,109,255,0.2); }
  .sidebar-item .badge {
    margin-left: auto; background: var(--purple-700); color: #fff;
    font-size: 0.7rem; padding: 1px 6px; border-radius: 50px; min-width: 18px; text-align: center;
  }
  .dashboard-content { margin-left: 240px; padding: 2rem; padding-top: calc(64px + 2rem); min-height: 100vh; }
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .dashboard-content { margin-left: 0; }
  }

  /* ── STAT CARDS ── */
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
  .stat-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1.25rem;
    position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; right: 0;
    width: 80px; height: 80px; border-radius: 50%;
    background: radial-gradient(circle, rgba(155,109,255,0.15), transparent 70%);
    transform: translate(20px, -20px);
  }
  .stat-number { font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; font-weight: 500; color: var(--purple-200); line-height: 1; }
  .stat-label { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.3rem; letter-spacing: 0.05em; text-transform: uppercase; }

  /* ── INPUT ── */
  .input-group { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
  .input-group label { font-size: 0.82rem; color: var(--text-secondary); letter-spacing: 0.03em; }
  input, textarea, select {
    width: 100%; background: rgba(255,255,255,0.05); border: 1px solid var(--border-med);
    border-radius: var(--radius-sm); padding: 0.65rem 1rem;
    color: var(--text-primary); font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
    transition: all 0.2s; outline: none;
  }
  input:focus, textarea:focus, select:focus { border-color: var(--purple-400); box-shadow: 0 0 0 3px rgba(155,109,255,0.15); }
  textarea { resize: vertical; min-height: 100px; }
  select option { background: var(--deep); }

  /* ── TAGS ── */
  .tag { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 50px; font-size: 0.75rem; }
  .tag-purple { background: rgba(155,109,255,0.15); color: var(--purple-200); border: 1px solid rgba(155,109,255,0.25); }
  .tag-pending { background: rgba(255,209,102,0.12); color: var(--amber); border: 1px solid rgba(255,209,102,0.25); }
  .tag-approved { background: rgba(77,217,172,0.12); color: var(--teal); border: 1px solid rgba(77,217,172,0.25); }
  .tag-rejected { background: rgba(220,38,38,0.1); color: #fca5a5; border: 1px solid rgba(220,38,38,0.2); }

  /* ── NOTIFICATION BELL ── */
  .notif-dot { position: absolute; top: 2px; right: 2px; width: 8px; height: 8px; background: var(--rose); border-radius: 50%; border: 2px solid var(--void); }

  /* ── SECTION ── */
  .section { padding: 6rem 2rem; max-width: 1200px; margin: 0 auto; }
  .section-title { font-family: 'Cormorant Garamond', serif; font-size: 3rem; font-weight: 300; color: var(--purple-100); margin-bottom: 0.5rem; }
  .section-sub { color: var(--text-secondary); margin-bottom: 3rem; }

  /* ── MESSAGE CARDS ── */
  .message-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 1.5rem;
    position: relative; overflow: hidden;
    transition: all 0.3s ease;
  }
  .message-card:hover { border-color: rgba(155,109,255,0.3); transform: translateY(-2px); box-shadow: 0 8px 40px rgba(155,109,255,0.12); }
  .message-card::before {
    content: '"'; position: absolute; top: -10px; left: 10px;
    font-family: 'Cormorant Garamond', serif; font-size: 8rem;
    color: rgba(155,109,255,0.08); line-height: 1; font-weight: 300;
  }
  .message-text { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 400; font-style: italic; line-height: 1.7; color: var(--purple-100); margin-bottom: 1rem; position: relative; z-index: 1; }
  .message-author { font-size: 0.8rem; color: var(--text-muted); }

  /* ── ALBUM CARD ── */
  .album-card {
    position: relative; border-radius: var(--radius); overflow: hidden;
    aspect-ratio: 4/3; cursor: pointer;
    transition: transform 0.3s ease;
  }
  .album-card:hover { transform: scale(1.02); }
  .album-card img { width: 100%; height: 100%; object-fit: cover; }
  .album-card-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(10,6,16,0.85) 0%, rgba(10,6,16,0.2) 50%, transparent 100%);
    padding: 1.25rem; display: flex; flex-direction: column; justify-content: flex-end;
  }

  /* ── UPLOAD ZONE ── */
  .upload-zone {
    border: 2px dashed var(--border-med); border-radius: var(--radius);
    padding: 3rem; text-align: center; cursor: pointer;
    transition: all 0.3s ease; background: rgba(155,109,255,0.03);
  }
  .upload-zone:hover, .upload-zone.drag-over {
    border-color: var(--purple-400); background: rgba(155,109,255,0.08);
  }

  /* ── LIGHTBOX ── */
  .lightbox {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(5,3,10,0.97);
    display: flex; align-items: center; justify-content: center;
  }
  .lightbox img { max-width: 90vw; max-height: 85vh; border-radius: var(--radius-sm); object-fit: contain; }
  .lightbox-close { position: absolute; top: 1.5rem; right: 1.5rem; }
  .lightbox-info { position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); text-align: center; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--void); }
  ::-webkit-scrollbar-thumb { background: rgba(155,109,255,0.3); border-radius: 3px; }

  /* ── LOADING ── */
  .spinner { width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--purple-400); border-radius: 50%; animation: spin 0.8s linear infinite; }

  /* ── TOAST ── */
  .toast-container { position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 500; display: flex; flex-direction: column; gap: 0.5rem; }
  .toast {
    background: var(--card); border: 1px solid var(--border-med);
    padding: 0.75rem 1.25rem; border-radius: var(--radius-sm);
    font-size: 0.88rem; display: flex; align-items: center; gap: 0.6rem;
    animation: fadeUp 0.3s ease both; min-width: 240px; max-width: 320px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  }
  .toast-success { border-color: rgba(77,217,172,0.35); }
  .toast-error { border-color: rgba(220,38,38,0.35); }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: linear-gradient(to right, transparent, var(--border-med), transparent); margin: 2rem 0; }

  /* ── LOGIN ── */
  .login-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; position: relative; }
  .login-card { width: 100%; max-width: 400px; background: var(--card); border: 1px solid var(--border-med); border-radius: 24px; padding: 2.5rem; }

  /* ── NOTIFICATION PANEL ── */
  .notif-panel {
    position: absolute; top: 100%; right: 0; margin-top: 0.5rem;
    width: 320px; background: var(--card); border: 1px solid var(--border-med);
    border-radius: var(--radius); overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: fadeUp 0.2s ease;
  }
  .notif-item { padding: 0.9rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.85rem; cursor: pointer; }
  .notif-item:hover { background: rgba(155,109,255,0.06); }
  .notif-item:last-child { border-bottom: none; }

  /* ── MISC ── */
  .flex-center { display: flex; align-items: center; justify-content: center; }
  .flex-between { display: flex; align-items: center; justify-content: space-between; }
  .gap-1 { gap: 0.5rem; } .gap-2 { gap: 1rem; } .gap-3 { gap: 1.5rem; }
  .mt-1 { margin-top: 0.5rem; } .mt-2 { margin-top: 1rem; } .mt-3 { margin-top: 1.5rem; }
  .mb-1 { margin-bottom: 0.5rem; } .mb-2 { margin-bottom: 1rem; } .mb-3 { margin-bottom: 1.5rem; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
  .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
  .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; }
  .text-muted { color: var(--text-muted); }
  .text-secondary { color: var(--text-secondary); }
  .text-purple { color: var(--purple-400); }
  .text-sm { font-size: 0.85rem; }
  .text-xs { font-size: 0.75rem; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .w-full { width: 100%; }
  .relative { position: relative; }
`;

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
let toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span style={{ fontSize: "1rem" }}>{t.type === "success" ? "✦" : "✗"}</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── TIME HELPERS ─────────────────────────────────────────────────────────────
function timeAgo(iso) {
  const d = new Date(iso); const now = new Date();
  const s = Math.floor((now - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function isExpired(iso) { return new Date(iso) < new Date(); }

function formatExpiry(iso) {
  if (!iso) return "";
  const d = new Date(iso); const now = new Date();
  const diff = d - now;
  if (diff < 0) return "expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

// ── Download Request Modal ──
function RequestModal({ photo, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", from: "", message: "", social: "" });
  const [loading, setLoading] = useState(false);
  const up = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async () => {
    if (!form.name || !form.from || !form.message) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    onSubmit({ ...form, photoId: photo.id, photoTitle: photo.title });
    setLoading(false);
  };
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" style={{ padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(155,109,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: "1.5rem" }}>✦</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", fontWeight: 400, color: "var(--purple-100)", marginBottom: "0.5rem" }}>Tell Han something</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Before saving <em style={{ color: "var(--purple-300)" }}>{photo.title}</em>, share something you'd like to say.
          </p>
        </div>
        <div className="divider" style={{ margin: "1rem 0" }} />
        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: 1.7 }}>
          Ideas: your honest impression of him · a memory you share · something you've always wanted to say · where you know him from
        </div>
        <div className="input-group">
          <label>Full name *</label>
          <input placeholder="Your name" value={form.name} onChange={up("name")} />
        </div>
        <div className="input-group">
          <label>Where do you know Han from? *</label>
          <input placeholder="e.g. University, work, childhood..." value={form.from} onChange={up("from")} />
        </div>
        <div className="input-group">
          <label>Message to Han *</label>
          <textarea placeholder="Write something meaningful..." value={form.message} onChange={up("message")} style={{ minHeight: 120 }} />
        </div>
        <div className="input-group">
          <label>Social media <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
          <input placeholder="@username" value={form.social} onChange={up("social")} />
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary w-full" onClick={submit} disabled={loading || !form.name || !form.from || !form.message}
            style={{ opacity: (!form.name || !form.from || !form.message) ? 0.5 : 1 }}>
            {loading ? <><div className="spinner" />&nbsp;Sending…</> : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──
function Lightbox({ photo, onClose, onSave, approved }) {
  return (
    <div className="lightbox" onClick={e => e.target === e.currentTarget && onClose()}>
      <button className="btn btn-ghost btn-icon lightbox-close" onClick={onClose} style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}>✕</button>
      <img src={photo.url} alt={photo.title} />
      <div className="lightbox-info">
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", color: "var(--purple-100)", marginBottom: "0.5rem" }}>{photo.title}</p>
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>{photo.date}</p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          {approved ? (
            <a href={photo.url} download className="btn btn-success btn-sm">⬇ Download</a>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onSave}>✦ Request Save</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Photo Tile ──
function PhotoTile({ photo, onClick, onSave, liked, onLike, approved }) {
  return (
    <div className="photo-tile" onClick={() => onClick(photo)}>
      <img src={photo.thumb} alt={photo.title} loading="lazy" style={{ borderRadius: "10px" }} />
      <div className="photo-overlay">
        <div className="photo-overlay-actions">
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#fff" }}>{photo.title}</p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{photo.date}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onLike(photo.id)}
              style={{ color: liked ? "var(--rose)" : "rgba(255,255,255,0.7)", borderColor: liked ? "rgba(255,110,180,0.4)" : "rgba(255,255,255,0.2)" }}>
              {liked ? "♥" : "♡"}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => onSave(photo)} style={{ fontSize: "0.75rem", padding: "0.3rem 0.75rem" }}>
              {approved ? "⬇" : "✦ Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Upload Modal ──
function UploadModal({ albums, onClose, onUpload }) {
  const [files, setFiles] = useState([]);
  const [album, setAlbum] = useState(albums[0]?.id || "");
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const handleDrop = e => {
    e.preventDefault(); setDrag(false);
    const f = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...f]);
  };
  const handleFiles = e => {
    const f = Array.from(e.target.files);
    setFiles(prev => [...prev, ...f]);
  };
  const submit = async () => {
    if (!files.length || !album) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    onUpload(files, album);
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm" style={{ padding: "2rem" }}>
        <div className="flex-between mb-2"><h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400 }}>Upload Photos</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button></div>
        <div className={`upload-zone ${drag ? "drag-over" : ""}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop} onClick={() => fileRef.current.click()}>
          <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={handleFiles} />
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem", color: "var(--purple-400)" }}>⬆</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Drop photos here or click to browse</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "0.3rem" }}>JPG, PNG, WEBP supported</p>
        </div>
        {files.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>{files.length} file(s) selected</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {files.map((f, i) => <span key={i} className="tag tag-purple">{f.name.slice(0, 18)}{f.name.length > 18 ? "…" : ""}</span>)}
            </div>
          </div>
        )}
        <div className="input-group mt-2">
          <label>Album</label>
          <select value={album} onChange={e => setAlbum(e.target.value)}>
            {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary w-full" onClick={submit} disabled={!files.length || loading}>
            {loading ? <><div className="spinner" />&nbsp;Uploading…</> : `Upload ${files.length || ""} Photo${files.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Request Detail Modal ──
function RequestDetailModal({ req, photo, onClose, onApprove, onReject }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ padding: "2rem" }}>
        <div className="flex-between mb-3">
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 400 }}>Request Details</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
          {photo && <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "4/3" }}>
            <img src={photo.thumb} alt={photo.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(155,109,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "var(--purple-200)" }}>
                {req.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p style={{ fontWeight: 500, color: "var(--text-primary)" }}>{req.name}</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{req.from}</p>
              </div>
              <span className={`tag tag-${req.status} ml-auto`} style={{ marginLeft: "auto" }}>{req.status}</span>
            </div>
            <div style={{ background: "rgba(155,109,255,0.06)", border: "1px solid var(--border)", borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontStyle: "italic", color: "var(--purple-100)", lineHeight: 1.7 }}>"{req.message}"</p>
            </div>
            {req.social && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>Social: <span style={{ color: "var(--purple-300)" }}>{req.social}</span></p>}
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Requested {timeAgo(req.date)} · Photo: {req.photoTitle}</p>
            {req.status === "approved" && req.expiresAt && (
              <p style={{ fontSize: "0.8rem", color: isExpired(req.expiresAt) ? "#fca5a5" : "var(--teal)", marginTop: "0.4rem" }}>
                ⏱ {formatExpiry(req.expiresAt)}
              </p>
            )}
          </div>
        </div>
        {req.status === "pending" && (
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
            <button className="btn btn-danger" onClick={() => onReject(req.id)}>✕ Reject</button>
            <button className="btn btn-success" onClick={() => onApprove(req.id)}>✔ Approve (24h)</button>
          </div>
        )}
        {req.status !== "pending" && (
          <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

// ── PUBLIC GALLERY ──
function GalleryPage({ photos, albums, requests, messages, onRequestDownload, likes, onLike, onAlbum, selectedAlbum, setSelectedAlbum, onLogin }) {
  const [lightbox, setLightbox] = useState(null);
  const [reqModal, setReqModal] = useState(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("gallery");
  const [sent, setSent] = useState({});

  const filtered = photos.filter(p =>
    (!selectedAlbum || p.album === selectedAlbum) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.tags || []).some(t => t.includes(search.toLowerCase())))
  );

  const isApproved = pid => {
    const r = requests.find(r => r.photoId === pid && r.status === "approved");
    return r && !isExpired(r.expiresAt);
  };

  const handleSave = (photo) => {
    if (isApproved(photo.id)) {
      const a = document.createElement("a"); a.href = photo.url; a.download = photo.title; a.click();
    } else {
      setReqModal(photo);
    }
  };

  const handleRequest = (data) => {
    onRequestDownload(data);
    setSent(s => ({ ...s, [data.photoId]: true }));
    setReqModal(null);
  };

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-orbs">
          <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        </div>
        <div className="hero-eyebrow">✦ Personal Memory Archive ✦</div>
        <h1 className="hero-title">
          Han's <em>Luminary</em>
        </h1>
        <p className="hero-subtitle">
          A private archive of moments, places, and memories — curated and preserved with intention.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={() => document.getElementById("gallery-anchor").scrollIntoView({ behavior: "smooth" })}>
            ✦ Browse Archive
          </button>
          <button className="btn btn-ghost" onClick={onLogin}>Owner Portal</button>
        </div>
        <div style={{ marginTop: "4rem", display: "flex", gap: "3rem", animation: "fadeUp 1s ease 0.6s both" }}>
          {[["Photos", photos.length], ["Albums", albums.length], ["Memories", messages.length + " shared"]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "var(--purple-200)" }}>{v}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ALBUMS */}
      <section className="section">
        <h2 className="section-title">Albums</h2>
        <p className="section-sub text-secondary">Collections of moments, grouped by memory.</p>
        <div className="grid-4">
          <div className="album-card" onClick={() => setSelectedAlbum(null)} style={{ border: !selectedAlbum ? "1px solid var(--purple-600)" : "1px solid var(--border)" }}>
            <div style={{ background: "linear-gradient(135deg, var(--purple-800), var(--deep))", width: "100%", height: "100%", borderRadius: "var(--radius)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "2rem" }}>⊞</span>
            </div>
            <div className="album-card-overlay">
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 400, color: "#fff" }}>All Photos</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{photos.length} photos</p>
            </div>
          </div>
          {albums.map(a => (
            <div key={a.id} className="album-card" onClick={() => setSelectedAlbum(a.id === selectedAlbum ? null : a.id)}
              style={{ border: selectedAlbum === a.id ? "1px solid var(--purple-600)" : "1px solid var(--border)" }}>
              <img src={a.cover} alt={a.name} />
              <div className="album-card-overlay">
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem", fontWeight: 400, color: "#fff" }}>{a.name}</p>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{photos.filter(p => p.album === a.id).length} photos</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY */}
      <div id="gallery-anchor" />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="flex-between mb-3" style={{ flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 0 }}>Archive</h2>
            {selectedAlbum && <p style={{ color: "var(--purple-400)", fontSize: "0.85rem", marginTop: "0.25rem" }}>Filtered: {albums.find(a => a.id === selectedAlbum)?.name}</p>}
          </div>
          <input placeholder="Search photos…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>◌</div>
            <p>No photos found</p>
          </div>
        ) : (
          <div className="masonry">
            {filtered.map(p => (
              <PhotoTile key={p.id} photo={p} onClick={setLightbox} onSave={() => handleSave(p)}
                liked={likes[p.id]} onLike={onLike} approved={isApproved(p.id)} />
            ))}
          </div>
        )}
      </section>

      {/* MESSAGES TO HAN */}
      <section className="section" style={{ borderTop: "1px solid var(--border)" }}>
        <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 3rem" }}>
          <div className="hero-eyebrow" style={{ animation: "none" }}>✦ From Those Who Care ✦</div>
          <h2 className="section-title" style={{ textAlign: "center" }}>Messages to Han</h2>
          <p className="section-sub" style={{ textAlign: "center" }}>Words people left behind — turned into a digital memory book.</p>
        </div>
        <div className="grid-3">
          {messages.map(m => (
            <div key={m.id} className="message-card">
              <p className="message-text">"{m.text}"</p>
              <div className="divider" style={{ margin: "1rem 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--purple-200)" }}>{m.name}</p>
                  <p className="message-author">{m.from}</p>
                </div>
                <p className="message-author">{m.date}</p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              <p>No messages yet. Be the first to share something with Han.</p>
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} onSave={() => { setReqModal(lightbox); setLightbox(null); }} approved={isApproved(lightbox.id)} />}

      {/* REQUEST MODAL */}
      {reqModal && !sent[reqModal.id] && <RequestModal photo={reqModal} onClose={() => setReqModal(null)} onSubmit={handleRequest} />}
      {reqModal && sent[reqModal.id] && (
        <div className="modal-backdrop" onClick={() => setReqModal(null)}>
          <div className="modal modal-sm" style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(77,217,172,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", fontSize: "1.8rem", color: "var(--teal)" }}>✔</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.5rem", fontWeight: 400, marginBottom: "0.75rem" }}>Request Sent</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
              Han will review your message and decide whether to grant you temporary access. If approved, you'll have 24 hours to save the photo.
            </p>
            <button className="btn btn-primary" onClick={() => setReqModal(null)}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── ADMIN LOGIN ──
function LoginPage({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); await new Promise(r => setTimeout(r, 600));
    if (pw === "luminary2025") { onLogin(); }
    else { setErr("Incorrect password."); setLoading(false); }
  };
  return (
    <div className="login-wrap">
      <div className="hero-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <div className="login-card">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2rem", color: "var(--purple-200)", marginBottom: "0.5rem" }}>✦ Luminary</div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>Owner Portal — Private Access</p>
        </div>
        <div className="input-group">
          <label>Password</label>
          <input type="password" placeholder="Enter your password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()} />
        </div>
        {err && <p style={{ color: "#fca5a5", fontSize: "0.82rem", marginBottom: "0.75rem" }}>{err}</p>}
        <button className="btn btn-primary w-full" onClick={submit} disabled={loading}>
          {loading ? <><div className="spinner" />Verifying…</> : "Enter Archive"}
        </button>
        <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "1rem" }}>Demo password: luminary2025</p>
      </div>
    </div>
  );
}

// ── DASHBOARD ──
function Dashboard({ photos, albums, requests, messages, notifications, onLogout, onApprove, onReject, onUpload, onDeletePhoto, onAddAlbum, toast }) {
  const [tab, setTab] = useState("overview");
  const [reqDetail, setReqDetail] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [showNotifs, setShowNotifs] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const notifRef = useRef();

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");

  const tabs = [
    { id: "overview", label: "Overview", icon: "⊞" },
    { id: "photos", label: "Photos", icon: "⬡" },
    { id: "albums", label: "Albums", icon: "⊛" },
    { id: "requests", label: "Requests", icon: "↓", badge: pending.length },
    { id: "messages", label: "Messages", icon: "✉" },
  ];

  const filteredReqs = requests.filter(r => filterStatus === "all" || r.status === filterStatus);

  return (
    <>
      <div className="sidebar">
        <div style={{ padding: "0.5rem 0.5rem 1.5rem", borderBottom: "1px solid var(--border)", marginBottom: "0.75rem" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "var(--purple-200)" }}>✦ Luminary</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>Owner Dashboard</p>
        </div>
        {tabs.map(t => (
          <div key={t.id} className={`sidebar-item ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: "0.9rem" }}>{t.icon}</span>
            {t.label}
            {t.badge > 0 && <span className="badge">{t.badge}</span>}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div className="sidebar-item" onClick={onLogout} style={{ marginTop: "auto", color: "var(--text-muted)" }}>
          <span>⎋</span> Sign Out
        </div>
      </div>

      <div className="dashboard-content">
        {/* TOPBAR */}
        <div className="flex-between mb-3">
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 300, textTransform: "capitalize" }}>
            {tabs.find(t => t.id === tab)?.label}
          </h2>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <div className="relative">
              <button className="btn btn-ghost btn-icon relative" onClick={() => setShowNotifs(v => !v)}>
                🔔
                {pending.length > 0 && <span className="notif-dot" />}
              </button>
              {showNotifs && (
                <div ref={notifRef} className="notif-panel">
                  <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    Notifications
                  </div>
                  {notifications.slice(0, 6).map((n, i) => (
                    <div key={i} className="notif-item">
                      <span style={{ color: "var(--purple-400)", marginRight: "0.4rem" }}>✦</span>
                      {n}
                    </div>
                  ))}
                  {notifications.length === 0 && <div style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>No notifications</div>}
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>+ Upload</button>
          </div>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <>
            <div className="stat-grid mb-3">
              {[["Photos", photos.length, "var(--purple-400)"], ["Albums", albums.length, "var(--rose)"], ["Pending", pending.length, "var(--amber)"], ["Approved", approved.length, "var(--teal)"], ["Messages", messages.length, "var(--purple-200)"]].map(([l, v, c]) => (
                <div key={l} className="stat-card">
                  <div className="stat-number" style={{ color: c }}>{v}</div>
                  <div className="stat-label">{l}</div>
                </div>
              ))}
            </div>
            <div className="grid-2">
              <div className="card">
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, marginBottom: "1rem", color: "var(--purple-200)" }}>Recent Requests</h3>
                {requests.slice(0, 4).map(r => (
                  <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0", borderBottom: "1px solid var(--border)" }}
                    onClick={() => { setReqDetail(r); setTab("requests"); }} style2={{ cursor: "pointer" }}>
                    <div>
                      <p style={{ fontSize: "0.88rem", fontWeight: 500 }}>{r.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.photoTitle}</p>
                    </div>
                    <span className={`tag tag-${r.status}`}>{r.status}</span>
                  </div>
                ))}
                {requests.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No requests yet</p>}
              </div>
              <div className="card">
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, marginBottom: "1rem", color: "var(--purple-200)" }}>Latest Messages</h3>
                {messages.slice(0, 3).map(m => (
                  <div key={m.id} style={{ padding: "0.65rem 0", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "0.88rem", fontStyle: "italic", color: "var(--purple-100)", lineHeight: 1.5 }}>"{m.text.slice(0, 80)}{m.text.length > 80 ? "…" : ""}"</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>— {m.name}</p>
                  </div>
                ))}
                {messages.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No messages yet</p>}
              </div>
            </div>
          </>
        )}

        {/* PHOTOS */}
        {tab === "photos" && (
          <>
            <div className="flex-between mb-2">
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{photos.length} photos in archive</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>+ Upload Photos</button>
            </div>
            <div className="masonry">
              {photos.map(p => (
                <div key={p.id} className="photo-tile" style={{ position: "relative" }}>
                  <img src={p.thumb} alt={p.title} loading="lazy" style={{ borderRadius: "10px" }} />
                  <div className="photo-overlay">
                    <div className="photo-overlay-actions">
                      <div>
                        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", color: "#fff" }}>{p.title}</p>
                        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{albums.find(a => a.id === p.album)?.name}</p>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); onDeletePhoto(p.id); }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ALBUMS */}
        {tab === "albums" && (
          <>
            <div className="flex-between mb-2">
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{albums.length} albums</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAlbumForm(true)}>+ New Album</button>
            </div>
            {showAlbumForm && (
              <div className="card mb-2" style={{ maxWidth: 400 }}>
                <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, marginBottom: "1rem" }}>Create Album</h4>
                <div className="input-group">
                  <label>Album name</label>
                  <input placeholder="Enter album name…" value={newAlbumName} onChange={e => setNewAlbumName(e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowAlbumForm(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={() => { if (newAlbumName) { onAddAlbum(newAlbumName); setNewAlbumName(""); setShowAlbumForm(false); } }}>Create</button>
                </div>
              </div>
            )}
            <div className="grid-3">
              {albums.map(a => (
                <div key={a.id} className="album-card">
                  <img src={a.cover} alt={a.name} />
                  <div className="album-card-overlay">
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#fff" }}>{a.name}</p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>{photos.filter(p => p.album === a.id).length} photos</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* REQUESTS */}
        {tab === "requests" && (
          <>
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              {["all", "pending", "approved", "rejected"].map(s => (
                <button key={s} className={`btn btn-sm ${filterStatus === s ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilterStatus(s)} style={{ textTransform: "capitalize" }}>
                  {s} {s === "pending" && pending.length > 0 ? `(${pending.length})` : ""}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredReqs.map(r => {
                const photo = photos.find(p => p.id === r.photoId);
                return (
                  <div key={r.id} className="card" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1rem", alignItems: "center", cursor: "pointer" }} onClick={() => setReqDetail(r)}>
                    {photo && <img src={photo.thumb} alt="" style={{ width: 60, height: 60, borderRadius: "8px", objectFit: "cover" }} />}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.3rem" }}>
                        <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{r.name}</p>
                        <span className={`tag tag-${r.status}`}>{r.status}</span>
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>"{r.message.slice(0, 70)}{r.message.length > 70 ? "…" : ""}"</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{r.from} · {timeAgo(r.date)} · {r.photoTitle}</p>
                      {r.status === "approved" && r.expiresAt && (
                        <p style={{ fontSize: "0.75rem", color: isExpired(r.expiresAt) ? "#fca5a5" : "var(--teal)", marginTop: "0.2rem" }}>⏱ {formatExpiry(r.expiresAt)}</p>
                      )}
                    </div>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.4rem" }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-success btn-sm" onClick={() => onApprove(r.id)}>✔</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onReject(r.id)}>✕</button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredReqs.length === 0 && (
                <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>◌</div>
                  <p>No {filterStatus === "all" ? "" : filterStatus} requests</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* MESSAGES */}
        {tab === "messages" && (
          <>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "1.5rem" }}>{messages.length} messages from {messages.length} people</p>
            <div className="grid-2">
              {messages.map(m => (
                <div key={m.id} className="message-card">
                  <p className="message-text">"{m.text}"</p>
                  <div className="divider" style={{ margin: "0.75rem 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--purple-200)" }}>{m.name}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.from}</p>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{m.date}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                  <p>No messages yet. When visitors request photos, their messages appear here.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODALS */}
      {showUpload && <UploadModal albums={albums} onClose={() => setShowUpload(false)} onUpload={(files, albumId) => { onUpload(files, albumId); setShowUpload(false); }} />}
      {reqDetail && (
        <RequestDetailModal
          req={reqDetail} photo={photos.find(p => p.id === reqDetail.photoId)}
          onClose={() => setReqDetail(null)}
          onApprove={id => { onApprove(id); setReqDetail(null); }}
          onReject={id => { onReject(id); setReqDetail(null); }}
        />
      )}
    </>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [photos, setPhotos] = useState(SEED_PHOTOS);
  const [albums, setAlbums] = useState(SEED_ALBUMS);
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [likes, setLikes] = useState({});
  const [page, setPage] = useState("gallery"); // gallery | login | dashboard
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [notifications, setNotifications] = useState([
    "Samuel requested to download Golden Hour",
    "Meron Alemu left a message for you",
    "Abel requested Cherry Blossoms",
  ]);
  const { toasts, push: toast } = useToast();
  const [loaded, setLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    (async () => {
      const [ph, al, rq, ms, lk] = await Promise.all([
        dbGet(STORAGE_KEYS.photos), dbGet(STORAGE_KEYS.albums),
        dbGet(STORAGE_KEYS.requests), dbGet(STORAGE_KEYS.messages), dbGet(STORAGE_KEYS.likes),
      ]);
      if (ph) setPhotos(ph);
      if (al) setAlbums(al);
      if (rq) setRequests(rq);
      if (ms) setMessages(ms);
      if (lk) setLikes(lk);
      setLoaded(true);
    })();
  }, []);

  // Persist changes
  useEffect(() => { if (loaded) dbSet(STORAGE_KEYS.photos, photos); }, [photos, loaded]);
  useEffect(() => { if (loaded) dbSet(STORAGE_KEYS.albums, albums); }, [albums, loaded]);
  useEffect(() => { if (loaded) dbSet(STORAGE_KEYS.requests, requests); }, [requests, loaded]);
  useEffect(() => { if (loaded) dbSet(STORAGE_KEYS.messages, messages); }, [messages, loaded]);
  useEffect(() => { if (loaded) dbSet(STORAGE_KEYS.likes, likes); }, [likes, loaded]);

  const handleRequestDownload = (data) => {
    const id = "r" + Date.now();
    const newReq = { id, photoId: data.photoId, photoTitle: data.photoTitle, name: data.name, from: data.from, message: data.message, social: data.social || "", status: "pending", date: new Date().toISOString() };
    setRequests(r => [newReq, ...r]);
    setMessages(m => [{ id: "m" + Date.now(), name: data.name, text: data.message, from: data.from, date: new Date().toISOString().slice(0, 10) }, ...m]);
    setNotifications(n => [`${data.name} requested to save "${data.photoTitle}"`, ...n]);
  };

  const handleApprove = (id) => {
    setRequests(r => r.map(req => req.id === id ? { ...req, status: "approved", approvedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 24 * 3600000).toISOString() } : req));
    const req = requests.find(r => r.id === id);
    toast(`Approved ${req?.name}'s request (24h access granted)`, "success");
  };

  const handleReject = (id) => {
    setRequests(r => r.map(req => req.id === id ? { ...req, status: "rejected" } : req));
    toast("Request rejected", "error");
  };

  const handleUpload = (files, albumId) => {
    const newPhotos = files.map((f, i) => {
      const url = URL.createObjectURL(f);
      return { id: "p" + Date.now() + i, title: f.name.replace(/\.[^.]+$/, ""), album: albumId, url, thumb: url, date: new Date().toISOString().slice(0, 10), tags: [], likes: 0 };
    });
    setPhotos(p => [...newPhotos, ...p]);
    setAlbums(a => a.map(al => al.id === albumId ? { ...al, count: al.count + files.length } : al));
    toast(`${files.length} photo(s) uploaded`, "success");
  };

  const handleDeletePhoto = (id) => {
    setPhotos(p => p.filter(ph => ph.id !== id));
    toast("Photo deleted", "error");
  };

  const handleAddAlbum = (name) => {
    setAlbums(a => [...a, { id: "a" + Date.now(), name, cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", count: 0 }]);
    toast(`Album "${name}" created`, "success");
  };

  const handleLike = (id) => {
    setLikes(l => ({ ...l, [id]: !l[id] }));
  };

  return (
    <>
      <style>{FONTS}{CSS}</style>
      <div className="grain" />

      <nav className="nav">
        <div className="nav-logo" onClick={() => setPage("gallery")} style={{ cursor: "pointer" }}>✦ <span>Luminary</span></div>
        <div className="nav-actions">
          {page === "gallery" && <>
            <button className="btn btn-ghost btn-sm" onClick={() => document.querySelector("#gallery-anchor")?.scrollIntoView({ behavior: "smooth" })}>Archive</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("login")}>Owner Portal</button>
          </>}
          {page === "dashboard" && <>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Owner Dashboard</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("gallery")}>⬅ Gallery</button>
          </>}
          {page === "login" && <button className="btn btn-ghost btn-sm" onClick={() => setPage("gallery")}>⬅ Gallery</button>}
        </div>
      </nav>

      <main style={{ paddingTop: page === "dashboard" ? 0 : 0 }}>
        {page === "gallery" && (
          <GalleryPage photos={photos} albums={albums} requests={requests} messages={messages}
            onRequestDownload={handleRequestDownload} likes={likes} onLike={handleLike}
            selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} onLogin={() => setPage("login")} />
        )}
        {page === "login" && <LoginPage onLogin={() => setPage("dashboard")} />}
        {page === "dashboard" && (
          <Dashboard photos={photos} albums={albums} requests={requests} messages={messages}
            notifications={notifications} onLogout={() => setPage("gallery")}
            onApprove={handleApprove} onReject={handleReject} onUpload={handleUpload}
            onDeletePhoto={handleDeletePhoto} onAddAlbum={handleAddAlbum} toast={toast} />
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </>
  );
}
