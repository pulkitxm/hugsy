import type { Result } from "lighthouse";

export type FormFactor = "mobile" | "desktop";

export type AuditJob = {
  url: string;
  formFactor: FormFactor;
  categories: string[];
  reportPath: string;
};

export type WorkerReply = { ready: true } | { lhr: Result } | { error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isAuditJob(value: unknown): value is AuditJob {
  return (
    isRecord(value) &&
    typeof value["url"] === "string" &&
    (value["formFactor"] === "mobile" || value["formFactor"] === "desktop") &&
    Array.isArray(value["categories"]) &&
    typeof value["reportPath"] === "string"
  );
}

export function isWorkerReply(value: unknown): value is WorkerReply {
  return (
    isRecord(value) &&
    (value["ready"] === true || typeof value["error"] === "string" || isRecord(value["lhr"]))
  );
}
