import axios from "axios";

// Public API — no auth headers, used for public-facing pages (job applications etc.)
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return "http://localhost:8080/api/v1";
  return "/api/v1";
};

const publicApi = axios.create({
  baseURL: getBaseURL(),
  headers: { "Content-Type": "application/json" },
});

export default publicApi;
