# Experiment concluded

The owner ended active monitoring on 23 September 2026. Scheduled research is paused. Do not resume research or editorial updates without the owner's explicit instruction. The procedure below is retained as historical methodology.

# Shared Reset Watchdog research and publication

All website content and public run status must be English. Never publish private account observations, private project advice, full transcripts, credentials or conversation IDs. Use the existing Site and authenticated report endpoint; no redeployment is needed for research updates.

## Public writing
Use short, plain English sentences. Keep summaries and change titles easy to scan. Avoid repeating the same warning or finding. Put detailed evidence, caveats and technical terms in source notes and supporting fields shown in expandable sections. Preserve exact source meaning, uncertainty and earlier corrections.

### Explain every published update
Write each `analysis.changes[].detail` as a short explanation a curious reader can understand without reading earlier reports. The newest entry is shown in full immediately below the AltoTrail advertisement; it remains visible when the advertisement is dismissed. Older entries remain in the existing change log and report archive. Use two to four short paragraphs, separated by blank lines, within the existing 1,800-character limit. Old single-paragraph entries remain supported.

Lead with what changed and its effect on the single reset outlook. Explain the concrete evidence and why it supports that decision, including why a level stayed unchanged when relevant. Clearly mark interpretation with language such as "our reading" or "this could mean". Close with the important uncertainty or evidence that would change the assessment. Speculation is optional and must have a stated basis; never invent a scenario merely to fill the explanation. Do not require a new reset announcement before considering other evidence, and do not treat missing confirmation as proof that a reset is unlikely.

Distinguish new adverse evidence from a correction to an earlier judgement. Explain a downgrade caused by weaker support as such. A level and the confidence in that level are different. Never turn a longer wait, more reports or an approaching event into a measured probability. Name unavailable originals when they materially limit the conclusion. Do not change assessment dates unless a genuine reassessment took place. A no-change check does not need a new report just to provide commentary.

Example for the September 21 downgrade, preserving its original assessment time:

> We lowered the automatic-reset outlook from HIGH to lower ELEVATED. Banked stays at lower ELEVATED. Confidence in both remains low.
>
> The earlier HIGH judgement gave too much weight to the long wait and growing number of usage reports. Those reports deserve attention, but they are not all verified billing errors, and we have not established how reliably they predict another reset.
>
> Tibo's September 19 reply is also ambiguous. We cannot safely read it as a reset promise. This change corrects the strength of our earlier judgement; it does not reflect a new negative announcement from OpenAI.
>
> Past resets still justify watching closely. Stronger evidence linking the current situation to a new grant could change the outlook. ELEVATED is a cautious judgement, not a calculated probability.

This standalone Site uses English only. Context interpretation uses the existing source notes, combined outlook and change explanation. The methodology copy is shared by server rendering and hydration in `app/page.tsx`; page metadata is unchanged because it does not describe this step. Reuse the existing report contract and rendering; no forecast engine, extra source of truth or new publishing schedule is introduced.

## Schedule and run lifecycle
Temporarily every hour on the hour, Europe/Stockholm, until the operator requests a change. Full research at 07 and 19; other runs are change checks. This replaces the earlier three-hour and four-times-daily schedules. Execution requires the owner's Codex environment; do not promise continuous server monitoring.
1. The monitor command reconciles the exact saved terminal outcome before starting another run. If reconciliation fails, keep the saved outcome and do not start a replacement run. `python3 scripts/monitor-run.py reconcile` retries a saved terminal outcome without starting research. Run `python3 scripts/monitor-run.py start full` (or light/recovery) BEFORE research. It publishes running status and recovers a locally unfinished prior run as failed. If this fails, report the monitoring failure and continue safe research; do not claim healthy automation.
2. Fetch public /api/watchdog with User-Agent Mozilla/5.0. Read lib/research.ts and use the public report as baseline. Do not overwrite newer reports. The status endpoint /api/watchdog/status independently detects late starts and unfinished runs after 45 minutes.
3. Review the public sources and research inputs you have configured for your own installation. The original owner's private Codex tasks and message checkpoints are not included. Record unavailable inputs as unavailable coverage, never as 'nothing new'. Do not copy private conversations into reports.
4. Reconcile configured sources with independent public discovery below. Save unresolved public leads/conflicts in the report's coverage/changes, not just private scratch notes. Advance processed message checkpoints ONLY after verified publication, or after explicitly documenting a no-change comparison. Checkpoints store message IDs and report IDs, never private transcript text.
5. Before completion write .sites-runtime/run-coverage.json as [{name,status,detail}], where status is checked, partial or unavailable. Include configured research inputs, official sources, staff originals, GitHub/community and historical reconciliation. Coverage describes THIS run, not a recycled earlier review.
6. Publish material changes with scripts/submit-research.py after both validator and tests. Then run `python3 scripts/monitor-run.py finish published 'Public summary of coverage and changes' REPORT_ID`. This refuses success when the report archive does not exist. If unchanged, finish unchanged with a bounded coverage statement; do not rewrite report freshness. On failure finish failed with a public-safe reason and notify. Do not abandon a started run silently. If interrupted, resume at the earliest unfinished step using saved state.

