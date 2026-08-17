#!/usr/bin/env node
// synthesize.mjs — turn ONE final ESPN summary into a live-game snapshot
// sequence for the replay server. No recording required.
//
//   node tools/synthesize.mjs path/to/summary.json
//
// Writes captures/{eventId}/000.json … NNN.json:
//   000        = pregame (status pre, 0-0, no drives)
//   001..N-1   = after each play: drives truncated, live status, running
//                score, clock/period from the play, winprob to that play
//   N          = the real final payload, untouched
//
// Known simplifications (fine for UI replay, noted for honesty):
//   - boxscore/leaders stay at final values throughout
//   - linescores stay at final values (quarter cells fill "early")
// The field, drive path, situation, scoring list, and win prob all replay
// faithfully play-by-play, which is what the harness is for.

import fs from "node:fs";
import path from "node:path";

const src = process.argv[2];
if (!src) { console.error("usage: node tools/synthesize.mjs <final-summary.json>"); process.exit(1); }
const finalSummary = JSON.parse(fs.readFileSync(src, "utf8"));
const eventId = String(finalSummary?.header?.id || "unknown");
const outDir = path.join("captures", eventId);
fs.mkdirSync(outDir, { recursive: true });

const drivesPrev = finalSummary?.drives?.previous || [];
// Flatten plays in game order, remembering their drive.
const seq = [];
drivesPrev.forEach((drive, di) => {
  (drive.plays || []).forEach((play, pi) => seq.push({ di, pi, play }));
});
seq.sort((a, b) => Number(a.play.sequenceNumber || 0) - Number(b.play.sequenceNumber || 0));
if (!seq.length) { console.error("no plays found in drives.previous"); process.exit(1); }

const clone = (o) => JSON.parse(JSON.stringify(o));
const comp = (s) => s.header.competitions[0];

function setScores(snap, awayScore, homeScore) {
  for (const c of comp(snap).competitors) {
    c.score = String(c.homeAway === "home" ? homeScore : awayScore);
  }
}

function write(idx, snap) {
  fs.writeFileSync(path.join(outDir, String(idx).padStart(3, "0") + ".json"), JSON.stringify(snap));
}

// ── 000: pregame ──
{
  const s = clone(finalSummary);
  comp(s).status = {
    type: { id: "1", name: "STATUS_SCHEDULED", state: "pre", completed: false, description: "Scheduled", detail: "Scheduled" },
  };
  setScores(s, 0, 0);
  delete s.drives;
  s.scoringPlays = [];
  s.winprobability = [];
  for (const c of comp(s).competitors) delete c.linescores;
  write(0, s);
}

// ── per-play snapshots ──
const wp = finalSummary.winprobability || [];
const wpByPlayId = new Map(wp.map((w, i) => [String(w.playId), i]));
const scoringIds = new Set((finalSummary.scoringPlays || []).map((p) => String(p.id)));

seq.forEach((entry, i) => {
  const s = clone(finalSummary);
  const { di, pi, play } = entry;

  const per = Number(play?.period?.number) || 1;
  comp(s).status = {
    type: {
      id: "2", name: per === 2 && pi === (drivesPrev[di].plays.length - 1) ? "STATUS_IN_PROGRESS" : "STATUS_IN_PROGRESS",
      state: "in", completed: false,
      description: "In Progress", detail: "In Progress",
    },
    displayClock: String(play?.clock?.displayValue || ""),
    period: per,
  };
  setScores(s, Number(play.awayScore) || 0, Number(play.homeScore) || 0);

  // drives: previous = fully-completed drives before di; current = drive di
  // truncated to plays 0..pi
  const prevDone = drivesPrev.slice(0, di).map(clone);
  const cur = clone(drivesPrev[di]);
  cur.plays = (drivesPrev[di].plays || []).slice(0, pi + 1).map(clone);
  delete cur.displayResult; delete cur.result; // in progress — no result yet
  // Drive meta must be AS OF this play, not the drive's final totals —
  // otherwise the CURRENT DRIVE header reads the future during replay.
  {
    const ADMIN = /timeout|two-minute|end (period|of)/i;
    const KICK = /kickoff/i;
    const counted = cur.plays.filter((q) => {
      const t = String(q?.type?.text || "");
      return !ADMIN.test(t) && !KICK.test(t);
    });
    cur.offensivePlays = counted.length;
    cur.yards = counted.reduce((sum, q) => sum + (Number(q?.statYardage) || 0), 0);
    delete cur.timeElapsed; // not honestly reconstructable mid-drive
    delete cur.description;
  }
  s.drives = { current: cur, previous: prevDone };

  // scoring plays seen so far
  const seenIds = new Set();
  seq.slice(0, i + 1).forEach((e) => seenIds.add(String(e.play.id)));
  s.scoringPlays = (finalSummary.scoringPlays || []).filter((p) => seenIds.has(String(p.id)));

  // win prob up to this play (by playId when it maps, else proportional)
  const wpIdx = wpByPlayId.has(String(play.id))
    ? wpByPlayId.get(String(play.id))
    : Math.floor(((i + 1) / seq.length) * wp.length) - 1;
  s.winprobability = wp.slice(0, Math.max(1, wpIdx + 1));

  write(i + 1, s);
});

// ── final: the real payload ──
write(seq.length + 1, finalSummary);

console.log(`eventId ${eventId}: wrote ${seq.length + 2} snapshots to ${outDir}/`);
console.log(`replay:  node tools/replay.mjs --dir ${outDir}`);
