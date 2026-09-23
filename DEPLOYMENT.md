# Public deployment

The app needs one continuously running Node service while players are connected. The included `render.yaml` deploys the frontend and live multiplayer backend together on Render's **Free** compute plan. It does not create a database, disk, paid worker or paid preview environment.

## Configuration

- Runtime: Node 24.14.1.
- Build: `npm ci --include=dev && npm test && npm run build && npm prune --omit=dev`.
- Start: `npm start`.
- Health check: `/api/health`.
- Bind address: `0.0.0.0`; Render supplies the public service port.
- One instance, with 20 rooms allowed initially. Each room keeps the game's existing player limits.
- Automatic redeploys are off so a source edit cannot interrupt an active game night. Deploy a verified commit when the room is idle.
- Use the assigned HTTPS address to create rooms and copy invitations. Both normal HTTP and Socket.IO use that same origin. No frontend backend-URL secret is needed.
- After Render assigns the URL, set `ALLOWED_ORIGINS` to its exact HTTPS origin (plus any intended custom domains, comma-separated). This restricts browser connections to the deployed site.
- Visitor IP handling is automatic on Render, using its validated edge header for room-entry rate limits. Leave `RENDER` unset when self-hosting directly; forwarded headers are ignored there.

The hosting account and source repository should belong to you. Connect only this repository when authorizing Render's GitHub integration if its account flow permits that choice.

## Keep it free

Choose a Hobby workspace and keep the service on **Free** compute. No paid plan, domain, database or add-on is required. Keep the account without a payment method to avoid automatic usage charges. If Render requires card verification for your particular account, stop and review the requirement before proceeding; a cardless signup is not guaranteed for every account.

Current free limits include 750 running hours per workspace each month. Render sleeps an idle service after 15 minutes without inbound HTTP or WebSocket traffic; waking takes roughly one minute. Restarts, redeploys and sleep clear this app's in-memory rooms and session scores. This is suitable for a public hobby game site, not guaranteed always-on hosting. Check current [free-service limits](https://render.com/docs/free), [bandwidth allowance](https://render.com/docs/outbound-bandwidth) and [build allowance](https://render.com/docs/build-pipeline) in your account.

## Deploy and manage

Create a Render Blueprint from this repository and verify that its only resource is the Free `night-arcade` web service before deploying. Alternatively, create a Web Service with the exact settings above. Do not select Static Site: it cannot run the game server.

After the build succeeds, verify the assigned public URL, `/api/health`, a refreshed room URL, and a complete two-player game. `node scripts/verify-deployment.mjs https://YOUR-SERVICE.onrender.com` checks the public frontend and plays a temporary Connect Four room over secure WebSockets, then leaves both test seats.

You can inspect logs, redeploy a tested commit, roll back, suspend or remove the service from your Render dashboard. Source code, rules, original content and branding remain editable in your repository. The standard Node/Docker setup also supports moving to another compatible host.