## Discovery beyond the source tasks
### Priority staff pass, every hour
Tibo discovery is the first research task, ahead of GitHub. Search results alone NEVER satisfy it. In EVERY run:
1. Open `https://x.com/thsottiaux` and `https://x.com/thsottiaux/with_replies` in the available browser. Record access failures rather than treating an empty/error timeline as no new posts.
2. Open `https://codexreset.org/` directly, even if search finds nothing. Read its latest monitored Tibo link, collection timestamp and recent timeline. Use `https://recodex.lol/timeline` as a second discovery route. These are COMMUNITY link indexes, not authority for classification, probabilities or reply relationships. Do not assume their timestamps prove complete coverage.
3. Compare discovered canonical post IDs with LIVE report sources. Inspect all new posts and replies within the 48-hour overlap, including non-reset wording. Open each material original in the browser and inspect context. A blocked profile does not mean individual post URLs are blocked. Revisit unresolved leads before lower-priority bug reports.
4. In the existing `run-coverage.json`, add `Tibo discovery` and `Tibo originals` rows. Record actual routes, access gaps, newest canonical post URL, and disposition of new leads. Mark checked only after discovery and original checks were actually performed. Broader staff coverage may still be partial. Never reuse a prior run's check or invent a successful check to satisfy the guard.
5. If no current discovery route works, or material originals cannot be verified, publish discovered leads as qualified/incomplete if possible, then finish **failed** with an explicit Tibo-coverage reason and notify the operator. Do not silently finish unchanged or claim a healthy check. The local monitor rejects successful completion without both checked rows and canonical URLs; this enforces recording, not external feed completeness.

Regression case: the September 22 04:31 UTC post `https://x.com/thsottiaux/status/2102254445082116335` was absent from broad search results but present on the directly opened monitor, and its original was readable in the browser. The earlier staff-reassessment guard only caught sources already added to a candidate. It could not detect this discovery omission. Keep the original-context and same-run reassessment guards as well.

Before broad GitHub discovery, search Tibo and VB posts AND replies independently of configured research inputs. Use a rolling 48-hour overlap, including older posts discovered late. Search each author without requiring the word "reset"; include timing, launch and credit hints. Follow exact phrases and canonical post IDs from supplied leads. Check the reply's parent and surrounding thread when accessible. Search-engine indexing and X access are incomplete: report that limitation instead of claiming comprehensive coverage.

Treat a new or materially clarified reset, grant, timing or related launch hint as a priority lead even when ambiguous. Retain its canonical original URL in `sources`, its exact short wording, access/provenance and unresolved context in source notes, and the pending verification in public coverage. If only copies are readable, keep them COMMUNITY and the original unavailable; do not discard the lead or call it directly verified STAFF. Multiple copies of one post remain one signal. Prioritize unresolved staff leads again next run until clarified, superseded or explicitly closed with an explanation. Do not let an older correction about a different post suppress new evidence.

Reassess the single combined reset outlook in the SAME hourly run when a priority staff lead is added or materially changes. Do not wait for 07:00/19:00. Link the original source ID in the outlook, update reasons/support/against, timestamps and provenance, and explain the judgement in the newest change entry beside the advertisement. Evaluate the positive signal as well as uncertainty; neither automatic promotion to HIGH nor automatic dismissal for lack of confirmation is justified. A completed assessment of the combined outlook uses `analysis.review`; name the targeted scope and preserve timestamps of sources not rechecked. If blocked, publish the lead and an explicit incomplete assessment rather than silently retaining apparently current forecasts.

