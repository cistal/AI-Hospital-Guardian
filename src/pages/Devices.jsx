import React, { useEffect, useState } from "react";
import api from "../api";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [rooms, setRooms] = useState({});
  const [selected, setSelected] = useState(null);
  const [deviceVitals, setDeviceVitals] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get("/api/devices/").then((res) => setDevices(res.data));
    api.get("/api/rooms/").then((res) => {
      const map = {};
      res.data.forEach((r) => (map[r.id] = r));
      setRooms(map);
    });
  }, []);

  function openDevice(dev) {
    setSelected(dev);
    api.get(`/api/devices/${dev.id}/vitals`).then((res) => setDeviceVitals(res.data.slice(0, 20)));
    api.get(`/api/ai/devices/${dev.id}/profile`).then((res) => setProfile(res.data)).catch(() => setProfile(null));
  }

  return (
    <div>
      <h3 className="section-title">الأجهزة الطبية</h3>
      <div className="grid grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>الكود</th>
                <th>النوع</th>
                <th>الغرفة</th>
                <th>نطاق العمل الطبيعي</th>
                <th>آخر ظهور</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} onClick={() => openDevice(d)} style={{ cursor: "pointer" }}>
                  <td>{d.device_code}</td>
                  <td>{d.device_type}</td>
                  <td>{rooms[d.room_id]?.room_number || "-"}</td>
                  <td className="small-dim">{d.normal_start_hour}:00 - {d.normal_end_hour}:00</td>
                  <td className="small-dim">{d.last_seen_at ? new Date(d.last_seen_at).toLocaleString("ar-EG") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>
            {selected ? `قراءات الجهاز ${selected.device_code}` : "اختر جهاز من الجدول"}
          </h4>
          {selected && profile && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <span className={`badge ${profile.anomalies.length ? "badge-danger" : "badge-success"}`}>
                  {profile.anomalies.length ? `🧠 ${profile.anomalies.length} سلوك غير طبيعي` : "🧠 سلوك طبيعي"}
                </span>
                <span className="badge badge-info">{profile.readings_last_24h} قراءة آخر 24 ساعة</span>
                <span className="badge badge-info">{profile.distinct_patients_last_24h} مريض مختلف</span>
              </div>
              {profile.anomalies.length > 0 && (
                <ul style={{ margin: 0, paddingRight: 20 }}>
                  {profile.anomalies.slice(0, 6).map((a, i) => (
                    <li key={i} style={{ fontSize: 13, marginBottom: 4 }}>{a}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {!selected && (
            <p className="small-dim">
              دي القراءات اللي بيولدها الجهاز ده - الـ AI بيبني منها Behavior Profile
              ويكتشف أي نشاط خارج النطاق الطبيعي أو في غرفة/قسم غير مخصص للجهاز.
            </p>
          )}
          {selected && (
            <table>
              <thead>
                <tr><th>سكر</th><th>نبض</th><th>الوقت</th></tr>
              </thead>
              <tbody>
                {deviceVitals.map((v) => (
                  <tr key={v.id}>
                    <td>{v.glucose ?? "-"}</td>
                    <td>{v.heart_rate ?? "-"}</td>
                    <td className="small-dim">{new Date(v.recorded_at).toLocaleString("ar-EG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
