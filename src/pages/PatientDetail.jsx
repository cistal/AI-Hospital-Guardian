import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../api";

function riskBadge(level) {
  if (level === "critical") return "badge-danger";
  if (level === "high") return "badge-danger";
  if (level === "moderate") return "badge-warning";
  return "badge-success";
}

const LEVEL_LABELS = { critical: "حرج", high: "مرتفع", moderate: "متوسط", low: "منخفض" };

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [risk, setRisk] = useState(null);

  useEffect(() => {
    api.get(`/api/patients/${id}`).then((res) => setPatient(res.data));
    api.get(`/api/patients/${id}/vitals`).then((res) => setVitals(res.data.reverse()));
    api.get(`/api/patients/${id}/lab-results`).then((res) => setLabs(res.data));
    api.get(`/api/patients/${id}/prescriptions`).then((res) => setPrescriptions(res.data));
    api.get(`/api/ai/patients/${id}/risk`).then((res) => setRisk(res.data)).catch(() => setRisk(null));
  }, [id]);

  const chartData = vitals.map((v) => ({
    time: new Date(v.recorded_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    glucose: v.glucose,
    heart_rate: v.heart_rate,
    spo2: v.spo2,
  }));

  const riskTimeline = (risk?.timeline || []).map((s) => ({
    time: new Date(s.timestamp).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    risk_score: s.risk_score,
  }));

  if (!patient) return <div>...جاري التحميل</div>;

  return (
    <div>
      <h3 className="section-title">{patient.full_name}</h3>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card"><div className="stat-value">{patient.blood_type || "-"}</div><div className="stat-label">فصيلة الدم</div></div>
        <div className="card"><div className="stat-value">{patient.gender === "male" ? "ذكر" : "أنثى"}</div><div className="stat-label">الجنس</div></div>
        <div className="card"><div className="stat-value">{patient.allergies || "لا يوجد"}</div><div className="stat-label">حساسية</div></div>
        <div className="card"><div className="stat-value">{patient.status}</div><div className="stat-label">الحالة</div></div>
      </div>

      {risk && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>🧠 تقييم الخطورة بواسطة الـ AI</h4>
            <span className={`badge ${riskBadge(risk.level)}`}>
              {LEVEL_LABELS[risk.level] || risk.level} - {Math.round(risk.risk_score)}%
            </span>
          </div>
          {risk.reasons && risk.reasons.length > 0 ? (
            <ul style={{ margin: "8px 0 0", paddingRight: 20 }}>
              {risk.reasons.map((r, i) => (
                <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="small-dim" style={{ margin: "8px 0 0" }}>لا توجد مؤشرات خطورة حاليًا.</p>
          )}
          {riskTimeline.length > 1 && (
            <div style={{ marginTop: 14 }}>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={riskTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
                  <Line type="monotone" dataKey="risk_score" stroke="#f87171" name="نسبة الخطورة" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h4 style={{ marginTop: 0 }}>العلامات الحيوية (آخر القراءات)</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155" }} />
            <Legend />
            <Line type="monotone" dataKey="glucose" stroke="#f87171" name="سكر الدم" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="heart_rate" stroke="#38bdf8" name="نبض القلب" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="spo2" stroke="#34d399" name="الأكسجين" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h4 style={{ marginTop: 0 }}>نتائج المعامل</h4>
          <table>
            <thead><tr><th>الفحص</th><th>القيمة</th><th>الحالة</th></tr></thead>
            <tbody>
              {labs.map((l) => (
                <tr key={l.id}>
                  <td>{l.test_name}</td>
                  <td>{l.value} {l.unit}</td>
                  <td><span className={`badge ${l.is_abnormal ? "badge-danger" : "badge-success"}`}>{l.is_abnormal ? "غير طبيعي" : "طبيعي"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>الوصفات الطبية</h4>
          <table>
            <thead><tr><th>الجرعة</th><th>التكرار</th><th>الحالة</th></tr></thead>
            <tbody>
              {prescriptions.map((p) => (
                <tr key={p.id}>
                  <td>{p.dosage} {p.unit}</td>
                  <td>{p.frequency}</td>
                  <td><span className="badge badge-info">{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
