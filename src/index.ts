import type { ChangelogFunctions } from "@changesets/types";

import { getInfo, getInfoFromPullRequest } from "@changesets/get-github-info";

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

const changelogFunctions: ChangelogFunctions = {
  getDependencyReleaseLine: async (
    changesets,
    dependenciesUpdated,
    options?: Options,
  ) => {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@ncontiero/changelog-github", { "repo": "org/repo" }]',
      );
    }
    if (dependenciesUpdated.length === 0) return "";

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async (cs) => {
          if (cs.commit) {
            const { links } = await getInfo({
              repo: options.repo,
              commit: cs.commit,
            });
            return links.commit;
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
    const options = opts as Options | undefined;
    const repo = options?.repo;
    if (!options || !repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@ncontiero/changelog-github", { "repo": "org/repo" }]',
      );
    }

    const { exclude } = options;
    const excludePr = exclude?.pr || false;
    const excludeUser = exclude?.user || false;
    const excludeCommit = exclude?.commit || false;

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

    const { links, userLogin } = await (async () => {
      if (prFromSummary !== undefined) {
        let { links, user } = await getInfoFromPullRequest({
          repo,
          pull: prFromSummary,
        });
        if (commitFromSummary) {
          const shortCommitId = commitFromSummary.slice(0, 7);
          links = {
            ...links,
            commit: `[\`${shortCommitId}\`](https://github.com/${repo}/commit/${commitFromSummary})`,
          };
        }
        return { links, userLogin: user };
      }
      const commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        const { links, user } = await getInfo({
          repo,
          commit: commitToFetchFrom,
        });
        return { links, userLogin: user };
      }
      return {
        links: {
          commit: null,
          pull: null,
          user: null,
        },
        userLogin: null,
      };
    })();

    const ignoreUsers = new Set(
      (options.ignoreUsers || []).map((u) => u.toLowerCase()),
    );

    let users: string | null = null;
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

    const parts = [];
    if (links.pull !== null && !excludePr) parts.push(links.pull);
    if (links.commit !== null && !excludeCommit) parts.push(links.commit);
    if (users !== null && !excludeUser) parts.push(`Thanks ${users}!`);

    const prefix = parts.length > 0 ? `${parts.join(" ")} - ` : "";

    return `\n\n- ${prefix}${firstLine}\n${futureLines
      .map((l) => `  ${l}`)
      .join("\n")}`;
  },
};

export default changelogFunctions;