`prepare-research.py` and the publisher reject new or materially changed sources from the registered staff post URLs unless the combined outlook has a fresh, source-linked assessment and a new public explanation. The honest failure path is a new `incomplete` review whose `considered` entries name each pending source ID, with a new public explanation. This includes originals recorded as COMMUNITY/imported/unavailable, and ignores check-time-only changes. The guard verifies recording, not discovery completeness or the quality of a judgement. Resolve a rejection by assessing the evidence or recording the limitation, not by dropping the source or relabelling it.

### Interpret the conversation before weighing a hint
For every material staff reply or ambiguous hint, inspect the parent post, any quoted post, relevant surrounding replies, and later clarifications by the staff author or the person addressed. Follow exact original URLs. When text fetching fails, try the original in the available browser before declaring it unavailable. Read visible text and relevant media only; mark media that cannot be inspected as a gap. A copy or a tracker classification cannot establish a reply relationship.

Record the context in the existing source `note`, with original links saved as separate `sources` when material:
- What the staff member actually said, and what they were replying to.
- The subject: a reset request, product launch, event, joke or personal usage window, or unresolved. Separate observed context from our interpretation; do not force a category when uncertain.
- Later clarification, who wrote it, and whether it supports or contradicts the reset interpretation. A participant's own post is direct COMMUNITY evidence of their explanation, not STAFF authority over OpenAI's plans.
- The strongest supported reset reading, any supported alternative, and the resulting effect: strengthens, weakens, neutral or unresolved. Give the reason; do not turn these labels into a score or a probability.

Use this interpretation in the combined outlook's existing `support`, `against`, `reason`, `missing` and `sourceIds`, and in the public update explanation beside the advertisement. Context can strengthen a cryptic hint even without the word reset, or remove weight previously assigned to it. A missing parent means unresolved context, not evidence for either outcome. Do not convert a clock phrase into a reset deadline unless both the event and time zone are supported.

Two posts count as a continuing conversation only when the reply/quote relationship is verified. Repeated copies remain one signal. When using historical style, compare genuinely similar cryptic exchanges with known subsequent outcomes; an explicit livestream invitation is not a counterexample to a claim about cryptic reset hints. A few selected successes do not establish that such hints always precede resets.

A material parent or clarification discovered later triggers the same-hour reassessment rule, even if the staff post itself is unchanged. Update the original staff source's `note` and include the linked context sources in the combined outlook so the existing publication guard requires a new assessment and public explanation. Never leave a disproved interpretation in current support while merely appending a correction elsewhere. Preserve earlier reports and change entries as history. Prefer source-linked corrections over a conflicting imported watch interpretation and do not count a retracted lead as independent reset support.

September 21 regression example: the "3am" reply belongs to a GPT-6 Community Night post, whose author later rejects the reset interpretation. It must not reinforce the separate September 19 banked-reset exchange. Keep the latter as a qualified lead: its parent requests a banked reset while also discussing a delayed release. Future evidence may change this assessment; the example is not a permanent rule about Tuesdays.

Full reviews: read Help Center reset and Astra usage guidance, Status current AND incident history, official announcements/changelog, Tibo and VB posts AND replies, GitHub usage/accounting/context/automation reports and merged fixes. Review new source-linked leads from configured inputs first. Use original pages and inspect surrounding context. Search GitHub by updated date with at least a 24-hour overlap since last successful run; follow pagination when it indicates more results. Deduplicate by canonical issue/post/PR ID. Bot labels and duplicate suggestions are not staff confirmation or proof of independent defects.
Change checks: configured research inputs are mandatory, plus broad discovery across official/staff and GitHub. Start with up to eight targeted queries and twelve relevant originals. This is a starting budget, not a completeness claim: if material leads remain, prioritize reset announcements/corrections, process additional relevant originals or publish an explicit pending list and partial coverage. Never drop a supplied lead merely because the initial budget ended. Old long ledgers need not be rebuilt every run.
Always include a staff discovery query without an X domain restriction or exact date phrase. Search reset, banked, saved credits, compensation, rollout AND contextual replies, exact phrases and post IDs. A reply may not contain 'reset'. Archives such as Reset Beacon and Codex Limit Watch only discover original links. Do not inherit their classifications or percentages. Read the parent post and response where accessible. If X fails, retain prior findings as imported research and archive copies as COMMUNITY. Do not upgrade them to directly read STAFF.

