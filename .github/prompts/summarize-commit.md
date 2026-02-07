---
model: GPT-5 mini
---

# Workflow: Summarize and Commit Changes

1.  **Read Changes**
    - Get changes with `git diff --staged` or `git diff` (if no staged change). If both empty, report "No changes to summarize" and stop.

2.  **Generate Commit Message**
    - Review the diff and generate a Conventional Commit message (e.g., `feat(xxx):`, `fix:`), using a single line no longer than 50 characters.
    - For simple changes, provide a concise summary highlighting key updates and omitting trivial details.
    - For complex changes over 300 lines, add a body section with up to 3 bullet points. Wrap lines at 72 characters.

3.  **Commit**
    - Execute `git commit` with the message.
