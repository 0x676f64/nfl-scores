import type { IncomingMessage, ServerResponse } from "node:http";
import { once } from "node:events";
import { context, reddit, redis, settings } from "@devvit/web/server";
import type { PartialJsonValue, TriggerResponse, UiResponse } from "@devvit/web/shared";

// ════════════════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════════════════

// ESPN NFL team IDs. Verified against a live summary payload (standings
// block, Aug 2026): CHI=3, CIN=4, CLE=5, DET=8, GB=9, MIN=16, PIT=23,
// BAL=33 — all matched this canonical enumeration. (ESPN skips 31/32.)
// Before first release, confirm the remaining 24 with one request:
//   https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams
const TEAM_NAMES: Record<string, string> = {
  "1": "Atlanta Falcons",
  "2": "Buffalo Bills",
  "3": "Chicago Bears",
  "4": "Cincinnati Bengals",
  "5": "Cleveland Browns",
  "6": "Dallas Cowboys",
  "7": "Denver Broncos",
  "8": "Detroit Lions",
  "9": "Green Bay Packers",
  "10": "Tennessee Titans",
  "11": "Indianapolis Colts",
  "12": "Kansas City Chiefs",
  "13": "Las Vegas Raiders",
  "14": "Los Angeles Rams",
  "15": "Miami Dolphins",
  "16": "Minnesota Vikings",
  "17": "New England Patriots",
  "18": "New Orleans Saints",
  "19": "New York Giants",
  "20": "New York Jets",
  "21": "Philadelphia Eagles",
  "22": "Arizona Cardinals",
  "23": "Pittsburgh Steelers",
  "24": "Los Angeles Chargers",
  "25": "San Francisco 49ers",
  "26": "Seattle Seahawks",
  "27": "Tampa Bay Buccaneers",
  "28": "Washington Commanders",
  "29": "Carolina Panthers",
  "30": "Jacksonville Jaguars",
  "33": "Baltimore Ravens",
  "34": "Houston Texans",
};

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const ESPN_STANDINGS_URL = "https://site.api.espn.com/apis/v2/sports/football/nfl/standings";

// ════════════════════════════════════════════════════════════════════════
// Redis expiration helpers
// ════════════════════════════════════════════════════════════════════════

// Dedup keys only need to live long enough to prevent same-day or
// next-day re-posts. Three days is plenty.
function dedupExpiresAt(): Date {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
}

// post-game / post-type mappings power rendering of old threads. 180 days.
function renderExpiresAt(): Date {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
}

// ════════════════════════════════════════════════════════════════════════
// Entry point
// ════════════════════════════════════════════════════════════════════════

export async function serverOnRequest(
  req: IncomingMessage,
  rsp: ServerResponse,
): Promise<void> {
  try {
    await onRequest(req, rsp);
  } catch (err) {
    const msg = `server error; ${err instanceof Error ? err.stack : err}`;
    console.error(msg);
    writeJSON<ErrorResponse>(500, { error: msg, status: 500 }, rsp);
  }
}

async function onRequest(
  req: IncomingMessage,
  rsp: ServerResponse,
): Promise<void> {
  const url = req.url;
  if (!url || url === "/") {
    writeJSON<ErrorResponse>(404, { error: "not found", status: 404 }, rsp);
    return;
  }

  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;

  // ── Public read endpoints (called by the splash) ──────────────────────
  if (pathname === "/api/schedule") {
    await onSchedule(urlObj, rsp);
    return;
  }
  if (pathname.startsWith("/api/game/")) {
    await onGame(pathname.slice("/api/game/".length), rsp);
    return;
  }
  if (pathname.startsWith("/api/winprob/")) {
    await onWinProb(pathname.slice("/api/winprob/".length), rsp);
    return;
  }
  if (pathname.startsWith("/api/broadcasts/")) {
    await onBroadcasts(pathname.slice("/api/broadcasts/".length), rsp);
    return;
  }
  if (pathname.startsWith("/api/clips/")) {
    await onClips(pathname.slice("/api/clips/".length), rsp);
    return;
  }
  if (pathname === "/api/standings") {
    await onStandings(rsp);
    return;
  }
  if (pathname === "/api/post-game") {
    await onPostGame(rsp);
    return;
  }
  if (pathname === "/api/postgame-check") {
    await onPostgameCheck(rsp);
    return;
  }

  // ── Moderator menu endpoints ──────────────────────────────────────────
  if (pathname === "/internal/menu/post-all-today") {
    const result = await onMenuPostAllGames();
    writeJSON<PartialJsonValue>(200, result as unknown as PartialJsonValue, rsp);
    return;
  }
  if (pathname === "/internal/menu/post-postgame") {
    const result = await onMenuPostPostgame();
    writeJSON<PartialJsonValue>(200, result as unknown as PartialJsonValue, rsp);
    return;
  }
  if (pathname === "/internal/menu/clear-today-dedup") {
    const result = await onMenuClearTodayDedup();
    writeJSON<PartialJsonValue>(200, result as unknown as PartialJsonValue, rsp);
    return;
  }

  // ── Scheduler endpoints ───────────────────────────────────────────────
  if (pathname === "/internal/scheduler/postgame-sweep") {
    await onCronPostgameSweep();
    writeJSON<PartialJsonValue>(200, { ok: true } as PartialJsonValue, rsp);
    return;
  }

  // ── Trigger endpoints ─────────────────────────────────────────────────
  if (pathname === "/internal/triggers/on-app-install") {
    const result = await onAppInstall();
    writeJSON<PartialJsonValue>(200, result as unknown as PartialJsonValue, rsp);
    return;
  }
  if (pathname === "/internal/triggers/on-post-delete") {
    const result = await onPostDelete(req);
    writeJSON<PartialJsonValue>(200, result as unknown as PartialJsonValue, rsp);
    return;
  }
  if (pathname === "/internal/triggers/on-mod-action") {
    const result = await onModAction(req);
    writeJSON<PartialJsonValue>(200, result as unknown as PartialJsonValue, rsp);
    return;
  }

  writeJSON<ErrorResponse>(404, { error: "not found", status: 404 }, rsp);
}

type ErrorResponse = {
  error: string;
  status: number;
};

// ════════════════════════════════════════════════════════════════════════
// HTTP helpers
// ════════════════════════════════════════════════════════════════════════

function writeJSON<T extends PartialJsonValue>(
  status: number,
  json: Readonly<T>,
  rsp: ServerResponse,
): void {
  const body = JSON.stringify(json);
  const len = Buffer.byteLength(body);
  rsp.writeHead(status, {
    "Content-Length": len,
    "Content-Type": "application/json",
  });
  rsp.end(body);
}

