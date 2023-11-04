import changelogFunctions from ".";
import parse from "@changesets/parse";
import { describe, expect, it, test, vi } from "vitest";

const { getReleaseLine } = changelogFunctions;

const repo = "dkshs/create-dk-app";

type ChangeData = {
  user: string;
  repo: string;
  commit: string;
  pull: number | null;
};
type IncludeOptions = {
  pr?: boolean;
  user?: boolean;
  commit?: boolean;
};

const changes: ChangeData[] = [
  {
    commit: "6623231",
    user: "dkshs",
    pull: 2,
    repo,
  },
  {
    commit: "6ce620e",
    user: "dkshs",
    pull: null,
    repo,
  },
];

vi.mock(
  "@changesets/get-github-info",
  (): typeof import("@changesets/get-github-info") => {
    return {
      async getInfo({ commit, repo }) {
        const data = changes.find((c) => c.commit === commit);
        if (!data) {
          throw Error(`No commit found`);
        }
        expect(commit).toBe(data.commit);
        expect(repo).toBe(data.repo);
        return {
          pull: data.pull,
          user: data.user,
          links: {
            user: `[@${data.user}](https://github.com/${data.user})`,
            pull:
              data.pull != null
                ? `[#${data.pull}](https://github.com/${data.repo}/pull/${data.pull})`
                : null,
            commit: `[\`${data.commit}\`](https://github.com/${data.repo}/commit/${data.commit})`,
          },
        };
      },
      async getInfoFromPullRequest({ pull, repo }) {
        const data = changes.find((c) => c.pull === pull);
        if (!data) {
          throw Error(`No pull request found`);
        }
        expect(pull).toBe(data.pull);
        expect(repo).toBe(data.repo);
        return {
          commit: data.commit,
          user: data.user,
          links: {
            user: `[@${data.user}](https://github.com/${data.user})`,
            pull: `[#${data.pull}](https://github.com/${data.repo}/pull/${data.pull})`,
            commit: `[\`${data.commit}\`](https://github.com/${data.repo}/commit/${data.commit})`,
          },
        };
      },
    };
  },
);

const getChangeset = (
  content: string,
  commit: string | undefined,
  exclude?: IncludeOptions,
) => {
  return [
    {
      ...parse(
        `---
  pkg: "minor"
  ---

  something
  ${content}
  `,
      ),
      id: "some-id",
      commit,
    },
    "minor",
    { repo, exclude },
  ] as const;
};

const changeData = changes[0];
const changeDataWithoutPullRequest = changes[1];

describe.each([changeData.commit, "wrongcommit", undefined])(
  "with commit from changeset of %s",
  (commitFromChangeset) => {
    describe.each(["pr", "pull request", "pull"])(
      "override pr with %s keyword",
      (keyword) => {
        test.each(["with #", "without #"] as const)("%s", async (kind) => {
          expect(
            await getReleaseLine(
              ...getChangeset(
                `${keyword}: ${kind === "with #" ? "#" : ""}${changeData.pull}`,
                commitFromChangeset,
              ),
            ),
          ).toEqual(
            `\n\n- [#2](https://github.com/dkshs/create-dk-app/pull/2) [\`6623231\`](https://github.com/dkshs/create-dk-app/commit/6623231) Thanks [@dkshs](https://github.com/dkshs)! - something\n`,
          );
        });
      },
    );
    it("overrides commit with commit keyword", async () => {
      expect(
        await getReleaseLine(
          ...getChangeset(`commit: ${changeData.commit}`, commitFromChangeset),
        ),
      ).toEqual(
        `\n\n- [#2](https://github.com/dkshs/create-dk-app/pull/2) [\`6623231\`](https://github.com/dkshs/create-dk-app/commit/6623231) Thanks [@dkshs](https://github.com/dkshs)! - something\n`,
      );
    });
  },
);

test("with multiple authors", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        ["author: @Andarist", "author: @mitchellhamilton"].join("\n"),
        changeData.commit,
      ),
    ),
  ).toMatchInlineSnapshot(`
    "
    
    - [#2](https://github.com/dkshs/create-dk-app/pull/2) [\`6623231\`](https://github.com/dkshs/create-dk-app/commit/6623231) Thanks [@Andarist](https://github.com/Andarist), [@mitchellhamilton](https://github.com/mitchellhamilton)! - something
    "
  `);
});

test("change without a pull release", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeDataWithoutPullRequest.commit),
    ),
  ).toMatchInlineSnapshot(`
    "
    
    - [\`6ce620e\`](https://github.com/dkshs/create-dk-app/commit/6ce620e) Thanks [@dkshs](https://github.com/dkshs)! - something
    "
  `);
});

test("change without a pull release, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeData.commit, { pr: true }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [\`6623231\`](https://github.com/dkshs/create-dk-app/commit/6623231) Thanks [@dkshs](https://github.com/dkshs)! - something
    "
  `);
});

test("change without a pull release and user", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeDataWithoutPullRequest.commit, {
        user: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [\`6ce620e\`](https://github.com/dkshs/create-dk-app/commit/6ce620e) - something
    "
  `);
});

test("change without a pull release and user, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeData.commit, {
        user: true,
        pr: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [\`6623231\`](https://github.com/dkshs/create-dk-app/commit/6623231) - something
    "
  `);
});

test("change with a pull release and without user", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeData.commit, { user: true }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#2](https://github.com/dkshs/create-dk-app/pull/2) [\`6623231\`](https://github.com/dkshs/create-dk-app/commit/6623231) - something
    "
  `);
});

test("change without a commit, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeData.commit, {
        commit: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#2](https://github.com/dkshs/create-dk-app/pull/2) Thanks [@dkshs](https://github.com/dkshs)! - something
    "
  `);
});

test("change without a commit and pull release, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeData.commit, {
        commit: true,
        pr: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - Thanks [@dkshs](https://github.com/dkshs)! - something
    "
  `);
});

test("change without a commit, pull release and user, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @dkshs", changeData.commit, {
        commit: true,
        pr: true,
        user: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - something
    "
  `);
});
