# Night Arcade

50 browser multiplayer games, one persistent room. Host a room, share its six-character code, play, and return to the same lobby. React + Vite, TypeScript, Express and Socket.IO. No accounts, advertising, payment integrations, remote content APIs, or database are required.

## Run it

Install Node.js 22.16 or newer (tested with Node 24.14.1), then open a terminal in this folder:

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The same command runs the browser frontend and game server. Open another browser profile or another device for a different player. A normal refresh preserves your identity. Two tabs in the same browser profile intentionally share the same seat: the latest tab takes over.

For the production build:

```sh
npm run build
npm start
```

Open **http://localhost:3001**. Express serves both the compiled frontend and the live game connection from one port. Keep the terminal open while playing; Ctrl+C stops the server. On a fresh checkout with the included lockfile, `npm ci` can replace `npm install` for reproducible dependencies.

`npm test` runs rule, content, privacy, lifecycle and real WebSocket integration tests. `npm run typecheck` checks all TypeScript without building. After building, `node scripts/smoke-production.mjs` verifies the compiled server, 50-game health response, frontend and room refresh route on a temporary local port, then closes only its own server.

On Windows, you can also double-click **Start Arcade.cmd** after installing Node. It installs dependencies if needed, builds the app, then runs it. Keep that terminal open while playing; Ctrl+C stops the server. If your organization installs a private certificate authority and npm reports `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, use Node 24 with `node --use-system-ca "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" install`. Do not turn off TLS verification.

## Keeping it free and under your control

- All application code and original content are in this folder under the [MIT license](LICENSE). You can edit, run, copy and host it yourself while preserving the license notice. Dependencies retain their own licenses. There is no vendor account, billing setup, license server, or required cloud subscription.
- Running on your existing computer and Wi-Fi has no software or hosting subscription. Ordinary electricity and internet usage still apply. On another device on the same network, use `http://YOUR-COMPUTER-LAN-IP:3001` after a production build, or port `5173` during development. Allow Node through your private-network firewall if prompted. Sharing `localhost` only works on the same computer.
- Reliable, always-on public hosting depends on a machine and network you provide or a hosting provider. This project does **not** promise permanent free third-party infrastructure. Free plans can sleep or change their limits, interrupting in-memory rooms. You never need a paid API just to play these games.

The game requires a live Node process with WebSockets. A static-only host cannot run the backend. For public hosting, deploy the whole project as one Node service, install dependencies with `npm ci`, build with `npm run build`, and start with `npm start`. Optional Docker support is included. Terminate HTTPS at your reverse proxy and forward WebSocket upgrades. Open the public address before creating a room so invitations use the address friends can reach. Run **one server instance**: multi-instance deployment requires shared room ownership/state and Socket.IO coordination.

## Configuration and management

For public hosting, [DEPLOYMENT.md](DEPLOYMENT.md) describes the included free Render configuration, ownership, usage limits and multiplayer verification. The deployment uses the complete Node app; a static frontend alone cannot host rooms.

In the lobby or results screen, the host can open **Game settings**, edit the selected game's controls, and click **Apply settings**. **Reset recommended defaults** restores that game's defaults. Settings are shared with the room, retained separately for each game, and locked during countdown/play. The server validates the allowed fields and ranges. Controls cover implemented round counts and time limits; there are no cosmetic difficulty or map selectors.

Examples: Type Race defaults to one 120-second race; Trivia Blitz to ten questions with 12 seconds each; Territory Wars to 60 simultaneous three-second turns; Mini Golf to 90 seconds per hole; Button Bash to a limit of 100 commands. Draw & Guess rounds expand to complete equal artist rotations. The game list below describes recommended defaults; host settings may change their round counts and timers.

Open **Settings** in the header to reduce interface motion. It follows your device preference by default; **Always reduce motion** disables interface animations and transitions and is saved in this browser. Live gameplay movement remains visible.

Copy `.env.example` to `.env` if you want to change defaults:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Production and game-server port. The dev proxy expects 3001. |
| `HOST` | `0.0.0.0` | Listen on all interfaces for LAN play. Set `127.0.0.1` for local-only use. |
| `ALLOWED_ORIGINS` | unset | Optional comma-separated browser origins allowed to connect. Include the exact scheme and hostname for your deployment. |
| `ROOM_IDLE_MINUTES` | `120` | Inactivity expiry; minimum five minutes. |
| `MAX_ROOMS` | `200` | Upper limit on simultaneous in-memory rooms. |

Rooms, scores and ongoing rounds are stored only in server memory. **Restarting the server clears every room.** The browser saves the display name and random seat token for reconnecting; the server holds the corresponding identity and token in room memory. No database, analytics or external content service is required.