async function readJSON<T>(req: IncomingMessage): Promise<T | null> {
  try {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    await once(req, "end");
    const body = Buffer.concat(chunks).toString();
    return body ? (JSON.parse(body) as T) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  CACHE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const GAME_CACHE_TTL_S = 8;       // live summary — play-by-play, refreshes ~every 10s
const SCHEDULE_CACHE_TTL_S = 30;  // scoreboard — changes slowly
const STANDINGS_CACHE_TTL_S = 300; // standings — changes only when games end

// Like writeJSON, but writes an already-serialized JSON string as-is. Lets a
// cache hit go straight to the wire without a parse/re-stringify round trip.
function writeRawJSON(status: number, body: string, rsp: ServerResponse): void {
  rsp.writeHead(status, {
    "Content-Length": Buffer.byteLength(body),
    "Content-Type": "application/json",
  });
  rsp.end(body);
}

// Serve `url` as JSON, backed by a short-lived Redis cache under `cacheKey`.
// Cache read/write failures are non-fatal (fall through to fetch / serve
// uncached). Upstream errors pass through uncached so the client can retry.
async function proxyEspnJsonCached(
  cacheKey: string,
  url: string,
  ttlSeconds: number,
  rsp: ServerResponse,
): Promise<void> {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      writeRawJSON(200, cached, rsp);
      return;
    }
  } catch (e) {
    console.error(`cache read failed for ${cacheKey}:`, e);
  }

  try {
    const r = await fetch(url);
    const text = await r.text();
    if (r.ok) {
      // NOTE: the NFL summary payload runs ~1.1MB for a completed game —
      // near typical Redis value limits. If "cache write failed" shows up in
      // the logs frequently, switch this endpoint to caching a trimmed subset.
      try {
        await redis.set(cacheKey, text, {
          expiration: new Date(Date.now() + ttlSeconds * 1000),
        });
      } catch (e) {
        console.error(`cache write failed for ${cacheKey}:`, e);
      }
      writeRawJSON(200, text, rsp);
    } else {
      writeRawJSON(
        r.status,
        text || `{"error":"upstream ${r.status}","status":${r.status}}`,
        rsp,
      );
    }
  } catch (e) {
    writeJSON<ErrorResponse>(500, { error: String(e), status: 500 }, rsp);
  }
}

// Fetch-and-parse variant for server-side consumers (postgame check, sweep).
// Same cache as the proxy path so viewers and the lifecycle share one
// upstream fetch per TTL.
async function fetchEspnJsonCached(
  cacheKey: string,
  url: string,
  ttlSeconds: number,
): Promise<any | null> {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error(`cache read failed for ${cacheKey}:`, e);
  }
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const text = await r.text();
    try {
      await redis.set(cacheKey, text, {
        expiration: new Date(Date.now() + ttlSeconds * 1000),
      });
    } catch (e) {
      console.error(`cache write failed for ${cacheKey}:`, e);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error(`fetch failed for ${url}:`, e);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════
// ESPN NFL API proxies (called by the splash)
// ════════════════════════════════════════════════════════════════════════

// The client keeps sending sv-SE (YYYY-MM-DD) exactly as it did for MLB;
// ESPN's ?dates= wants YYYYMMDD, so the hyphens are stripped server-side.
// Client contract unchanged.
async function onSchedule(urlObj: URL, rsp: ServerResponse): Promise<void> {
  const date = urlObj.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    writeJSON<ErrorResponse>(400, { error: "Missing or invalid date param", status: 400 }, rsp);
    return;
  }
  const espnDate = date.replaceAll("-", "");
  await proxyEspnJsonCached(
    `nflcache:sched:${date}`,
    `${ESPN_BASE}/scoreboard?dates=${espnDate}`,
    SCHEDULE_CACHE_TTL_S,
    rsp,
  );
}

// ── Broadcast delay ──────────────────────────────────────────────────────
// MLB's delay rode statsapi's point-in-time `timecode` feed. ESPN has no
// equivalent, so the NFL delay is served from OUR OWN snapshot ring buffer:
// every time the summary cache refreshes, the fresh body is appended to a
// per-game snapshot list in Redis ({t, body}, capped). A delayed viewer gets
// the newest snapshot at or before (now − delay). Nothing is skipped — each
// snapshot is the complete game state at its moment, and the forward-only
// guard below means the delayed view can never rewind.
//
// Storage note: full summaries are ~1.1MB, so the buffer stores a TRIMMED
// snapshot (header + situation-critical fields + tails of drives/plays are
// still present because we trim by dropping the largest static blocks). If
// Redis size still bites, tighten trimSummaryForSnapshot further.

const DELAY_SNAP_CAP = 40; // × 8s TTL ≈ 5+ minutes of history; max delay is 20s

// Drop the heavyweight blocks a delayed *live* viewer doesn't need this
// instant. They come back the moment delay is Off, and the wrap/final view
// always renders from the real-time payload once the game completes.
function trimSummaryForSnapshot(full: any): any {
  const t = { ...full };
  delete t.standings;
  delete t.news;
  delete t.article;
  delete t.videos;
  delete t.pickcenter;
  delete t.againstTheSpread;
  delete t.odds;
  delete t.injuries;
  return t;
}

async function appendDelaySnapshot(eventId: string, fresh: any): Promise<void> {
  const key = `nflcache:delaysnaps:${eventId}`;
  const now = Date.now();
  try {
    const raw = await redis.get(key);
    let snaps: Array<{ t: number; body: any }> = raw ? JSON.parse(raw) : [];
    const last = snaps[snaps.length - 1];
    // Only append when the cache actually turned over (one snapshot per TTL).
    if (!last || now - last.t >= GAME_CACHE_TTL_S * 1000 - 500) {
      snaps.push({ t: now, body: trimSummaryForSnapshot(fresh) });
      if (snaps.length > DELAY_SNAP_CAP) snaps = snaps.slice(-DELAY_SNAP_CAP);
      await redis.set(key, JSON.stringify(snaps), {
        expiration: new Date(now + 6 * 3600 * 1000),
      });
    }
  } catch (e) {
    console.error(`delay snapshot append failed for ${eventId}:`, e);
  }
}

async function serveDelayedGame(
  eventId: string,
  delaySeconds: number,
  rsp: ServerResponse,
): Promise<void> {
  const liveUrl = `${ESPN_BASE}/summary?event=${eventId}`;
  // Keep the buffer fed off the same shared cache the real-time path uses.
  const fresh = await fetchEspnJsonCached(
    `nflcache:game:${eventId}`,
    liveUrl,
    GAME_CACHE_TTL_S,
  );
  if (!fresh) {
    writeJSON<ErrorResponse>(500, { error: "upstream summary unavailable", status: 500 }, rsp);
    return;
  }
  await appendDelaySnapshot(eventId, fresh);

  try {
    const raw = await redis.get(`nflcache:delaysnaps:${eventId}`);
    const snaps: Array<{ t: number; body: any }> = raw ? JSON.parse(raw) : [];
    const target = Date.now() - delaySeconds * 1000;

    let selected: { t: number; body: any } | null = null;
    for (const s of snaps) {
      if (s.t <= target) selected = s;
      else break;
    }
    // Buffer younger than the delay — serve the earliest snapshot (delayed
    // viewer sees the start), mirroring the MLB behavior.
    if (!selected) selected = snaps[0] ?? null;
    if (!selected) {
      writeJSON<PartialJsonValue>(200, fresh as PartialJsonValue, rsp);
      return;
    }

    // Forward-only guard: never serve an earlier snapshot than we already
    // served for this (game, delay), so the delayed view can never rewind.
    const guardKey = `nflcache:lastsnap:${eventId}:${delaySeconds}`;
    try {
      const prevT = Number(await redis.get(guardKey));
      if (Number.isFinite(prevT) && prevT > selected.t) {
        const prev = snaps.find((s) => s.t === prevT);
        if (prev) selected = prev;
      }
      await redis.set(guardKey, String(selected.t), {
        expiration: new Date(Date.now() + 6 * 3600 * 1000),
      });
    } catch (e) {
      console.error(`delay guard failed for ${eventId}:`, e);
    }

    writeJSON<PartialJsonValue>(200, selected.body as PartialJsonValue, rsp);
  } catch (e) {
    console.error(`serveDelayedGame failed for ${eventId} — serving live:`, e);
    writeJSON<PartialJsonValue>(200, fresh as PartialJsonValue, rsp);
  }
}

