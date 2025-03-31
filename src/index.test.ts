import parse from "@changesets/parse";
import { describe, expect, it, test, vi } from "vitest";
import changelogFunctions from ".";

const { getReleaseLine } = changelogFunctions;

const repo = "ncontiero/dkcutter";

type ChangeData = {
  user: string;
  repo: string;
  commit: string;
  pull: number | null;
};
type ExcludeOptions = {
  /**
   * Exclude the PR from the release line.
   * @default false
   */
  pr?: boolean;
  /**
   * Exclude the user from the release line.
   * @default false
   */
  user?: boolean;
  /**
   * Exclude the commit from the release line.
   * @default false
   */
  commit?: boolean;
};

const changes: ChangeData[] = [
  {
    commit: "bf8e488",
    user: "ncontiero",
    pull: 134,
    repo,
  },
  {
    commit: "3ccbd2c",
    user: "ncontiero",
    pull: null,
    repo,
  },
];

vi.mock(
  "@changesets/get-github-info",
  (): typeof import("@changesets/get-github-info") => {
    return {
      // eslint-disable-next-line require-await
      async getInfo({ commit, repo }) {
        const data = changes.find((c) => c.commit === commit);
        if (!data) {
          throw new Error(`No commit found`);
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
      // eslint-disable-next-line require-await
      async getInfoFromPullRequest({ pull, repo }) {
        const data = changes.find((c) => c.pull === pull);
        if (!data) {
          throw new Error(`No pull request found`);
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
  exclude?: ExcludeOptions,
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
            `\n\n- [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) Thanks [@ncontiero](https://github.com/ncontiero)! - something\n`,
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
        `\n\n- [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) Thanks [@ncontiero](https://github.com/ncontiero)! - something\n`,
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
    
    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) Thanks [@Andarist](https://github.com/Andarist), [@mitchellhamilton](https://github.com/mitchellhamilton)! - something
    "
  `);
});

test("change without a pull release", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        "author: @ncontiero",
        changeDataWithoutPullRequest.commit,
      ),
    ),
  ).toMatchInlineSnapshot(`
    "
    
    - [\`3ccbd2c\`](https://github.com/ncontiero/dkcutter/commit/3ccbd2c) Thanks [@ncontiero](https://github.com/ncontiero)! - something
    "
  `);
});

test("change without a pull release, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, { pr: true }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) Thanks [@ncontiero](https://github.com/ncontiero)! - something
    "
  `);
});

test("change without a pull release and user", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        "author: @ncontiero",
        changeDataWithoutPullRequest.commit,
        {
          user: true,
        },
      ),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [\`3ccbd2c\`](https://github.com/ncontiero/dkcutter/commit/3ccbd2c) - something
    "
  `);
});

test("change without a pull release and user, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, {
        user: true,
        pr: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) - something
    "
  `);
});

test("change with a pull release and without user", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, { user: true }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) - something
    "
  `);
});

test("change without a commit, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, {
        commit: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) Thanks [@ncontiero](https://github.com/ncontiero)! - something
    "
  `);
});

test("change without a commit and pull release, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, {
        commit: true,
        pr: true,
      }),
    ),
  ).toMatchInlineSnapshot(`
    "

    - Thanks [@ncontiero](https://github.com/ncontiero)! - something
    "
  `);
});

test("change without a commit, pull release and user, exclude option", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, {
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
