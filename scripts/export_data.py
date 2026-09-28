"""
Exports a static snapshot of the hospital system for the GitHub Pages demo.

Seeds a throwaway SQLite database, runs the REAL AI analysis engine on it,
then calls the REAL FastAPI endpoints (through TestClient) and stores every
response in src/demoData.json. The demo frontend serves those responses
instead of talking to a backend.

Run from the backend folder:
    DATABASE_URL=sqlite:////tmp/demo.db python /path/to/export_data.py
"""
import json, os, sys
from datetime import datetime

sys.path.insert(0, os.getcwd())
from app import seed_data
seed_data.run()

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app import models
from app.ai.patient_risk import compute_patient_risk

OUT = sys.argv[1]
data = {"generated_at": datetime.utcnow().isoformat(), "patient": {}, "device": {}}

with TestClient(app) as c:
    tok = c.post("/api/auth/login", data={"username": "admin", "password": "Admin@123"}).json()["access_token"]
    H = {"Authorization": f"Bearer {tok}"}
    get = lambda url, **kw: c.get(url, headers=H, **kw).json()

    data["me"] = get("/api/auth/me")
    data["patients"] = get("/api/patients/")
    data["rooms"] = get("/api/rooms/")
    data["devices"] = get("/api/devices/")
    data["system_events"] = get("/api/logs/system-events")
    data["audit"] = get("/api/logs/audit")
    data["access"] = get("/api/logs/access")
    c.post("/api/ai/analyze", headers=H)
    data["alerts"] = get("/api/ai/alerts")

    for p in data["patients"]:
        pid = p["id"]
        data["patient"][pid] = {
            "detail": get(f"/api/patients/{pid}"),
            "vitals": get(f"/api/patients/{pid}/vitals"),
            "labs": get(f"/api/patients/{pid}/lab-results"),
            "prescriptions": get(f"/api/patients/{pid}/prescriptions"),
            "risk": get(f"/api/ai/patients/{pid}/risk"),
        }
    for d in data["devices"]:
        did = d["id"]
        data["device"][did] = {
            "vitals": get(f"/api/devices/{did}/vitals"),
            "profile": get(f"/api/ai/devices/{did}/profile"),
        }

# Build a real risk-over-time timeline: re-run the patient risk detector on
# each growing prefix of the patient's vital signs (oldest -> newest).
db = SessionLocal()
for pid, blob in data["patient"].items():
    vit = (db.query(models.VitalSign).filter(models.VitalSign.patient_id == pid)
           .order_by(models.VitalSign.recorded_at.asc()).all())
    labs = db.query(models.LabResult).filter(models.LabResult.patient_id == pid).all()
    timeline, last = [], None
    for k in range(1, len(vit) + 1):
        score, findings, level = compute_patient_risk(vit[:k], labs)
        if last is None or abs(score - last) >= 5 or k == len(vit):
            timeline.append({"id": f"{pid}-{k}", "patient_id": pid, "risk_score": score, "level": level,
                             "reasons": findings, "timestamp": vit[k - 1].recorded_at.isoformat()})
            last = score
    blob["risk"]["timeline"] = timeline
db.close()

json.dump(data, open(OUT, "w"), ensure_ascii=False, default=str)
print("patients", len(data["patients"]), "devices", len(data["devices"]), "alerts", len(data["alerts"]))
print("size KB", os.path.getsize(OUT) // 1024)
