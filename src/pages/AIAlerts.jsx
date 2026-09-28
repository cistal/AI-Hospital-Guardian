import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const CATEGORY_LABELS = {
  PATIENT_RISK: "مراقبة المريض",
  MEDICATION_SAFETY: "أمان الأدوية",
  DOSE_CHANGE: "تغيير الجرعة",
  DEVICE_BEHAVIOR: "سلوك الجهاز",
  CYBERSECURITY: "الأمن السيبراني",
  NETWORK: "الشبكة",
  CORRELATION: "ربط الأحداث",
};

const CATEGORY_ICONS = {
  PATIENT_RISK: "\u2764\uFE0F",
  MEDICATION_SAFETY: "\uD83D\uDC8A",
  DOSE_CHANGE: "\uD83D\uDCC8",
  DEVICE_BEHAVIOR: "\uD83E\uDE7A",
  CYBERSECURITY: "\uD83D\uDD10",
  NETWORK: "\uD83C\uDF10",
  CORRELATION: "\uD83D\uDD25",
};

function severityBadge(sev) {
  if (sev === "critical") return "badge-danger";
  if (sev === "warning") return "badge-warning";
  return "badge-info";
}

function statusBadge(st) {
  if (st === "open") return "badge-danger";
  if (st === "acknowledged") return "badge-warning";
  return "badge-success";
}

export default function AIAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("open");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    api
      .get("/api/ai/alerts", { params })
      .then((res) => setAlerts(res.data))
      .catch(() => setError("محتاج صلاحية لعرض تنبيهات الـ AI."));
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  function runAnalysisNow() {
    setRunning(true);
    api
      .post("/api/ai/analyze")
      .then((res) => {
        setLastRun(res.data);
        load();
      })
      .catch(() => setError("محتاج صلاحية Admin/Doctor لتشغيل التحليل يدويًا."))
      .finally(() => setRunning(false));
  }

  function updateStatus(alertId, status) {
    api.patch(`/api/ai/alerts/${alertId}`, { status }).then(() => load());
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          مركز الذكاء الاصطناعي - AI Correlation Engine
        </h3>
        <button onClick={runAnalysisNow} disabled={running}>
          {running ? "جاري التحليل..." : "تشغيل التحليل الآن"}
        </button>
      </div>

      <p className="small-dim" style={{ marginBottom: 16 }}>
        الـ AI بيحلل بيانات المرضى والأجهزة والدخول والوصفات تلقائيًا كل 30 ثانية، ويربط
        الأحداث المرتبطة ببعضها في حادثة واحدة (Correlation) بدل ما يوريك تنبيهات منفصلة.
      </p>

      {lastRun && (
        <p className="small-dim">
          آخر تشغيل يدوي: +{lastRun.alerts_created} جديد، {lastRun.alerts_updated} تحديث،{" "}
          {lastRun.alerts_resolved} تم حله ({lastRun.signals_evaluated} إشارة تم فحصها).
        </p>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {["open", "acknowledged", "resolved", ""].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              style={{
                background: statusFilter === s ? "var(--accent)" : "var(--panel-light)",
                color: statusFilter === s ? "#06202e" : "var(--text)",
              }}
            >
              {s === "open" ? "مفتوح" : s === "acknowledged" ? "تمت المراجعة" : s === "resolved" ? "تم الحل" : "الكل"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => setCategoryFilter("")}
            style={{
              background: categoryFilter === "" ? "var(--accent)" : "var(--panel-light)",
              color: categoryFilter === "" ? "#06202e" : "var(--text)",
            }}
          >
            كل الفئات
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              style={{
                background: categoryFilter === key ? "var(--accent)" : "var(--panel-light)",
                color: categoryFilter === key ? "#06202e" : "var(--text)",
              }}
            >
              {CATEGORY_ICONS[key]} {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {alerts.length === 0 && !error && (
        <div className="card">
          <p className="small-dim" style={{ margin: 0 }}>
            لا توجد تنبيهات مطابقة للفلتر الحالي.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {alerts.map((a) => {
          const isOpen = expanded === a.id;
          return (
            <div
              key={a.id}
              className="card"
              style={{ borderRight: `4px solid var(--${a.severity === "critical" ? "danger" : a.severity === "warning" ? "warning" : "success"})` }}
            >
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpanded(isOpen ? null : a.id)}
              >
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span className={`badge ${severityBadge(a.severity)}`}>{a.severity}</span>
                    <span className="badge badge-info">
                      {CATEGORY_ICONS[a.category] || ""} {CATEGORY_LABELS[a.category] || a.category}
                    </span>
                    <span className={`badge ${statusBadge(a.status)}`}>{a.status}</span>
                  </div>
                  <strong>{a.title}</strong>
                  <p className="small-dim" style={{ margin: "4px 0 0" }}>{a.summary}</p>
                </div>
                <div style={{ textAlign: "left", flexShrink: 0, marginRight: 16 }}>
                  {a.risk_score != null && <div className="stat-value" style={{ fontSize: 20 }}>{Math.round(a.risk_score)}%</div>}
                  <div className="small-dim">الثقة {a.confidence != null ? Math.round(a.confidence) : "-"}%</div>
                </div>
              </div>

              {isOpen && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <p className="small-dim" style={{ marginBottom: 6 }}>الأسباب (Findings):</p>
                  <ul style={{ margin: "0 0 12px", paddingRight: 20 }}>
                    {(a.findings || []).map((f, i) => (
                      <li key={i} style={{ marginBottom: 4, fontSize: 14 }}>{f}</li>
                    ))}
                  </ul>
                  {a.recommended_action && (
                    <p style={{ fontSize: 14 }}>
                      <strong>الإجراء المقترح: </strong>
                      {a.recommended_action}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {a.patient_id && (
                      <Link to={`/patients/${a.patient_id}`}>
                        <button style={{ background: "var(--panel-light)", color: "var(--text)" }}>عرض المريض</button>
                      </Link>
                    )}
                    {a.status !== "acknowledged" && (
                      <button onClick={() => updateStatus(a.id, "acknowledged")}>تمت المراجعة</button>
                    )}
                    {a.status !== "resolved" && (
                      <button
                        onClick={() => updateStatus(a.id, "resolved")}
                        style={{ background: "var(--success)" }}
                      >
                        تم الحل
                      </button>
                    )}
                  </div>
                  <p className="small-dim" style={{ marginTop: 10 }}>
                    آخر تحديث: {new Date(a.updated_at).toLocaleString("ar-EG")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
