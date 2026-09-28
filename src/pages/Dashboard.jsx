import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState({ patients: 0, devices: 0, prescriptions: 0, events: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [patientsRes, devicesRes] = await Promise.all([
          api.get("/api/patients/"),
          api.get("/api/devices/"),
        ]);
        setStats((s) => ({ ...s, patients: patientsRes.data.length, devices: devicesRes.data.length }));
      } catch (e) {
        // ignore - endpoint may require different role
      }

      try {
        const eventsRes = await api.get("/api/logs/system-events");
        setStats((s) => ({ ...s, events: eventsRes.data.length }));
        setRecentEvents(eventsRes.data.slice(0, 8));
      } catch (e) {
        // requires admin/doctor role
      }

      try {
        const alertsRes = await api.get("/api/ai/alerts", { params: { status: "open" } });
        setAiAlerts(alertsRes.data.slice(0, 6));
      } catch (e) {
        // ignore
      }
    }
    load();
  }, []);

  function severityBadge(sev) {
    if (sev === "critical") return "badge-danger";
    if (sev === "warning") return "badge-warning";
    return "badge-info";
  }

  const criticalCount = aiAlerts.filter((a) => a.severity === "critical").length;

  return (
    <div>
      <h3 className="section-title">نظرة عامة على المستشفى</h3>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="stat-value">{stats.patients}</div>
          <div className="stat-label">إجمالي المرضى</div>
        </div>
        <div className="card">
          <div className="stat-value">{stats.devices}</div>
          <div className="stat-label">الأجهزة الطبية</div>
        </div>
        <div className="card">
          <div className="stat-value">{stats.events}</div>
          <div className="stat-label">أحداث النظام الأخيرة</div>
        </div>
        <Link to="/ai-alerts" style={{ textDecoration: "none" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <div className="stat-value" style={{ color: criticalCount ? "var(--danger)" : "var(--text)" }}>
              {aiAlerts.length}
            </div>
            <div className="stat-label">🧠 تنبيهات AI مفتوحة</div>
          </div>
        </Link>
      </div>

      {aiAlerts.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ marginTop: 0 }}>أحدث تنبيهات الذكاء الاصطناعي</h4>
            <Link to="/ai-alerts" className="small-dim">عرض الكل →</Link>
          </div>
          <table>
            <thead>
              <tr><th>الفئة</th><th>الخطورة</th><th>العنوان</th><th>نسبة الخطورة</th></tr>
            </thead>
            <tbody>
              {aiAlerts.map((a) => (
                <tr key={a.id}>
                  <td className="small-dim">{a.category}</td>
                  <td><span className={`badge ${severityBadge(a.severity)}`}>{a.severity}</span></td>
                  <td>{a.title}</td>
                  <td>{a.risk_score != null ? `${Math.round(a.risk_score)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h4 style={{ marginTop: 0 }}>آخر أحداث النظام</h4>
        <p className="small-dim">
          دي البيانات الخام اللي بيتغذى منها الـ AI Correlation Engine.
        </p>
        {recentEvents.length === 0 ? (
          <p className="small-dim">لا توجد أحداث بعد، أو الحساب الحالي مش عنده صلاحية عرضها.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>النوع</th>
                <th>الخطورة</th>
                <th>الوصف</th>
                <th>الوقت</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.event_type}</td>
                  <td><span className={`badge ${severityBadge(ev.severity)}`}>{ev.severity}</span></td>
                  <td>{ev.description}</td>
                  <td className="small-dim">{new Date(ev.timestamp).toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
