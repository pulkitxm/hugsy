import { describe, expect, it } from "vitest";
import { hasValidPullRequestTitle } from "../scripts/check-pr-policy";

describe("pull request title policy", () => {
  it.each([
    "feat(registry): add stacked cards",
    "fix: preserve markdown route paths",
    "Add stacked-cards component with 200pt card height",
    'Fix failing GitHub Actions job "PR policy"',
    "[WIP] fix(ci): update workflow pin",
    '[WIP] Fix failing GitHub Actions job "PR policy"',
  ])("accepts %s", (title) => {
    expect(hasValidPullRequestTitle(title)).toBe(true);
  });

  it.each([
    "",
    "wip: update policy",
    "[WIP] wip: update policy",
    "release candidate",
    "feature add cards",
  ])("rejects %s", (title) => {
    expect(hasValidPullRequestTitle(title)).toBe(false);
  });
});