// True when the (cached) summary says the game is complete. Shares the game
// cache, so this costs nothing extra while viewers are polling.
async function gameIsFinalCached(eventId: string): Promise<boolean> {
  const summary = await fetchEspnJsonCached(
    `nflcache:game:${eventId}`,
    `${ESPN_BASE}/summary?event=${eventId}`,
    GAME_CACHE_TTL_S,
  );
  const g = summary ? normalizeSummary(summary) : null;
  return g ? isFinalGame(g) : false;
}

async function onGame(eventId: string, rsp: ServerResponse): Promise<void> {
  if (!/^\d+$/.test(eventId)) {
    writeJSON<ErrorResponse>(400, { error: "Invalid eventId", status: 400 }, rsp);
    return;
  }
  const delay = await getBroadcastDelaySetting();
  // Delay only applies while the game is live. Once it's Final there's nothing
  // to spoil, so fall through to real-time and let the Wrap Up render
  // immediately. (The snapshot buffer would self-heal after `delay` seconds
  // anyway — final-state snapshots keep appending — but the bypass matches the
  // deployed MLB semantics and skips the buffer overhead.)
  if (delay > 0 && !(await gameIsFinalCached(eventId))) {
    await serveDelayedGame(eventId, delay, rsp);
    return;
  }
  await proxyEspnJsonCached(
    `nflcache:game:${eventId}`,
    `${ESPN_BASE}/summary?event=${eventId}`,
    GAME_CACHE_TTL_S,
    rsp,
  );
}

// ESPN bundles win probability INSIDE the summary (winprobability[], keyed by
// playId with homeWinPercentage). This endpoint extracts from the SAME cached
// summary — the client contract stays a separate /api/winprob/ call like MLB,
// but there's no extra upstream fetch behind it.
async function onWinProb(eventId: string, rsp: ServerResponse): Promise<void> {
  if (!/^\d+$/.test(eventId)) {
    writeJSON<ErrorResponse>(400, { error: "Invalid eventId", status: 400 }, rsp);
    return;
  }
  const summary = await fetchEspnJsonCached(
    `nflcache:game:${eventId}`,
    `${ESPN_BASE}/summary?event=${eventId}`,
    GAME_CACHE_TTL_S,
  );
  if (!summary) {
    writeJSON<ErrorResponse>(500, { error: "upstream summary unavailable", status: 500 }, rsp);
    return;
  }
  writeJSON<PartialJsonValue>(
    200,
    { winprobability: summary?.winprobability ?? [] } as PartialJsonValue,
    rsp,
  );
}

// Broadcast/TV info comes bundled in the summary (header.competitions[0]
// .broadcasts[] — {type, market, media.shortName, isNational}). Extracted from
// the shared summary cache; no separate upstream call, unlike MLB's schedule
// hydrate.
async function onBroadcasts(eventId: string, rsp: ServerResponse): Promise<void> {
  if (!/^\d+$/.test(eventId)) {
    writeJSON<ErrorResponse>(400, { error: "Invalid eventId", status: 400 }, rsp);
    return;
  }
  const summary = await fetchEspnJsonCached(
    `nflcache:game:${eventId}`,
    `${ESPN_BASE}/summary?event=${eventId}`,
    GAME_CACHE_TTL_S,
  );
  const broadcasts = summary?.header?.competitions?.[0]?.broadcasts ?? [];
  writeJSON<PartialJsonValue>(200, { broadcasts } as PartialJsonValue, rsp);
}

// Best direct-MP4 URL from an ESPN video item. links.source carries quality
// variants (HD / mezzanine / full) that are direct mp4s on espnmedia-cdn;
// HLS/hds/flash are streaming manifests the webview player doesn't want.
function bestVideoUrl(item: any): string | null {
  const source = item?.links?.source ?? {};
  const prefer = ["HD", "mezzanine", "full"];
  for (const q of prefer) {
    const href = source?.[q]?.href;
    if (typeof href === "string" && href) return href;
  }
  return typeof source?.href === "string" && source.href ? source.href : null;
}

// Highlight clips from summary.videos[]. NOTE (differs from MLB): MLB clips
// were keyed by playId GUID for exact scoring-play matching; ESPN clips are a
// loose list not reliably keyed to plays, so this serves a trimmed array and
// the client renders them as a highlights rail rather than per-play chips.
async function onClips(eventId: string, rsp: ServerResponse): Promise<void> {
  if (!/^\d+$/.test(eventId)) {
    writeJSON<ErrorResponse>(400, { error: "Invalid eventId", status: 400 }, rsp);
    return;
  }
  const summary = await fetchEspnJsonCached(
    `nflcache:game:${eventId}`,
    `${ESPN_BASE}/summary?event=${eventId}`,
    GAME_CACHE_TTL_S,
  );
  const videos: any[] = summary?.videos ?? [];
  const clips = videos
    .map((v) => ({
      id: String(v?.id ?? ""),
      headline: String(v?.headline ?? ""),
      description: String(v?.description ?? ""),
      thumbnail: String(v?.thumbnail ?? ""),
      duration: Number(v?.duration ?? 0) || 0,
      url: bestVideoUrl(v),
    }))
    .filter((c) => c.url);
  writeJSON<PartialJsonValue>(200, { clips } as PartialJsonValue, rsp);
}

async function onStandings(rsp: ServerResponse): Promise<void> {
  await proxyEspnJsonCached(
    "nflcache:standings",
    ESPN_STANDINGS_URL,
    STANDINGS_CACHE_TTL_S,
    rsp,
  );
}

// ════════════════════════════════════════════════════════════════════════
// Normalized game shape
// ════════════════════════════════════════════════════════════════════════
// MLB's helpers poked two payload shapes (schedule game vs live feed) with
// fallback chains. ESPN gives us a cleaner option: scoreboard events[] and
// summary.header.competitions[0] carry the SAME competitor/status structure,
// so everything downstream (titles, lifecycle) runs on one normalized shape.
// This also fixes ESPN's string-typed scores ("16") in one place.

