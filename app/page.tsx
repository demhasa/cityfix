"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Bell,
  Camera,
  ChevronRight,
  CircleUserRound,
  FileText,
  Home as HomeIcon,
  MapPin,
  Menu,
  Plus,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
} from "lucide-react";
import CityMap from "@/components/city-map";
import { categories } from "@/lib/domain";

type Incident = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: "urgent" | "high" | "normal";
  area: string;
  reports: number;
  likes: number;
  imageUrl: string | null;
  time: string;
  lat: number;
  lng: number;
};
type AiPreview = { title: string; description: string; category: string; danger_level: number; suggested_priority: string };
type User = { id: string; name: string; surname: string; role: string };

const navItems = [
  { label: "Kryefaqja", icon: HomeIcon },
  { label: "Harta", icon: MapPin },
  { label: "Raporto", icon: Camera },
  { label: "Raportet", icon: FileText },
  { label: "Profili", icon: CircleUserRound },
];

export default function Home() {
  const [active, setActive] = useState("Kryefaqja");
  const [showReport, setShowReport] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const load = () => void fetch("/api/incidents").then((response) => response.ok ? response.json() as Promise<{ incidents: Incident[] }> : Promise.reject(new Error("incident load failed"))).then((data) => setIncidents(data.incidents)).catch(() => setIncidents([]));
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void fetch("/api/auth").then((response) => response.json() as Promise<{ user: User | null }>).then((data) => setUser(data.user)).catch(() => setUser(null));
  }, []);

  return (
    <main className="cityfix-app">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><ShieldCheck size={19} /></div><div><strong>CityFix</strong><span>Prishtinë · Kosovë</span></div></div>
        <div className="top-actions"><button aria-label="Njoftimet" className="icon-button" onClick={() => setShowNotifications((value) => !value)}><Bell size={20} /><i /></button><button aria-label="Menuja" className="icon-button" onClick={() => setActive("Profili")}><Menu size={21} /></button></div>
      </header>
      {showNotifications && <button className="notification-popover" onClick={() => setShowNotifications(false)}>Nuk ka njoftime të reja.</button>}

      <section className="content">
        {active === "Kryefaqja" && (
          <>
            <div className="greeting"><div><p className="eyebrow">E martë, 9 nëntor</p><h1>Çfarë po ndodh<br /><em>në lagjen tënde?</em></h1></div><button className="avatar" onClick={() => setActive("Profili")}>{user ? user.name[0] : "A"}</button></div>
            <button className="report-cta" onClick={() => setShowReport(true)}><span className="camera-circle"><Camera size={24} /></span><span><strong>Raporto një problem</strong><small>Ndihmo qytetin të bëhet më i mirë</small></span><ChevronRight size={21} /></button>
            <div className="section-heading"><div><p className="eyebrow">Në afërsi</p><h2>Problemet e fundit</h2></div><button className="link-button" onClick={() => setActive("Harta")}>Shiko të gjitha <ChevronRight size={16} /></button></div>
            <div className="incident-list">{incidents.length ? incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} user={user} onLike={async (id) => { if (!user) { setShowAuth(true); return; } const response = await fetch(`/api/incidents/${id}/like`, { method: "POST", headers: { "x-cityfix-user": user.id } }); if (response.ok) { const result = await response.json() as { likes: number }; setIncidents((current) => current.map((item) => item.id === id ? { ...item, likes: result.likes } : item)); } }} />) : <p className="empty-copy">Duke ngarkuar incidentet reale...</p>}</div>
            <div className="community-card"><div className="community-icon"><Sparkles size={20} /></div><div><strong>Së bashku bëjmë ndryshimin</strong><p>Ke parë një problem që dikush tjetër e ka raportuar? Konfirmoje.</p></div><ChevronRight size={18} /></div>
          </>
        )}
        {active === "Harta" && <MapView incidents={incidents} />}
        {active === "Raportet" && <ReportsView user={user} onAuth={() => setShowAuth(true)} />}
        {active === "Profili" && <ProfileView user={user} onAuth={() => setShowAuth(true)} onLogout={() => setUser(null)} />}
        {active === "Raporto" && <ReportView user={user} onClose={() => setActive("Kryefaqja")} />}
      </section>

      <nav className="bottom-nav" aria-label="Navigimi kryesor">
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setShowReport(false); }}><span className={label === "Raporto" ? "camera-nav" : ""}><Icon size={label === "Raporto" ? 25 : 21} /></span><small>{label}</small></button>)}
      </nav>
      {showReport && <ReportSheet onClose={() => setShowReport(false)} onContinue={() => { setShowReport(false); setActive("Raporto"); }} />}
      {showAuth && <AuthSheet onClose={() => setShowAuth(false)} onSuccess={(nextUser) => { setUser(nextUser); setShowAuth(false); }} />}
    </main>
  );
}

