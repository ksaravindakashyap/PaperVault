import { z } from "zod";

export const VenueTypeEnum = z.enum([
  "ACL",
  "NEURIPS",
  "ICML",
  "ICLR",
  "EMNLP",
  "NAACL",
  "USENIX_SECURITY",
  "CCS",
  "NDSS",
  "CHI",
  "IEEE_GENERIC",
  "OTHER",
]);

export const PaperStatusEnum = z.enum([
  "PROCESSING",
  "READY",
  "FAILED",
  "TO_READ",
  "SKIMMED",
  "DEEP_READ",
  "INTEGRATED",
]);

export const uploadPaperSchema = z.object({
  venueType: VenueTypeEnum,
  file: z.custom<File>((val) => val instanceof File, "File is required"),
});

export const updateSummarySchema = z.object({
  summary: z.string().max(50000, "Summary must be less than 50,000 characters"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  notes: z.string().max(100000, "Notes must be less than 100,000 characters").optional().nullable(),
});

export const addPaperToProjectSchema = z.object({
  paperId: z.string().cuid(),
});

export const updatePaperStatusSchema = z.object({
  status: PaperStatusEnum,
});

export const TodoStatusEnum = z.enum(["OPEN", "DONE"]);

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(140, "Title must be less than 140 characters"),
  dueDate: z.string().datetime({ message: "Due date is required and must be a valid date" }),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(140, "Title must be less than 140 characters").optional(),
  dueDate: z.string().datetime({ message: "Due date must be a valid date" }).optional(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().nullable(),
  status: TodoStatusEnum.optional(),
});

export const WorkspaceRoleEnum = z.enum(["OWNER", "ADMIN", "MEMBER"]);

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be less than 200 characters"),
});

export const createWorkspaceInviteSchema = z.object({
  workspaceId: z.string().cuid(),
  role: WorkspaceRoleEnum.optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

export const joinWorkspaceSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const setActiveWorkspaceSchema = z.object({
  workspaceId: z.string().cuid(),
});

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  if (file.type !== "application/pdf") {
    return { valid: false, error: "File must be a PDF" };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 25MB" };
  }
  return { valid: true };
}
