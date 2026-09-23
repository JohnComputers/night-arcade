# Validation record

Validated against the expanded 50-game execution specification on September 22, 2026, with public-hosting regression checks on September 23, using Node 24.14.1 on Windows. This record supersedes the earlier 119-test implementation record.

## Automated checks

- `npm test`: **179 passing tests**, zero failures, skipped tests or TODOs.
- `npm run build`: TypeScript validation, Vite production frontend and bundled Node backend pass.
- `node scripts/smoke-production.mjs`: compiled server starts, reports 50 games, serves the built frontend and a room refresh URL, then shuts down its own temporary process.
- The registry generates 50 per-game tests. Each validates metadata and execution-spec aliases, minimum and maximum rosters, serializable player/public views, unknown-player privacy boundaries, invalid input rejection, finite idle completion, scores and repeated cleanup.
- A real HTTP/Socket.IO matrix starts **every game at its minimum roster**, advances its authoritative clock through idle completion, and checks identical public results and session points on every connected client. This is a real transport test with accelerated server time, not 50 manual playthroughs.
- Additional WebSocket coverage plays Connect Four to a legitimate win, refreshes/rejoins the host, checks host migration and identity recovery, preserves session scores, and submits a correct numeric Speed Math answer.
- All 50 actual React renderers accept initial player, spectator, timed-phase and finished views from their respective server engines.

## Rule, privacy and lifecycle coverage

- Boards/cards: Connect Four gravity, wins, forfeits and alternating starters; Ultimate Tic-Tac-Toe forced boards and global/subboard results; Dots & Boxes extra turns and idle passes; Battleship placement, private drafts/fleets, sinking and repeated timeouts; Checkers mandatory captures, multi-jumps, kings, crowning and no-move results; Crazy Eights private hands, one-card draws, wild suits and reshuffling; President set strength, passed-player restrictions, trick resets and finishing order.
- Arcade: simultaneous territory support/conflict resolution; snake fixed-tick simultaneous collisions; connected perfect mazes; tile warnings/removal and color strikes; bounded movement and projectile hits; crown drop/pickup lock and possession time; six JSON golf courses, physics and penalties; race jump/checkpoint behavior; reaction timing, false starts and six-button commands; independent generated difference scenes and private answer regions.
- Party: hidden words/roles/answers/drawings, guessing normalization and correct-once scores; timed read/discussion/vote/reveal phases; revisable sealed votes and bids; auction final-bid tie order; numeric/majority/minority ties; dictionary validation and anti-repeat content; private number hints and attempt limits; team clue restrictions; anonymous drawing galleries; isolated telephone chains and participation-only results; timed single-pad memory playback and reconnect behavior.
- Explicit secret-state assertions cover Impostor Word, Guess the Drawing, The Liar, Fake Answer, Auction Wars, Battleship, both private-hand card games, Password, Secret Number, Spot the Difference, Sequence and Button Bash. Spectators and unknown player IDs receive public views.
- Type Race verifies server-validated incremental progress, no arbitrary completion, idempotent packet retries after a missed acknowledgement, and no duplicate typo count after a partial acknowledgement. The actual client transport helper has regression coverage.
- Shared platform: 20 seats, invalid codes/names, duplicate names, removal/token blocking, 90-second reconnect grace, immediate host migration, spectator restrictions, duplicate/out-of-order actions, room cleanup, countdown reconnects, normalized incremental drawing transport, undo/clear snapshots, per-game host settings and range validation.
- Ranking preserves raw scores while applying lower-is-better golf results, survival/finish ordering and game-specific tie-breaks. Session points are 5/3/2/1, ties share placement, only first-place finishes add wins, and Telephone awards participation without a competitive win.
- Room-owned shuffle bags exhaust stable content pools before reuse and avoid an immediate repeat on refill. All content minimums and structural constraints pass.
- Render proxy tests verify separate room-entry limits for different real visitors, a shared limit for the same visitor, rejection of malformed forwarded IPs, and ignoring all forwarded IPs outside Render. The deployment verification script plays a real two-player game without direct server-state access; its local preflight passes. A public URL must be checked separately before claiming deployment success.

## Browser checks on the upgraded build

Used independent browser identities on `localhost` and `127.0.0.1` connected to the same compiled server. The final build is running locally on port 3001; an isolated port 3002 was used for earlier verification.

- Created/joined by room code and verified both names and shared room state.
- Changed Connect Four turn time to 60 seconds; the guest saw the synchronized disabled setting. Reset recommended defaults to 30 seconds before play.
- Observed the three-second start countdown, then played a seven-move Connect Four win through the browser controls. Both clients showed the same placements, raw game scores and **5/3 session points**.
- Refreshed the original host: the same name, seat and session score returned, while host controls moved to the other connected player.
- Battleship: placed a carrier by tapping, rotated it, refreshed and recovered the same private draft, dragged a destroyer from its tray, randomized and locked both fleets, and exchanged alternating shots. Attack results appeared on the corresponding other player's sea.
- Draw & Guess: only the artist saw the word. A mouse stroke appeared live on the other canvas; Undo removed it there. Clear required its confirmation control. A correct guess revealed the word and awarded the time-based guess score plus 250 to the artist.
- Type Race: typed using keyboard events in both clients, saw shared progress and accuracy, refreshed one player mid-race, recovered server-confirmed text and continued. Both completed the same phrase and saw the same first/second ordering. Unconfirmed text at the instant of refresh must be typed again.
- Mini Golf: displayed hole 1 of 6 and its par; a shot increased the authoritative raw stroke count in both clients. Shoot disabled while the local ball rolled; the other player's ball remained independently playable.
- Checked 320-pixel and 1440-pixel browser viewports. Landing, lobby, settings, leaderboard, typing and golf controls had no document-level horizontal overflow in the checked views. Mobile retains the compact session leaderboard.
- Opened the header Settings dialog, changed reduced motion, refreshed and verified persistence, then restored the device default after testing.
- Browser console error logs were empty for both verification tabs.

## Bundled offline content

| Bank | Entries |
| --- | ---: |
| Drawing words with categories | 1,597 |
| Impostor words with categories | 1,597 |
| Odd drawing prompt pairs | 80 |
| Multiple-choice trivia | 155 |
| Typing phrases, 40–180 characters | 82 |
| Liar prompts | 80 |
| Fake-answer questions | 82 |
| Password words | 1,664 |
| Emoji clues with accepted answers | 115 |
| Would You Rather prompts | 105 |
| Majority / Minority prompts | 80 / 80 |
| Numeric trivia | 106 |
| Accepted category entries | 1,797; 1,759 distinct words |
| Scramble words, 4–12 letters | 1,846 |
| Hangman words | 1,876 |

Related word banks reuse the shared dictionary and category lists; the counts do not represent independent collections of trivia questions. Content is bundled and judged by deterministic rules without an external API.

## Limits of this evidence

All 50 engines have automated lifecycle and real transport completion coverage. Browser checks are representative end-to-end interactions, not every possible action in every game. Physical iOS/Android touch input, internet latency, large concurrent-room loads, Docker execution and third-party deployment were not independently exercised. No public deployment or paid service was created.

Rooms and session scores live in one server process and reset on restart. The application source is MIT-licensed and can be managed locally without accounts or subscriptions. Hardware, electricity, internet service and any separately chosen public hosting remain the operator's responsibility. See [README.md](README.md) for setup and management.
