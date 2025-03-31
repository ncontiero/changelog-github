# @ncontiero/changelog-github

## @dkshs/changelog-github

### 2.0.0

#### Major Changes

- [`1d1ccde`](https://github.com/ncontiero/changelog-github/commit/1d1ccde72beb805b0e2480e59bdc8113a99fc311) - refactor: move project from `@dkshs/changelog-github` to `@ncontiero/changelog-github`

  - To migrate, run the following command with your package manager:

  `npm rm @dkshs/changelog-github && npm i -D @ncontiero/changelog-github`

  ```diff
  {
  -  "changelog": ["@dkshs/changelog-github"],
  +  "changelog": ["@ncontiero/changelog-github"],
  }
  ```

### 1.0.6

#### Patch Changes

- [`b4055d2`](https://github.com/dkshs/changelog-github/commit/b4055d2e3185f307f8fd2ee156f10f49b5425935) - chore: format code

### 1.0.5

#### Patch Changes

- [`4ce3292`](https://github.com/dkshs/changelog-github/commit/4ce329215bfe90640df55f573715131b2c9e6fc7) - update(deps): bump tsup to 8.0.2

- [`d72e929`](https://github.com/dkshs/changelog-github/commit/d72e9291dd2938134d0308cd60ab709048db347e) - update(deps): bump dotenv to 16.4.5

### 1.0.4

#### Patch Changes

- [`e47a627`](https://github.com/dkshs/changelog-github/commit/e47a62715127c7c960cd1e41f097b624a5721a7f) - update: changing from `commonjs` to `module`.

- [`ee640aa`](https://github.com/dkshs/changelog-github/commit/ee640aa6d641285c9041449eaa1ba0e848151c98) - fix: `repo` option not found error.

### 1.0.3

#### Patch Changes

- [`cff3ec2`](https://github.com/dkshs/changelog-github/commit/cff3ec2f12b86ced6d3c3268fb1e2affc29707f5) - update(deps): bump @changesets/get-github-info from 0.5.2 to 0.6.0.

### 1.0.2

#### Patch Changes

- [`6722b04`](https://github.com/dkshs/changelog-github/commit/6722b0463c4bf02c87f600edc17d35577daa0c53) - fix(docs): formatting of codes blocks in README.

### 1.0.1

#### Patch Changes

- [`c64a60b`](https://github.com/dkshs/changelog-github/commit/c64a60b5ce02ed2cb39d6158e1f2e97abde24cc5) - update(docs): updating the readme to follow the new main version.

### 1.0.0

#### Major Changes

- [`3de0729`](https://github.com/dkshs/changelog-github/commit/3de072970dc5a322b2748eeb53996db64bd1b5d4) - feat: removing the `notUser` option in favor of the `exclude` object.

- [`3de0729`](https://github.com/dkshs/changelog-github/commit/3de072970dc5a322b2748eeb53996db64bd1b5d4) - feat: adding option to remove pull release, commit and user within the `exclude` option.
