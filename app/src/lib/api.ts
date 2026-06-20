/**
 * Centralised API base URL.
 *
 * Development  : VITE_API_BASE is empty → Vite proxy forwards /api to localhost:3001
 * Production   : VITE_API_BASE = https://your-backend.onrender.com
 */
export const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '');