type NormTeam = {
  id: string;
  name: string;
  abbr: string;
  score: number;
};

type NormGame = {
  eventId: string;
  date: string;            // ISO, e.g. "2026-08-13T23:00Z"
  seasonType: number;      // 1 = preseason, 2 = regular, 3 = postseason
  week: number | null;
  statusName: string;      // e.g. "STATUS_FINAL"
  statusState: string;     // "pre" | "in" | "post"
  completed: boolean;
  statusDetail: string;    // e.g. "Final", "Postponed - Weather"
  home: NormTeam;
  away: NormTeam;
};

function normTeamFromCompetitor(c: any): NormTeam {
  return {
    id: String(c?.team?.id ?? ""),
    name: String(c?.team?.displayName ?? (c?.homeAway === "home" ? "Home" : "Away")),
    abbr: String(c?.team?.abbreviation ?? ""),
    score: Number(c?.score ?? 0) || 0, // ESPN scores are strings
  };
}

// `comp` is a competition object; works for both scoreboard events[].competitions[0]
// and summary.header.competitions[0]. `seasonWeekSource` carries season/week
// (the event itself for scoreboard; the header for summary).
function normalizeCompetition(comp: any, seasonWeekSource: any, eventId: string): NormGame | null {
  const competitors: any[] = comp?.competitors ?? [];
  const home = competitors.find((c) => c?.homeAway === "home");
  const away = competitors.find((c) => c?.homeAway === "away");
  if (!home || !away) return null;

  const st = comp?.status?.type ?? {};
  return {
    eventId,
    date: String(comp?.date ?? ""),
    seasonType: Number(seasonWeekSource?.season?.type ?? 2) || 2,
    week: typeof seasonWeekSource?.week?.number === "number"
      ? seasonWeekSource.week.number
      : typeof seasonWeekSource?.week === "number"
        ? seasonWeekSource.week
        : null,
    statusName: String(st?.name ?? ""),
    statusState: String(st?.state ?? ""),
    completed: st?.completed === true,
    statusDetail: String(st?.detail ?? st?.description ?? ""),
    home: normTeamFromCompetitor(home),
    away: normTeamFromCompetitor(away),
  };
}

// Scoreboard event → NormGame. (scoreboard events[] have week as a number on
// the event and season on the event; both shapes handled above.)
function normalizeScoreboardEvent(ev: any): NormGame | null {
  const eventId = String(ev?.id ?? "");
  if (!eventId) return null;
  return normalizeCompetition(ev?.competitions?.[0], ev, eventId);
}

// Full summary → NormGame.
function normalizeSummary(summary: any): NormGame | null {
  const header = summary?.header;
  const eventId = String(header?.id ?? "");
  if (!eventId) return null;
  return normalizeCompetition(header?.competitions?.[0], header, eventId);
}

// Lifecycle predicates (replaces MLB's codedGameState checks).
function isFinalGame(g: NormGame): boolean {
  return g.completed || g.statusName === "STATUS_FINAL";
}
function isPostponedGame(g: NormGame): boolean {
  return g.statusName === "STATUS_POSTPONED";
}
function isCanceledGame(g: NormGame): boolean {
  return g.statusName === "STATUS_CANCELED";
}

// ════════════════════════════════════════════════════════════════════════
// Settings helpers
// ════════════════════════════════════════════════════════════════════════

async function getTeamIdFilter(): Promise<string | null> {
  try {
    const raw = await settings.get<string | string[]>("teamId");

    let value: string;
    if (Array.isArray(raw)) {
      value = (raw[0] ?? "").toString().trim();
    } else if (typeof raw === "string") {
      value = raw.trim();
    } else {
      value = "";
    }

    if (!value) return null;
    if (!/^\d+$/.test(value)) {
      console.warn(`Invalid teamId setting: "${value}" — falling back to all games`);
      return null;
    }
    return value;
  } catch (e) {
    console.error("getTeamIdFilter error:", e);
    return null;
  }
}

async function getAutoPostgameSetting(): Promise<boolean> {
  try {
    const raw = await settings.get<boolean | boolean[]>("autoPostgame");
    if (Array.isArray(raw)) return raw[0] ?? true;
    if (typeof raw === "boolean") return raw;
    return true;
  } catch (e) {
    console.error("getAutoPostgameSetting error:", e);
    return true;
  }
}

async function getThreadTypeSetting(): Promise<string> {
  try {
    const raw = await settings.get<string | string[]>("threadType");
    if (Array.isArray(raw)) return (raw[0] ?? "game").toString();
    if (typeof raw === "string") return raw;
    return "game";
  } catch (e) {
    console.error("getThreadTypeSetting error:", e);
    return "game";
  }
}

async function isBroadcastMode(): Promise<boolean> {
  return (await getThreadTypeSetting()) === "broadcast";
}

async function getBroadcastLabel(): Promise<string> {
  try {
    const raw = await settings.get<string | string[]>("broadcastLabel");
    const val = Array.isArray(raw) ? (raw[0] ?? "") : typeof raw === "string" ? raw : "";
    return val.toString().trim() || "Broadcast Thread";
  } catch (e) {
    console.error("getBroadcastLabel error:", e);
    return "Broadcast Thread";
  }
}

// Broadcast delay in seconds (0 = real-time). See serveDelayedGame.
async function getBroadcastDelaySetting(): Promise<number> {
  try {
    const raw = await settings.get<string | string[]>("broadcastDelay");
    const val = Array.isArray(raw) ? (raw[0] ?? "0") : raw ?? "0";
    const n = parseInt(String(val), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch (e) {
    console.error("getBroadcastDelaySetting error:", e);
    return 0;
  }
}

// Automatic postgame threads fire only when the setting is on AND we are not in
// Broadcast (companion) mode. Broadcast mode never auto-posts a postgame.
async function autoPostgameEnabled(): Promise<boolean> {
  if (await isBroadcastMode()) return false;
  return getAutoPostgameSetting();
}

async function getCustomPostgameTitles(): Promise<{ win: string; loss: string }> {
  const normalize = (raw: unknown): string => {
    if (Array.isArray(raw)) return (raw[0] ?? "").toString().trim();
    if (typeof raw === "string") return raw.trim();
    return "";
  };

  try {
    const winRaw = await settings.get<string | string[]>("postgameWinTitle");
    const lossRaw = await settings.get<string | string[]>("postgameLossTitle");
    return {
      win: normalize(winRaw),
      loss: normalize(lossRaw),
    };
  } catch (e) {
    console.error("getCustomPostgameTitles error:", e);
    return { win: "", loss: "" };
  }
}

// ════════════════════════════════════════════════════════════════════════
// Date helpers
// ════════════════════════════════════════════════════════════════════════

function todayDateStr(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/New_York" });
}

function yesterdayDateStr(): string {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return yesterday.toLocaleDateString("sv-SE", { timeZone: "America/New_York" });
}

// Fetch a date's slate from the scoreboard, normalized, optionally filtered
// to the configured team. NOTE (differs from MLB): ESPN's scoreboard has no
// team query param the way statsapi's schedule had &teamId= — the full slate
// is fetched (one cached call) and filtered server-side.
async function fetchGamesForDate(date: string, teamId: string | null): Promise<NormGame[]> {
  const espnDate = date.replaceAll("-", "");
  const data = await fetchEspnJsonCached(
    `nflcache:sched:${date}`,
    `${ESPN_BASE}/scoreboard?dates=${espnDate}`,
    SCHEDULE_CACHE_TTL_S,
  );
  const events: any[] = data?.events ?? [];
  const games: NormGame[] = [];
  for (const ev of events) {
    const g = normalizeScoreboardEvent(ev);
    if (!g) continue;
    if (teamId && g.home.id !== teamId && g.away.id !== teamId) continue;
    games.push(g);
  }
  return games;
}

async function fetchRecentGames(teamId: string | null): Promise<NormGame[]> {
  const [today, yesterday] = await Promise.all([
    fetchGamesForDate(todayDateStr(), teamId),
    fetchGamesForDate(yesterdayDateStr(), teamId),
  ]);

  const seen = new Set<string>();
  const combined: NormGame[] = [];
  for (const g of [...today, ...yesterday]) {
    if (!seen.has(g.eventId)) {
      seen.add(g.eventId);
      combined.push(g);
    }
  }
  return combined;
}

function formatGameTimeET(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
  });
}

