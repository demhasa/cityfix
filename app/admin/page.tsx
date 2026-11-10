"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, Map, ShieldCheck } from "lucide-react";
import "./admin.css";

type Row = { id: string; title: string; area: string; priority: string; status: string };
const demoAdmin = { personalNumber: "1000000002", password: "CityFix123!" };

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState(demoAdmin);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [section, setSection] = useState("Dashboard");
  const load = () => void fetch("/api/incidents").then((response) => response.json() as Promise<{ incidents: Row[] }>).then((data) => setRows(data.incidents)).catch(() => setRows([]));
  useEffect(() => { if (loggedIn) load(); }, [loggedIn]);
  const login = async (event: React.FormEvent) => {
    event.preventDefault(); setError("");
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
    const data = await response.json() as { user?: { role: string }; error?: string };
    if (!response.ok || data.user?.role !== "admin") { setError("Kredencialet e administratorit nuk janë valide."); return; }
    setLoggedIn(true);
  };
  if (!loggedIn) return <main className="admin-login"><form onSubmit={login}><ShieldCheck size={42} /><p className="admin-caption">PANELI I KOMUNËS</p><h1>Hyr në CityFix Admin</h1><input value={credentials.personalNumber} placeholder="Numri personal" onChange={(event) => setCredentials({ ...credentials, personalNumber: event.target.value })} /><input value={credentials.password} type="password" placeholder="Fjalëkalimi" onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />{error && <p className="admin-error">{error}</p>}<button type="submit">Hyr në panel</button><small>Test: 1000000002 / CityFix123!</small></form></main>;
  return <main className="admin-shell"><aside><div className="admin-brand"><ShieldCheck /> CityFix</div><p className="admin-caption">PANELI I KOMUNËS</p>{["Dashboard", "Incidentet", "Ekipet", "Harta", "Raportet"].map((item, index) => <button className={section === item ? "selected" : ""} key={item} onClick={() => setSection(item)}>{index === 0 ? <BarChart3 /> : index === 3 ? <Map /> : <CheckCircle2 />}{item}</button>)}<button className="admin-logout" onClick={() => setLoggedIn(false)}>Dil nga paneli</button></aside><section className="admin-main"><header><div><p className="admin-caption">PANELI I KOMUNËS</p><h1>{section}</h1></div><div className="admin-user"><span>Komuna e Prishtinës</span><strong>AD</strong></div></header>{section === "Dashboard" && <><div className="kpis"><Kpi icon={<AlertTriangle />} label="Të hapura" value={String(rows.filter((row) => row.status === "new").length)} tone="red" /><Kpi icon={<Clock3 />} label="Në proces" value={String(rows.filter((row) => row.status === "in_progress").length)} tone="orange" /><Kpi icon={<CheckCircle2 />} label="Gjithsej" value={String(rows.length)} tone="green" /><Kpi icon={<BarChart3 />} label="Prioriteti mes." value={rows.length ? String(Math.round(rows.reduce((sum, row) => sum + (row.priority === "urgent" ? 3 : row.priority === "high" ? 2 : 1), 0) / rows.length)) : "0"} tone="blue" /></div><IncidentTable rows={rows} onUpdated={load} /></>}{section !== "Dashboard" && <section className="admin-card empty-admin"><h2>{section}</h2><p>Kjo pamje është gati për përdorim. Zgjidh Dashboard ose Incidentet për të menaxhuar të dhënat.</p>{section === "Incidentet" && <IncidentTable rows={rows} onUpdated={load} />}</section>}</section></main>;
}
function IncidentTable({ rows, onUpdated }: { rows: Row[]; onUpdated: () => void }) { const update = async (id: string, status: string) => { await fetch(`/api/incidents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); onUpdated(); }; return <section className="admin-card wide"><div className="admin-card-head"><div><p className="admin-caption">TË DHËNAT NGA DATABASE</p><h2>Incidentet reale</h2></div><button className="admin-outline" onClick={onUpdated}>Rifresko</button></div><div className="table-wrap"><table><thead><tr><th>ID</th><th>Problemi</th><th>Zona</th><th>Prioriteti</th><th>Statusi</th><th>Veprim</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.id.slice(0, 8)}</td><td>{row.title}</td><td>{row.area}</td><td className="priority-cell">{row.priority}</td><td>{row.status}</td><td><button className="table-action" onClick={() => update(row.id, row.status === "new" ? "in_progress" : "resolved")}>{row.status === "new" ? "Nis" : "Mbyll"}</button></td></tr>)}</tbody></table></div></section>; }
function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) { return <div className="kpi"><span className={`kpi-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>; }
