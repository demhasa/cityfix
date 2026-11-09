"use client";

import { useState } from "react";
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

const incidents: Incident[] = [
  { id: "CF-1042", title: "Gropë e madhe në rrugë", category: "Gropë", status: "Në pritje", priority: "urgent", area: "Bregu i Diellit", reports: 14, time: "12 min më parë" },
  { id: "CF-1041", title: "Ndriçimi publik nuk punon", category: "Ndriçim", status: "Në proces", priority: "high", area: "Ulpianë", reports: 6, time: "1 orë më parë" },
  { id: "CF-1038", title: "Mbeturina pranë parkut", category: "Mbeturina", status: "Pranuar", priority: "normal", area: "Dardani", reports: 9, time: "3 orë më parë" },
];

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
            <div className="incident-list">{incidents.map((incident) => <IncidentCard key={incident.id} incident={incident} />)}</div>
            <div className="community-card"><div className="community-icon"><Sparkles size={20} /></div><div><strong>Së bashku bëjmë ndryshimin</strong><p>Ke parë një problem që dikush tjetër e ka raportuar? Konfirmoje.</p></div><ChevronRight size={18} /></div>
          </>
        )}
        {active === "Harta" && <MapView />}
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

function MapView() { return <div className="empty-view"><div className="map-preview"><div className="map-grid" /><span className="map-pin pin-one"><MapPin /></span><span className="map-pin pin-two"><MapPin /></span><span className="map-pin pin-three"><MapPin /></span><div className="map-label">Probleme në afërsi</div></div><h2>Harta e qytetit</h2><p>Shiko problemet e raportuara rreth teje.</p></div>; }
function ReportsView() { return <div className="screen-view"><p className="eyebrow">Aktiviteti yt</p><h1>Raportet e mia</h1><div className="stats-row"><div><strong>3</strong><span>Raporte</span></div><div><strong>2</strong><span>Të zgjidhura</span></div><div><strong>18</strong><span>Mbështetje</span></div></div>{incidents.slice(0, 2).map((incident) => <IncidentCard key={incident.id} incident={incident} />)}</div>; }
function ProfileView() { return <div className="screen-view profile-view"><div className="profile-avatar">A</div><h1>Agim Demhasaj</h1><p>Qytetar · Prishtinë</p><div className="profile-menu"><button><Bell /> Njoftimet <ChevronRight /></button><button><ShieldCheck /> Privatësia dhe siguria <ChevronRight /></button><button><CircleUserRound /> Llogaria ime <ChevronRight /></button></div></div>; }
function ReportView({ onClose }: { onClose: () => void }) { return <div className="camera-view"><div className="camera-frame"><div className="camera-hint"><Sparkles size={18} /> Fotografia analizohet nga AI</div><div className="camera-crosshair" /></div><h2>Raporto një problem</h2><p>Fotografo problemin qartë për analizë më të saktë.</p><button className="primary-button" onClick={onClose}>Zgjidh fotografinë</button></div>; }
function ReportSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) { return <div className="sheet-backdrop" onClick={onClose}><div className="report-sheet" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><p className="eyebrow">Hapi 1 nga 3</p><h2>Çfarë dëshiron të raportosh?</h2><p className="sheet-copy">Bëj një fotografi. CityFix do ta analizojë dhe do të plotësojë raportin për ty.</p><div className="upload-options"><button onClick={onContinue}><Camera /><span><strong>Hap kamerën</strong><small>Fotografo problemin tani</small></span><ChevronRight /></button><button onClick={onContinue}><Plus /><span><strong>Zgjidh nga galeria</strong><small>Ngarko një fotografi ekzistuese</small></span><ChevronRight /></button></div><button className="cancel-button" onClick={onClose}>Anulo</button></div></div>; }
