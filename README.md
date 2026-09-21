# Tibo Reset Watchdog

An unofficial, playful dashboard for public Codex reset research, source-backed updates, qualitative outlooks, and research-run status. It is not affiliated with OpenAI and does not access your account, purchase credits, or perform resets.

[Live site](https://tibo-reset-watchdog.johanlundgren.chatgpt.site/)

## Run locally

Requires Node.js 22.13 or newer and npm. Python 3 is needed only for the optional publishing helpers.

```sh
npm run install:ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_busy_quasar.sql
npm run dev
```

Open the loopback URL printed by the development server (normally http://localhost:5173). The app uses React, Vinext, Tailwind CSS, and a Cloudflare D1 database. An empty database shows unavailable research until a reviewed report is submitted. Apply the migration once per database.

## Checks

```sh
node --experimental-strip-types scripts/validate-research.mjs research/latest.json
node --experimental-strip-types scripts/test-research.mjs
node --experimental-strip-types scripts/test-monitor.mjs
node --experimental-strip-types scripts/test-publication.mjs
WATCHDOG_SITE_URL=https://example.invalid python3 scripts/test-publication-recovery.py
npm run build
```

The included research JSON is a dated public snapshot, not a live feed. Tests use it as a fixture. References and third-party source material retain their original attribution and rights.

## Hosting and publishing reports

The project retains its Sites-compatible structure. `.openai/hosting.json` declares the `DB` binding but contains no existing Site identity. Register your own Site to deploy through Sites. For other hosting, provide a Cloudflare Worker-compatible deployment and a D1 `DB` binding; deployment elsewhere has not been verified.

Configure your own `WATCHDOG_INGEST_TOKEN` server secret. Store the matching token locally in the ignored `.sites-runtime/ingest-token` file, and set `WATCHDOG_SITE_URL` to your own deployment origin before running either publishing helper. Never commit the token. For local development, provide the server secret through your local Worker environment.

```sh
export WATCHDOG_SITE_URL=https://your-own-site.example
# Save your current public /api/watchdog response as live-baseline.json first.
python3 scripts/prepare-research.py candidate.json live-baseline.json prepared-report.json
node --experimental-strip-types scripts/validate-research.mjs prepared-report.json
python3 scripts/submit-research.py prepared-report.json live-baseline.json
```

Review and update the report first: the server rejects expired reports, malformed payloads, and older reports that would overwrite newer research. The helpers verify readback. Do not submit the bundled historical snapshot as fresh research.

## Research and monitoring

See [research/WORKFLOW.md](research/WORKFLOW.md) for the research process. The website displays run status; it does not schedule or perform research by itself. The original owner's Codex automations, private tasks, credentials, database contents, and local execution history are not included. Configure your own research runner if desired. The current status model expects hourly checks in Europe/Stockholm, with full reviews at 07:00 and 19:00.

The latest update is explained next to the AltoTrail panel using the same report text as the change log and archive. The research workflow requires plain explanations of the evidence, outlook impact and uncertainty.

The original interface and AltoTrail promotional panel are included. Adjust branding for your own fork as needed. This GitHub source release is separate from the live Site; pushing here does not deploy it.

## License

MIT, copyright 2026 Johan Lundgren. See [LICENSE](LICENSE). Bundled third-party notices remain in [build/sites-vite-plugin.LICENSE](build/sites-vite-plugin.LICENSE) and [vendor/shadcn-tailwind-4.13.0.LICENSE.md](vendor/shadcn-tailwind-4.13.0.LICENSE.md); dependencies have their own licenses.
