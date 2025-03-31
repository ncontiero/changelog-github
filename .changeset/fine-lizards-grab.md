---
"@dkshs/changelog-github": major
---

refactor: move project from `@dkshs/changelog-github` to `@ncontiero/changelog-github`

- To migrate, run the following command with your package manager:

`npm rm @dkshs/changelog-github && npm i -D @ncontiero/changelog-github`

```diff
{
-  "changelog": ["@dkshs/changelog-github"],
+  "changelog": ["@ncontiero/changelog-github"],
}
```