The room host can choose games, resolve votes, configure/start/rematch/end games, and remove players. Ready badges are advisory: the host may start without every badge. The selected game's player limits apply to connected participants; every room has at most 20 total seats. New arrivals after countdown begins watch until the next lobby. A seat absent when play begins also watches that game on returning. Refresh recovery reserves an existing seat for 90 seconds. When the host disconnects or leaves, the role passes immediately to the longest continuously connected player. A kicked token cannot rejoin that room, though this is a casual no-account system, not a strong identity ban.

To change branding and layout, edit `client/src/App.tsx` and `client/src/styles.css`. Change game descriptions in `shared/catalog.ts`, settings in `shared/game-config.ts`, authoritative rules in `server/games/`, and bundled content in `server/content/party.ts` and `server/content/extra.ts`. The six golf courses are in `server/games/golf-holes.json`. Rebuild and restart the production server to apply changes. Keep a copy of the source, lockfile and any custom content; there is no persistent room database to back up. `GET /api/health` reports process health and room/game counts without exposing room codes or identities. `GET /api/games` returns the 50 games' public metadata, instructions and settings.

## Scores across a game night

Results show each game's raw score and its session points separately. First place earns **5** session points, second **3**, third **2**, and every other participant **1**. Exact ties share competition placement (for example, 1st, 1st, 3rd) and the corresponding points. Session totals, games played and wins stay with the room between games.

Each game determines placement using its rules: higher score usually wins, Mini Golf uses **lower raw strokes**, races use finish order/progress, and survival games account for elimination order. Game-specific tie-breaks, such as reaction time, apply before declaring a shared placement. Doodle Telephone awards one participation point each and no competitive win. This keeps games with large raw scores from dominating the session leaderboard.

## Architecture

```text
client/
  src/App.tsx             landing, lobby, voting, results and reusable game shell
  src/GameSettings.tsx    host settings and recommended defaults
  src/games/             lazy-loaded board, party and arcade renderers
server/
  app.ts                 HTTP/Socket.IO boundary, rate limits, 20 Hz clock
  rooms.ts               room lifecycle, seats, reconnects, host migration, stats
  games/base.ts          standardized lifecycle and validation helpers
  games/utilities.ts     server timers, private-view boundary and ranking
  games/registry.ts      all 50 game definitions
  games/boards.ts        board and card rules, private hands and fleets
  games/party*.ts        party registry, phase engine and drawing/text helpers
  games/arcade*.ts       arcade registry, grids, physics and reaction rules
  games/golf-holes.json  six handcrafted courses
  content/party.ts       bundled banks, with additions from extra.ts
  content/shuffle-bag.ts room-scoped content rotation across rematches
shared/
  types.ts               protocol and lifecycle contracts
  catalog.ts             50 games, exact player limits and execution-spec ID aliases
  game-config.ts         allowed settings, defaults and validation
  board-rules.ts         public board rules and card helpers
tests/                   rule, content, privacy, registry and network tests
```

Every definition supplies metadata and `init(players, now, context)`. The context carries validated settings, a match index, room content rotation and server-measured latency. Instances expose `publicState()`, `privateState(playerId)`, `endCondition()` and `score()`, together with `join`, `leave`, `reconnect`, `input`, `tick`, `serialize`, `roundEnd` and `cleanup`. Canonical hyphenated game IDs and the execution spec's aliases resolve to the same 50 definitions.

The room lifecycle is `LOBBY → COUNTDOWN → PLAYING → RESULTS → LOBBY`. No game creates its own network connection or scheduling interval. A single 20 Hz scheduler advances server state; gameplay views are sent at up to 10 Hz, with movement interpolation in the browser. Snake advances on a fixed 10 Hz simulation; golf physics uses fixed 60 Hz substeps. Lobby updates are event-driven. Games share three lazy-loaded frontend renderers.

The server accepts actions, never claimed scores or winners. It owns the random outcomes, clocks, movements, physics, turn changes and final placements. Each player receives a deliberately constructed private/public view; entire game objects are never broadcast. Repeated unchanged gameplay views are suppressed, and drawing updates append compact stroke deltas with full snapshots on reconnect. Inputs require membership, an eligible seat, an active round, valid values, and increasing sequence numbers. Per-socket token buckets, IP room-entry limits, payload size limits, and room caps bound basic spam. Client strings render as text, not HTML. Text is length-limited. Turn timers and round deadlines ensure absent players cannot block a room indefinitely.

