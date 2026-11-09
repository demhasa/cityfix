"use client";

import { useEffect, useRef, useState } from "react";
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

type Incident = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: "urgent" | "high" | "normal";
  area: string;
  reports: number;
  time: string;
};

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
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    void fetch("/api/incidents").then((response) => response.ok ? response.json() as Promise<{ incidents: Incident[] }> : Promise.reject(new Error("incident load failed"))).then((data) => setIncidents(data.incidents)).catch(() => setIncidents([]));
  }, []);

  return (
    <main className="cityfix-app">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><ShieldCheck size={19} /></div><div><strong>CityFix</strong><span>Prishtinë · Kosovë</span></div></div>
        <div className="top-actions"><button aria-label="Njoftimet" className="icon-button"><Bell size={20} /><i /></button><button aria-label="Menuja" className="icon-button"><Menu size={21} /></button></div>
      </header>

      <section className="content">
        {active === "Kryefaqja" && (
          <>
            <div className="greeting"><div><p className="eyebrow">E martë, 9 nëntor</p><h1>Çfarë po ndodh<br /><em>në lagjen tënde?</em></h1></div><div className="avatar">A</div></div>
            <button className="report-cta" onClick={() => setShowReport(true)}><span className="camera-circle"><Camera size={24} /></span><span><strong>Raporto një problem</strong><small>Ndihmo qytetin të bëhet më i mirë</small></span><ChevronRight size={21} /></button>
            <div className="section-heading"><div><p className="eyebrow">Në afërsi</p><h2>Problemet e fundit</h2></div><button className="link-button">Shiko të gjitha <ChevronRight size={16} /></button></div>
            <div className="incident-list">{incidents.length ? incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />) : <p className="empty-copy">Duke ngarkuar incidentet reale...</p>}</div>
            <div className="community-card"><div className="community-icon"><Sparkles size={20} /></div><div><strong>Së bashku bëjmë ndryshimin</strong><p>Ke parë një problem që dikush tjetër e ka raportuar? Konfirmoje.</p></div><ChevronRight size={18} /></div>
          </>
        )}
        {active === "Harta" && <MapView incidents={incidents} />}
        {active === "Raportet" && <ReportsView />}
        {active === "Profili" && <ProfileView />}
        {active === "Raporto" && <ReportView onClose={() => setActive("Kryefaqja")} />}
      </section>

      <nav className="bottom-nav" aria-label="Navigimi kryesor">
        {navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setShowReport(false); }}><span className={label === "Raporto" ? "camera-nav" : ""}><Icon size={label === "Raporto" ? 25 : 21} /></span><small>{label}</small></button>)}
      </nav>
      {showReport && <ReportSheet onClose={() => setShowReport(false)} onContinue={() => { setShowReport(false); setActive("Raporto"); }} />}
    </main>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  return <article className="incident-card"><div className={`incident-photo photo-${incident.priority}`}><MapPin size={22} /><span>{incident.area}</span></div><div className="incident-info"><div className="card-meta"><span className={`priority-dot ${incident.priority}`} />{incident.category}<time>{incident.time}</time></div><h3>{incident.title}</h3><div className="card-footer"><span className={`status ${incident.status === "Në proces" ? "progress" : ""}`}>{incident.status}</span><button aria-label="Konfirmo raportin"><ThumbsUp size={15} /> {incident.reports}</button></div></div></article>;
}

function MapView({ incidents }: { incidents: Incident[] }) { return <div className="empty-view"><div className="map-preview"><div className="map-grid" />{incidents.slice(0, 6).map((incident, index) => <span className={`map-pin pin-${(index % 3) + 1}`} key={incident.id} title={incident.title}><MapPin /></span>)}<div className="map-label">{incidents.length} probleme në databazë</div></div><h2>Harta e qytetit</h2><p>Shiko problemet e raportuara rreth teje.</p></div>; }
function ReportsView() { return <div className="screen-view"><p className="eyebrow">Aktiviteti yt</p><h1>Raportet e mia</h1><div className="stats-row"><div><strong>0</strong><span>Raporte</span></div><div><strong>0</strong><span>Të zgjidhura</span></div><div><strong>0</strong><span>Mbështetje</span></div></div><p className="empty-copy">Raportet e tua do të shfaqen këtu pas dërgimit.</p></div>; }
function ProfileView() { return <div className="screen-view profile-view"><div className="profile-avatar">A</div><h1>Agim Demhasaj</h1><p>Qytetar · Prishtinë</p><div className="profile-menu"><button><Bell /> Njoftimet <ChevronRight /></button><button><ShieldCheck /> Privatësia dhe siguria <ChevronRight /></button><button><CircleUserRound /> Llogaria ime <ChevronRight /></button></div></div>; }
function ReportView({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraMessage, setCameraMessage] = useState("Duke kërkuar qasje në kamerë...");
  const [locationMessage, setLocationMessage] = useState("Lokacioni nuk është marrë ende.");
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
    if (!photo || !location) return;
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Raport nga kamera", description: "Raport i ri nga qytetari.", category: "other", lat: location.lat, lng: location.lng, imageUrl: photo }),
    });
    if (response.ok) setSubmitted(true);
  };

  if (submitted) return <div className="camera-view success-view"><div className="success-icon"><ShieldCheck size={34} /></div><h2>Raporti u pranua</h2><p>Komuna do ta shqyrtojë problemin në lokacionin e shënuar.</p><button className="primary-button" onClick={onClose}>Kthehu në kryefaqe</button></div>;
  return <div className="camera-view">
    <div className={`camera-frame ${photo ? "has-photo" : ""}`}>
      {photo ? <img src={photo} alt="Fotografia e problemit" /> : <video ref={videoRef} className="camera-video" playsInline muted aria-label="Pamja e kamerës" />}
      {!photo && <><div className="camera-hint"><Sparkles size={18} /> {cameraMessage}</div><div className="camera-crosshair" /></>}
    </div>
    <div className="camera-actions">
      {!photo ? <><button className="shutter-button" aria-label="Bëj fotografi" onClick={capturePhoto}><Camera size={24} /></button><label className="gallery-button"><Plus size={20} /><input type="file" accept="image/*" capture="environment" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setPhoto(URL.createObjectURL(file)); requestLocation(); } }} /></label></> : <button className="retake-button" onClick={() => setPhoto(null)}>Bëj përsëri</button>}
    </div>
    <h2>Raporto një problem</h2><p>Fotografo problemin qartë për analizë më të saktë.</p>
    <button className={`location-button ${location ? "ready" : ""}`} onClick={requestLocation}><MapPin size={17} /> {location ? `${location.lat}, ${location.lng}` : "Lejo lokacionin në hartë"}</button>
    <small className="permission-message">{locationMessage}</small>
    {photo && <button className="primary-button submit-report" disabled={!location} onClick={submitReport}>Konfirmo dhe dërgo raportin</button>}
  </div>;
}
function ReportSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) { return <div className="sheet-backdrop" onClick={onClose}><div className="report-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><p className="eyebrow">Hapi 1 nga 3</p><h2>Çfarë dëshiron të raportosh?</h2><p className="sheet-copy">Bëj një fotografi. CityFix do ta analizojë dhe do të plotësojë raportin për ty.</p><div className="upload-options"><button onClick={onContinue}><Camera /><span><strong>Hap kamerën</strong><small>Fotografo problemin tani</small></span><ChevronRight /></button><button onClick={onContinue}><Plus /><span><strong>Zgjidh nga galeria</strong><small>Ngarko një fotografi ekzistuese</small></span><ChevronRight /></button></div><button className="cancel-button" onClick={onClose}>Anulo</button></div></div>; }
