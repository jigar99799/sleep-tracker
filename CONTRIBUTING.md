# Contributing

This repository is public. Reading or forking it does not grant permission to push changes to this repository.

## Submit a Change

1. Fork the repository into your GitHub account. Collaborators with write access can instead create a feature branch in this repository.
2. Create a branch such as `fix/awake-timer` or `feature/habit-history`. Do not push to `main`.
3. Keep the change focused. Do not add personal backup data, credentials, analytics, or paid service dependencies.
4. Using Node.js 22 or later, run:

   ```sh
   npm ci
   npm test
   npm run build
   ```

5. Include focused tests for behavior changes. For UI changes, check mobile and desktop layouts. Do not claim that phone inactivity proves sleep or that this diary is medically validated.
6. Push your feature branch to your fork, then open a pull request targeting `jigar99799/sleep-tracker:main`.
7. Describe the problem, the change, and how you tested it. Wait for review by `@jigar99799` and resolve review comments.

The owner decides whether to approve and merge a contribution. Opening a pull request does not grant merge or write access.

## Main Branch Rules

An active GitHub ruleset applies to `refs/heads/main`:

- Non-bypass users cannot directly update, delete, or force-push `main`.
- Pull requests require an approval, code-owner review when the CODEOWNERS file is published on the base branch, and resolved review conversations. New commits dismiss stale approvals.
- Updating `main`, including merging a pull request, is restricted to bypass actors. The repository owner performs merges after review.
- Repository administrators have an always-on bypass, so the owner can still push directly and merge without approving their own pull request. Currently `@jigar99799` is the only administrator. Granting another person Admin access would grant the same bypass and the ability to change protections. Do not grant that role if you want owner-only control.

The `update` restriction controls who can update `main`; CODEOWNERS alone is not a security boundary. Public users normally contribute through forks because they do not have permission to create branches in this repository.

## Ruleset Configuration

The ruleset definition is recorded in `.github/rulesets/main.json`. Enforcement is a GitHub repository setting, not something activated merely by committing this JSON file. Administrators can inspect it under **Settings > Rules > Rulesets**.

Only an authenticated repository administrator should apply changes to the remote ruleset. GitHub changes are independent of local commits; do not create duplicate rulesets when updating an existing one. Publishing CODEOWNERS and this guide requires committing and pushing these files.