// ════════════════════════════════════════════════════════════════════════
// Game type / context helpers
// ════════════════════════════════════════════════════════════════════════
// MLB used gameType letters + seriesDescription. NFL context comes from
// season.type (1 pre / 2 reg / 3 post) + week.number.
//
// Postseason week numbering per ESPN (season.type === 3):
//   1 = Wild Card, 2 = Divisional, 3 = Conference Championship,
//   4 = Pro Bowl, 5 = Super Bowl
// VERIFY against the live scoreboard in January before the first postseason —
// the sample payload is preseason, so this mapping is from documentation, not
// from verified data.

function getPostseasonName(week: number | null): string {
  switch (week) {
    case 1: return "Wild Card";
    case 2: return "Divisional Round";
    case 3: return "Conference Championship";
    case 4: return "Pro Bowl";
    case 5: return "Super Bowl";
    default: return "Playoffs";
  }
}

function getGamePrefix(g: NormGame, isPostgame: boolean): string {
  if (g.seasonType === 3) {
    const name = getPostseasonName(g.week);
    return isPostgame ? `${name} Final` : name;
  }
  if (g.seasonType === 1) {
    return isPostgame ? "Preseason Postgame" : "Preseason";
  }
  return isPostgame ? "Postgame Thread" : "Game Thread";
}

// Used in front of custom win/loss titles so playoff context isn't lost.
function getCustomTitleContext(g: NormGame): string {
  if (g.seasonType === 3) return `[${getPostseasonName(g.week)}] `;
  if (g.seasonType === 1) return "[Preseason] ";
  return "";
}

// Regular-season week tag, e.g. " (Week 8)". Replaces MLB's doubleheader
// suffix as the disambiguator in busy feeds; empty when week is unknown.
function weekSuffix(g: NormGame): string {
  if (g.seasonType === 2 && g.week) return ` (Week ${g.week})`;
  return "";
}

// ════════════════════════════════════════════════════════════════════════
// Title builders
// ════════════════════════════════════════════════════════════════════════

function buildGameThreadTitle(
  g: NormGame,
  teamId: string | null,
  broadcastLabel?: string | null,
): string {
  const time = formatGameTimeET(g.date || new Date().toISOString());
  // Broadcast (companion) mode replaces the "Game Thread" prefix with the mod's label.
  const prefix =
    broadcastLabel && broadcastLabel.trim() ? broadcastLabel.trim() : getGamePrefix(g, false);

  if (teamId && teamId === g.home.id) {
    return `${prefix}: ${g.home.name} vs ${g.away.name}${weekSuffix(g)} - ${time}`;
  }
  return `${prefix}: ${g.away.name} @ ${g.home.name}${weekSuffix(g)} - ${time}`;
}

function applyTitleTemplate(
  template: string,
  team: string,
  opp: string,
  teamScore: number,
  oppScore: number,
): string {
  return template
    .replace(/\{team\}/g, team)
    .replace(/\{opp\}/g, opp)
    .replace(/\{teamScore\}/g, String(teamScore))
    .replace(/\{oppScore\}/g, String(oppScore));
}

function buildPostgameThreadTitle(
  g: NormGame,
  teamId: string | null,
  customTitles: { win: string; loss: string },
): string {
  const prefix = getGamePrefix(g, true);
  const suffix = weekSuffix(g);

  if (!teamId) {
    return `${prefix}: ${g.away.name} ${g.away.score} @ ${g.home.name} ${g.home.score}${suffix}`;
  }

  const isHomeYourTeam = teamId === g.home.id;
  const isAwayYourTeam = teamId === g.away.id;
  if (!isHomeYourTeam && !isAwayYourTeam) {
    return `${prefix}: ${g.away.name} ${g.away.score} @ ${g.home.name} ${g.home.score}${suffix}`;
  }

  const teamName = isHomeYourTeam ? g.home.name : g.away.name;
  const oppName = isHomeYourTeam ? g.away.name : g.home.name;
  const teamScore = isHomeYourTeam ? g.home.score : g.away.score;
  const oppScore = isHomeYourTeam ? g.away.score : g.home.score;
  const teamWon = teamScore > oppScore;
  // NFL ties are real (regular season). A tie uses the LOSS template if set —
  // "we didn't win" phrasing reads closer to a tie than a victory chant. Subs
  // that care can watch for it; default format is used when templates are blank.

  const template = teamWon ? customTitles.win : customTitles.loss;
  if (template) {
    const contextPrefix = getCustomTitleContext(g);
    const filled = applyTitleTemplate(template, teamName, oppName, teamScore, oppScore);
    return `${contextPrefix}${filled}${suffix}`;
  }

  if (isHomeYourTeam) {
    return `${prefix}: ${g.home.name} ${g.home.score} vs ${g.away.name} ${g.away.score}${suffix}`;
  }
  return `${prefix}: ${g.away.name} ${g.away.score} @ ${g.home.name} ${g.home.score}${suffix}`;
}

function buildPostponedThreadTitle(g: NormGame, teamId: string | null): string {
  // ESPN puts any qualifier in status detail ("Postponed", sometimes with a
  // reason). Only append it when it says more than the bare word.
  const detail = g.statusDetail && !/^postponed$/i.test(g.statusDetail.trim())
    ? ` (${g.statusDetail})`
    : "";

  if (teamId && teamId === g.home.id) {
    return `Postponed: ${g.home.name} vs ${g.away.name}${detail}`;
  }
  return `Postponed: ${g.away.name} @ ${g.home.name}${detail}`;
}

