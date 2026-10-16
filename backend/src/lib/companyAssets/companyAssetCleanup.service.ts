/**
 * Best-effort cleanup of all registered company Storage folders on company delete.
 * Never throws — failures are recorded in the summary and logged by the caller.
 */

import { supabaseAdmin } from "../../config/supabase";
import {
  getCompanyAssetFolder,
  REGISTERED_COMPANY_ASSET_BUCKETS,
  type RegisteredCompanyAssetBucket,
} from "./companyAssetPaths";

export type CompanyAssetBucketCleanupStatus = "cleaned" | "empty" | "failed";

export type CompanyAssetBucketCleanupResult = {
  bucket: RegisteredCompanyAssetBucket | string;
  status: CompanyAssetBucketCleanupStatus;
  removedCount: number;
  error?: string;
};

export type CompanyAssetCleanupSummary = {
  companyId: string;
  buckets: CompanyAssetBucketCleanupResult[];
};

const LIST_PAGE_SIZE = 100;

function isMissingBucketOrFolder(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("not found") ||
    m.includes("does not exist") ||
    m.includes("bucket not found") ||
    m.includes("no such file") ||
    m.includes("404")
  );
}

/**
 * Delete every object under `<bucket>/<company_id>/`.
 * Empty / missing folders → status `empty`. Errors → `failed` (non-throwing).
 */
async function cleanupBucketFolder(
  bucket: string,
  companyId: string
): Promise<CompanyAssetBucketCleanupResult> {
  const folder = getCompanyAssetFolder(companyId);
  let removedCount = 0;

  try {
    // Paginate until the folder is empty (or missing).
    for (let page = 0; page < 50; page += 1) {
      const { data, error } = await supabaseAdmin.storage.from(bucket).list(folder, {
        limit: LIST_PAGE_SIZE,
        offset: page * LIST_PAGE_SIZE,
      });

      if (error) {
        if (isMissingBucketOrFolder(error.message)) {
          return { bucket, status: "empty", removedCount: 0 };
        }
        return {
          bucket,
          status: "failed",
          removedCount,
          error: error.message,
        };
      }

      const entries = data ?? [];
      if (entries.length === 0) {
        return {
          bucket,
          status: removedCount > 0 ? "cleaned" : "empty",
          removedCount,
        };
      }

      // Only remove files; nested folders are rare for logos but remove by path if present as placeholders
      const paths = entries
        .filter((e) => e.name && !e.name.endsWith("/"))
        .map((e) => `${folder}/${e.name}`);

      if (paths.length === 0) {
        return {
          bucket,
          status: removedCount > 0 ? "cleaned" : "empty",
          removedCount,
        };
      }

      const { error: removeErr } = await supabaseAdmin.storage.from(bucket).remove(paths);
      if (removeErr) {
        if (isMissingBucketOrFolder(removeErr.message)) {
          return { bucket, status: removedCount > 0 ? "cleaned" : "empty", removedCount };
        }
        return {
          bucket,
          status: "failed",
          removedCount,
          error: removeErr.message,
        };
      }
      removedCount += paths.length;

      if (entries.length < LIST_PAGE_SIZE) {
        break;
      }
    }

    return {
      bucket,
      status: removedCount > 0 ? "cleaned" : "empty",
      removedCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isMissingBucketOrFolder(message)) {
      return { bucket, status: "empty", removedCount };
    }
    return { bucket, status: "failed", removedCount, error: message };
  }
}

/**
 * Iterate all registered company asset buckets and wipe this company's folder.
 */
export async function cleanupCompanyAssets(
  companyId: string,
  buckets: readonly string[] = REGISTERED_COMPANY_ASSET_BUCKETS
): Promise<CompanyAssetCleanupSummary> {
  const id = companyId.trim();
  const results: CompanyAssetBucketCleanupResult[] = [];

  for (const bucket of buckets) {
    results.push(await cleanupBucketFolder(bucket, id));
  }

  return { companyId: id, buckets: results };
}

/** Human-readable multiline summary for logs / audit metadata. */
export function formatCompanyAssetCleanupSummary(
  summary: CompanyAssetCleanupSummary
): string {
  const lines = ["Storage Cleanup"];
  for (const b of summary.buckets) {
    if (b.status === "cleaned") {
      lines.push(`✓ ${b.bucket}`);
    } else if (b.status === "empty") {
      lines.push(`✓ ${b.bucket} (empty)`);
    } else {
      lines.push(`✗ ${b.bucket}${b.error ? `: ${b.error}` : ""}`);
    }
  }
  return lines.join("\n");
}
