# Stage System — Concept & Design Decisions

## Overview

The `stage` field adds a human-readable progress layer (1–5) on top of the spaced repetition algorithm. It is stored (not computed) so words can be queried and filtered by stage.

---

## Stage Progression Rules

- **forgot** → `stage = max(1, stage - 1)` — regress by 1
- **hard / good / easy** → `stage = min(5, stage + 1)` — advance by 1

Regression drops by 1 step only (not full reset) to avoid "ease hell" where words get stuck at stage 1 after a few failures.

---

## Stage Definitions

| Stage | Label     | Interval range | Meaning                              |
|-------|-----------|----------------|--------------------------------------|
| 1     | New       | 0 days         | Just added, never reviewed           |
| 2     | Learning  | 1–3 days       | Short-term memory, frequent review   |
| 3     | Familiar  | 4–14 days      | Recognizable, mid-term memory        |
| 4     | Confident | 15–60 days     | Long-term memory forming             |
| 5     | Mastered  | 60+ days       | Long-term retention, rare reviews    |

Labels are display-only. The source of truth is always the `stage` integer in the database.

---

## User Configuration

Each user has a `stageThresholds` JSON config that maps stage number to the minimum `intervalDays` for that stage label. The algorithm still drives scheduling; thresholds only affect the label shown.

Default thresholds:
```json
{ "1": 0, "2": 1, "3": 4, "4": 15, "5": 60 }
```

Users can tune these via settings. Keep default values for MVP.

---

## Why Stored, Not Computed

- Enables DB queries: `WHERE stage = 1` to show "new words" list
- Stage can diverge from `repetitionCount` once regression is applied
- Enables future features: "review only stage 3+ today", stage-based stats, streaks

---

## Algorithm Note

`stage` advances independently from `intervalDays` and `easeFactor`. The spaced repetition algorithm (interval calculation) and the stage system run in parallel — both updated on each review.

Future: support SM-2 or FSRS as algorithm presets while keeping the stage layer unchanged.

---

## References

- [FSRS vs SM-2](https://memstride.com/blog/fsrs-vs-sm2-algorithm-comparison/) — why mean reversion beats ease hell
- [Anki algorithm](https://faqs.ankiweb.net/what-spaced-repetition-algorithm)
- [Duolingo strength model](https://speakada.com/anki-vs-duolingo-which-language-learning-app-really-works/)