// ════════════════════════════════════════════════════════════════════════
// Postponement + Postgame handling (shared helper)
// ════════════════════════════════════════════════════════════════════════
// NOTE (deliberate addition over the uploaded MLB server): the submit is
// wrapped in an atomic claim (redis.incrBy — only the caller that lands
// n === 1 posts). All three entry paths (cron sweep, viewer postgame-check,
// manual menu) run through THIS function, so the pgKey read-then-set race
// between concurrent paths is closed. The claim is released on failure so a
// transient submit error doesn't wedge the postgame for 10 minutes.

async function claimPostgame(subredditId: string, eventId: string): Promise<boolean> {
  const key = `pgclaim:${subredditId}:${eventId}`;
  const n = await redis.incrBy(key, 1);
  await redis.expire(key, 600);
  return n === 1;
}

async function releasePostgameClaim(subredditId: string, eventId: string): Promise<void> {
  await redis.del(`pgclaim:${subredditId}:${eventId}`);
}

async function handlePostgameOrPostponement(
  g: NormGame,
  subredditId: string,
  teamId: string | null,
  customTitles: { win: string; loss: string },
): Promise<"postponed" | "postgame" | "skipped" | "failed"> {
  const eventId = g.eventId;
  if (!eventId) return "skipped";

  const gameDedupKey = `posted:${subredditId}:${eventId}`;
  if (!(await redis.get(gameDedupKey))) return "skipped";

  // Broadcast game threads are permanently hands-off, regardless of the sub's
  // current mode setting. (Marker written by onMenuPostAllGames.)
  if (await redis.get(`broadcast-game:${subredditId}:${eventId}`)) return "skipped";

  // Postponement branch
  if (isPostponedGame(g)) {
    const postponedKey = `postponed:${subredditId}:${eventId}`;
    if (await redis.get(postponedKey)) return "skipped";
    if (!(await claimPostgame(subredditId, eventId))) return "skipped";

    try {
      const post = await reddit.submitCustomPost({
        title: buildPostponedThreadTitle(g, teamId),
      });
      await redis.set(`post-game:${post.id}`, eventId, { expiration: renderExpiresAt() });
      await redis.set(`post-type:${post.id}`, "postponed", { expiration: renderExpiresAt() });
      await redis.set(postponedKey, post.id, { expiration: dedupExpiresAt() });
      // Release the original Game Thread's dedup so the makeup date can post
      // a fresh Game Thread. VERIFY on the first real NFL postponement that
      // ESPN reuses the eventId on reschedule the way MLB reused gamePk —
      // if ESPN issues a NEW eventId instead, this del is harmless but the
      // makeup will post under the new id regardless.
      await redis.del(gameDedupKey);
      console.log(`postponed: created ${post.id} for event ${eventId}, released gameDedupKey for makeup`);
      return "postponed";
    } catch (e) {
      console.error(`postponed post failed for event ${eventId}:`, e);
      await releasePostgameClaim(subredditId, eventId);
      return "failed";
    }
  }

  // Postgame branch
  if (!isFinalGame(g)) return "skipped";
  if (isCanceledGame(g)) return "skipped";

  if (g.date) {
    const ageMs = Date.now() - new Date(g.date).getTime();
    if (ageMs > 36 * 60 * 60 * 1000) return "skipped";
  }

  const pgKey = `postgame:${subredditId}:${eventId}`;
  if (await redis.get(pgKey)) return "skipped";
  if (!(await claimPostgame(subredditId, eventId))) return "skipped";

  try {
    const post = await reddit.submitCustomPost({
      title: buildPostgameThreadTitle(g, teamId, customTitles),
    });
    await redis.set(`post-game:${post.id}`, eventId, { expiration: renderExpiresAt() });
    await redis.set(`post-type:${post.id}`, "postgame", { expiration: renderExpiresAt() });
    await redis.set(pgKey, post.id, { expiration: dedupExpiresAt() });
    console.log(`postgame: created ${post.id} for event ${eventId}`);
    return "postgame";
  } catch (e) {
    console.error(`postgame post failed for event ${eventId}:`, e);
    await releasePostgameClaim(subredditId, eventId);
    return "failed";
  }
}

// ════════════════════════════════════════════════════════════════════════
// Post identity + viewer-driven postgame check
// ════════════════════════════════════════════════════════════════════════

async function onPostGame(rsp: ServerResponse): Promise<void> {
  if (!context.postId) {
    writeJSON<PartialJsonValue>(200, { eventId: null, postType: null } as PartialJsonValue, rsp);
    return;
  }
  try {
    const val = await redis.get(`post-game:${context.postId}`);
    const postType = await redis.get(`post-type:${context.postId}`);
    writeJSON<PartialJsonValue>(
      200,
      { eventId: val || null, postType: postType || null } as PartialJsonValue,
      rsp,
    );
  } catch (e) {
    console.error("onPostGame error:", e);
    writeJSON<PartialJsonValue>(200, { eventId: null, postType: null } as PartialJsonValue, rsp);
  }
}

// Viewer-driven check (path 2 of 3). Unlike the MLB version, which carried a
// private copy of the final-check/post logic, this normalizes the summary and
// delegates to the SAME shared handler the cron and menu use — one code path,
// one dedup, one claim.
async function onPostgameCheck(rsp: ServerResponse): Promise<void> {
  const subId = context.subredditId;
  const postId = context.postId;
  if (!subId || !postId) {
    writeJSON<PartialJsonValue>(200, { created: false } as PartialJsonValue, rsp);
    return;
  }

  const eventId = await redis.get(`post-game:${postId}`);
  if (!eventId) {
    writeJSON<PartialJsonValue>(200, { created: false } as PartialJsonValue, rsp);
    return;
  }

  // Broadcast game threads never get an auto-postgame — even if the sub later
  // switches to Game Thread mode. (Marker written by onMenuPostAllGames.)
  if (await redis.get(`broadcast-game:${subId}:${eventId}`)) {
    writeJSON<PartialJsonValue>(200, { created: false } as PartialJsonValue, rsp);
    return;
  }

  const enabled = await autoPostgameEnabled();
  if (!enabled) {
    writeJSON<PartialJsonValue>(200, { created: false } as PartialJsonValue, rsp);
    return;
  }

  // Fast dedup skip before touching the summary.
  if (await redis.get(`postgame:${subId}:${eventId}`)) {
    writeJSON<PartialJsonValue>(200, { created: false } as PartialJsonValue, rsp);
    return;
  }

  const summary = await fetchEspnJsonCached(
    `nflcache:game:${eventId}`,
    `${ESPN_BASE}/summary?event=${eventId}`,
    GAME_CACHE_TTL_S,
  );
  const g = summary ? normalizeSummary(summary) : null;
  if (!g) {
    writeJSON<PartialJsonValue>(200, { created: false } as PartialJsonValue, rsp);
    return;
  }

  const teamId = await getTeamIdFilter();
  const customTitles = await getCustomPostgameTitles();
  const result = await handlePostgameOrPostponement(g, subId, teamId, customTitles);
  writeJSON<PartialJsonValue>(
    200,
    { created: result === "postgame" || result === "postponed" } as PartialJsonValue,
    rsp,
  );
}

