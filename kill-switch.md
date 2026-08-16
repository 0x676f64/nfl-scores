# MLB Scores — Emergency Stop (Kill Switch)

If the app ever misbehaves during a game, this is how to stop it. Do the smallest fix for your problem and escalate only if it doesn't work. Every step here is reversible.

## Fastest path — pick your symptom

- **The scoreboard is frozen or way behind the real game** → turn off Broadcast delay. **(Quick settings fix)**
- **One post is wrong** (wrong game, broken scoreboard, bad title) → take that post down. **(Level 2)**
- **It's auto-posting threads it shouldn't** (unwanted postgame threads) → turn off Auto-post postgame threads. **(Level 1)**
- **Everything looks broken and you're not sure why** → uninstall the app. **(Level 3)**
- **You (the developer) just shipped a build that broke it** → roll the deploy back. **(Level 3, developer note)**

---

## Quick settings fix — the scoreboard is frozen or far behind

**When:** the scoreboard seems stuck, or it's running much further behind the live game than you'd expect.

**Do:**
1. Mod Tools → Community Apps → mlb-scores → Settings
2. Set **Broadcast delay** to **Off**
3. Save

**Why:** Broadcast delay intentionally holds the scoreboard a few seconds behind live, so fans on a TV or streaming feed aren't spoiled. If it's set higher than you want, or something looks off, setting it to Off puts the scoreboard back to real time. This only changes data timing — it doesn't post or remove anything.

**Undo:** set the delay back to your preferred number and Save.

---

## Level 1 — Stop automatic posting

**When:** the app is posting postgame threads on its own that you don't want.

**Do:**
1. Mod Tools → Community Apps → mlb-scores → Settings
2. Turn **Auto-post postgame threads** off
3. Save

Takes effect within about a minute (the next background check).

**Stops:** automatic postgame threads — both the ones that fire when a game ends and the every-minute background sweep.

**Does NOT stop:**
- **Postponement notices** — those still post, by design (they're informational, so they fire even with this off).
- **Live scoreboards already on existing posts** — this setting only controls new auto-posts, not scoreboards that are already running.
- **The mod menu** — you can still post threads manually if you click the menu items.

**Undo:** turn it back on and Save.

> **Running in Broadcast Thread mode?** Then the app already never auto-posts *anything* on its own — no postgame threads, no postponement notices, no off-day threads. It only posts the threads you create from the menu. So in Broadcast mode there's nothing here you need to turn off.

---

## Level 2 — Take down one bad post

**When:** a single thread is the problem.

**Do:** open the post and remove it the way you'd remove any post (or delete it if it's your own).

Once it's down, no one sees its scoreboard, and the app automatically clears its own internal records for that post so it won't interfere with future posts. This works whether you **Remove** it as a mod or **Delete** it as the author — both are handled.

**Undo / bring it back:** run **Allow re-posting removed game threads** from the mod menu, and the app can post it again.

---

## Level 3 — Full stop

**When:** something's wrong across the board and you just want it all to stop.

**Do:** uninstall the app — Mod Tools → Community Apps → mlb-scores → Remove.

**Stops:** everything new — auto-posts, menu actions, and the background sweep. Existing posts may stop showing live data once the app is gone. This is the definitive off.

**Undo:** reinstall. You may need to re-enter your settings (team filter, thread type, delay, custom titles, etc.).

### Developer note (u/0xgod only)

A subreddit mod can't do this — if a mod hits an app-wide problem, they contact you. If a build **you just shipped** broke rendering or behavior everywhere, don't uninstall — roll back instead:

1. From the machine with the Devvit CLI (logged in), redeploy the last known-good version.
2. Reopen a post to confirm the fix and clear the cached web-view bundle.

This keeps the app installed; it just reverts the code.

---

## One thing no setting stops instantly

A live scoreboard already open on someone's screen keeps refreshing until the game ends or **the post is removed**. There's no toggle that blanks a single running scoreboard — to stop a specific one, take that post down (Level 2). (The Broadcast delay setting changes how far behind the scoreboard runs, but it doesn't stop one that's already open.)
