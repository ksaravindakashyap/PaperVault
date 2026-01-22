import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writePdf } from "@/lib/storage";
import { VenueTypeEnum, validatePdfFile } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const venueType = formData.get("venueType") as string | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { message: "File is required" },
        { status: 400 }
      );
    }

    if (!venueType) {
      return NextResponse.json(
        { message: "Venue type is required" },
        { status: 400 }
      );
    }

    // Validate venue type
    const venueTypeValidation = VenueTypeEnum.safeParse(venueType);
    if (!venueTypeValidation.success) {
      return NextResponse.json(
        { message: "Invalid venue type" },
        { status: 400 }
      );
    }

    // Validate PDF file
    const fileValidation = validatePdfFile(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { message: fileValidation.error },
        { status: 400 }
      );
    }

    // Create paper record first to get ID
    const paper = await db.paper.create({
      data: {
        originalFileName: file.name,
        venueType: venueTypeValidation.data,
        fileKey: "", // Will be updated after file write
        status: "PROCESSING",
      },
    });

    try {
      // Write file to disk
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileKey = await writePdf(paper.id, buffer);

      // Update paper with file key
      await db.paper.update({
        where: { id: paper.id },
        data: { fileKey },
      });

      return NextResponse.json({
        id: paper.id,
        status: paper.status,
      });
    } catch (fileError) {
      // If file write fails, mark paper as failed
      await db.paper.update({
        where: { id: paper.id },
        data: { status: "FAILED" },
      });

      console.error("File write error:", fileError);
      return NextResponse.json(
        { message: "Failed to save file" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Upload failed" },
      { status: 500 }
    );
  }
}