// ════════════════════════════════════════════════════════════════════════
// Moderator menu handlers
// ════════════════════════════════════════════════════════════════════════

async function onMenuPostAllGames(): Promise<UiResponse> {
  const subredditId = context.subredditId;
  const subredditName = context.subredditName;
  if (!subredditId || !subredditName) {
    return { showToast: { text: "No subreddit context.", appearance: "neutral" } };
  }

  const teamId = await getTeamIdFilter();
  const broadcastLabel = (await isBroadcastMode()) ? await getBroadcastLabel() : null;
  const games = await fetchGamesForDate(todayDateStr(), teamId);

  if (!games.length) {
    // No NFL off-day threads (deliberate — see porting notes). Weekly cadence
    // means 6 gameless days per team per week; a daily discussion post would
    // be spam, not a feature. A future bye-week thread can slot in here.
    return { showToast: { text: "No games today.", appearance: "neutral" } };
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const g of games) {
    const dedupKey = `posted:${subredditId}:${g.eventId}`;
    if (await redis.get(dedupKey)) {
      skipped++;
      continue;
    }

    try {
      const post = await reddit.submitCustomPost({
        title: buildGameThreadTitle(g, teamId, broadcastLabel),
      });
      await redis.set(`post-game:${post.id}`, g.eventId, { expiration: renderExpiresAt() });
      await redis.set(`post-type:${post.id}`, "game", { expiration: renderExpiresAt() });
      await redis.set(dedupKey, post.id, { expiration: dedupExpiresAt() });
      // Broadcast threads are marked so no future path (cron, viewer check,
      // manual menu) ever auto-posts a postgame for them — even if the sub
      // later switches back to Game Thread mode.
      if (broadcastLabel) {
        await redis.set(`broadcast-game:${subredditId}:${g.eventId}`, "1", {
          expiration: dedupExpiresAt(),
        });
      }
      // If this game was previously postponed, release the postponement lock so
      // the cron can fire another postponement notice if it happens again.
      await redis.del(`postponed:${subredditId}:${g.eventId}`);
      created++;
    } catch (e) {
      console.error(`Failed posting game ${g.eventId}:`, e);
      failed++;
    }
  }

  const msg = `Posted ${created}, skipped ${skipped}${failed ? `, failed ${failed}` : ""}.`;
  return {
    showToast: {
      text: msg,
      appearance: created > 0 ? "success" : "neutral",
    },
  };
}

async function onMenuPostPostgame(): Promise<UiResponse> {
  const subredditId = context.subredditId;
  if (!subredditId) {
    return { showToast: { text: "No subreddit context.", appearance: "neutral" } };
  }

  const teamId = await getTeamIdFilter();
  const customTitles = await getCustomPostgameTitles();
  const games = await fetchRecentGames(teamId);

  if (!games.length) {
    return { showToast: { text: "No recent games found.", appearance: "neutral" } };
  }

  let postgameCreated = 0;
  let postponedCreated = 0;
  let failed = 0;

  for (const g of games) {
    const result = await handlePostgameOrPostponement(g, subredditId, teamId, customTitles);
    if (result === "postgame") postgameCreated++;
    else if (result === "postponed") postponedCreated++;
    else if (result === "failed") failed++;
  }

  if (postgameCreated === 0 && postponedCreated === 0 && failed === 0) {
    return {
      showToast: {
        text: "Nothing new to post — all completed games already have threads.",
        appearance: "neutral",
      },
    };
  }

  const parts: string[] = [];
  if (postgameCreated > 0) parts.push(`${postgameCreated} postgame`);
  if (postponedCreated > 0) parts.push(`${postponedCreated} postponement`);
  if (failed > 0) parts.push(`${failed} failed`);
  const msg = `Posted ${parts.join(", ")} thread(s).`;

  return {
    showToast: {
      text: msg,
      appearance: postgameCreated + postponedCreated > 0 ? "success" : "neutral",
    },
  };
}

async function onCronPostgameSweep(): Promise<void> {
  const subredditId = context.subredditId;
  if (!subredditId) return;

  // Broadcast (companion) mode never auto-posts anything — no postgame threads and
  // no postponement notices. The app only posts the threads a mod creates from the
  // menu. (The manual "Post postgame threads" menu still works as an override.)
  if (await isBroadcastMode()) return;

  const enabled = await getAutoPostgameSetting();
  const teamId = await getTeamIdFilter();
  const customTitles = await getCustomPostgameTitles();
  const games = await fetchRecentGames(teamId);

  for (const g of games) {
    if (!enabled) {
      // Auto-postgame off: postponement notices still fire (informational).
      if (!isPostponedGame(g)) continue;
    }
    await handlePostgameOrPostponement(g, subredditId, teamId, customTitles);
  }
}

async function onMenuClearTodayDedup(): Promise<UiResponse> {
  const subredditId = context.subredditId;
  if (!subredditId) {
    return { showToast: { text: "No subreddit context.", appearance: "neutral" } };
  }

  const teamId = await getTeamIdFilter();
  // NFL nuance: "today" is often an empty slate. Clear across the recent
  // window (today + yesterday) so a mod fixing a Sunday-night mistake on
  // Monday morning isn't stranded.
  const games = await fetchRecentGames(teamId);

  let cleared = 0;

  for (const g of games) {
    const eventId = g.eventId;

    const gameDedupKey = `posted:${subredditId}:${eventId}`;
    const linkedGamePostId = await redis.get(gameDedupKey);
    if (linkedGamePostId) {
      await redis.del(gameDedupKey);
      await redis.del(`post-game:${linkedGamePostId}`);
      await redis.del(`post-type:${linkedGamePostId}`);
      cleared++;
    }

    const pgKey = `postgame:${subredditId}:${eventId}`;
    const linkedPgPostId = await redis.get(pgKey);
    if (linkedPgPostId) {
      await redis.del(pgKey);
      await redis.del(`post-game:${linkedPgPostId}`);
      await redis.del(`post-type:${linkedPgPostId}`);
      cleared++;
    }

    const ppKey = `postponed:${subredditId}:${eventId}`;
    const linkedPpPostId = await redis.get(ppKey);
    if (linkedPpPostId) {
      await redis.del(ppKey);
      await redis.del(`post-game:${linkedPpPostId}`);
      await redis.del(`post-type:${linkedPpPostId}`);
      cleared++;
    }

    // Clear any stale claim so re-posting isn't blocked for up to 10 minutes.
    await redis.del(`pgclaim:${subredditId}:${eventId}`);
  }

  if (!games.length && cleared === 0) {
    return { showToast: { text: "No recent games to clear.", appearance: "neutral" } };
  }

  return {
    showToast: {
      text: `Cleared ${cleared} thread(s). You can now re-post them.`,
      appearance: cleared > 0 ? "success" : "neutral",
    },
  };
}

