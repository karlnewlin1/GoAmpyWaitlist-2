# Frontend: FSD + Atomic
**FSD layers:** `app/`, `pages/`, `features/`, `entities/`, `shared/`.
**Atomic UI (in shared/ui):** atoms (Button, Chip, Input) → molecules (ChatBubble, StatChip, ProgressBar) → organisms (ChatPanel, ConsolePanel, ReferralCard, LeaderboardModal).
Pages are thin: wire layout + call feature APIs. SplitShell layout used by Landing/Tour/Dashboard.