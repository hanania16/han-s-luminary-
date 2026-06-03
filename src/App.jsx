import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const SK = { photos:"lum:photos", albums:"lum:albums", requests:"lum:requests", messages:"lum:messages", likes:"lum:likes" };
async function dbGet(k){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch{return null;}}
async function dbSet(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch{}}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED_PHOTOS = [
  { id:"p1", title:"Golden Hour",      album:"a1", url:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800", thumb:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", date:"2024-06-15", tags:["nature","sunset"],  likes:12 },
  { id:"p2", title:"City Lights",      album:"a1", url:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", thumb:"https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400", date:"2024-07-20", tags:["city","night"],    likes:8  },
  { id:"p3", title:"Morning Fog",      album:"a2", url:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", thumb:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", date:"2024-08-01", tags:["mountain","fog"],  likes:23 },
  { id:"p4", title:"Ocean Calm",       album:"a2", url:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800", thumb:"https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400", date:"2024-09-10", tags:["ocean","calm"],    likes:15 },
  { id:"p5", title:"Forest Path",      album:"a3", url:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=800", thumb:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400", date:"2024-10-05", tags:["forest","path"],   likes:19 },
  { id:"p6", title:"Desert Dunes",     album:"a3", url:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800", thumb:"https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400", date:"2024-11-12", tags:["desert","travel"],  likes:31 },
  { id:"p7", title:"Starry Night",     album:"a1", url:"https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800", thumb:"https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400", date:"2024-12-01", tags:["stars","night"],   likes:44 },
  { id:"p8", title:"Cherry Blossoms",  album:"a4", url:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800", thumb:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400", date:"2025-03-20", tags:["spring","japan"],   likes:56 },
  { id:"p9", title:"Rainy Window",     album:"a4", url:"https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800", thumb:"https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=400", date:"2025-01-08", tags:["rain","moody"],    likes:27 },
];
const SEED_ALBUMS = [
  { id:"a1", name:"Cosmos & Cities",  cover:"https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400", count:3 },
  { id:"a2", name:"Wild Horizons",    cover:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400", count:2 },
  { id:"a3", name:"Earth's Palette",  cover:"https://images.unsplash.com/photo-1448375240586-882707db888b?w=400", count:2 },
  { id:"a4", name:"Quiet Moments",    cover:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400", count:2 },
];
const SEED_REQUESTS = [
  { id:"r1", photoId:"p1", photoTitle:"Golden Hour",     name:"Samuel Tesfaye", from:"University friend",   message:"Han, you helped me through my first year at university. This photo reminds me of the evenings we'd study together. You were always the calm I needed.", social:"@samuelT", status:"pending",  date:"2025-06-01T14:32:00Z" },
  { id:"r2", photoId:"p7", photoTitle:"Starry Night",    name:"Meron Alemu",    from:"Childhood neighbor",  message:"I never got the chance to tell you how much your kindness meant to me growing up. We used to stare at the stars from the roof and dream about the future.", social:"@meron_a", status:"approved", approvedAt:"2025-06-02T10:00:00Z", expiresAt: new Date(Date.now()+12*3600000).toISOString(), date:"2025-06-01T09:15:00Z" },
  { id:"r3", photoId:"p8", photoTitle:"Cherry Blossoms", name:"Abel Girma",     from:"Work colleague",      message:"This photo is stunning, Han. You always had an eye for beauty that most of us walk right past. Thank you for sharing your world with us.", social:"", status:"rejected", date:"2025-05-30T16:45:00Z" },
];
const SEED_MESSAGES = [
  { id:"m1", name:"Samuel Tesfaye", text:"You helped me through my first year at college. I don't think I would have made it without you.", from:"University", date:"2025-06-01" },
  { id:"m2", name:"Meron Alemu",    text:"I never got the chance to say thank you. These photos remind me of our best memories together.", from:"Childhood",  date:"2025-06-01" },
  { id:"m3", name:"Abel Girma",     text:"You always saw the world differently. Thank you for letting us see it through your lens.", from:"Work", date:"2025-05-30" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function timeAgo(iso){const s=Math.floor((Date.now()-new Date(iso))/1000);if(s<60)return"just now";if(s<3600)return`${Math.floor(s/60)}m ago`;if(s<86400)return`${Math.floor(s/3600)}h ago`;return`${Math.floor(s/86400)}d ago`;}
function isExpired(iso){return new Date(iso)<new Date();}
function formatExpiry(iso){if(!iso)return"";const diff=new Date(iso)-Date.now();if(diff<0)return"expired";return`${Math.floor(diff/3600000)}h ${Math.floor((diff%3600000)/60000)}m remaining`;}
function shuffle(arr){return [...arr].sort(()=>Math.random()-0.5);}

// ─── TOAST ────────────────────────────────────────────────────────────────────
let tid=0;
function useToast(){
  const [toasts,set]=useState([]);
  const push=useCallback((msg,type="success")=>{const id=++tid;set(t=>[...t,{id,msg,type}]);setTimeout(()=>set(t=>t.filter(x=>x.id!==id)),3500);},[]);
  return{toasts,push};
}
function Toasts({toasts}){
  return <div style={{position:"fixed",bottom:"1.5rem",right:"1.5rem",zIndex:600,display:"flex",flexDirection:"column",gap:"0.5rem"}}>
    {toasts.map(t=>(
      <div key={t.id} style={{background:"rgba(255,255,255,0.95)",backdropFilter:"blur(20px)",border:`1px solid ${t.type==="success"?"rgba(236,72,153,0.3)":"rgba(220,38,38,0.3)"}`,padding:"0.75rem 1.25rem",borderRadius:"50px",fontSize:"0.85rem",display:"flex",alignItems:"center",gap:"0.5rem",color:"#831843",boxShadow:"0 8px 30px rgba(236,72,153,0.15)",animation:"fadeUp 0.3s ease",minWidth:220}}>
        <span>{t.type==="success"?"🌸":"✕"}</span>{t.msg}
      </div>
    ))}
  </div>;
}

// ─── FLOATING PHOTO BUBBLES ────────────────────────────────────────────────────
function FloatingPhotos({ photos }) {
  const bubbles = useMemo(() => {
    const picked = shuffle(photos).slice(0, Math.min(10, photos.length));
    const cw = window.innerWidth;
    const ch = window.innerHeight + 400;
    const margin = 12;
    const sizes  = [110, 130, 100, 145, 120, 90, 155, 105, 135, 115];

    const result = [];
    for (const p of picked) {
      let left, top, size;
      let attempts = 0;
      let ok = false;
      while (!ok && attempts < 80) {
        size = sizes[Math.floor(Math.random() * sizes.length)];
        left = Math.random() * 96;
        top  = Math.random() * 95;
        const cx = left / 100 * cw, cy = top / 100 * ch;
        ok = result.every(b => {
          const bx = b.left / 100 * cw, by = b.top / 100 * ch;
          return cx + size + margin < bx || bx + b.size + margin < cx ||
                 cy + size + margin < by || by + b.size + margin < cy;
        });
        attempts++;
      }
      const dur    = 6 + Math.random() * 4;
      const delay  = Math.random() * 3;
      const rotate = Math.random() * 40 - 20;
      result.push({ ...p, size, left, top, dur, delay, rotate });
    }
    return result;
  }, [photos]);

  return (
    <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0}}>
      {bubbles.map((b,i)=>(
        <div key={b.id+i} style={{
          position:"absolute",
          left:`${b.left}%`, top:`${b.top}%`,
          width:b.size, height:b.size,
          borderRadius: i%3===0 ? "40% 60% 55% 45%/45% 40% 60% 55%" : i%3===1 ? "50%" : "30% 70% 60% 40%/50% 30% 70% 50%",
          overflow:"hidden",
          border:"3px solid rgba(255,255,255,0.6)",
          boxShadow:"0 8px 32px rgba(236,72,153,0.18), 0 2px 8px rgba(255,182,193,0.3)",
          opacity:0,
          animation:`dropBubble ${b.dur}s ${b.delay}s linear infinite both`,
          filter:"blur(0.5px)",
        }}>
          <div style={{width:"100%",height:"100%",transform:`rotate(${b.rotate}deg)`}}>
            <img src={b.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover",filter:"saturate(1.1) brightness(1.05)"}} loading="lazy"/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FONTS + CSS ──────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Nunito:wght@300;400;500;600&display=swap');`;

const CSS = `
* { box-sizing:border-box; margin:0; padding:0; }

:root {
  --bg:        #fff5f8;
  --bg2:       #ffeef4;
  --bg3:       #ffe4ef;
  --card:      rgba(255,255,255,0.82);
  --card-solid:#ffffff;
  --border:    rgba(236,72,153,0.15);
  --border-med:rgba(236,72,153,0.28);
  --pink:      #ec4899;
  --pink-dark: #be185d;
  --pink-light:#fce7f3;
  --rose:      #fb7185;
  --blush:     #fda4af;
  --lilac:     #c084fc;
  --lilac-light:#f3e8ff;
  --mauve:     #a855f7;
  --gold:      #f59e0b;
  --text:      #4a1942;
  --text2:     #7e3a72;
  --text3:     #b06fa0;
  --muted:     #c9a0bc;
  --teal:      #2dd4bf;
  --radius:    18px;
  --radius-sm: 12px;
}

body { background:var(--bg); color:var(--text); font-family:'Nunito',sans-serif; min-height:100vh; }

@keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes shimmer  { from{background-position:-200% center} to{background-position:200% center} }
@keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes modalIn  { from{opacity:0;transform:scale(0.93) translateY(16px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes dropBubble {
  0%   { transform:translateY(-30vh) scale(0.65); opacity:0; }
  10%  { opacity:0.5; }
  40%  { transform:translateY(-2vh) scale(1); opacity:0.45; }
  70%  { transform:translateY(15vh) scale(0.9); opacity:0.25; }
  80%  { opacity:0; }
  100% { transform:translateY(25vh) scale(0.85); opacity:0; }
}
@keyframes heartPop { 0%{transform:scale(1)} 50%{transform:scale(1.35)} 100%{transform:scale(1)} }
@keyframes sparkle  { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }

/* ── NAV ── */
.nav {
  position:fixed; top:0; left:0; right:0; z-index:100;
  background:rgba(255,245,248,0.85); backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
  padding:0 2rem; height:64px;
  display:flex; align-items:center; justify-content:space-between;
}
.nav-logo { font-family:'Playfair Display',serif; font-size:1.45rem; font-weight:700; font-style:italic; color:var(--pink-dark); cursor:pointer; display:flex; align-items:center; gap:0.4rem; }
.nav-logo span { color:var(--lilac); }

/* ── BUTTONS ── */
.btn { padding:0.5rem 1.3rem; border-radius:50px; font-family:'Nunito',sans-serif; font-size:0.85rem; font-weight:600; cursor:pointer; transition:all 0.2s; border:1px solid transparent; display:inline-flex; align-items:center; gap:0.45rem; }
.btn-ghost { background:transparent; border-color:var(--border-med); color:var(--text2); }
.btn-ghost:hover { background:rgba(236,72,153,0.08); color:var(--pink-dark); }
.btn-primary { background:linear-gradient(135deg,var(--pink),var(--mauve)); color:#fff; box-shadow:0 4px 20px rgba(236,72,153,0.35); }
.btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 28px rgba(236,72,153,0.5); }
.btn-danger { background:rgba(251,113,133,0.12); border-color:rgba(251,113,133,0.4); color:#be123c; }
.btn-danger:hover { background:rgba(251,113,133,0.22); }
.btn-success { background:rgba(45,212,191,0.12); border-color:rgba(45,212,191,0.4); color:#0f766e; }
.btn-success:hover { background:rgba(45,212,191,0.22); }
.btn-sm { padding:0.35rem 0.9rem; font-size:0.8rem; }
.btn-icon { padding:0.5rem; width:36px; height:36px; justify-content:center; }

/* ── CARDS ── */
.card { background:var(--card); backdrop-filter:blur(16px); border:1px solid var(--border); border-radius:var(--radius); padding:1.5rem; transition:all 0.3s; }
.card:hover { border-color:var(--border-med); box-shadow:0 8px 40px rgba(236,72,153,0.12); }

/* ── HERO ── */
.hero { min-height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:6rem 2rem 4rem; position:relative; overflow:hidden; }

.hero-mesh {
  position:absolute; inset:0; z-index:0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 20%, rgba(253,164,175,0.45) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 15%, rgba(192,132,252,0.35) 0%, transparent 55%),
    radial-gradient(ellipse 50% 60% at 10% 80%, rgba(251,207,232,0.5)  0%, transparent 55%),
    radial-gradient(ellipse 70% 50% at 90% 75%, rgba(249,168,212,0.4)  0%, transparent 60%),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(255,228,230,0.3)  0%, transparent 70%);
  background-color:var(--bg);
}

.hero-eyebrow {
  font-size:0.72rem; letter-spacing:0.3em; text-transform:uppercase; margin-bottom:1.25rem;
  background:linear-gradient(90deg,var(--pink),var(--lilac),var(--rose),var(--pink));
  background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  animation:shimmer 4s linear infinite; position:relative; z-index:1;
}
.hero-title {
  font-family:'Playfair Display',serif; font-size:clamp(2.8rem,7vw,6rem); font-weight:700;
  line-height:1.08; color:var(--text); margin-bottom:1.25rem;
  animation:fadeUp 0.9s ease both; position:relative; z-index:1;
}
.hero-title em { font-style:italic; color:var(--pink); }
.hero-title .soft { color:var(--lilac); }
.hero-subtitle { font-size:1.05rem; color:var(--text2); max-width:480px; line-height:1.75; margin-bottom:2.5rem; animation:fadeUp 0.9s ease 0.15s both; position:relative; z-index:1; }
.hero-actions { display:flex; gap:1rem; flex-wrap:wrap; justify-content:center; animation:fadeUp 0.9s ease 0.3s both; position:relative; z-index:1; }

.hero-stats { display:flex; gap:3rem; margin-top:3.5rem; animation:fadeUp 0.9s ease 0.45s both; position:relative; z-index:1; }
.hero-stat-num { font-family:'Playfair Display',serif; font-size:2.2rem; font-weight:700; color:var(--pink-dark); }
.hero-stat-lbl { font-size:0.72rem; color:var(--muted); text-transform:uppercase; letter-spacing:0.12em; margin-top:0.1rem; }

/* decorative sparkles */
.sparkle { position:absolute; border-radius:50%; animation:sparkle 3s ease-in-out infinite; }

/* ── MASONRY ── */
.masonry { columns:3; gap:1rem; column-fill:balance; }
@media(max-width:900px){.masonry{columns:2;}}
@media(max-width:550px){.masonry{columns:1;}}

.photo-tile { break-inside:avoid; margin-bottom:1rem; position:relative; border-radius:var(--radius-sm); overflow:hidden; cursor:pointer; }
.photo-tile img { width:100%; display:block; transition:transform 0.5s ease; }
.photo-tile:hover img { transform:scale(1.05); }
.photo-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(74,25,66,0.85) 0%,transparent 55%); opacity:0; transition:opacity 0.3s; display:flex; align-items:flex-end; padding:1rem; }
.photo-tile:hover .photo-overlay { opacity:1; }

  [data-theme=dark] .photo-overlay {
    background: linear-gradient(to top, rgba(30,30,55,0.95) 0%, transparent 55%);
  }
  [data-theme=dark] .album-overlay {
    background: linear-gradient(to top, rgba(30,30,55,0.92) 0%, rgba(30,30,55,0.25) 55%, transparent);
  }
  [data-theme=dark] .hero-stat-num { color:var(--pink); }
  [data-theme=dark] .hero-mesh {
    background:
      radial-gradient(ellipse 80% 60% at 20% 20%, rgba(236,72,153,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 15%, rgba(192,132,252,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 10% 80%, rgba(236,72,153,0.15) 0%, transparent 55%),
      radial-gradient(ellipse 70% 50% at 90% 75%, rgba(192,132,252,0.15) 0%, transparent 60%);
    background-color:var(--bg);
  }

/* ── ALBUMS ── */
.album-card { position:relative; border-radius:var(--radius); overflow:hidden; aspect-ratio:4/3; cursor:pointer; transition:transform 0.3s; }
.album-card:hover { transform:scale(1.03); }
.album-card img { width:100%; height:100%; object-fit:cover; }
.album-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(74,25,66,0.8) 0%,rgba(74,25,66,0.1) 60%,transparent); padding:1.25rem; display:flex; flex-direction:column; justify-content:flex-end; }

/* ── SECTION ── */
.section { padding:5rem 2rem; max-width:1200px; margin:0 auto; }
.section-title { font-family:'Playfair Display',serif; font-size:2.6rem; font-weight:700; color:var(--text); margin-bottom:0.4rem; }
.section-title em { font-style:italic; color:var(--pink); }
.section-sub { color:var(--text3); margin-bottom:2.5rem; font-size:0.95rem; }

/* ── MESSAGE CARDS ── */
.msg-card { background:var(--card-solid); border:1px solid var(--border); border-radius:var(--radius); padding:1.5rem; position:relative; overflow:hidden; transition:all 0.3s; }
.msg-card:hover { transform:translateY(-3px); box-shadow:0 12px 40px rgba(236,72,153,0.15); border-color:var(--border-med); }
.msg-card::before { content:'"'; position:absolute; top:-12px; left:8px; font-family:'Playfair Display',serif; font-size:7rem; color:rgba(236,72,153,0.07); line-height:1; font-weight:700; }
.msg-text { font-family:'Playfair Display',serif; font-size:1.1rem; font-style:italic; line-height:1.75; color:var(--text); margin-bottom:1rem; position:relative; z-index:1; }
.msg-author { font-size:0.8rem; color:var(--muted); }

/* ── MODAL ── */
.modal-backdrop { position:fixed; inset:0; z-index:200; background:rgba(74,25,66,0.5); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; padding:1rem; }
.modal { background:#fff; border:1px solid var(--border-med); border-radius:24px; max-height:90vh; overflow-y:auto; animation:modalIn 0.28s ease both; }
.modal-sm { width:100%; max-width:460px; }
.modal-lg { width:100%; max-width:680px; }

/* ── SIDEBAR / DASHBOARD ── */
.sidebar { position:fixed; left:0; top:64px; bottom:0; width:240px; background:var(--card-solid); border-right:1px solid var(--border); padding:1.25rem 1rem; overflow-y:auto; display:flex; flex-direction:column; gap:0.2rem; }
.sb-item { padding:0.6rem 0.9rem; border-radius:var(--radius-sm); display:flex; align-items:center; gap:0.7rem; font-size:0.88rem; color:var(--text2); cursor:pointer; transition:all 0.2s; border:1px solid transparent; font-weight:500; }
.sb-item:hover { background:rgba(236,72,153,0.07); color:var(--pink-dark); }
.sb-item.active { background:rgba(236,72,153,0.1); color:var(--pink-dark); border-color:rgba(236,72,153,0.2); }
.sb-item .badge { margin-left:auto; background:var(--pink); color:#fff; font-size:0.7rem; padding:1px 6px; border-radius:50px; min-width:18px; text-align:center; }
.dash-body { margin-left:240px; padding:2rem; padding-top:calc(64px + 2rem); min-height:100vh; }
@media(max-width:768px){ .sidebar{display:none;} .dash-body{margin-left:0;} }

/* ── STATS ── */
.stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:1rem; }
.stat-card { background:var(--card-solid); border:1px solid var(--border); border-radius:var(--radius); padding:1.25rem; position:relative; overflow:hidden; }
.stat-card::after { content:''; position:absolute; top:-20px; right:-20px; width:80px; height:80px; border-radius:50%; background:radial-gradient(circle,rgba(236,72,153,0.12),transparent 70%); }
.stat-n { font-family:'Playfair Display',serif; font-size:2.4rem; font-weight:700; color:var(--pink-dark); line-height:1; }
.stat-l { font-size:0.75rem; color:var(--muted); margin-top:0.25rem; text-transform:uppercase; letter-spacing:0.08em; }

/* ── INPUTS ── */
.inp-group { display:flex; flex-direction:column; gap:0.35rem; margin-bottom:0.9rem; }
.inp-group label { font-size:0.8rem; color:var(--text2); font-weight:600; letter-spacing:0.02em; }
input, textarea, select { width:100%; background:#fff5f8; border:1.5px solid var(--border-med); border-radius:var(--radius-sm); padding:0.65rem 1rem; color:var(--text); font-family:'Nunito',sans-serif; font-size:0.9rem; transition:all 0.2s; outline:none; }
input:focus, textarea:focus, select:focus { border-color:var(--pink); box-shadow:0 0 0 3px rgba(236,72,153,0.12); }
textarea { resize:vertical; min-height:96px; }
select option { background:#fff; }

/* ── TAGS ── */
.tag { display:inline-block; padding:0.22rem 0.65rem; border-radius:50px; font-size:0.74rem; font-weight:600; }
.tag-pink { background:rgba(236,72,153,0.1); color:var(--pink-dark); border:1px solid rgba(236,72,153,0.2); }
.tag-pending { background:rgba(245,158,11,0.1); color:#92400e; border:1px solid rgba(245,158,11,0.25); }
.tag-approved { background:rgba(45,212,191,0.1); color:#0f766e; border:1px solid rgba(45,212,191,0.25); }
.tag-rejected { background:rgba(251,113,133,0.1); color:#be123c; border:1px solid rgba(251,113,133,0.25); }

/* ── LIGHTBOX ── */
.lightbox { position:fixed; inset:0; z-index:300; background:rgba(74,25,66,0.96); display:flex; align-items:center; justify-content:center; }
.lightbox img { max-width:90vw; max-height:82vh; border-radius:var(--radius-sm); object-fit:contain; }

/* ── UPLOAD ZONE ── */
.upload-zone { border:2px dashed var(--border-med); border-radius:var(--radius); padding:2.5rem; text-align:center; cursor:pointer; transition:all 0.3s; background:rgba(236,72,153,0.03); }
.upload-zone:hover, .upload-zone.drag { border-color:var(--pink); background:rgba(236,72,153,0.07); }

/* ── NOTIF PANEL ── */
.notif-panel { position:absolute; top:110%; right:0; width:300px; background:#fff; border:1px solid var(--border-med); border-radius:var(--radius); overflow:hidden; box-shadow:0 20px 60px rgba(236,72,153,0.18); animation:fadeUp 0.2s ease; z-index:10; }
.notif-item { padding:0.85rem 1rem; border-bottom:1px solid var(--border); font-size:0.83rem; cursor:pointer; color:var(--text2); }
.notif-item:hover { background:rgba(236,72,153,0.05); }
.notif-item:last-child { border-bottom:none; }

/* ── MISC ── */
.flex-center { display:flex; align-items:center; justify-content:center; }
.flex-between { display:flex; align-items:center; justify-content:space-between; }
.divider { height:1px; background:linear-gradient(to right,transparent,var(--border-med),transparent); margin:1.25rem 0; }
.grid-2 { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:1rem; }
.grid-3 { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; }
.grid-4 { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:1rem; }
.w-full { width:100%; }
.relative { position:relative; }
.spinner { width:20px; height:20px; border:2px solid var(--border-med); border-top-color:var(--pink); border-radius:50%; animation:spin 0.8s linear infinite; }

::-webkit-scrollbar { width:5px; height:5px; }
::-webkit-scrollbar-track { background:var(--bg); }
::-webkit-scrollbar-thumb { background:rgba(236,72,153,0.25); border-radius:3px; }

/* ── LOGIN ── */
  .login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:2rem; background:var(--bg); position:relative; overflow:hidden; }
  .login-card { width:100%; max-width:400px; background:rgba(255,255,255,0.92); backdrop-filter:blur(20px); border:1.5px solid var(--border-med); border-radius:28px; padding:2.5rem; position:relative; z-index:1; box-shadow:0 20px 60px rgba(236,72,153,0.15); }

@media(prefers-color-scheme:dark){
  :root:not([data-theme=light]){
    --bg:#0f0f18; --bg2:#1a1a2e; --bg3:#252540;
    --card:rgba(30,30,55,0.85); --card-solid:#1e1e37;
    --border:rgba(236,72,153,0.2); --border-med:rgba(236,72,153,0.35);
    --text:#f0e8f5; --text2:#d4c0dc; --text3:#b898a8; --muted:#8b7298;
    body{background:#0f0f18;color:#f0e8f5;}
    .nav{background:rgba(15,15,24,0.92);border-bottom-color:var(--border);}
    .modal{background:#1e1e37;}
    .msg-card{background:#1e1e37;}
    .notif-panel{background:#1e1e37;}
    input,textarea,select{background:#1a1a2e;}
    .upload-zone{background:rgba(236,72,153,0.05);}
    .hero-mesh {
      background:
        radial-gradient(ellipse 80% 60% at 20% 20%, rgba(236,72,153,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 15%, rgba(192,132,252,0.22) 0%, transparent 55%),
        radial-gradient(ellipse 50% 60% at 10% 80%, rgba(236,72,153,0.15) 0%, transparent 55%),
        radial-gradient(ellipse 70% 50% at 90% 75%, rgba(192,132,252,0.15) 0%, transparent 60%);
      background-color:var(--bg);
    }
  }
}
[data-theme=dark]{
  --bg:#0f0f18; --bg2:#1a1a2e; --bg3:#252540;
  --card:rgba(30,30,55,0.85); --card-solid:#1e1e37;
  --border:rgba(236,72,153,0.2); --border-med:rgba(236,72,153,0.35);
  --text:#f0e8f5; --text2:#d4c0dc; --text3:#b898a8; --muted:#8b7298;
  body{background:#0f0f18;color:#f0e8f5;}
  .nav{background:rgba(15,15,24,0.92);border-bottom-color:var(--border);}
  .modal{background:#1e1e37;}
  .msg-card{background:#1e1e37;}
  .notif-panel{background:#1e1e37;}
  input,textarea,select{background:#1a1a2e;}
  .upload-zone{background:rgba(236,72,153,0.05);}
  .hero-mesh {
    background:
      radial-gradient(ellipse 80% 60% at 20% 20%, rgba(236,72,153,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 50% at 80% 15%, rgba(192,132,252,0.22) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 10% 80%, rgba(236,72,153,0.15) 0%, transparent 55%),
      radial-gradient(ellipse 70% 50% at 90% 75%, rgba(192,132,252,0.15) 0%, transparent 60%);
    background-color:var(--bg);
  }
  .photo-overlay {
    background: linear-gradient(to top, rgba(30,30,55,0.95) 0%, transparent 55%);
  }
  .album-overlay {
    background: linear-gradient(to top, rgba(30,30,55,0.92) 0%, rgba(30,30,55,0.25) 55%, transparent);
  }
  .hero-stat-num { color:var(--pink); }
}
[data-theme=light]{
  --bg:#fff5f8; --bg2:#ffeef4; --bg3:#ffe4ef;
  --card:rgba(255,255,255,0.82); --card-solid:#ffffff;
  --border:rgba(236,72,153,0.15); --border-med:rgba(236,72,153,0.28);
  --text:#4a1942; --text2:#7e3a72; --text3:#b06fa0; --muted:#c9a0bc;
  body{background:#fff5f8;color:#4a1942;}
  .nav{background:rgba(255,245,248,0.92);border-bottom-color:var(--border);}
  .modal{background:#fff;}
  .msg-card{background:#ffffff;}
  .notif-panel{background:#fff;}
  input,textarea,select{background:#fff5f8;}
  .upload-zone{background:rgba(236,72,153,0.03);}
}
`;

// ─── SPARKLES DECORATION ─────────────────────────────────────────────────────
function Sparkles() {
  const items = [
    {top:"12%",left:"8%",s:10,c:"var(--pink)",delay:0},
    {top:"25%",left:"92%",s:8,c:"var(--lilac)",delay:0.7},
    {top:"60%",left:"5%",s:12,c:"var(--blush)",delay:1.3},
    {top:"70%",left:"88%",s:9,c:"var(--pink)",delay:0.4},
    {top:"40%",left:"95%",s:7,c:"var(--lilac)",delay:1.8},
    {top:"85%",left:"15%",s:11,c:"var(--rose)",delay:0.9},
  ];
  return <>
    {items.map((sp,i)=>(
      <div key={i} className="sparkle" style={{top:sp.top,left:sp.left,width:sp.s,height:sp.s,background:sp.c,animationDelay:`${sp.delay}s`,position:"absolute",zIndex:1,opacity:0.7}} />
    ))}
  </>;
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function RequestModal({ photo, onClose, onSubmit }) {
  const [form, setForm] = useState({ name:"", from:"", message:"", social:"" });
  const [loading, setLoading] = useState(false);
  const up = k => e => setForm(f=>({...f,[k]:e.target.value}));
  const ok = form.name && form.from && form.message;
  const submit = async () => {
    if(!ok) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,800));
    onSubmit({...form, photoId:photo.id, photoTitle:photo.title});
    setLoading(false);
  };
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-sm" style={{padding:"2rem"}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"2rem",marginBottom:"0.75rem"}}>🌸</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.55rem",fontWeight:700,color:"var(--text)",marginBottom:"0.5rem"}}>Tell Han something</h2>
          <p style={{fontSize:"0.84rem",color:"var(--text3)",lineHeight:1.65}}>
            Before saving <em style={{color:"var(--pink)"}}>{photo.title}</em>, share something you'd like to say.
          </p>
        </div>
        <div className="divider" style={{margin:"1rem 0"}} />
        <p style={{fontSize:"0.77rem",color:"var(--muted)",marginBottom:"1rem",lineHeight:1.7}}>
          Ideas: your honest impression · a memory you share · something you've always wanted to say · where you know him from
        </p>
        <div className="inp-group"><label>Full name *</label><input placeholder="Your name" value={form.name} onChange={up("name")} /></div>
        <div className="inp-group"><label>Where do you know Han from? *</label><input placeholder="e.g. University, work, childhood…" value={form.from} onChange={up("from")} /></div>
        <div className="inp-group"><label>Message to Han *</label><textarea placeholder="Write something meaningful…" value={form.message} onChange={up("message")} /></div>
        <div className="inp-group"><label>Social media <span style={{color:"var(--muted)",fontWeight:400}}>(optional)</span></label><input placeholder="@username" value={form.social} onChange={up("social")} /></div>
        <div style={{display:"flex",gap:"0.75rem",marginTop:"1.25rem"}}>
          <button className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary w-full" onClick={submit} disabled={loading||!ok} style={{opacity:!ok?0.55:1}}>
            {loading?<><div className="spinner"/>Sending…</>:"🌸 Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Lightbox({ photo, onClose, onSave, approved }) {
  return (
    <div className="lightbox" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <button className="btn btn-ghost btn-icon" onClick={onClose} style={{position:"absolute",top:"1.25rem",right:"1.25rem",color:"#fff",borderColor:"rgba(255,255,255,0.3)"}}>✕</button>
      <img src={photo.url} alt={photo.title} />
      <div style={{position:"absolute",bottom:"1.5rem",left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:"#fff",marginBottom:"0.4rem"}}>{photo.title}</p>
        <p style={{fontSize:"0.78rem",color:"rgba(255,255,255,0.55)",marginBottom:"1rem"}}>{photo.date}</p>
        {approved
          ? <a href={photo.url} download className="btn btn-success btn-sm">⬇ Download</a>
          : <button className="btn btn-primary btn-sm" onClick={onSave}>🌸 Request Save</button>}
      </div>
    </div>
  );
}

function PhotoTile({ photo, onClick, onSave, liked, onLike, approved }) {
  return (
    <div className="photo-tile" onClick={()=>onClick(photo)}>
      <img src={photo.thumb} alt={photo.title} loading="lazy" />
      <div className="photo-overlay">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",width:"100%"}}>
          <div>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:"0.95rem",color:"#fff",fontWeight:500}}>{photo.title}</p>
            <p style={{fontSize:"0.72rem",color:"rgba(255,255,255,0.6)"}}>{photo.date}</p>
          </div>
          <div style={{display:"flex",gap:"0.4rem"}} onClick={e=>e.stopPropagation()}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>onLike(photo.id)}
              style={{color:liked?"#fb7185":"rgba(255,255,255,0.7)",borderColor:liked?"rgba(251,113,133,0.5)":"rgba(255,255,255,0.25)",animation:liked?"heartPop 0.3s ease":"none"}}>
              {liked?"♥":"♡"}
            </button>
            <button className="btn btn-primary btn-sm" onClick={()=>onSave(photo)} style={{fontSize:"0.75rem",padding:"0.3rem 0.7rem"}}>
              {approved?"⬇":"🌸 Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ albums, onClose, onUpload }) {
  const [files,setFiles]=useState([]); const [album,setAlbum]=useState(albums[0]?.id||""); const [drag,setDrag]=useState(false); const [loading,setLoading]=useState(false); const ref=useRef();
  const handleDrop=e=>{e.preventDefault();setDrag(false);setFiles(p=>[...p,...Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith("image/"))]);};
  const submit=async()=>{if(!files.length||!album)return;setLoading(true);await new Promise(r=>setTimeout(r,900));onUpload(files,album);setLoading(false);};
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-sm" style={{padding:"2rem"}}>
        <div className="flex-between" style={{marginBottom:"1.25rem"}}><h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.3rem"}}>Upload Photos</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button></div>
        <div className={`upload-zone ${drag?"drag":""}`} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={handleDrop} onClick={()=>ref.current.click()}>
          <input ref={ref} type="file" multiple accept="image/*" style={{display:"none"}} onChange={e=>setFiles(p=>[...p,...Array.from(e.target.files)])} />
          <div style={{fontSize:"1.8rem",marginBottom:"0.6rem"}}>🌸</div>
          <p style={{color:"var(--text2)",fontSize:"0.88rem",fontWeight:500}}>Drop photos here or click to browse</p>
          <p style={{color:"var(--muted)",fontSize:"0.76rem",marginTop:"0.25rem"}}>JPG, PNG, WEBP</p>
        </div>
        {files.length>0&&<div style={{marginTop:"0.75rem",display:"flex",flexWrap:"wrap",gap:"0.35rem"}}>{files.map((f,i)=><span key={i} className="tag tag-pink">{f.name.slice(0,16)}{f.name.length>16?"…":""}</span>)}</div>}
        <div className="inp-group" style={{marginTop:"1rem"}}><label>Album</label>
          <select value={album} onChange={e=>setAlbum(e.target.value)}>{albums.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
        </div>
        <div style={{display:"flex",gap:"0.75rem",marginTop:"1rem"}}>
          <button className="btn btn-ghost w-full" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary w-full" onClick={submit} disabled={!files.length||loading}>{loading?<><div className="spinner"/>Uploading…</>:`Upload ${files.length||""} Photo${files.length!==1?"s":""}`}</button>
        </div>
      </div>
    </div>
  );
}

function ReqDetailModal({ req, photo, onClose, onApprove, onReject }) {
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal modal-lg" style={{padding:"2rem"}}>
        <div className="flex-between" style={{marginBottom:"1.5rem"}}><h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.3rem"}}>Request Details</h3><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:"1.5rem"}}>
          {photo&&<div style={{borderRadius:"12px",overflow:"hidden",aspectRatio:"4/3"}}><img src={photo.thumb} alt={photo.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"1rem"}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(236,72,153,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"var(--pink-dark)",fontWeight:700}}>{req.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
              <div><p style={{fontWeight:600,color:"var(--text)"}}>{req.name}</p><p style={{fontSize:"0.78rem",color:"var(--muted)"}}>{req.from}</p></div>
              <span className={`tag tag-${req.status}`} style={{marginLeft:"auto"}}>{req.status}</span>
            </div>
            <div style={{background:"rgba(236,72,153,0.04)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1rem",marginBottom:"0.75rem"}}>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",fontStyle:"italic",color:"var(--text)",lineHeight:1.75}}>"{req.message}"</p>
            </div>
            {req.social&&<p style={{fontSize:"0.8rem",color:"var(--muted)",marginBottom:"0.4rem"}}>Social: <span style={{color:"var(--pink-dark)"}}>{req.social}</span></p>}
            <p style={{fontSize:"0.78rem",color:"var(--muted)"}}>Requested {timeAgo(req.date)} · {req.photoTitle}</p>
            {req.status==="approved"&&req.expiresAt&&<p style={{fontSize:"0.78rem",color:isExpired(req.expiresAt)?"#be123c":"#0f766e",marginTop:"0.3rem"}}>⏱ {formatExpiry(req.expiresAt)}</p>}
          </div>
        </div>
        {req.status==="pending"&&(
          <div style={{display:"flex",gap:"0.75rem",marginTop:"1.5rem",justifyContent:"flex-end"}}>
            <button className="btn btn-danger" onClick={()=>onReject(req.id)}>✕ Reject</button>
            <button className="btn btn-success" onClick={()=>onApprove(req.id)}>✔ Approve (24h)</button>
          </div>
        )}
        {req.status!=="pending"&&<div style={{marginTop:"1.25rem",textAlign:"right"}}><button className="btn btn-ghost" onClick={onClose}>Close</button></div>}
      </div>
    </div>
  );
}

// ─── GALLERY PAGE ─────────────────────────────────────────────────────────────
function GalleryPage({ photos, albums, requests, messages, onRequestDownload, likes, onLike, selectedAlbum, setSelectedAlbum, onLogin }) {
  const [lightbox, setLightbox] = useState(null);
  const [reqModal, setReqModal] = useState(null);
  const [search, setSearch] = useState("");
  const [sent, setSent] = useState({});

  const filtered = photos.filter(p=>
    (!selectedAlbum||p.album===selectedAlbum)&&
    (!search||p.title.toLowerCase().includes(search.toLowerCase())||(p.tags||[]).some(t=>t.includes(search.toLowerCase())))
  );
  const isApproved = pid => { const r=requests.find(r=>r.photoId===pid&&r.status==="approved"); return r&&!isExpired(r.expiresAt); };
  const handleSave = photo => { if(isApproved(photo.id)){const a=document.createElement("a");a.href=photo.url;a.download=photo.title;a.click();}else{setReqModal(photo);} };
  const handleRequest = data => { onRequestDownload(data); setSent(s=>({...s,[data.photoId]:true})); setReqModal(null); };

  return (
    <>
      <div style={{position:"relative"}}>
      {/* HERO */}
      <section className="hero">
        <div className="hero-mesh" />
        <Sparkles />

        <div className="hero-eyebrow">✦ Personal Memory Archive ✦</div>
        <h1 className="hero-title">
          Han's <em>Luminary</em><br/>
          <span className="soft" style={{fontSize:"0.6em",fontWeight:400}}>a place for memories</span>
        </h1>
        <p className="hero-subtitle">
          A private archive of moments, places, and memories — curated and shared with love.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={()=>document.getElementById("gallery-anchor")?.scrollIntoView({behavior:"smooth"})}>
            🌸 Browse Archive
          </button>
          <button className="btn btn-ghost" onClick={onLogin}>Owner Portal</button>
        </div>
        <div className="hero-stats">
          {[["Photos",photos.length],["Albums",albums.length],["Messages",messages.length+" shared"]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div className="hero-stat-num">{v}</div>
              <div className="hero-stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <FloatingPhotos photos={photos} />

      {/* ALBUMS */}
      <section className="section">
        <h2 className="section-title">Albums</h2>
        <p className="section-sub">Collections of moments, grouped by memory.</p>
        <div className="grid-4">
          <div className="album-card" onClick={()=>setSelectedAlbum(null)} style={{border:!selectedAlbum?"2px solid var(--pink)":"1px solid var(--border)"}}>
            <div style={{background:"linear-gradient(135deg,#fce7f3,#f3e8ff)",width:"100%",height:"100%",borderRadius:"var(--radius)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:"2.5rem"}}>🌸</span>
            </div>
            <div className="album-overlay"><p style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#fff",fontWeight:500}}>All Photos</p><p style={{fontSize:"0.73rem",color:"rgba(255,255,255,0.7)"}}>{photos.length} photos</p></div>
          </div>
          {albums.map(a=>(
            <div key={a.id} className="album-card" onClick={()=>setSelectedAlbum(a.id===selectedAlbum?null:a.id)} style={{border:selectedAlbum===a.id?"2px solid var(--pink)":"1px solid var(--border)"}}>
              <img src={a.cover} alt={a.name} />
              <div className="album-overlay"><p style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#fff",fontWeight:500}}>{a.name}</p><p style={{fontSize:"0.73rem",color:"rgba(255,255,255,0.7)"}}>{photos.filter(p=>p.album===a.id).length} photos</p></div>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* GALLERY */}
      <div id="gallery-anchor" />
      <section className="section" style={{paddingTop:0}}>
        <div className="flex-between" style={{marginBottom:"1.5rem",flexWrap:"wrap",gap:"1rem"}}>
          <div>
            <h2 className="section-title">Archive</h2>
            {selectedAlbum&&<p style={{color:"var(--pink)",fontSize:"0.83rem",marginTop:"0.2rem"}}>Filtered: {albums.find(a=>a.id===selectedAlbum)?.name}</p>}
          </div>
          <input placeholder="Search photos…" value={search} onChange={e=>setSearch(e.target.value)} style={{width:210}} />
        </div>
        {filtered.length===0?(
          <div style={{textAlign:"center",padding:"4rem",color:"var(--muted)"}}>
            <div style={{fontSize:"2.5rem",marginBottom:"0.75rem"}}>🌸</div>
            <p>No photos found</p>
          </div>
        ):(
          <div className="masonry">
            {filtered.map(p=>(
              <PhotoTile key={p.id} photo={p} onClick={setLightbox} onSave={()=>handleSave(p)} liked={likes[p.id]} onLike={onLike} approved={isApproved(p.id)} />
            ))}
          </div>
        )}
      </section>

      {/* MESSAGES */}
      <section className="section" style={{borderTop:"1px solid var(--border)"}}>
        <div style={{textAlign:"center",maxWidth:560,margin:"0 auto 3rem"}}>
          <div className="hero-eyebrow" style={{animation:"none"}}>✦ From Those Who Care ✦</div>
          <h2 className="section-title" style={{textAlign:"center"}}>Messages to <em>Han</em></h2>
          <p className="section-sub" style={{textAlign:"center"}}>Words people left behind — turned into a digital memory book.</p>
        </div>
        <div className="grid-3">
          {messages.map(m=>(
            <div key={m.id} className="msg-card">
              <p className="msg-text">"{m.text}"</p>
              <div className="divider" />
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontSize:"0.88rem",fontWeight:600,color:"var(--pink-dark)"}}>{m.name}</p><p className="msg-author">{m.from}</p></div>
                <p className="msg-author">{m.date}</p>
              </div>
            </div>
          ))}
          {messages.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"3rem",color:"var(--muted)"}}>No messages yet. Be the first to share something with Han.</div>}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{textAlign:"center",padding:"2.5rem",borderTop:"1px solid var(--border)",color:"var(--muted)",fontSize:"0.8rem"}}>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontStyle:"italic",color:"var(--pink-dark)",marginBottom:"0.4rem"}}>✦ Luminary</p>
        <p>Han's personal memory archive · All rights reserved</p>
      </footer>

      {lightbox&&<Lightbox photo={lightbox} onClose={()=>setLightbox(null)} onSave={()=>{setReqModal(lightbox);setLightbox(null);}} approved={isApproved(lightbox.id)} />}
      {reqModal&&!sent[reqModal.id]&&<RequestModal photo={reqModal} onClose={()=>setReqModal(null)} onSubmit={handleRequest} />}
      {reqModal&&sent[reqModal.id]&&(
        <div className="modal-backdrop" onClick={()=>setReqModal(null)}>
          <div className="modal modal-sm" style={{padding:"2.5rem",textAlign:"center"}}>
            <div style={{fontSize:"3rem",marginBottom:"1rem"}}>🌸</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.5rem",fontWeight:700,marginBottom:"0.75rem",color:"var(--text)"}}>Request Sent!</h3>
            <p style={{color:"var(--text2)",lineHeight:1.7,marginBottom:"1.5rem"}}>Han will review your message and decide whether to grant you temporary access. If approved, you'll have 24 hours to save the photo.</p>
            <button className="btn btn-primary" onClick={()=>setReqModal(null)}>Done 🌸</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [pw,setPw]=useState(""); const [err,setErr]=useState(""); const [loading,setLoading]=useState(false);
  const submit=async()=>{setLoading(true);await new Promise(r=>setTimeout(r,600));if(pw==="luminary2025"){onLogin();}else{setErr("Incorrect password.");setLoading(false);}};
  return (
    <div className="login-wrap">
      <div className="hero-mesh" style={{position:"absolute",inset:0}} />
      <FloatingPhotos photos={SEED_PHOTOS} />
      <div className="login-card">
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{fontSize:"2rem",marginBottom:"0.5rem"}}>🌸</div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",fontStyle:"italic",fontWeight:700,color:"var(--pink-dark)"}}>Luminary</div>
          <p style={{color:"var(--text3)",fontSize:"0.85rem",marginTop:"0.3rem"}}>Owner Portal — Private Access</p>
        </div>
        <div className="inp-group"><label>Password</label><input type="password" placeholder="Enter your password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} /></div>
        {err&&<p style={{color:"#be123c",fontSize:"0.82rem",marginBottom:"0.75rem"}}>{err}</p>}
        <button className="btn btn-primary w-full" onClick={submit} disabled={loading}>{loading?<><div className="spinner"/>Verifying…</>:"Enter Archive 🌸"}</button>
        <p style={{textAlign:"center",fontSize:"0.76rem",color:"var(--muted)",marginTop:"1rem"}}>Demo password: luminary2025</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ photos, albums, requests, messages, notifications, onLogout, onApprove, onReject, onUpload, onDeletePhoto, onAddAlbum }) {
  const [tab,setTab]=useState("overview"); const [reqDetail,setReqDetail]=useState(null); const [showUpload,setShowUpload]=useState(false); const [showAlbumForm,setShowAlbumForm]=useState(false); const [newAlbum,setNewAlbum]=useState(""); const [showNotifs,setShowNotifs]=useState(false); const [filterStatus,setFilterStatus]=useState("all");
  const pending=requests.filter(r=>r.status==="pending");
  const approved=requests.filter(r=>r.status==="approved");
  const TABS=[{id:"overview",label:"Overview",icon:"🌸"},{id:"photos",label:"Photos",icon:"📷"},{id:"albums",label:"Albums",icon:"🗂"},{id:"requests",label:"Requests",icon:"💌",badge:pending.length},{id:"messages",label:"Messages",icon:"✉"}];
  const filteredReqs=requests.filter(r=>filterStatus==="all"||r.status===filterStatus);

  return (
    <>
      <div className="sidebar">
        <div style={{padding:"0.5rem 0.5rem 1.25rem",borderBottom:"1px solid var(--border)",marginBottom:"0.6rem"}}>
          <p style={{fontFamily:"'Playfair Display',serif",fontSize:"1.05rem",fontStyle:"italic",fontWeight:700,color:"var(--pink-dark)"}}>🌸 Luminary</p>
          <p style={{fontSize:"0.73rem",color:"var(--muted)",marginTop:"0.15rem"}}>Owner Dashboard</p>
        </div>
        {TABS.map(t=>(
          <div key={t.id} className={`sb-item ${tab===t.id?"active":""}`} onClick={()=>setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
            {t.badge>0&&<span className="badge">{t.badge}</span>}
          </div>
        ))}
        <div style={{flex:1}} />
        <div className="sb-item" onClick={onLogout} style={{color:"var(--muted)"}}>
          <span>⎋</span>Sign Out
        </div>
      </div>

      <div className="dash-body">
        <div className="flex-between" style={{marginBottom:"1.5rem"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"1.7rem",fontWeight:700,color:"var(--text)"}}>{TABS.find(t=>t.id===tab)?.icon} {TABS.find(t=>t.id===tab)?.label}</h2>
          <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
            <div className="relative">
              <button className="btn btn-ghost btn-icon relative" onClick={()=>setShowNotifs(v=>!v)} style={{fontSize:"1rem"}}>
                🔔{pending.length>0&&<span style={{position:"absolute",top:2,right:2,width:8,height:8,background:"var(--pink)",borderRadius:"50%",border:"2px solid var(--bg)"}} />}
              </button>
              {showNotifs&&(
                <div className="notif-panel">
                  <div style={{padding:"0.65rem 1rem",borderBottom:"1px solid var(--border)",fontSize:"0.8rem",color:"var(--muted)",fontWeight:600}}>Notifications</div>
                  {notifications.slice(0,6).map((n,i)=><div key={i} className="notif-item"><span style={{color:"var(--pink)",marginRight:"0.4rem"}}>🌸</span>{n}</div>)}
                  {notifications.length===0&&<div style={{padding:"1rem",color:"var(--muted)",fontSize:"0.83rem",textAlign:"center"}}>No notifications</div>}
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowUpload(true)}>+ Upload</button>
          </div>
        </div>

        {/* OVERVIEW */}
        {tab==="overview"&&<>
          <div className="stat-grid" style={{marginBottom:"1.5rem"}}>
            {[["Photos",photos.length,"var(--pink)"],["Albums",albums.length,"var(--lilac)"],["Pending",pending.length,"var(--gold)"],["Approved",approved.length,"var(--teal)"],["Messages",messages.length,"var(--rose)"]].map(([l,v,c])=>(
              <div key={l} className="stat-card"><div className="stat-n" style={{color:c}}>{v}</div><div className="stat-l">{l}</div></div>
            ))}
          </div>
          <div className="grid-2">
            <div className="card">
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,marginBottom:"1rem",color:"var(--pink-dark)"}}>Recent Requests</h3>
              {requests.slice(0,4).map(r=>(
                <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.6rem 0",borderBottom:"1px solid var(--border)",cursor:"pointer"}} onClick={()=>{setReqDetail(r);setTab("requests");}}>
                  <div><p style={{fontSize:"0.88rem",fontWeight:600,color:"var(--text)"}}>{r.name}</p><p style={{fontSize:"0.73rem",color:"var(--muted)"}}>{r.photoTitle}</p></div>
                  <span className={`tag tag-${r.status}`}>{r.status}</span>
                </div>
              ))}
              {requests.length===0&&<p style={{color:"var(--muted)",fontSize:"0.85rem"}}>No requests yet</p>}
            </div>
            <div className="card">
              <h3 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,marginBottom:"1rem",color:"var(--pink-dark)"}}>Latest Messages</h3>
              {messages.slice(0,3).map(m=>(
                <div key={m.id} style={{padding:"0.6rem 0",borderBottom:"1px solid var(--border)"}}>
                  <p style={{fontSize:"0.88rem",fontStyle:"italic",color:"var(--text)",lineHeight:1.55}}>"{m.text.slice(0,80)}{m.text.length>80?"…":""}"</p>
                  <p style={{fontSize:"0.73rem",color:"var(--muted)",marginTop:"0.25rem"}}>— {m.name}</p>
                </div>
              ))}
              {messages.length===0&&<p style={{color:"var(--muted)",fontSize:"0.85rem"}}>No messages yet</p>}
            </div>
          </div>
        </>}

        {/* PHOTOS */}
        {tab==="photos"&&<>
          <div className="flex-between" style={{marginBottom:"1rem"}}>
            <p style={{color:"var(--text3)",fontSize:"0.88rem"}}>{photos.length} photos in archive</p>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowUpload(true)}>+ Upload Photos</button>
          </div>
          <div className="masonry">
            {photos.map(p=>(
              <div key={p.id} className="photo-tile">
                <img src={p.thumb} alt={p.title} loading="lazy" />
                <div className="photo-overlay">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",width:"100%"}}>
                    <div><p style={{fontFamily:"'Playfair Display',serif",fontSize:"0.92rem",color:"#fff"}}>{p.title}</p><p style={{fontSize:"0.7rem",color:"rgba(255,255,255,0.6)"}}>{albums.find(a=>a.id===p.album)?.name}</p></div>
                    <button className="btn btn-danger btn-sm" onClick={e=>{e.stopPropagation();onDeletePhoto(p.id);}}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* ALBUMS */}
        {tab==="albums"&&<>
          <div className="flex-between" style={{marginBottom:"1rem"}}>
            <p style={{color:"var(--text3)",fontSize:"0.88rem"}}>{albums.length} albums</p>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowAlbumForm(true)}>+ New Album</button>
          </div>
          {showAlbumForm&&(
            <div className="card" style={{maxWidth:380,marginBottom:"1rem"}}>
              <h4 style={{fontFamily:"'Playfair Display',serif",fontWeight:700,marginBottom:"0.75rem",color:"var(--text)"}}>Create Album</h4>
              <div className="inp-group"><label>Album name</label><input placeholder="Enter name…" value={newAlbum} onChange={e=>setNewAlbum(e.target.value)} /></div>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <button className="btn btn-ghost btn-sm" onClick={()=>setShowAlbumForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={()=>{if(newAlbum){onAddAlbum(newAlbum);setNewAlbum("");setShowAlbumForm(false);}}}>Create</button>
              </div>
            </div>
          )}
          <div className="grid-3">
            {albums.map(a=>(
              <div key={a.id} className="album-card"><img src={a.cover} alt={a.name} />
                <div className="album-overlay"><p style={{fontFamily:"'Playfair Display',serif",fontSize:"1rem",color:"#fff",fontWeight:500}}>{a.name}</p><p style={{fontSize:"0.73rem",color:"rgba(255,255,255,0.7)"}}>{photos.filter(p=>p.album===a.id).length} photos</p></div>
              </div>
            ))}
          </div>
        </>}

        {/* REQUESTS */}
        {tab==="requests"&&<>
          <div style={{display:"flex",gap:"0.5rem",marginBottom:"1.25rem",flexWrap:"wrap"}}>
            {["all","pending","approved","rejected"].map(s=>(
              <button key={s} className={`btn btn-sm ${filterStatus===s?"btn-primary":"btn-ghost"}`} onClick={()=>setFilterStatus(s)} style={{textTransform:"capitalize"}}>
                {s}{s==="pending"&&pending.length>0?` (${pending.length})`:""}
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"0.75rem"}}>
            {filteredReqs.map(r=>{
              const photo=photos.find(p=>p.id===r.photoId);
              return (
                <div key={r.id} className="card" style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:"1rem",alignItems:"center",cursor:"pointer"}} onClick={()=>setReqDetail(r)}>
                  {photo&&<img src={photo.thumb} alt="" style={{width:56,height:56,borderRadius:"10px",objectFit:"cover"}} />}
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:"0.65rem",marginBottom:"0.25rem"}}>
                      <p style={{fontWeight:600,fontSize:"0.92rem",color:"var(--text)"}}>{r.name}</p>
                      <span className={`tag tag-${r.status}`}>{r.status}</span>
                    </div>
                    <p style={{fontSize:"0.8rem",color:"var(--text3)",marginBottom:"0.2rem"}}>"{r.message.slice(0,65)}{r.message.length>65?"…":""}"</p>
                    <p style={{fontSize:"0.73rem",color:"var(--muted)"}}>{r.from} · {timeAgo(r.date)} · {r.photoTitle}</p>
                    {r.status==="approved"&&r.expiresAt&&<p style={{fontSize:"0.73rem",color:isExpired(r.expiresAt)?"#be123c":"#0f766e",marginTop:"0.15rem"}}>⏱ {formatExpiry(r.expiresAt)}</p>}
                  </div>
                  {r.status==="pending"&&(
                    <div style={{display:"flex",gap:"0.35rem"}} onClick={e=>e.stopPropagation()}>
                      <button className="btn btn-success btn-sm" onClick={()=>onApprove(r.id)}>✔</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>onReject(r.id)}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredReqs.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"var(--muted)"}}><div style={{fontSize:"2rem",marginBottom:"0.5rem"}}>🌸</div><p>No {filterStatus==="all"?"":filterStatus} requests</p></div>}
          </div>
        </>}

        {/* MESSAGES */}
        {tab==="messages"&&<>
          <p style={{color:"var(--text3)",fontSize:"0.88rem",marginBottom:"1.5rem"}}>{messages.length} messages</p>
          <div className="grid-2">
            {messages.map(m=>(
              <div key={m.id} className="msg-card">
                <p className="msg-text">"{m.text}"</p>
                <div className="divider" />
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div><p style={{fontSize:"0.88rem",fontWeight:600,color:"var(--pink-dark)"}}>{m.name}</p><p style={{fontSize:"0.75rem",color:"var(--muted)"}}>{m.from}</p></div>
                  <p style={{fontSize:"0.75rem",color:"var(--muted)"}}>{m.date}</p>
                </div>
              </div>
            ))}
            {messages.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"3rem",color:"var(--muted)"}}>No messages yet.</div>}
          </div>
        </>}
      </div>

      {showUpload&&<UploadModal albums={albums} onClose={()=>setShowUpload(false)} onUpload={(files,albumId)=>{onUpload(files,albumId);setShowUpload(false);}} />}
      {reqDetail&&<ReqDetailModal req={reqDetail} photo={photos.find(p=>p.id===reqDetail.photoId)} onClose={()=>setReqDetail(null)} onApprove={id=>{onApprove(id);setReqDetail(null);}} onReject={id=>{onReject(id);setReqDetail(null);}} />}
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [photos,setPhotos]=useState(SEED_PHOTOS);
  const [albums,setAlbums]=useState(SEED_ALBUMS);
  const [requests,setRequests]=useState(SEED_REQUESTS);
  const [messages,setMessages]=useState(SEED_MESSAGES);
  const [likes,setLikes]=useState({});
  const [page,setPage]=useState("gallery");
  const [selectedAlbum,setSelectedAlbum]=useState(null);
  const [notifications,setNotifications]=useState(["Samuel requested to download Golden Hour","Meron Alemu left a message for you","Abel requested Cherry Blossoms"]);
  const {toasts,push:toast}=useToast();
  const [loaded,setLoaded]=useState(false);
  const [theme,setTheme]=useState(()=>{
    const stored=localStorage.getItem("lum:theme");
    if(stored) return stored;
    if(typeof window!=="undefined" && window.matchMedia("(prefers-color-scheme:dark)").matches) return "dark";
    return "light";
  });
  const toggleTheme=useCallback(()=>{
    const next=theme==="dark"?"light":"dark";
    setTheme(next);
    localStorage.setItem("lum:theme",next);
  },[theme]);
  useEffect(()=>{
    document.documentElement.setAttribute("data-theme",theme);
  },[theme]);

  useEffect(()=>{(async()=>{
    const [ph,al,rq,ms,lk]=await Promise.all([dbGet(SK.photos),dbGet(SK.albums),dbGet(SK.requests),dbGet(SK.messages),dbGet(SK.likes)]);
    if(ph)setPhotos(ph); if(al)setAlbums(al); if(rq)setRequests(rq); if(ms)setMessages(ms); if(lk)setLikes(lk);
    setLoaded(true);
  })();},[]);

  useEffect(()=>{if(loaded)dbSet(SK.photos,photos);},[photos,loaded]);
  useEffect(()=>{if(loaded)dbSet(SK.albums,albums);},[albums,loaded]);
  useEffect(()=>{if(loaded)dbSet(SK.requests,requests);},[requests,loaded]);
  useEffect(()=>{if(loaded)dbSet(SK.messages,messages);},[messages,loaded]);
  useEffect(()=>{if(loaded)dbSet(SK.likes,likes);},[likes,loaded]);

  const handleRequestDownload=data=>{
    const id="r"+Date.now();
    setRequests(r=>[{id,photoId:data.photoId,photoTitle:data.photoTitle,name:data.name,from:data.from,message:data.message,social:data.social||"",status:"pending",date:new Date().toISOString()},...r]);
    setMessages(m=>[{id:"m"+Date.now(),name:data.name,text:data.message,from:data.from,date:new Date().toISOString().slice(0,10)},...m]);
    setNotifications(n=>[`${data.name} requested to save "${data.photoTitle}"`,...n]);
  };
  const handleApprove=id=>{
    setRequests(r=>r.map(req=>req.id===id?{...req,status:"approved",approvedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+24*3600000).toISOString()}:req));
    const req=requests.find(r=>r.id===id);
    toast(`Approved ${req?.name}'s request — 24h access granted 🌸`,"success");
  };
  const handleReject=id=>{setRequests(r=>r.map(req=>req.id===id?{...req,status:"rejected"}:req));toast("Request rejected","error");};
  const handleUpload=(files,albumId)=>{
    const newPhotos=files.map((f,i)=>{const url=URL.createObjectURL(f);return{id:"p"+Date.now()+i,title:f.name.replace(/\.[^.]+$/,""),album:albumId,url,thumb:url,date:new Date().toISOString().slice(0,10),tags:[],likes:0};});
    setPhotos(p=>[...newPhotos,...p]);
    setAlbums(a=>a.map(al=>al.id===albumId?{...al,count:al.count+files.length}:al));
    toast(`${files.length} photo(s) uploaded 🌸`,"success");
  };
  const handleDeletePhoto=id=>{setPhotos(p=>p.filter(ph=>ph.id!==id));toast("Photo deleted","error");};
  const handleAddAlbum=name=>{setAlbums(a=>[...a,{id:"a"+Date.now(),name,cover:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400",count:0}]);toast(`Album "${name}" created 🌸`,"success");};
  const handleLike=id=>setLikes(l=>({...l,[id]:!l[id]}));

  return (
    <>
      <style>{FONTS}{CSS}</style>

      <nav className="nav">
        <div className="nav-logo" onClick={()=>setPage("gallery")}>🌸 <span>Luminary</span></div>
        <div style={{display:"flex",gap:"0.75rem",alignItems:"center"}}>
          <button className="btn btn-ghost btn-icon" onClick={toggleTheme} aria-label="Toggle theme" title={`Switch to ${theme==="dark"?"light":"dark"} mode`}>
            {theme==="dark"?"☀":"🌙"}
          </button>
          {page==="gallery"&&<>
            <button className="btn btn-ghost btn-sm" onClick={()=>document.querySelector("#gallery-anchor")?.scrollIntoView({behavior:"smooth"})}>Archive</button>
            <button className="btn btn-ghost btn-sm" onClick={()=>setPage("login")}>Owner Portal</button>
          </>}
          {page==="dashboard"&&<>
            <span style={{fontSize:"0.82rem",color:"var(--muted)"}}>Owner Dashboard</span>
            <button className="btn btn-ghost btn-sm" onClick={()=>setPage("gallery")}>← Gallery</button>
          </>}
          {page==="login"&&<button className="btn btn-ghost btn-sm" onClick={()=>setPage("gallery")}>← Gallery</button>}
        </div>
      </nav>

      <main>
        {page==="gallery"&&<GalleryPage photos={photos} albums={albums} requests={requests} messages={messages} onRequestDownload={handleRequestDownload} likes={likes} onLike={handleLike} selectedAlbum={selectedAlbum} setSelectedAlbum={setSelectedAlbum} onLogin={()=>setPage("login")} />}
        {page==="login"&&<LoginPage onLogin={()=>setPage("dashboard")} />}
        {page==="dashboard"&&<Dashboard photos={photos} albums={albums} requests={requests} messages={messages} notifications={notifications} onLogout={()=>setPage("gallery")} onApprove={handleApprove} onReject={handleReject} onUpload={handleUpload} onDeletePhoto={handleDeletePhoto} onAddAlbum={handleAddAlbum} />}
      </main>

      <Toasts toasts={toasts} />
    </>
  );
} 