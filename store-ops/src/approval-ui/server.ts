/**
 * Local-only approval UI. One static page, plain JS, no build step. Lists content_drafts and
 * pin_queue rows waiting for review; Approve / Reject POSTs flip status. Binds 127.0.0.1.
 */
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "../db.js";
import { loadEnv } from "../config.js";
import { isPaused, pausedReason, unpause } from "../jobs/pause.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export function createApp(db = getPool()) {
  const app = express();
  app.use(express.json());
  app.use(express.static(path.join(here, "public")));

  app.get("/api/state", async (_req, res) => {
    const drafts = await db.query(`SELECT id, kind, target_handle, title, seo_title, seo_description, body_html, faq_json, internal_links, status, created_at, reviewer_notes FROM content_drafts WHERE status = 'draft' ORDER BY created_at DESC LIMIT 50`);
    const pins = await db.query(`SELECT id, page_url, board, title, description, alt_text, keyword, template, image_path, image_hash, status, created_at FROM pin_queue WHERE status = 'pending' ORDER BY created_at DESC LIMIT 100`);
    const counts = await db.query<{ k: string; n: string }>(`SELECT 'drafts_approved' AS k, count(*)::text AS n FROM content_drafts WHERE status='approved'
      UNION ALL SELECT 'pins_approved', count(*)::text FROM pin_queue WHERE status='approved'
      UNION ALL SELECT 'pins_posted_7d', count(*)::text FROM pins_posted WHERE posted_at >= now() - interval '7 days'`);
    res.json({ drafts: drafts.rows, pins: pins.rows, counts: Object.fromEntries(counts.rows.map((r) => [r.k, Number(r.n)])), paused: isPaused(), pausedReason: pausedReason() });
  });

  app.get("/api/pins/:id/image", async (req, res) => {
    const r = await db.query<{ image_path: string }>(`SELECT image_path FROM pin_queue WHERE id = $1`, [Number(req.params.id)]);
    const p = r.rows[0]?.image_path;
    if (!p || !existsSync(p)) return res.status(404).end();
    return res.sendFile(path.resolve(p));
  });

  const decision = (table: "content_drafts" | "pin_queue") => async (req: express.Request, res: express.Response) => {
    const id = Number(req.params["id"]);
    const action = req.params["action"];
    if (!Number.isInteger(id) || (action !== "approve" && action !== "reject")) return res.status(400).json({ error: "bad request" });
    const status = action === "approve" ? "approved" : "rejected";
    const notes = typeof req.body?.notes === "string" ? req.body.notes.slice(0, 2000) : null;
    const pendingStatus = table === "content_drafts" ? "draft" : "pending";
    const r = await db.query(
      table === "content_drafts"
        ? `UPDATE content_drafts SET status = $2, approved_at = CASE WHEN $2 = 'approved' THEN now() END, reviewer_notes = coalesce($3, reviewer_notes) WHERE id = $1 AND status = $4 RETURNING id`
        : `UPDATE pin_queue SET status = $2, approved_at = CASE WHEN $2 = 'approved' THEN now() END, error = $3 WHERE id = $1 AND status = $4 RETURNING id`,
      [id, status, notes, pendingStatus],
    );
    if (r.rowCount === 0) return res.status(409).json({ error: "row not in a reviewable state" });
    return res.json({ ok: true, id, status });
  };
  app.post("/api/drafts/:id/:action", decision("content_drafts"));
  app.post("/api/pins/:id/:action", decision("pin_queue"));

  app.post("/api/unpause", (_req, res) => {
    unpause();
    res.json({ ok: true });
  });

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = loadEnv().APPROVAL_UI_PORT;
  createApp().listen(port, "127.0.0.1", () => console.log(`approval UI on http://127.0.0.1:${port}`));
}
