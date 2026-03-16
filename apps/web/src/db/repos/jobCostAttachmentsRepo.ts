import type { BaseRow } from "@/db/types/base";
import { makeRepo } from "../makeRepo";

export type JobCostAttachmentRow = BaseRow & {
  jobCostEntryId: string;
  fileName: string;
  mimeType: string;
  storageType: "inline" | "local" | "remote";
  fileDataBase64?: string | null;
  fileUrl?: string | null;
  thumbnailBase64?: string | null;
};

export const jobCostAttachmentsRepo = makeRepo<JobCostAttachmentRow>("jobCostAttachments");
