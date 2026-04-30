# Version Control Setup for Dynamic Form Builder System

## Overview
This repository is already initialized with Git and has `origin` configured as `https://github.com/dang232/TopCV`. The current branch is `main`. This document records the active version-control expectations for the pnpm workspace.

## Repository Checks

Use these commands from the project root when reviewing local state:

```bash
git status
git remote -v
git branch --show-current
```

## Ignore Rules

The workspace should ignore generated dependencies, build output, local caches, and private environment files. Recommended Node/workspace entries:

```gitignore
node_modules/
**/node_modules/
dist/
**/dist/
.next/
coverage/
.env
.env.*
!.env.example
```

Do not commit secrets from local `.env` files. Keep safe templates in `.env.example`.

## Daily Workflow

1. **Check local changes**
   ```bash
   git status
   ```
2. **Review diffs before staging**
   ```bash
   git diff
   ```
3. **Stage only relevant files**
   ```bash
   git add <paths>
   ```
4. **Commit with a focused message**
   ```bash
   git commit -m "docs: align documentation with forms implementation"
   ```
5. **Push the current branch when ready**
   ```bash
   git push -u origin main
   ```

## Conclusion
Keep commits small and review generated/untracked files carefully, especially workspace `node_modules`, `dist`, and local environment files.

---

*Reviewed on 2026-04-30.*