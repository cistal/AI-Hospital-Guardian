import React, { useEffect, useState } from "react";
import api from "../api";

const TABS = [
  { key: "system-events", label: "أحداث النظام", endpoint: "/api/logs/system-events" },
  { key: "audit", label: "Audit Log", endpoint: "/api/logs/audit" },
  { key: "access", label: "سجل الدخول", endpoint: "/api/logs/access" },
];

export default function SystemEvents() {
  const [tab, setTab] = useState("system-events");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    const endpoint = TABS.find((t) => t.key === tab).endpoint;
    api
      .get(endpoint)
      .then((res) => setRows(res.data))
      .catch(() => {
        setRows([]);
        setError("محتاج صلاحية Admin لعرض السجل ده.");
      });
  }, [tab]);

  function severityBadge(sev) {
    if (sev === "critical" || sev === false) return "badge-danger";
    if (sev === "warning") return "badge-warning";
    return "badge-success";
  }

  return (
    <div>
      <h3 className="section-title">الأحداث والسجلات</h3>
      <div className="card">
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? "var(--accent)" : "var(--panel-light)",
                color: tab === t.key ? "#06202e" : "var(--text)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        {tab === "system-events" && (
          <table>
            <thead><tr><th>النوع</th><th>الخطورة</th><th>الوصف</th><th>المصدر</th><th>الوقت</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.event_type}</td>
                  <td><span className={`badge ${severityBadge(r.severity)}`}>{r.severity}</span></td>
                  <td>{r.description}</td>
                  <td className="small-dim">{r.source || "-"}</td>
                  <td className="small-dim">{new Date(r.timestamp).toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "audit" && (
          <table>
            <thead><tr><th>الإجراء</th><th>النوع</th><th>IP</th><th>الوقت</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.action}</td>
                  <td>{r.entity_type}</td>
                  <td className="small-dim">{r.ip_address || "-"}</td>
                  <td className="small-dim">{new Date(r.timestamp).toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === "access" && (
          <table>
            <thead><tr><th>النتيجة</th><th>IP</th><th>الجهاز</th><th>الوقت</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className={`badge ${severityBadge(r.success)}`}>{r.success ? "نجح" : "فشل"}</span></td>
                  <td className="small-dim">{r.ip_address || "-"}</td>
                  <td className="small-dim">{r.device_info || "-"}</td>
                  <td className="small-dim">{new Date(r.timestamp).toLocaleString("ar-EG")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
