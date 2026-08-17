#!/usr/bin/env node
// replay.mjs — run the REAL built client against recorded/synthesized
// snapshots in a normal browser. No Reddit, no Devvit, no live game needed.
//
//   npm run build                                # client must be built first
//   node tools/replay.mjs --dir captures/401873272 [--port 4400] [--speed 20]
//   open http://localhost:4400/splash.html
//
// Serves:
//   static files from public/ (the built app)
//   /api/post-game, /api/game/:id, /api/winprob/:id, /api/broadcasts/:id,
//   /api/clips/:id, /api/standings, /api/postgame-check
//
// The clock: snapshots advance automatically at --speed x real cadence
// (default 20x: a 3h game replays in ~9 min at the client's 10s poll).
// Controls (curl or browser):
//   /replay/status            where the replay clock is
//   /replay/pause  /replay/play
//   /replay/seek?i=42         jump to snapshot 42 (pauses)
//   /replay/speed?x=60        change speed
//
// capture.mjs recordings (epoch-named) and synthesize.mjs output
// (000.json…) both work — files are ordered by name/number.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const DIR = opt("dir", "");
const PORT = Number(opt("port", "4400"));
const PUBLIC = opt("public", "public");
let speed = Number(opt("speed", "20"));

if (!DIR || !fs.existsSync(DIR)) {
  console.error("usage: node tools/replay.mjs --dir captures/<eventId> [--port 4400] [--speed 20]");
  process.exit(1);
}
const eventId = path.basename(DIR);
const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"))
  .sort((a, b) => Number(a.replace(".json", "")) - Number(b.replace(".json", "")));
if (!files.length) { console.error(`no .json snapshots in ${DIR}`); process.exit(1); }
console.log(`${files.length} snapshots for event ${eventId}`);

// Replay clock: manual index + auto-advance.
let idx = 0;
let playing = true;
let lastTick = Date.now();
const REAL_CADENCE_MS = 12000; // capture cadence the speed multiplies

function currentIndex() {
  if (playing) {
    const now = Date.now();
    const advance = Math.floor(((now - lastTick) * speed) / REAL_CADENCE_MS);
    if (advance > 0) {
      idx = Math.min(files.length - 1, idx + advance);
      lastTick = now;
    }
  }
  return idx;
}
function snapshot() {
  return fs.readFileSync(path.join(DIR, files[currentIndex()]), "utf8");
}

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".map": "application/json", ".png": "image/png" };

function json(res, code, obj) {
  const body = typeof obj === "string" ? obj : JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(body);
}

http.createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const p = url.pathname;

  // ── replay controls ──
  if (p === "/replay/status") return json(res, 200, { index: currentIndex(), total: files.length, playing, speed, file: files[idx] });
  if (p === "/replay/pause") { currentIndex(); playing = false; return json(res, 200, { playing }); }
  if (p === "/replay/play") { playing = true; lastTick = Date.now(); return json(res, 200, { playing }); }
  if (p === "/replay/seek") { idx = Math.max(0, Math.min(files.length - 1, Number(url.searchParams.get("i")) || 0)); playing = false; return json(res, 200, { index: idx, playing }); }
  if (p === "/replay/speed") { speed = Math.max(1, Number(url.searchParams.get("x")) || speed); lastTick = Date.now(); return json(res, 200, { speed }); }

  // ── api surface the client expects ──
  if (p === "/api/post-game") return json(res, 200, { eventId, postType: "game" });
  if (p.startsWith("/api/game/")) return json(res, 200, snapshot());
  if (p.startsWith("/api/winprob/")) {
    const s = JSON.parse(snapshot());
    return json(res, 200, { winprobability: s.winprobability || [] });
  }
  if (p.startsWith("/api/broadcasts/")) {
    const s = JSON.parse(snapshot());
    return json(res, 200, { broadcasts: s?.header?.competitions?.[0]?.broadcasts || [] });
  }
  if (p.startsWith("/api/clips/")) {
    const s = JSON.parse(snapshot());
    const clips = (s.videos || []).map((v) => ({
      id: String(v?.id ?? ""), headline: String(v?.headline ?? ""),
      thumbnail: String(v?.thumbnail ?? ""),
      url: v?.links?.source?.HD?.href || v?.links?.source?.href || null,
    })).filter((c) => c.url);
    return json(res, 200, { clips });
  }
  if (p === "/api/standings") {
    const f = path.join("captures", "standings.json");
    if (fs.existsSync(f)) return json(res, 200, fs.readFileSync(f, "utf8"));
    return json(res, 404, { error: "no captures/standings.json — save one with: curl -o captures/standings.json 'https://site.api.espn.com/apis/v2/sports/football/nfl/standings'" });
  }
  if (p === "/api/postgame-check") return json(res, 200, { created: false, replay: true });

  // ── static: the built client ──
  let file = p === "/" ? "/splash.html" : p;
  const full = path.join(PUBLIC, path.normalize(file).replace(/^([.][.][/\\])+/, ""));
  if (fs.existsSync(full) && fs.statSync(full).isFile()) {
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(full)] || "application/octet-stream",
      "Cache-Control": "no-store", // always serve the freshest build
    });
    return fs.createReadStream(full).pipe(res);
  }
  res.writeHead(404); res.end("not found");
}).listen(PORT, () => {
  console.log(`replay server: http://localhost:${PORT}/splash.html  (speed ${speed}x)`);
  console.log(`controls: /replay/status /replay/pause /replay/play /replay/seek?i=N /replay/speed?x=N`);
});