function IncidentCard({ incident, user, onLike }: { incident: Incident; user: User | null; onLike: (id: string) => Promise<void> }) {
  return <article className="incident-card"><div className={`incident-photo photo-${incident.priority}`}>{incident.imageUrl ? <Image src={incident.imageUrl} alt="" fill unoptimized sizes="78px" /> : <><MapPin size={22} /><span>{incident.area}</span></>}</div><div className="incident-info"><div className="card-meta"><span className={`priority-dot ${incident.priority}`} />{incident.category}<time>{incident.time}</time></div><h3>{incident.title}</h3><div className="card-footer"><span className={`status ${incident.status === "Në proces" ? "progress" : ""}`}>{incident.status}</span><button aria-label={user ? "Pëlqe problemin" : "Hyr për të pëlqyer"} onClick={() => void onLike(incident.id)}><ThumbsUp size={15} /> {incident.likes}</button></div></div></article>;
}

function MapView({ incidents }: { incidents: Incident[] }) { return <div className="empty-view"><CityMap incidents={incidents} className="citizen-map" /><h2>Harta e Prishtinës</h2><p>{incidents.length} probleme të sinkronizuara nga databaza.</p></div>; }
function ReportsView({ user, onAuth }: { user: User | null; onAuth: () => void }) {
  const [reports, setReports] = useState<Array<{ id: string; title: string; category: string; status: string; createdAt: string }>>([]);
  useEffect(() => {
    if (!user) return;
    void fetch("/api/reports", { headers: { "x-cityfix-user": user.id } }).then((response) => response.json() as Promise<{ reports: typeof reports }>).then((data) => setReports(data.reports)).catch(() => setReports([]));
  }, [user]);
  if (!user) return <div className="screen-view"><p className="eyebrow">Aktiviteti yt</p><h1>Raportet e mia</h1><p className="empty-copy">Hyr për të parë dhe ruajtur raportet e tua.</p><button className="primary-button" onClick={onAuth}>Hyr / Regjistrohu</button></div>;
  return <div className="screen-view"><p className="eyebrow">Aktiviteti yt</p><h1>Raportet e mia</h1><div className="stats-row"><div><strong>{reports.length}</strong><span>Raporte</span></div><div><strong>{reports.filter((report) => report.status === "resolved").length}</strong><span>Të zgjidhura</span></div><div><strong>0</strong><span>Mbështetje</span></div></div>{reports.length ? <div className="my-reports">{reports.map((report) => <article className="my-report" key={report.id}><strong>{report.title}</strong><span>{report.category} · {report.status}</span></article>)}</div> : <p className="empty-copy">Raportet e tua do të shfaqen këtu pas dërgimit.</p>}</div>;
}
function ProfileView({ user, onAuth, onLogout }: { user: User | null; onAuth: () => void; onLogout: () => void }) {
  if (!user) return <div className="screen-view profile-view"><div className="profile-avatar">?</div><h1>Mirë se vjen</h1><p>Krijo llogari ose hyr për të menaxhuar raportet.</p><button className="primary-button" onClick={onAuth}>Hyr / Regjistrohu</button></div>;
  return <div className="screen-view profile-view"><div className="profile-avatar">{user.name[0]}</div><h1>{user.name} {user.surname}</h1><p>{user.role === "admin" ? "Administrator" : "Qytetar"} · Prishtinë</p><div className="profile-menu"><button onClick={() => alert("Nuk ka njoftime të reja.")}><Bell /> Njoftimet <ChevronRight /></button><button onClick={() => alert("Të dhënat ruhen në mënyrë të sigurt.")}><ShieldCheck /> Privatësia dhe siguria <ChevronRight /></button><button onClick={() => alert("Profili yt është aktiv.")}><CircleUserRound /> Llogaria ime <ChevronRight /></button></div><button className="logout-button" onClick={onLogout}>Dil nga llogaria</button></div>;
}
function AuthSheet({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ personalNumber: "", password: "", name: "", surname: "", neighborhood: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json", "x-auth-action": mode }, body: JSON.stringify(form) });
    const data = await response.json() as { user?: User; error?: string };
    if (!response.ok || !data.user) { setError(data.error ?? "Veprimi dështoi."); return; }
    onSuccess(data.user);
  };
  return <div className="sheet-backdrop" onClick={onClose}><div className="auth-sheet" onClick={(event) => event.stopPropagation()}><button className="sheet-close" onClick={onClose}>×</button><p className="eyebrow">Profili CityFix</p><h2>{mode === "login" ? "Hyr në llogari" : "Krijo llogari"}</h2><form onSubmit={submit}>{mode === "register" && <><input required placeholder="Emri" value={form.name} onChange={update("name")} /><input required placeholder="Mbiemri" value={form.surname} onChange={update("surname")} /><input required placeholder="Lagjja ku banoni" value={form.neighborhood} onChange={update("neighborhood")} /><input type="email" placeholder="Email (opsionale)" value={form.email} onChange={update("email")} /><input type="tel" placeholder="Telefon (opsional)" value={form.phone} onChange={update("phone")} /></>}<input required placeholder="Numri personal" value={form.personalNumber} onChange={update("personalNumber")} /><input required type="password" minLength={6} placeholder="Fjalëkalimi" value={form.password} onChange={update("password")} />{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">{mode === "login" ? "Hyr" : "Regjistrohu"}</button></form><button className="link-button auth-switch" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Nuk ke llogari? Regjistrohu" : "Ke llogari? Hyr"}</button></div></div>;
}
function ReportView({ user, onClose }: { user: User | null; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraMessage, setCameraMessage] = useState("Duke kërkuar qasje në kamerë...");
  const [locationMessage, setLocationMessage] = useState("Lokacioni nuk është marrë ende.");
  const [analysis, setAnalysis] = useState<AiPreview | null>(null);
  const [editingAnalysis, setEditingAnalysis] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const requestCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraMessage("Kamera nuk mbështetet. Përdor ngarkimin e fotografisë.");
        return;
      }
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        streamRef.current = activeStream;
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          await videoRef.current.play();
        }
        setCameraMessage("Kamera është gati.");
      } catch {
        setCameraMessage("Qasja në kamerë u refuzua. Mund të përdorësh galerinë.");
      }
    };
    void requestCamera();
    return () => {
      activeStream?.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Ky shfletues nuk mbështet lokacionin.");
      return;
    }
    setLocationMessage("Duke kërkuar lokacionin...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = { lat: Number(position.coords.latitude.toFixed(6)), lng: Number(position.coords.longitude.toFixed(6)) };
        setLocation(nextLocation);
        setLocationMessage("Lokacioni u gjet.");
      },
      () => setLocationMessage("Lokacioni u refuzua. Mund ta aktivizosh nga cilësimet e shfletuesit."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.8));
    requestLocation();
  };

  const submitReport = async () => {
    if (!photo || !location || !analysis) return;
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(user ? { "x-cityfix-user": user.id } : {}) },
      body: JSON.stringify({ title: analysis.title, description: analysis.description, category: analysis.category, lat: location.lat, lng: location.lng, imageUrl: photo }),
    });
    if (response.ok) setSubmitted(true);
  };

  const analyzeReport = async () => {
    if (!photo || !location) return;
    setAnalysisMessage("AI po e analizon fotografinë...");
    const response = await fetch("/api/reports/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: photo, category: "other" }),
    });
    if (!response.ok) {
      setAnalysisMessage("Analiza dështoi. Provo përsëri.");
      return;
    }
    const data = await response.json() as { ai: AiPreview };
    setAnalysis(data.ai);
    setAnalysisMessage("Kontrolloje raportin para se ta dërgosh.");
  };

  if (submitted) return <div className="camera-view success-view"><div className="success-icon"><ShieldCheck size={34} /></div><h2>Raporti u pranua</h2><p>Komuna do ta shqyrtojë problemin në lokacionin e shënuar.</p><button className="primary-button" onClick={onClose}>Kthehu në kryefaqe</button></div>;
  return <div className="camera-view">
    <div className={`camera-frame ${photo ? "has-photo" : ""}`}>
      {photo ? <Image src={photo} alt="Fotografia e problemit" fill unoptimized sizes="(max-width: 540px) 100vw, 540px" /> : <video ref={videoRef} className="camera-video" playsInline muted aria-label="Pamja e kamerës" />}
      {!photo && <><div className="camera-hint"><Sparkles size={18} /> {cameraMessage}</div><div className="camera-crosshair" /></>}
    </div>
    <div className="camera-actions">
      {!photo ? <><button className="shutter-button" aria-label="Bëj fotografi" onClick={capturePhoto}><Camera size={24} /></button><label className="gallery-button"><Plus size={20} /><input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setPhoto(URL.createObjectURL(file)); requestLocation(); } }} /></label></> : <button className="retake-button" onClick={() => setPhoto(null)}>Bëj përsëri</button>}
    </div>
    <h2>Raporto një problem</h2><p>Fotografo problemin qartë për analizë më të saktë.</p>
    <button className={`location-button ${location ? "ready" : ""}`} onClick={requestLocation}><MapPin size={17} /> {location ? `${location.lat}, ${location.lng}` : "Lejo lokacionin në hartë"}</button>
    <small className="permission-message">{locationMessage}</small>
    {photo && !analysis && <button className="primary-button submit-report" disabled={!location} onClick={analyzeReport}>Analizo fotografinë</button>}
    {analysisMessage && <small className="permission-message">{analysisMessage}</small>}
    {analysis && <div className="analysis-card"><div className="analysis-header"><Sparkles size={17} /><strong>Raporti i propozuar nga AI</strong></div><p className="ai-warning">AI mund të bëjë gabime. Shiko raportin dhe edito.</p>{editingAnalysis ? <div className="analysis-edit-form"><label>Titulli<input value={analysis.title} onChange={(event) => setAnalysis({ ...analysis, title: event.target.value })} /></label><label>Kategoria<select value={analysis.category} onChange={(event) => setAnalysis({ ...analysis, category: event.target.value })}>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label>Përshkrimi<textarea value={analysis.description} onChange={(event) => setAnalysis({ ...analysis, description: event.target.value })} /></label><button className="primary-button submit-report" onClick={() => setEditingAnalysis(false)}>Ruaj ndryshimet</button></div> : <><h3>{analysis.title}</h3><p>{analysis.description}</p><div className="analysis-meta"><span>Kategoria: {analysis.category}</span><span>Rreziku: {analysis.danger_level}/5</span><span>Prioriteti: {analysis.suggested_priority}</span></div><button className="primary-button submit-report" onClick={submitReport}>Dërgo raportin e AI pa ndryshime</button><button className="retake-button" onClick={() => setEditingAnalysis(true)}>Shiko raportin dhe edito</button></>}{editingAnalysis && <button className="retake-button" onClick={submitReport}>Dërgo këtë raport</button>}<button className="retake-button" onClick={() => { setAnalysis(null); setEditingAnalysis(false); }}>Ndrysho fotografinë</button></div>}
  </div>;
}
function ReportSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) { return <div className="sheet-backdrop" onClick={onClose}><div className="report-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><p className="eyebrow">Hapi 1 nga 3</p><h2>Çfarë dëshiron të raportosh?</h2><p className="sheet-copy">Bëj një fotografi. CityFix do ta analizojë dhe do të plotësojë raportin për ty.</p><div className="upload-options"><button onClick={onContinue}><Camera /><span><strong>Hap kamerën</strong><small>Fotografo problemin tani</small></span><ChevronRight /></button><button onClick={onContinue}><Plus /><span><strong>Zgjidh nga galeria</strong><small>Ngarko një fotografi ekzistuese</small></span><ChevronRight /></button></div><button className="cancel-button" onClick={onClose}>Anulo</button></div></div>; }