## Evidence, disagreement and history
OFFICIAL > STAFF > COMMUNITY applies to public authority, not a probability formula. Announced, scope, timing and delivered are separate claims. Do not classify ambiguous hints as reset events when even the reset type is unknown. Preserve corrections visibly in analysis.changes and source notes. Distinguish ordinary usage windows, paid resets, targeted replacements and broad grants. Count only the latter in broad promotional history.
Different watches interpreting the SAME post are not independent confirmations. State both interpretations and the evidence that would resolve the conflict. Use cautious editorial judgement; do not pick whichever source is newer or more optimistic. In particular the September 19 reply is ambiguous; no reset type, scope or Tuesday reset deadline is verified.
Publish schemaVersion 5, forecasts empty, and exactly one qualitative outlook with kind `any`. Separate level, confidence, as-of, imported/reviewed provenance, supporting/opposing evidence and missing decisive evidence. Bug counts and elapsed days do not mechanically increase outlooks or establish compensation policy.
Imported ledger totals are snapshots, separate from individually reviewed originals. Import a newer supplied snapshot with its as-of, category reconciliation and attribution; never add overlapping totals. Watch-only reports stay outside strict bug counts. A repository code fix is not a reproduced accounting defect or a human STAFF statement. Exact source timestamps remain qualified when imported.
Reconstruct historical intervals only from explicit per-event original anchors, reset type, date uncertainty and scope. Until then retain newer aggregate statistics as clearly dated imported analysis, not newly verified frequencies. Never interpret tiny survivor samples as calibrated probabilities. Historical official incidents belong to their actual cycle, not the current cycle.

## Validation and delivery
Use a saved live baseline, never the checked-in sample as the current report. First merge the candidate with that baseline, retaining important corrections in current source notes and outlook reasons. Prepare the rolling change list with `python3 scripts/prepare-research.py CANDIDATE LIVE_BASELINE PREPARED_REPORT`. This keeps the newest 30 changes and refuses to discard an unpublished change. Older changes remain accessible at /history in retained report snapshots. Never truncate sources, incidents or reset events to bypass validation; report those limits explicitly.
Run:
- node --experimental-strip-types scripts/validate-research.mjs PREPARED_REPORT
- node --experimental-strip-types scripts/test-research.mjs
- python3 scripts/submit-research.py PREPARED_REPORT LIVE_BASELINE
The publisher reads the ignored secret and verifies exact public equality. Never print/read the credential directly. A 409 requires fetching the newer report and reconciling. Preserve all valid prior history and source check timestamps. A targeted update may refresh report publication time but must not claim a full review of untouched sources.
After status readback, notify only material findings/corrections, publication or monitoring failure, or required action. Unchanged checks stay quiet. Never purchase credits, consume resets or enable paid reload. Token telemetry is null when unavailable; do not infer per-run usage from account totals.

## One reset outlook
The public question is: how strong are the signals of an extra reset? New reports
contain only `analysis.outlooks: [{kind: "any", ...}]` in schemaVersion 5. Reuse the
existing level, position, confidence, trend, evidence and review fields. Do not
produce separate automatic and banked forecasts, average them, take their maximum,
or copy the combined conclusion into redundant fields.

Use one discovery pass covering reset, banked/saved grants, global/automatic
resets, compensation, credits and rollout wording. Keep those search terms: source
authors use different words for the same user benefit. Prioritize Tibo and preserve
all original-verification and context requirements above. A direct promise of a
reset is positive evidence for this combined question even when its type is unknown.
Unknown type, eligibility or exact clock time alone must not cap the combined
outlook. Credibility, contradictory evidence and supported timing still matter;
apply the explicit-promise decision sequence below. Repeated interpretations of one post
remain one signal. Scheduled personal usage windows, purchased resets and merely
spending an existing saved reset are not new extra-reset grants.

Public current summaries, change titles and explanations describe "reset" with one
level and one reason. Preserve the difference between promised and delivered, and
state who is eligible when known. Put type-specific facts in expandable source and
history details. Retain historic records and corrections verbatim; do not relabel
old automatic-only interval statistics as statistics for all resets. A saved grant
and its later redemption are not two new grant events.

