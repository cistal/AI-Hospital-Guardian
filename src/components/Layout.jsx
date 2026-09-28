import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Layout({ children }) {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>🏥 Hospital System</h2>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            نظرة عامة
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => (isActive ? "active" : "")}>
            المرضى
          </NavLink>
          <NavLink to="/devices" className={({ isActive }) => (isActive ? "active" : "")}>
            الأجهزة الطبية
          </NavLink>
          <NavLink to="/events" className={({ isActive }) => (isActive ? "active" : "")}>
            الأحداث والسجلات
          </NavLink>
          <NavLink to="/ai-alerts" className={({ isActive }) => (isActive ? "active" : "")}>
            🧠 مركز الذكاء الاصطناعي
          </NavLink>
        </nav>
      </aside>
      <div className="main">
        <div className="topbar">
          <span className="small-dim">
            نسخة عرض ثابتة (Static Demo) — بيانات حقيقية من النظام، بدون باك إند
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span className="small-dim">
              {user?.username} · {user?.role}
            </span>
            <span className="badge badge-warning">DEMO</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
