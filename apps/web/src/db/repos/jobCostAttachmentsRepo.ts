import type { BaseRow } from "@/db/types/base";
import { makeRepo } from "./repoFactory";

export type JobCostAttachmentRow = BaseRow & {
  jobCostEntryId: string;
  fileName: string;
  mimeType: string;
  fileSize?: number | null;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
};

export const jobCostAttachmentsRepo = makeRepo<JobCostAttachmentRow>("jobCostAttachments");
