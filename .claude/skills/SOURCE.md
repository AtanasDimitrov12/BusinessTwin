Vendored from https://github.com/emilkowalski/skills at commit c8a79627b59d72d764d6ab6f2c87c09a48169833 (MIT).
Reviewed 2026-11-06: markdown only, no scripts, hooks or tool grants. Skipped write-swift and animate-expo (not relevant to the web app).

Added 2026-11-15:
- frontend-design: from https://github.com/anthropics/skills (commit 1780c5e), Apache 2.0. Markdown only.
- impeccable: from https://github.com/pbakaus/impeccable (commit 2b86d9c, v4.9.1), Apache 2.0. Only SKILL.md and reference/*.md are vendored.
  The scripts/ folder is deliberately left out: its launcher downloads and runs a prebuilt binary, and the skill can
  install an auto-running hook. Without them the skill uses its documented "Launcher unavailable" fallback.