// ════════════════════════════════════════════════════════════════════════
// Triggers
// ════════════════════════════════════════════════════════════════════════

const WELCOME_POST_BODY = `# Welcome to NFL Scoreboards

Thanks for installing **NFL Scoreboards** — a live Game Thread experience built for NFL communities, from team-focused subreddits to league-wide aggregators.

## What it does

NFL Scoreboards turns each Game Thread into a real-time, data-rich scoreboard. Once a thread is posted, the bot does the rest:

- **Pregame** — Matchup, records, kickoff time, broadcast info
- **Live** — Score, down and distance, possession, field position on a live game field, drive tracker, latest play
- **Box Score** — Team and player stats for both sides, toggleable team view
- **Scoring Plays** and **Drives** — Every drive with result, plays, yards, and time of possession
- **Win Probability** — Play-by-play chart, tap any swing to see the play that drove it
- **Final / Wrap** — Final score, top performers, scoring summary

Threads refresh every 10 seconds while a game is in progress. No further moderator action required after posting.

## What's covered

- **Regular Season** — Standard "Game Thread" and "Postgame Thread" titles with the week number.
- **Preseason** — Titles use a "Preseason" prefix so they're easy to spot.
- **Playoffs** — Titles automatically reflect the round ("Wild Card", "Divisional Round", "Conference Championship", "Super Bowl").
- **Postponements** — Rare in the NFL, but if a game is officially postponed, a notice posts automatically within ~1 minute.

## Three types of automated threads

- **Game Thread** — Posted manually by you when you run the "Post today's NFL game threads" menu. Captures live, in-game reactions.
- **Postgame Thread** — Posted automatically the moment a game ends. Includes the final score in the title.
- **Postponement Notice** — Posted automatically if the NFL officially postpones a game.

If you prefer single-thread style, disable **Auto-post postgame threads** in the settings — postponement notices will still fire, since they're informational.

## Thread type: Game Thread or Broadcast

The **Thread type** setting controls how the app fits into your subreddit:

- **Game Thread** (default) — the standard mode described above. Choose this if you want the app to be your subreddit's game threads.
- **Broadcast Thread** — an advanced/analytics **companion** that runs *alongside* your existing game threads rather than replacing them. In this mode:
  - Threads post with your **Broadcast label** (e.g. "Broadcast Thread", "Advanced View", "Live Scoreboard") in place of "Game Thread".
  - The app **never auto-posts anything** — no automatic Postgame Threads and no postponement notices. It only posts the threads you create from the menu.

  This is ideal for subreddits that want to keep their existing game thread tradition exactly as it is and simply *add* a live, interactive scoreboard as a second screen for the stats crowd.

## Custom postgame titles (optional)

If your subreddit has a signature postgame phrase, set it in the app settings:

- **Postgame Win Title** — used when your configured team wins
- **Postgame Loss Title** — used when your configured team loses (also used for ties)

Both fields support placeholders: \\\`{team}\\\`, \\\`{opp}\\\`, \\\`{teamScore}\\\`, \\\`{oppScore}\\\`.

Leave both blank to use the default format. Only applies when a specific team is configured in the Team Filter.

## Quick setup

1. Open **Mod Tools → Community Apps → nfl-scores → Settings**.
2. Under **NFL Team Filter**, choose your team — or **All Teams** for league-wide subreddits.
3. Confirm **Auto-post postgame threads** is set to your preference (on by default).
4. Under **Thread type**, choose **Game Thread** (standard) or **Broadcast Thread** (companion).
5. Click **Save**.
6. On gameday, open the moderator menu and select **"Post today's NFL game threads."** Postgame threads and postponement notices follow automatically.

## Recovering removed threads

If you delete or remove any thread the bot created, the system detects the removal and automatically allows it to be re-posted. If a thread doesn't come back on its own, run **"Allow re-posting removed game threads"** from the moderator menu.

## Questions or feedback

Reach out to u/0xgod with anything — feature requests, bug reports, suggestions.

---

*Built on Devvit Web. Data provided by ESPN. Not affiliated with the National Football League or ESPN.*`;

async function onAppInstall(): Promise<TriggerResponse> {
  const subredditName = context.subredditName;
  if (!subredditName) {
    console.warn("onAppInstall: no subredditName in context");
    return {};
  }
  try {
    await reddit.submitPost({
      subredditName,
      title: "Welcome to NFL Scoreboards — setup and overview",
      text: WELCOME_POST_BODY,
    });
  } catch (e) {
    console.error("onAppInstall welcome post failed:", e);
  }
  return {};
}

/**
 * Remove the dedup keys associated with a given post ID. Handles Game
 * Threads, Postgame Threads, and Postponement notices.
 * Safe to call on unknown postIds — silently no-ops if no mapping exists.
 */
async function cleanDedupForPost(postId: string): Promise<void> {
  const eventId = await redis.get(`post-game:${postId}`);
  if (!eventId) return;

  const subId = context.subredditId;
  if (subId) {
    const gameKey = `posted:${subId}:${eventId}`;
    const pgKey = `postgame:${subId}:${eventId}`;
    const ppKey = `postponed:${subId}:${eventId}`;

    const gameLinked = await redis.get(gameKey);
    if (gameLinked === postId) await redis.del(gameKey);

    const pgLinked = await redis.get(pgKey);
    if (pgLinked === postId) await redis.del(pgKey);

    const ppLinked = await redis.get(ppKey);
    if (ppLinked === postId) await redis.del(ppKey);

    // A removed postgame should be immediately re-postable.
    await redis.del(`pgclaim:${subId}:${eventId}`);
  }
  await redis.del(`post-game:${postId}`);
  await redis.del(`post-type:${postId}`);

  console.log(`Cleaned dedup for post ${postId} (event ${eventId})`);
}

async function onPostDelete(req: IncomingMessage): Promise<TriggerResponse> {
  try {
    const body = await readJSON<{ postId?: string; post?: { id?: string } }>(req);
    const postId = body?.postId || body?.post?.id;
    if (!postId) {
      console.warn("onPostDelete: no postId in event payload", body);
      return {};
    }
    await cleanDedupForPost(postId);
  } catch (e) {
    console.error("onPostDelete error:", e);
  }
  return {};
}

async function onModAction(req: IncomingMessage): Promise<TriggerResponse> {
  try {
    const body = await readJSON<{
      action?: string;
      targetPost?: { id?: string };
      targetPostId?: string;
    }>(req);

    const action = (body?.action || "").toLowerCase();
    const REMOVAL_ACTIONS = ["removelink", "spamlink"];
    if (!REMOVAL_ACTIONS.includes(action)) return {};

    const postId = body?.targetPost?.id || body?.targetPostId;
    if (!postId) {
      console.warn("onModAction: no targetPost ID in event payload", body);
      return {};
    }
    await cleanDedupForPost(postId);
  } catch (e) {
    console.error("onModAction error:", e);
  }
  return {};
}