Private words, roles, hands, unrevealed fleets, bids and answers are sent only to eligible recipients until their rules permit reveal. Memory playback transmits only the currently lit pad, Button Bash reveals only each player's current command, and Spot the Difference keeps answer regions and change flags on the server. Spectators receive public views. This limits accidental disclosure; players can still inspect or automate information legitimately delivered to their browsers.

Reaction games use authoritative receipt timing with conservative compensation from server-measured round-trip latency, capped at 50 ms. Network latency still matters. Client clock synchronization supports displays. Type Race disables paste/drop in the normal client; the server checks incremental text segments, sequence/progress and repeat requests, and flags sustained speeds above 300 WPM. It cannot prevent a custom client from automating typing. This is a friendly party platform, not tournament-grade anti-cheat.

## Bundled offline content

The app does not fetch questions, words or answers from a paid API. Current banks include:

| Bank | Entries |
| --- | ---: |
| Trivia / numeric estimation questions | 155 / 106 |
| Typing phrases | 82 |
| Drawing word/category entries / impostor word/category entries | 1,597 / 1,597 |
| Related prompt pairs for Guess the Drawing | 80 |
| Liar prompts / fake-answer prompts | 80 / 82 |
| Password words / scramble words / hangman words | 1,664 / 1,846 / 1,876 |
| Emoji clues with accepted answers | 115 |
| Would You Rather / Majority Rules / Minority Rules prompts | 105 / 80 / 80 |
| Accepted category entries | 1,797 across 11 categories (1,759 distinct words) |

Several word banks are filtered from the shared 1,969-word dictionary and category lists; these counts are not separate sets of independently authored questions. Room-scoped shuffle bags exhaust a stable game/content pool before reusing entries and avoid an immediate repeat when refilled. Rematches retain those bags; restarting the server clears them. Edit the bundled files to add your own content and run the content tests afterward.

## The 50 games and controls

All games show their specific rules and controls before/during play. Clickable controls support touch. Arrow keys/WASD move in arcade games; Space activates the relevant jump/dash/fire/action. Reaction games also use Z/X for A/B when indicated. Canvas drawing supports touch or mouse, colors, brush widths, erasing, Undo and confirmed Clear. Room members can discuss aloud or on their own voice call; no microphone permissions are needed.