The current page displays the existing `any` assessment for both legacy and new
reports. Legacy version 4 archives retain three assessments and remain readable;
do not rewrite them. No database migration or duplicate forecast engine is needed.
Each new assessment explicitly weighs its evidence; the migration may retain the
existing combined assessment and original assessment time without inventing a new
research review.

The single meter retains lower/middle/upper positions within LOW, ELEVATED, HIGH and
VERY HIGH. Position changes require evidence and a public explanation, never just
time passing or a check running. Level, confidence and trend remain distinct.
Preserve absent positions in older reports; never invent a midpoint.

## Weigh an explicit reset promise
The existing research agent owns this qualitative decision. Apply the following
sequence to the combined outlook; do not infer a numerical probability or add a
keyword-based scoring service.
1. Establish the original, author, wording and context. An explicit, credible
   OFFICIAL or directly verified STAFF commitment to a forthcoming extra reset is
   stronger than an ambiguous hint. Verify it concerns a new grant, not a routine
   personal window, a purchase or redemption of an existing grant.
2. Assess whether an extra reset will occur for some eligible users. This is not a
   prediction that every user, or the reader's own account, will receive one.
3. A clear, current commitment with no known material contradiction can justify
   lower VERY HIGH before delivery. Use this as the starting judgement for that
   evidence class, then explain any departure using actual evidence. Do not require
   a delivery announcement to reach VERY HIGH: delivered is an observed outcome,
   not a prerequisite for a strong forecast.
4. Unknown type, eligibility or exact clock time does not by itself cap this
   combined outlook at HIGH. Record those unknowns separately. They matter to the
   outlook only when they undermine whether an extra grant will occur at all or
   within the supported promised window. Do not invent a time zone or deadline.
5. Weigh credible contrary evidence, author qualifications, cancellations and
   delays. A withdrawn promise removes its support; a supported missed deadline or
   delay can weaken the timing assessment. Never preserve VERY HIGH mechanically.
   Earlier ambiguous hints are not independent confirmations and should not keep
   limiting the existence of a promise after a later explicit statement resolves it.
   Preserve their corrections and unresolved details in source notes and history.
6. Assess confidence separately from level. Explain source access and verification
   gaps, including any inability to check for later clarifications. A failed fetch
   is a coverage gap, not evidence of cancellation or proof that nothing changed.
   Previously verified evidence can be reweighed, with original source-check times
   retained and the limited reassessment scope stated. Do not claim a healthy
   discovery run or freshly checked originals; preserve monitoring failures.
7. For a changed judgement on unchanged evidence, update the existing combined
   outlook, review and public explanation together. Say that weighting changed,
   not that a second announcement was discovered. Repeated copies remain one signal.

Acceptance examples for applying this rule:
- Verified explicit promise; type/scope/time unknown; no known contradiction:
  lower VERY HIGH is justified, with confidence assessed separately. The September
  22 promise qualifies on the previously verified record; later verification gaps
  remain visible and medium confidence is retained in the targeted reassessment.
- Cryptic reply, unverified copy, or uncertain grant meaning: investigate context;
  no automatic promotion to VERY HIGH.
- Verified cancellation, reversal or material delay: reassess downwards as warranted;
  the prior promise does not create a permanent minimum level.
- Confirmation of delivery: record the event and eligible scope, then reassess what
  additional reset, if any, remains expected. Do not count redemption as a new grant.

The public explanation is English only, in the shared page component and the
existing outlook details. Metadata does not describe level thresholds and stays
unchanged. No schema, storage owner, schedule or new forecast engine is introduced.

## After a delivered reset: assess the next one
Apply this within the existing report and hourly research process, as soon as
delivery is verified. Do not wait for a scheduled full review, a guessed clock
time, a cooldown, or the passage of a fixed number of hours. This changes the
subject of the forecast from the fulfilled grant to the next possible extra grant;
it does not erase research or start another service, schedule or stored cycle.

### Verify completion and match the grant
- Require a directly read OFFICIAL or STAFF source confirming delivery of the
  relevant extra grant. An announcement, one account report, an ordinary window
  reset or an unverified mirror is insufficient. Distinguish rollout started from
  the promised grant being delivered for its stated eligible scope; do not require
  delivery to every account when the grant itself has a narrower scope.
