import type { CommitInfo, PullRequestInfo } from "@changesets/get-github-info";
import { parseChangesetFile as parse } from "@changesets/parse";
import { describe, expect, it, vi } from "vitest";
import changelogFunctions from ".";

const { getReleaseLine } = changelogFunctions;

const repo = "ncontiero/dkcutter";

interface ChangeData {
  author: string;
  repo: string;
  commit: string;
  pull: number | null;
}
interface ExcludeOptions {
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
}

const changes: ChangeData[] = [
  {
    commit: "bf8e488",
    author: "ncontiero",
    pull: 134,
    repo,
  },
  {
    commit: "3ccbd2c",
    author: "ncontiero",
    pull: null,
    repo,
  },
];

vi.mock(
  "@changesets/get-github-info",
  (): typeof import("@changesets/get-github-info") => {
    const urls = {
      commit: (data: ChangeData) =>
        `https://github.com/${data.repo}/commit/${data.commit}`,
      pull: (data: ChangeData) =>
        `https://github.com/${data.repo}/pull/${data.pull}`,
      author: (data: ChangeData) => `https://github.com/${data.author}`,
    };

    return {
      async getCommitInfo({ commit, repo }): Promise<CommitInfo> {
        const data = changes.find((c) => c.commit === commit);
        if (!data) {
          throw new Error(`No commit found`);
        }
        expect(commit).toBe(data.commit);
        expect(repo).toBe(data.repo);

        return Promise.resolve({
          commit: {
            sha: data.commit,
            url: urls.commit(data),
            markdownLink: `[\`${data.commit}\`](${urls.commit(data)})`,
          },
          author: {
            login: data.author,
            url: urls.author(data),
            markdownLink: `[@${data.author}](${urls.author(data)})`,
          },
          pull:
            data.pull != null
              ? {
                  number: data.pull,
                  url: urls.pull(data),
                  markdownLink: `[#${data.pull}](${urls.pull(data)})`,
                }
              : undefined,
        });
      },
      async getPullRequestInfo({ pull, repo }): Promise<PullRequestInfo> {
        const data = changes.find((c) => c.pull === pull);
        if (!data || data.pull == null) {
          throw new Error(`No pull request found`);
        }
        expect(pull).toBe(data.pull);
        expect(repo).toBe(data.repo);
        return Promise.resolve({
          commit: {
            sha: data.commit,
            url: urls.commit(data),
            markdownLink: `[\`${data.commit}\`](${urls.commit(data)})`,
          },
          author: {
            login: data.author,
            url: urls.author(data),
            markdownLink: `[@${data.author}](${urls.author(data)})`,
          },
          pull: {
            number: data.pull,
            url: urls.pull(data),
            markdownLink: `[#${data.pull}](${urls.pull(data)})`,
          },
        });
      },
    };
  },
);

const getChangeset = (
  content: string,
  commit: string | undefined,
  exclude?: ExcludeOptions,
  ignoreUsers?: string[],
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
    { repo, exclude, ignoreUsers },
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
        it.each(["with #", "without #"] as const)("%s", async (kind) => {
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

it("with multiple authors", async () => {
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

it("change without a pull release", async () => {
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

it("change without a pull release, exclude option", async () => {
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

it("change without a pull release and user", async () => {
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

it("change without a pull release and user, exclude option", async () => {
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

it("change with a pull release and without user", async () => {
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

it("change without a commit, exclude option", async () => {
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

it("change without a commit and pull release, exclude option", async () => {
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

it("change without a commit, pull release and user, exclude option", async () => {
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

it("override pr, commit, and author simultaneously", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        ["pr: #134", "commit: 5d18840", "author: @ncontiero"].join("\n"),
        undefined,
      ),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`5d18840\`](https://github.com/ncontiero/dkcutter/commit/5d18840) Thanks [@ncontiero](https://github.com/ncontiero)! - something
    "
  `);
});

it("override with user keyword instead of author", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("user: @ncontiero", changeData.commit),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) Thanks [@ncontiero](https://github.com/ncontiero)! - something
    "
  `);
});

it("ignoreUsers excludes the author from getInfo", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("", changeData.commit, undefined, ["ncontiero"]),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) - something
    "
  `);
});

it("ignoreUsers excludes the author from summary override", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @ncontiero", changeData.commit, undefined, [
        "ncontiero",
      ]),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) - something
    "
  `);
});

it("ignoreUsers excludes only the ignored author when multiple exist", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset(
        ["author: @ncontiero", "author: @someone"].join("\n"),
        changeData.commit,
        undefined,
        ["ncontiero"],
      ),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) Thanks [@someone](https://github.com/someone)! - something
    "
  `);
});

it("ignoreUsers is case-insensitive", async () => {
  expect(
    await getReleaseLine(
      ...getChangeset("author: @NContiero", changeData.commit, undefined, [
        "ncontiero",
      ]),
    ),
  ).toMatchInlineSnapshot(`
    "

    - [#134](https://github.com/ncontiero/dkcutter/pull/134) [\`bf8e488\`](https://github.com/ncontiero/dkcutter/commit/bf8e488) - something
    "
  `);
});
