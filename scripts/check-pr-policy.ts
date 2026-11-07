const conventionalPullRequestTitlePattern =
  /^(?:feat|fix|perf|refactor|test|docs|chore|ci|build|style|revert)(?:\([a-z0-9/-]+\))?!?: .+/;

const imperativePullRequestTitlePattern =
  /^(?:Add|Build|Bump|Chore|Document|Fix|Improve|Refactor|Remove|Revert|Test|Update)\b.+/;

const wipPrefixPattern = /^\[WIP\]\s+/i;

export function hasValidPullRequestTitle(title: string): boolean {
  const normalizedTitle = title.replace(wipPrefixPattern, "");
  return (
    conventionalPullRequestTitlePattern.test(normalizedTitle) ||
    imperativePullRequestTitlePattern.test(normalizedTitle)
  );
}
