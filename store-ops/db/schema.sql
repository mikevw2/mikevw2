-- store-ops Postgres schema. Apply with: npm run db:migrate  (or psql "$DATABASE_URL" -f db/schema.sql)
-- Everything the agents write lands here as a draft or a queued row; publishing reads only approved rows.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keyword snapshots. One row per (term, source, snapshot_date) so the agent builds its own time series.
CREATE TABLE IF NOT EXISTS keywords (
  id              bigserial PRIMARY KEY,
  term            text        NOT NULL,
  volume          integer,
  kd              numeric(5,1),                   -- keyword difficulty 0-100 when the source has it
  intent          text        CHECK (intent IN ('informational','commercial','transactional','navigational')),
  season          text,                           -- e.g. 'jan-planner', 'q4-gifting', 'evergreen'
  source          text        NOT NULL,           -- 'dataforseo' | 'gsc' | 'pinterest_trends' | 'manual'
  snapshot_date   date        NOT NULL DEFAULT CURRENT_DATE,
  raw             jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (term, source, snapshot_date)
);
CREATE INDEX IF NOT EXISTS keywords_term_idx ON keywords (lower(term));

-- Drafted copy. Agents only ever insert status='draft'. Humans move it to approved/rejected in the approval UI.
CREATE TABLE IF NOT EXISTS content_drafts (
  id               bigserial PRIMARY KEY,
  kind             text NOT NULL CHECK (kind IN ('guide','collection','product')),
  target_handle    text NOT NULL,                 -- Shopify handle of the article/collection/product
  keyword_id       bigint REFERENCES keywords(id),
  title            text NOT NULL,
  body_html        text NOT NULL,
  seo_title        text NOT NULL CHECK (char_length(seo_title) <= 60),
  seo_description  text NOT NULL CHECK (char_length(seo_description) <= 155),
  faq_json         jsonb NOT NULL DEFAULT '[]'::jsonb,
  internal_links   jsonb NOT NULL DEFAULT '[]'::jsonb,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected','published')),
  shopify_id       text,                          -- gid://shopify/... once published
  idempotency_key  text NOT NULL UNIQUE,
  model            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  approved_at      timestamptz,
  published_at     timestamptz,
  reviewer_notes   text
);
CREATE INDEX IF NOT EXISTS content_drafts_status_idx ON content_drafts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_drafts_kind_day_idx ON content_drafts (kind, created_at);

-- Pin queue. Pin factory inserts status='pending'; approval UI flips to approved/rejected; poster posts approved rows.
CREATE TABLE IF NOT EXISTS pin_queue (
  id               bigserial PRIMARY KEY,
  page_url         text NOT NULL,
  board            text NOT NULL,                 -- Pinterest board id (or name before boards are resolved)
  title            text NOT NULL CHECK (char_length(title) <= 100),
  description      text NOT NULL CHECK (char_length(description) <= 500),
  alt_text         text,
  keyword          text,
  template         text,
  image_path       text NOT NULL,
  image_hash       text NOT NULL,                 -- 64-bit average hash, hex
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','posting','posted','failed')),
  scheduled_for    timestamptz,
  posted_at        timestamptz,
  pinterest_pin_id text,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  approved_at      timestamptz
);
CREATE INDEX IF NOT EXISTS pin_queue_status_idx ON pin_queue (status, scheduled_for);
CREATE INDEX IF NOT EXISTS pin_queue_image_hash_idx ON pin_queue (image_hash);
CREATE INDEX IF NOT EXISTS pin_queue_url_posted_idx ON pin_queue (page_url, posted_at DESC) WHERE status = 'posted';

-- Posted pins only: used for URL spacing (>= 7 days) and daily count.
CREATE OR REPLACE VIEW pins_posted AS
  SELECT id, page_url, board, image_hash, posted_at, pinterest_pin_id
  FROM pin_queue
  WHERE status = 'posted' AND posted_at IS NOT NULL;

-- Every mutation against an external system, with the diff and the idempotency key, so retries never double-post.
CREATE TABLE IF NOT EXISTS publish_log (
  id               bigserial PRIMARY KEY,
  entity           text NOT NULL,                 -- 'shopify.article' | 'shopify.product' | 'shopify.metafield' | 'pinterest.pin' | ...
  action           text NOT NULL,                 -- 'create' | 'update' | 'dry_run' | ...
  entity_id        text,
  diff_json        jsonb NOT NULL,
  idempotency_key  text NOT NULL UNIQUE,
  ok               boolean NOT NULL DEFAULT true,
  error            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Daily metrics from every source, long format.
CREATE TABLE IF NOT EXISTS metrics_daily (
  id       bigserial PRIMARY KEY,
  date     date NOT NULL,
  source   text NOT NULL CHECK (source IN ('gsc','pinterest','shopify')),
  metric   text NOT NULL,                         -- 'clicks','impressions','saves','outbound_clicks','orders','revenue',...
  dimension text NOT NULL DEFAULT '',             -- optional breakdown, e.g. query or utm source
  value    numeric NOT NULL,
  UNIQUE (date, source, metric, dimension)
);

-- One row per job execution. ok=false plus a PAUSED file stops the poster until a human clears it.
CREATE TABLE IF NOT EXISTS job_runs (
  id          bigserial PRIMARY KEY,
  job         text NOT NULL,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok          boolean,
  notes       text
);
CREATE INDEX IF NOT EXISTS job_runs_job_idx ON job_runs (job, started_at DESC);

-- Monthly DataForSEO task counter (cap: 400/month).
CREATE TABLE IF NOT EXISTS api_task_counter (
  provider text NOT NULL,
  month    date NOT NULL,                         -- first day of month
  count    integer NOT NULL DEFAULT 0,
  PRIMARY KEY (provider, month)
);
