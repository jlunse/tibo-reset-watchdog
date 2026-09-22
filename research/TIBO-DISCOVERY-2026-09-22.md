# September 22 Tibo discovery miss

## Observed failure

The morning report missed the explicit Tuesday reset promise at
https://x.com/thsottiaux/status/2102254445082116335.
The run used search results without directly checking the current Tibo feed or
community link indexes. Yesterday's preparation guard only reassessed staff
sources already present in the candidate; it could not discover an absent post.

During recovery, the original post and main X profile were readable. The replies
feed returned an error. Both codexreset.org and recodex.lol/timeline exposed the
canonical post link. A failed replies feed therefore did not establish that the
original was inaccessible.

## Correction and prevention

The published correction records the explicit promise, raises banked to lower
HIGH and automatic to upper ELEVATED, and leaves type, eligibility, exact timing
and delivery unconfirmed. The separate Community Night correction is preserved.
Report equality and terminal published status were verified; the browser showed
the new explanation and change-log entry.

WORKFLOW.md and the active hourly automation now require direct Tibo discovery
before other research, comparison of canonical IDs, original verification and
explicit recording of gaps. monitor-run.py refuses published/unchanged completion
without this run's checked Tibo discovery and original rows with canonical URLs.
Failed outcomes remain available. Existing start behavior clears stale coverage.

The gate checks recorded evidence, not external-feed completeness. Twelve
publication-recovery tests pass, including missing coverage, accepted coverage,
stale coverage removal and failed completion. The changed procedure still needs
observation in a subsequent scheduled run; this manual recovery does not prove
future automatic discovery of every new post.
