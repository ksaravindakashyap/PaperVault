/**
 * Where marketing CTAs ("View Demo", "Try Demo") send users.
 * - Default `/library` = full app (DB, uploads, workspace) — best for local demos.
 * - Set `NEXT_PUBLIC_MARKETING_DEMO_HREF=/demo/library` for static/Netlify builds without a backend.
 */
export const MARKETING_DEMO_HREF =
  process.env.NEXT_PUBLIC_MARKETING_DEMO_HREF ?? "/library";
