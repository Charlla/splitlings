# Splitlings — Claude Code Instructions

> 📚 **Canonical patterns live in the BAB framework.** Read these first:
> - `/home/charl/code/bab/knowledge/auth.md` — OTP sign-in
> - `/home/charl/code/bab/knowledge/design-systems.md` — games UI components
> - `/home/charl/code/bab/knowledge/security.md` — HumanVerify + headers
> - `/home/charl/code/bab/knowledge/conventions.md` — cross-cutting rules

Splitlings is a tap-to-split orb defence arcade game. BAB slug: `splitlings` |
Table prefix: `splitlings_` | Domain: `splitlings.com`.

## Key rules

- **Auth**: OTP-only email sign-in via the canonical module. Cookie:
  `splitlings_session`. HumanVerify HMAC token required.
- **Single-player**: no online multiplayer.
- **Profile**: `splitlings_players.display_name` captured when needed (leaderboard).
- **Design system**: games — `components/games/`. Glassmorphic vibe.
  Accent cyan `#3aa8ff`, accent-2 magenta `#c061ff`.
- **HUD**: canvas-drawn (not DOM); always-visible `≡ Menu` button (top-right)
  opens the pause overlay. Hold-anywhere still works as a fallback gesture.
- **Mobile-first** + inputs ≥16px via globals.css `!important`.

@AGENTS.md
