---
phase: 02-search-and-config-history-ux
plan: 03
subsystem: consulta
tags: [metrics, delta, baseline, history]
requires: [HIST-02, HIST-03, CONF-03]
provides:
  - baseline resolution for selected terms
  - compact delta pills in the consulta card
  - explicit baseline provenance messaging
affects: [consulta, configuracao, persistence]
tech-stack:
  added: []
  patterns: [baseline fallback, delta visualization]
key-files:
  created: []
  modified: [lib/radar-history.ts, hooks/use-radar-dashboard.ts, components/dashboard/search-panel.tsx, components/dashboard/index.tsx]
key-decisions:
  - "Use previous term selection as primary baseline and config snapshots as fallback"
  - "Keep delta visualization small and embedded inside the analysis card rather than adding another major panel"
patterns-established:
  - "Historical comparisons must explain baseline provenance in UI"
requirements-completed: [HIST-02, HIST-03]
duration: 20min
completed: 2026-03-31
---

# Phase 2: Search and Config History UX Summary

**Plan 02-03 delivered contextual metric deltas for the selected term with explicit baseline provenance**

## Accomplishments

- Added baseline resolution that prefers previous term selections and falls back to config snapshots
- Calculated deltas for score, posição, CTR, cliques and impressões from persisted historical captures
- Embedded compact delta pills inside the Consulta analysis card
- Added provenance text so the user knows whether the comparison comes from history or config snapshot

## Files Created/Modified

- `lib/radar-history.ts`
- `hooks/use-radar-dashboard.ts`
- `components/dashboard/search-panel.tsx`
- `components/dashboard/index.tsx`

## Verification

- `pnpm exec tsc --noEmit`
- `pnpm build`

## Notes

- Position deltas invert the semantic direction so improvements read as positive even when the numeric position decreases.
