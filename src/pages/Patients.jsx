import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/api/patients/").then((res) => setPatients(res.data));
    api.get("/api/rooms/").then((res) => {
      const map = {};
      res.data.forEach((r) => (map[r.id] = r));
      setRooms(map);
    });
  }, []);

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h3 className="section-title">المرضى</h3>
      <div className="card">
        <input
          placeholder="ابحث باسم المريض..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 320 }}
        />
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الجنس</th>
              <th>فصيلة الدم</th>
              <th>الغرفة</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.full_name}</td>
                <td>{p.gender === "male" ? "ذكر" : "أنثى"}</td>
                <td>{p.blood_type || "-"}</td>
                <td>{rooms[p.room_id]?.room_number || "-"}</td>
                <td>
                  <span className={`badge ${p.status === "critical" ? "badge-danger" : "badge-success"}`}>
                    {p.status}
                  </span>
                </td>
                <td>
                  <Link to={`/patients/${p.id}`} style={{ color: "var(--accent)" }}>
                    عرض التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
