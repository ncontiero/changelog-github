<div align="center">

# `@ncontiero/changelog-github`

**A custom changelog entry generator for [Changesets](https://github.com/changesets/changesets)**

Generates GitHub release notes with links to commits, pull requests, and authors, featuring advanced exclusion options and summary overrides.

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@ncontiero/changelog-github?color=7c3aed&name=true)](https://npmx.dev/package/@ncontiero/changelog-github)
[![Open License](https://npmx.dev/api/registry/badge/license/@ncontiero/changelog-github?color=7c3aed)](https://github.com/ncontiero/changelog-github/blob/main/LICENSE)

</div>

## Getting Started

First, install the package:

```bash
npm i --save-dev @ncontiero/changelog-github
```

Then, add it to your `.changeset/config.json`:

```json
{
  "changelog": [
    "@ncontiero/changelog-github",
    {
      "repo": "<org>/<repo>"
    }
  ]
}
```

## Configuration

You can customize the generated changelog by providing an `exclude` object. This is useful if you want to keep your changelogs cleaner by removing pull requests, commits, or author mentions.

```json
{
  "changelog": [
    "@ncontiero/changelog-github",
    {
      "repo": "<org>/<repo>",
      "exclude": {
        "user": true,
        "pr": true,
        "commit": true
      }
    }
  ]
}
```

_Note: All keys inside `exclude` are optional and default to `false`._

You can also use the `ignoreUsers` array to exclude specific usernames from being thanked. This is perfect for single-maintainer packages or bots where you don't need a "Thanks..." message for yourself, but still want to thank external contributors.

```json
{
  "changelog": [
    "@ncontiero/changelog-github",
    {
      "repo": "<org>/<repo>",
      "ignoreUsers": ["your-username", "renovate[bot]"]
    }
  ]
}
```

## Advanced Usage (Overrides)

You can manually override the PR, commit, or user directly from the changeset summary text! Just include them in your changeset markdown:

```markdown
---
"my-package": patch
---

pr: #42
commit: 7c3aed7
author: @ncontiero

Fixed an annoying bug that crashed the app.
```

## Example Output

By default (without exclusions), a changeset entry will be formatted like this in your `CHANGELOG.md`:

> - [#42](https://github.com/org/repo/pull/42) [`7c3aed7`](https://github.com/org/repo/commit/7c3aed7) Thanks [@ncontiero](https://github.com/ncontiero)! - Fixed an annoying bug that crashed the app.