| # | Game | Players | What you do |
| --- | --- | --- | --- |
| 01 | Draw & Guess | 2–12 | Rotate artists; draw a private word and type guesses. |
| 02 | Impostor Word | 3–12 | Share clues, discuss, vote, and attempt the impostor's final guess. |
| 03 | Territory Wars | 2–8 | Plan simultaneous claims on a 24×18 board; adjacent support resolves conflicts, ties hold, enclosed neutral regions convert. |
| 04 | Quick Draw | 2–12 | React to secret GO timing over seven rounds; early clicks are invalid with a 1,000 ms penalty. |
| 05 | Type Race | 2–10 | Type the exact shared sentence in one 120-second race; typos stop progress until corrected. |
| 06 | Snake Arena | 2–12 | Steer a snake on a 50×36 grid at 10 ticks/second; eat food, avoid collisions and outlast opponents. |
| 07 | Bomb Pass | 3–12 | Solve a private challenge to unlock passing, pick a receiver, and beat the hidden fuse. |
| 08 | Guess the Drawing | 3–12 | Draw privately, then identify the odd assignment in the gallery. |
| 09 | Trivia Blitz | 2–20 | Ten original four-choice questions with speed points. |
| 10 | Word Chain | 2–12 | Start a dictionary word with the previous final letter. |
| 11 | Pixel Battle | 2–12 | Move, aim and fire; server handles shots, cover, health and respawns. |
| 12 | Memory Mayhem | 2–12 | Repeat growing timed patterns on four pads; two errors/timeouts eliminate. |
| 13 | The Liar | 3–12 | Read private roles, write answers, and identify the liar. |
| 14 | Higher or Lower | 2–12 | Predict each card; equal cards keep everyone safe. |
| 15 | Mini Golf | 2–8 | Drag back to shoot through six physics holes; lowest strokes wins, with water and pickup penalties. |
| 16 | Last Tile | 2–12 | Leave tiles before they crumble after 700 ms; outside tiles begin crumbling after 30 seconds. |
| 17 | One Button Racing | 2–10 | Hold/release Jump while running automatically; clear hurdles and pits or reset to a checkpoint. |
| 18 | Fake Answer | 3–12 | Write convincing fakes, then find the truth. |
| 19 | Auction Wars | 3–10 | Bid from $1,000 virtual cash across ten sealed lots; assets plus one quarter of remaining cash determine the score. |
| 20 | Doodle Telephone | 4–12 | Rotate private phrase/drawing/description chains, then explore the slideshow; participation points only. |
| 21 | Connect Four | 2 | Drop discs to connect four; a missed turn forfeits, and starters alternate on rematches. |
| 22 | Ultimate Tic-Tac-Toe | 2 | Win small boards while directing the next move; small-board totals decide a filled-board tie. |
| 23 | Dots & Boxes | 2–6 | Complete boxes for points and another turn; timeouts pass, with a finite all-idle ending. |
| 24 | Battleship | 2 | Drag, rotate or randomize and lock a private fleet; fire alternating shots, with repeated timeouts forfeiting. |
| 25 | Checkers | 2 | Forced captures, multi-jumps, promotion and kings. |
| 26 | Crazy Eights | 2–8 | Match rank/suit or play a wild eight; optionally draw one, then play only that new card or pass. |
| 27 | President | 3–8 | Quick variant: play stronger equal-sized sets or pass; no rank-based exchanges, and any set may lead. |
| 28 | Speed Math | 2–12 | Solve twelve increasingly difficult arithmetic problems, with ten seconds per answer. |
| 29 | Closest Wins | 2–20 | Estimate numeric facts; error ranks earn 1,000/500/250, exact answers add 250, equal errors share rank. |
| 30 | Categories | 2–12 | Find an accepted answer for a letter/category; unique answers earn 500 and duplicates 250. |
| 31 | Word Scramble | 2–12 | Unscramble a word before the others. |
| 32 | Hangman Battle | 2–8 | Solve a shared word with private letter guesses and strikes. |
| 33 | Password | 4–12 | Alternate teams and give one-word clues to teammates. |
| 34 | Emoji Guess | 2–12 | Decode picture clues into familiar objects and phrases. |
| 35 | Would You Rather | 3–20 | Pick A/B privately; a strict majority earns 500, while an even split earns 250 each. |
| 36 | Majority Rules | 3–20 | Choose a displayed option; the largest group earns 500, or 300 for tied largest groups. |
| 37 | Minority Rules | 3–20 | Join the smallest nonempty group for 500; equally sized occupied groups earn 250 each. |
| 38 | Secret Number | 2–12 | Privately race to a number from 1–1,000 using higher/lower hints, at most 20 guesses and two per second. |
| 39 | Maze Race | 2–12 | Race through the same perfect 25×19 maze; unfinished players rank by remaining path distance. |
| 40 | Platform Panic | 2–12 | Leave warned platforms before they disappear. |
| 41 | Color Dash | 2–12 | Reach the announced color before its accelerating deadline; one rescue, then elimination on the second strike. |
| 42 | Sumo Circles | 2–8 | Move and dash to push opponents outside the shrinking arena. |
| 43 | Dodge | 2–12 | Survive a growing stream of server-generated hazards. |
| 44 | Coin Rush | 2–10 | Collect respawning coins; dash to steal one coin from an opponent with a short victim protection period. |
| 45 | Capture the Crown | 2–10 | Hold the crown for 30 seconds total; tags drop it, with a one-second pickup lock for the former holder. |
| 46 | Red Light | 2–20 | Hold Run on green; continuing more than 100 ms into red eliminates you. Legal finish order wins. |
| 47 | Reaction Tournament | 2–20 | Eight rounds mix GO, arrows, colors, odd symbols, decoys and alternating A/B challenges. |
| 48 | Spot the Difference | 2–12 | Tap five differences in the right-hand vector scene; wrong clicks lock input for one second. |
| 49 | Sequence | 2–12 | Echo a growing four-color sequence after it hides. |
| 50 | Button Bash | 2–12 | Follow your own current command using six buttons (arrows and Z/X); timers accelerate, three strikes eliminate. |

## Validation

`npm test` includes initialization and finite idle completion at minimum and maximum player counts for every registry entry, private/public view checks, board/card/snake legality, content counts and uniqueness, settings validation, ranking and room lifecycle coverage. A 50-game matrix uses real Socket.IO clients to start each game at its minimum roster, advance the server clock through idle completion, and check consistent results. Additional network coverage plays a complete Connect Four round, submits a numeric Speed Math answer, refreshes a seat, migrates the host and preserves the session leaderboard. These automated timeout checks do not mean every control in every game was manually exercised. See [QA.md](QA.md) for browser checks and practical limits.

For public deployment, first use your own browsers/devices to test the intended network and player count. The software has not been load-tested for hundreds of concurrent rooms. Room limits are guardrails, not a capacity guarantee. No telemetry, remote administration backdoor or hidden paid feature is included.
