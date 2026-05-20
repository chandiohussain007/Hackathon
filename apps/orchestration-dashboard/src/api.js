/**
 * KhidmatAI Orchestration Dashboard — API Client
 * Connects to FastAPI backend to fetch recent sessions and specific session traces.
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://localhost:8000/api/v1";
  }
  // Map khidmat-observability-dashboard-[project].us-central1.run.app to khidmat-agent-backend-[project].us-central1.run.app
  if (hostname.includes('khidmat-observability-dashboard')) {
    const backendHost = hostname.replace('khidmat-observability-dashboard', 'khidmat-agent-backend');
    return `https://${backendHost}/api/v1`;
  }
  // General production default
  return "https://khidmat-agent-backend-1083893144498.us-central1.run.app/api/v1";
};

const API_BASE = getApiBase();
console.log("🚀 KhidmatAI Observability Dashboard: resolved API_BASE to", API_BASE);

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchSessions(limit = 50) {
  return request(`/sessions?limit=${limit}`);
}

export async function fetchSessionDetails(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export default { fetchSessions, fetchSessionDetails };
