// Static-demo replacement for the axios client.
// There is no backend: every GET is answered from src/demoData.json, a
// snapshot exported from the real FastAPI backend after the real AI engine
// ran on the seeded data (see scripts/export_data.py). Acknowledging /
// resolving alerts works in memory for the session.
import data from "./demoData.json";

const clone = (x) => JSON.parse(JSON.stringify(x));
const ok = (payload) => Promise.resolve({ data: clone(payload) });
const notFound = () => Promise.reject({ response: { status: 404 } });

let alerts = clone(data.alerts);
const SIGNALS_PER_CYCLE = 108; // signals evaluated by the engine in the exported run

function get(url, config = {}) {
  const params = config.params || {};
  let m;

  if (url === "/api/auth/me") return ok(data.me);
  if (url === "/api/patients/") return ok(data.patients);
  if (url === "/api/rooms/") return ok(data.rooms);
  if (url === "/api/devices/") return ok(data.devices);
  if (url === "/api/logs/system-events") return ok(data.system_events);
  if (url === "/api/logs/audit") return ok(data.audit);
  if (url === "/api/logs/access") return ok(data.access);

  if (url === "/api/ai/alerts") {
    let rows = alerts;
    for (const key of ["status", "severity", "category", "patient_id"]) {
      if (params[key]) rows = rows.filter((a) => a[key] === params[key]);
    }
    rows = [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    return ok(rows);
  }

  if ((m = url.match(/^\/api\/patients\/([^/]+)(?:\/(vitals|lab-results|prescriptions))?$/))) {
    const blob = data.patient[m[1]];
    if (!blob) return notFound();
    const part = { undefined: "detail", vitals: "vitals", "lab-results": "labs", prescriptions: "prescriptions" }[m[2]];
    return ok(blob[part]);
  }
  if ((m = url.match(/^\/api\/devices\/([^/]+)\/vitals$/))) {
    return data.device[m[1]] ? ok(data.device[m[1]].vitals) : notFound();
  }
  if ((m = url.match(/^\/api\/ai\/patients\/([^/]+)\/risk$/))) {
    return data.patient[m[1]] ? ok(data.patient[m[1]].risk) : notFound();
  }
  if ((m = url.match(/^\/api\/ai\/devices\/([^/]+)\/profile$/))) {
    return data.device[m[1]] ? ok(data.device[m[1]].profile) : notFound();
  }
  return notFound();
}

function patch(url, body) {
  const m = url.match(/^\/api\/ai\/alerts\/([^/]+)$/);
  const alert = m && alerts.find((a) => a.id === m[1]);
  if (!alert) return notFound();
  alert.status = body.status;
  alert.updated_at = new Date().toISOString();
  return ok(alert);
}

function post(url) {
  if (url === "/api/ai/analyze") {
    // Demo: the engine cannot run in the browser, so this reports a cycle in
    // which every open alert was re-evaluated and nothing new was found.
    const now = new Date().toISOString();
    const open = alerts.filter((a) => a.status !== "resolved");
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            data: {
              started_at: now,
              finished_at: now,
              alerts_created: 0,
              alerts_updated: open.length,
              alerts_resolved: 0,
              signals_evaluated: SIGNALS_PER_CYCLE,
            },
          }),
        700
      )
    );
  }
  return notFound();
}

export default { get, patch, post };
