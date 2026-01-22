import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function writePdf(
  paperId: string,
  buffer: Buffer
): Promise<string> {
  await ensureUploadDir();
  const fileName = `${paperId}.pdf`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  await fs.writeFile(filePath, buffer);
  return `data/uploads/${fileName}`;
}

export async function readPdf(fileKey: string): Promise<Buffer> {
  const filePath = path.join(process.cwd(), fileKey);
  return await fs.readFile(filePath);
}

export async function fileExists(fileKey: string): Promise<boolean> {
  try {
    const filePath = path.join(process.cwd(), fileKey);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