- Match the delivery to the existing promise/event and its source links. Continued
  rollout, additional recipients and later redemption of the same saved grant are
  updates to that event, not additional grants or reasons to restart again.
- Update the existing event ID when one already represents the grant. Record
  announcement, eligibility, timing and rollout as separate claims with their own
  evidence. Never infer unknown scope or an exact timestamp. If the grant is clearly
  delivered but its type remains unknown, record the outcome in source notes,
  historyNote and the latest change; defer the typed event and type-specific
  baseline rather than inventing reset/banked. Combined reassessment can proceed.

### Reassess the remaining evidence
- Retire the fulfilled promise from active support for another reset. Preserve it
  as historical evidence of the completed event. Review other existing leads: a
  separate unfulfilled promise must survive this transition even if it predates
  the delivered grant. Do not simply discard all earlier sources by date.
- With no remaining credible signals for another grant after that review, use LOW,
  lower position, as the new starting judgement and explain it in positionReason.
  LOW means little current support for another reset, not zero probability, a
  measured frequency or evidence that future resets are impossible. Assess
  confidence separately; confirmed delivery does not make the next forecast certain.
- If independent unfulfilled evidence justifies a higher level, retain that level
  for the next reset and explain the exception. Time passing, unchanged bug totals
  and repeated copies of the completed promise do not raise the new outlook.
- If delivery is unverified, do not trigger this transition. If delivery is verified
  but the next assessment cannot be completed, publish an incomplete review and say
  prominently in summary and the latest explanation that the saved meter belongs
  to the previous assessment and the next outlook is pending. Do not invent LOW or
  mark discovery healthy merely to complete the transition.

### Update current text and preserve history together
Before publishing the same report, review all these existing fields:
- summary: lead with confirmed delivery and its scope, then the outlook for the
  next extra reset. Remove stale future-tense claims that the completed grant is
  still awaited; do not replace uncertainties with guesses.
- analysis.outlooks[any]: reassess level, position, confidence, trend, asOf,
  provenance, reason, positionReason, support, against, missing and sourceIds. Remove
  the fulfilled promise as an active prediction, retain relevant corrections and
  independent outstanding signals. A move to LOW is a new subject, not a failed
  prior forecast; explain this alongside the existing weakening trend label.
- analysis.review: give the actual reassessment time, scope, considered delivery
  and remaining evidence, and complete/incomplete status. Preserve source-check
  times for originals not rechecked and keep coverage gaps and monitor failures.
- analysis.changes: append a plain-English explanation beside the advertisement.
  Say which forecast was fulfilled, what is now confirmed, why the next outlook
  starts at LOW or stays higher, and what could change it. Never rewrite earlier
  change entries or archived snapshots to make the old forecast look different.
- events, historyNote and baselines: record the delivered grant once, with links,
  actual dates and qualified scope. Advance only a reference whose type/scope
  matches this grant. A banked grant does not reset an automatic-only reference.
- sources and incident notes: keep original meaning, dates and corrections. Label
  fulfilled promises as historical context in current notes when clarified; keep
  links needed to explain the old and new assessments. A reset does not prove a
  reported software or accounting problem is fixed.
- importedLedger, incidents and analysis.history: retain cumulative totals and dated
  comparisons. Do not zero counts or redate an imported interval sample. Recompute
  only when its own evidence and type-specific reference support it, keeping prior
  snapshots. The public copy must identify these as history, not current pressure
  for another reset. Operating-usage totals and the hourly schedule also continue.

Use the existing conditional publisher and exact readback. Verify that the current
report shows delivery and the next assessment coherently, the prior forecast is
still readable in the archive, and no duplicate event was created. A later re-read
of the same delivery must not restart the round again.

Example only after verified delivery and a completed remaining-evidence review:
"The promised reset is now confirmed. The earlier VERY HIGH forecast was fulfilled.
We are now assessing the next extra reset, starting at LOW because we have no
remaining clear signals for another grant. A separate new promise or other credible
evidence could change that. Earlier assessments remain in the history."

