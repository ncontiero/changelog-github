import type { ChangelogFunctions } from "@changesets/types";

import { getCommitInfo, getPullRequestInfo } from "@changesets/get-github-info";

interface Options {
  repo: string;
  exclude?: {
    pr?: boolean;
    user?: boolean;
    commit?: boolean;
  };
  ignoreUsers?: string[];
}

const PULL_REQUEST_REGEX = /^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im;
const COMMIT_REGEX = /^\s*commit:\s*(\S+)/im;

function getRepo(options?: Options | null | Record<string, unknown>) {
  let repo: string | undefined;
  if (options && "repo" in options) {
    repo =
      typeof options.repo === "string" && options.repo
        ? options.repo
        : undefined;
  }

  if (!repo) {
    throw new Error(
      'Please provide a repo to this changelog generator like this:\n"changelog": ["@ncontiero/changelog-github", { "repo": "org/repo" }]',
    );
  }
  return repo;
}

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (
    changesets,
    dependenciesUpdated,
    options,
  ) => {
    const repo = getRepo(options);
    if (dependenciesUpdated.length === 0) return "";

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async (cs) => {
          if (cs.commit) {
            const info = await getCommitInfo({ repo, commit: cs.commit });
            return info?.commit.markdownLink ?? `\`${cs.commit.slice(0, 7)}\``;
          }
        }),
      )
    )
      .filter((_) => _)
      .join(", ")}]:`;

    const updatedDependenciesList = dependenciesUpdated.map(
      (dependency) => `  - ${dependency.name}@${dependency.newVersion}`,
    );

    return [changesetLink, ...updatedDependenciesList].join("\n");
  },
  getReleaseLine: async (changeset, _, opts) => {
    const options = opts as unknown as Options | undefined;
    const repo = getRepo(options);

    const { exclude } = options ?? {};
    const excludePr = exclude?.pr || false;
    const excludeUser = exclude?.user || false;
    const excludeCommit = exclude?.commit || false;

    const ignoreUsers = new Set(
      (options?.ignoreUsers || []).map((u) => u.toLowerCase()),
    );

    let prFromSummary: number | undefined;
    let commitFromSummary: string | undefined;
    const usersFromSummary = new Set<string>();

    const replacedChangelog = changeset.summary
      .replace(PULL_REQUEST_REGEX, (_, pr) => {
        const num = Number(pr);
        if (!Number.isNaN(num)) prFromSummary = num;
        return "";
      })
      .replace(COMMIT_REGEX, (_, commit) => {
        commitFromSummary = String(commit);
        return "";
      })
      .replaceAll(/^\s*(?:author|user):\s*@?(\S+)/gim, (_, user) => {
        usersFromSummary.add(String(user));
        return "";
      })
      .trim();

    const [firstLine, ...futureLines] = replacedChangelog
      .split("\n")
      .map((l) => l.trimEnd());

    let userLogin: string | undefined = undefined;
    const links: { commit?: string; pull?: string; user?: string } = {
      commit: undefined,
      pull: undefined,
      user: undefined,
    };

    const commitToFetchFrom = commitFromSummary || changeset.commit;
    if (prFromSummary != null) {
      const info = await getPullRequestInfo({ pull: prFromSummary, repo });
      links.commit = info?.commit?.markdownLink;
      links.pull = info?.pull.markdownLink;
      links.user = info?.author?.markdownLink;
      userLogin = info?.author?.login;

      if (commitFromSummary) {
        const shortCommitId = commitFromSummary.slice(0, 7);
        links.commit = `[\`${shortCommitId}\`](https://github.com/${repo}/commit/${commitFromSummary})`;
      }
    } else if (commitToFetchFrom) {
      const info = await getCommitInfo({ commit: commitToFetchFrom, repo });
      links.commit = info?.commit.markdownLink;
      links.pull = info?.pull?.markdownLink;
      links.user = info?.author?.markdownLink;
      userLogin = info?.author?.login;
    }

    let users: string | undefined = undefined;
    if (usersFromSummary.size > 0) {
      const usersToThank = Array.from(usersFromSummary).filter(
        (u) => !ignoreUsers.has(u.toLowerCase()),
      );
      if (usersToThank.length > 0) {
        users = usersToThank
          .map((u) => `[@${u}](https://github.com/${u})`)
          .join(", ");
      }
    } else if (userLogin && !ignoreUsers.has(userLogin.toLowerCase())) {
      users = links.user;
    }

    const parts: string[] = [];
    if (links.pull && !excludePr) parts.push(links.pull);
    if (links.commit && !excludeCommit) parts.push(links.commit);
    if (users && !excludeUser) parts.push(`Thanks ${users}!`);

    const prefix = parts.length > 0 ? `${parts.join(" ")} - ` : "";

    return `\n\n- ${prefix}${firstLine}\n${futureLines
      .map((l) => `  ${l}`)
      .join("\n")}`;
  },
};

export default changelogFunctions;
