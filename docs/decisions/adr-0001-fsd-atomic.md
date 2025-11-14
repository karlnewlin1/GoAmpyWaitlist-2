# ADR-0001 FSD + Atomic
**Decision:** Use Feature‑Sliced Design for structure and Atomic Design for UI.  
**Why:** Co‑locate logic with features; scale without god files; predictable layering.  
**Impact:** Pages are thin; shared UI lives in `shared/ui` (atoms → molecules → organisms).