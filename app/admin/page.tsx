"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, Map, ShieldCheck, Users } from "lucide-react";
import CityMap from "@/components/city-map";
import "./admin.css";

type Row = { id: string; title: string; category: string; area: string; priority: string; status: string; lat: number; lng: number };
type Team = { id: string; name: string; specialty: string; status: string; leadName: string };
const nav = [{ key: "dashboard", label: "Dashboard", icon: BarChart3 }, { key: "incidents", label: "Incidentet", icon: AlertTriangle }, { key: "teams", label: "Ekipet", icon: Users }, { key: "map", label: "Harta", icon: Map }, { key: "reports", label: "Raportet", icon: CheckCircle2 }];

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [credentials, setCredentials] = useState({ personalNumber: "1000000002", password: "CityFix123!" });
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [section, setSection] = useState(() => typeof window === "undefined" ? "dashboard" : window.location.hash.slice(1) || "dashboard");

  const load = () => {
    void Promise.all([
      fetch("/api/incidents").then((response) => response.json() as Promise<{ incidents: Row[] }>),
      fetch("/api/teams").then((response) => response.json() as Promise<{ teams: Team[] }>),
    ]).then(([incidentData, teamData]) => { setRows(incidentData.incidents); setTeams(teamData.teams); }).catch(() => { setRows([]); setTeams([]); });
  };
  useEffect(() => {
    const restore = () => void fetch("/api/auth").then((response) => response.json() as Promise<{ user: { role: string } | null }>).then((data) => setLoggedIn(data.user?.role === "admin")).catch(() => setLoggedIn(false));
    const onHash = () => setSection(window.location.hash.slice(1) || "dashboard");
    restore(); window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => { if (loggedIn) { load(); const timer = window.setInterval(load, 15000); return () => window.clearInterval(timer); } }, [loggedIn]);
  const changeSection = (key: string) => { window.history.pushState(null, "", `#${key}`); setSection(key); };
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const data = await response.json() as { user?: { role: string }; error?: string };
    if (!response.ok || data.user?.role !== "admin") { setError("Kredencialet e administratorit nuk janë valide."); return; }
    setLoggedIn(true);
  };
  if (loggedIn === null) return null;
  if (!loggedIn) return <main className="admin-login"><form onSubmit={login}><ShieldCheck size={42} /><p className="admin-caption">PANELI I KOMUNËS</p><h1>Hyr në CityFix Admin</h1><input value={credentials.personalNumber} placeholder="Numri personal" onChange={(event) => setCredentials({ ...credentials, personalNumber: event.target.value })} /><input value={credentials.password} type="password" placeholder="Fjalëkalimi" onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />{error && <p className="admin-error">{error}</p>}<button type="submit">Hyr në panel</button><small>Test: 1000000002 / CityFix123!</small></form></main>;
  const current = nav.find((item) => item.key === section) ?? nav[0];
  return <main className="admin-shell"><aside><div className="admin-brand"><ShieldCheck /> CityFix</div><p className="admin-caption">PANELI I KOMUNËS</p>{nav.map(({ key, label, icon: Icon }) => <button className={section === key ? "selected" : ""} key={key} onClick={() => changeSection(key)}><Icon />{label}</button>)}<button className="admin-logout" onClick={() => { document.cookie = "cityfix_user=; Max-Age=0; path=/"; setLoggedIn(false); }}>Dil nga paneli</button></aside><section className="admin-main"><header><div><p className="admin-caption">LIVE · NEON DATABASE</p><h1>{current.label}</h1></div><div className="admin-user"><span>Komuna e Prishtinës</span><strong>AD</strong></div></header>{section === "dashboard" && <Dashboard rows={rows} teams={teams} onUpdated={load} />}{section === "incidents" && <IncidentTable rows={rows} onUpdated={load} />}{section === "teams" && <Teams teams={teams} />}{section === "map" && <CityMap incidents={rows} className="admin-map" />}{section === "reports" && <ReportsSummary rows={rows} />}</section></main>;
}

function Dashboard({ rows, teams, onUpdated }: { rows: Row[]; teams: Team[]; onUpdated: () => void }) {
  return <><div className="kpis"><Kpi icon={<AlertTriangle />} label="Të hapura" value={String(rows.filter((row) => row.status === "new").length)} tone="red" /><Kpi icon={<Clock3 />} label="Në proces" value={String(rows.filter((row) => row.status === "in_progress").length)} tone="orange" /><Kpi icon={<CheckCircle2 />} label="Gjithsej" value={String(rows.length)} tone="green" /><Kpi icon={<Users />} label="Ekipet aktive" value={String(teams.filter((team) => team.status === "available").length)} tone="blue" /></div><IncidentTable rows={rows.slice(0, 6)} onUpdated={onUpdated} /></>;
}
function IncidentTable({ rows, onUpdated }: { rows: Row[]; onUpdated: () => void }) { const update = async (id: string, status: string) => { await fetch(`/api/incidents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); onUpdated(); }; return <section className="admin-card wide"><div className="admin-card-head"><div><p className="admin-caption">TË DHËNAT NGA DATABASE</p><h2>Incidentet reale</h2></div><button className="admin-outline" onClick={onUpdated}>Rifresko</button></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Problemi</th><th>Zona</th><th>Prioriteti</th><th>Statusi</th><th>Veprim</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.id.slice(0, 8)}</td><td>{row.title}</td><td>{row.area}</td><td className="priority-cell">{row.priority}</td><td>{row.status}</td><td><button className="table-action" onClick={() => update(row.id, row.status === "new" ? "in_progress" : "resolved")}>{row.status === "new" ? "Nis" : "Mbyll"}</button></td></tr>)}</tbody></table></div></section>; }
function Teams({ teams }: { teams: Team[] }) { return <section className="admin-card"><div className="admin-card-head"><div><p className="admin-caption">EKIPET KOMUNALE</p><h2>Kapaciteti i ekipeve</h2></div></div><div className="team-grid">{teams.map((team) => <article className="team-card" key={team.id}><span className={`team-status ${team.status}`}>{team.status === "available" ? "E lirë" : "Në punë"}</span><h3>{team.name}</h3><p>{team.specialty}</p><small>Përgjegjës: {team.leadName}</small></article>)}</div></section>; }
function ReportsSummary({ rows }: { rows: Row[] }) { const counts = useMemo(() => rows.reduce((result, row) => ({ ...result, [row.category]: (result[row.category] ?? 0) + 1 }), {} as Record<string, number>), [rows]); return <section className="admin-card"><p className="admin-caption">RAPORTET NGA NEON</p><h2>Problemet sipas kategorisë</h2><div className="report-bars">{Object.entries(counts).map(([category, count]) => <div key={category}><strong>{count}</strong><span style={{ height: `${Math.max(14, count * 18)}px` }} /><small>{category}</small></div>)}</div></section>; }
function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) { return <div className="kpi"><span className={`kpi-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }
