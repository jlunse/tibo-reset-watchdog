# Single reset outlook

## Scope

One public outlook answers whether an extra reset is expected. It includes a new
grant applied immediately or saved for later. Ordinary recurring usage windows,
purchases and redemption of an existing grant do not count as new grants.

Version 5 reuses the existing `any` outlook and all its evidence fields. It requires
exactly one outlook and no numeric forecast. Version 4 reports remain valid with
three outlooks. The page renders only `any` from either format. No database, storage
owner, timer or scoring service is added. Historical events, source classifications
and automatic-only interval comparisons retain their original meaning.

## Publication order and rollback

Deploy the reader/validator that supports both formats before publishing a version
5 report. Update the existing hourly automation to produce version 5 after the
Site deployment succeeds. Fetch the latest report immediately before preparing the
first version 5 report; use the existing conditional publisher and exact readback.
Preserve original assessment and source timestamps during format-only migration.

Rollback must retain version 5 reader support. Do not redeploy a version 4-only
reader while the current report uses version 5. A visual rollback can use the
existing combined record without restoring three artificial assessments. If a full
format reversal becomes necessary, first prepare an explicitly reviewed version 4
report and verify it with a compatible reader; never silently rewrite the archive.

## Verification and public copy

Tests cover the actual report/status/archive handlers with SQLite, strict outlook
cardinality, legacy archive reads, source-linked staff reassessment and the real
React renderer for both report formats. Build before publishing. Public English
copy changes affect the client-rendered outlook, references, history and shared
methodology. Existing metadata already describes reset news without splitting
reset types and is unchanged. No additional locale exists.

Closure requires exact report readback and a subsequent scheduled run producing
or retaining the single outlook with truthful source coverage. A local test or a
manual format migration is not proof of that subsequent scheduled run.

## Following a completed grant

Follow WORKFLOW.md, "After a delivered reset: assess the next one". Reuse the
existing event identity, source notes, current outlook, review and change log.
Confirmed delivery closes that grant's forecast; LOW is the assessed starting
point for the next grant only when no independent unfulfilled signals remain.
Keep old reports unchanged and label historical text as historical. No cycle ID,
new storage, automatic clock trigger or retention expansion is needed.

English public copy covers the shared current page, outlook and change-log labels,
and archive introduction. Metadata does not describe the handover and is unchanged.
The publication regression test exercises pending-to-delivered-to-LOW reporting
through the real handlers and SQLite while preserving the prior report and event
identity. It verifies storage and display contracts, not the agent's future source
judgement. Do not publish a simulated completion as current research.
