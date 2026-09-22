/**
 * Centralised API base URL.
 *
 * Development  : VITE_API_BASE is empty → Vite proxy forwards /api to localhost:3001
 * Production   : Fallback to Render production backend URL if VITE_API_BASE is not explicitly set
 */
const RENDER_BACKEND = 'https://website-x8xr.onrender.com';

export const API_BASE = (
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? RENDER_BACKEND : '')
).replace(/\/$/, '');
