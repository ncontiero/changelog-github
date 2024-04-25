<div align="center">

# `@dkshs/changelog-github`

A changelog entry generator for [changeset](https://github.com/changesets/changesets) on GitHub with links to commits, PRs, and optionally users.

[![license mit](https://img.shields.io/badge/licence-MIT-7c3aed)](https://github.com/dkshs/changelog-github/blob/master/LICENSE)
[![NPM version][npm-image]][npm-url]

</div>

[npm-url]: https://www.npmjs.com/package/@dkshs/changelog-github
[npm-image]: https://img.shields.io/npm/v/@dkshs/changelog-github?color=7c3aed&logoColor=7c3aed

## Getting Started

First Install the package:

```bash
npm i --save-dev @dkshs/changelog-github
```

And use it on `.changeset/config.json`:

```json
{
  // ...
  "changelog": [
    "@dkshs/changelog-github", { "repo": "<org>/<repo>" }
  ]
  // ...
}
```

There is also an optional option, which is `exclude`, an object and can have the `user`,`pr` and `commit` keys and their values being boolean.

```json
{
  // ...
  "changelog": [
    "@dkshs/changelog-github",
    {
      "repo": "<org>/<repo>",
      "exclude": { "user": true }
    }
  ]
  // ...
}
```

This option does not add the comment: "Thanks <@user>!".

And you can use to remove the pull releases:

```json
{
  // ...
  "changelog": [
    "@dkshs/changelog-github",
    {
      "repo": "<org>/<repo>",
      "exclude": { "pr": true }
    }
  ]
  // ...
}
```

And to remove the commits:

```json
{
  // ...
  "changelog": [
    "@dkshs/changelog-github",
    {
      "repo": "<org>/<repo>",
      "exclude": { "commit": true }
    }
  ]
  // ...
}
```