## Mandatory full assessment
Every full run at 07:00 and 19:00 must explicitly reassess the single combined reset outlook. Publish `analysis.review` with `at`, `status` (`complete` or `incomplete`), `considered` (the actual new evidence and unresolved gaps), and `reason` (why levels/positions changed or remained unchanged). A complete review sets the outlook's `asOf` to that review time and `provenance` to `reviewed`, including when levels remain unchanged. Update reasons and supporting/opposing evidence truthfully. Do not advance review dates just because a run started. The review time must be within the run and no later than report publication.
If assessment cannot be completed, publish an explicit incomplete review with its limitation and retain the last genuinely assessed outlook dates; or finish failed if publication is impossible. A full run cannot finish unchanged. A light update preserves the previous full review metadata unless an actual new full assessment was performed. Research/source coverage and assessment completeness are separate: explain material evidence gaps even in a completed assessment.

## Retention and recovery contract
The existing report/status handlers own D1 retention, enforced on successful writes with deterministic ordering by checked_at and id. Keep the newest 720 monitor runs and newest 720 report snapshots, plus the current report and snapshots referenced by those retained monitor runs (at most 1441 archived reports plus the latest pointer). Only exact `monitor-run-*` and `research-v2-run-*` key families are eligible; unrelated snapshots are protected. Archive pages contain ten reports and use keyset pagination. Return an explicit unavailable/reload response on storage errors or an expired cursor. This is bounded history, not permanent archival storage. Current source notes and outlook reasons must retain still-relevant corrections regardless of archive expiry.
The monitor script owns only `.sites-runtime/active-monitor-run.json`, `run-log.jsonl`, `monitor-command.lock`, `run-coverage.json` and their explicitly named temporary replacements. Keep at most 720 log lines and read at most a 16 MB tail during migration. Refuse symlinks, replace files atomically, serialize monitor commands, and never touch unrelated files. The active outcome is retained until exact remote equality is confirmed; three bounded transient-network attempts are allowed, with read-before-retry and no retry on conflicts or permanent errors. A cleanup/log-write failure is an error, not a successful terminal confirmation. A failed database cleanup returns an error even if the report was saved; inspect readback before retrying the same immutable report. No new timer or background process is introduced.

## Public surface
This standalone Site publishes English only. The assessment summary and history page are client-rendered public explanatory copy; existing metadata and the AltoTrail product's separate locale surfaces are unchanged.


## Operating-usage experiment
The existing monitor start command collects final token counters from earlier completed heartbeat turns of the configured Watchdog automation. It excludes manual and mixed manual/scheduled turns, other automations and unfinished turns. Token deltas use the cumulative counters before and after each turn; cached input is a subset of input and reasoning is already included in output. Missing counters or counter resets are recorded as unmeasured, never estimated as zero. A run includes its final answer and is normally counted by the next start. These are token counts, not a monetary cost or a percentage of an account allowance.

Configuration lives only in the ignored `.sites-runtime/usage-config.json`: `automationFile` points to the local automation TOML, `sessionsDirectory` to the local Codex sessions root, and `since` is a fixed UTC measurement start. Do not commit this configuration, session identifiers, transcripts, account limits or balances. Only aggregate counters and period timestamps are public. The first deployment may seed completed runs from the stated measurement start using `python3 scripts/monitor-run.py usage`; this does not start research.

The existing authenticated status handler owns one `watchdog-usage-total` snapshot in the existing snapshots table. It is protected from report/run retention. The snapshot contains cumulative counters and a completion watermark; each update requires the previous update timestamp, and totals cannot regress. Exact readback verifies delivery. Lost responses are reconciled by reading the aggregate on the next collection, so previously counted completions are skipped. There is no new timer, database table or append-only local output. Storage is bounded to one aggregate and one small configuration file. The collector only reads existing Codex logs; it does not own or delete them. Run collection under the existing monitor command lock. A collection error leaves the prior aggregate intact and prints an unavailable diagnostic; it must not fail or suppress research. The public panel shows the actual measurement period and last update, including unmeasured completions. If telemetry files disappear before collection, that missing history cannot be reconstructed; inspect gaps before claiming coverage.

Public copy remains English only. The experiment is client-rendered near the footer; page metadata is unchanged because it does not describe the usage measurement. Verify the raw-event collector with `python3 scripts/test-watchdog-usage.py`, and the actual status handler and SQLite persistence with `node --experimental-strip-types scripts/test-publication.mjs`.

