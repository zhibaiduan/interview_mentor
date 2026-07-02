import { NextResponse } from "next/server"
import { PDFParse } from "pdf-parse"
import { buildResumeMaterial, isSupportedResumeFile } from "@/lib/product/setup-validation"

export const runtime = "nodejs"

const maxUploadBytes = 6 * 1024 * 1024

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Resume file is required." }, { status: 400 })
  }

  if (file.size > maxUploadBytes) {
    return NextResponse.json({ error: "Resume file is too large. Upload a PDF under 6 MB." }, { status: 413 })
  }

  if (!isSupportedResumeFile(file.name, file.type)) {
    return NextResponse.json({ error: "Unsupported resume file. Upload PDF, .txt, or .md." }, { status: 415 })
  }

  try {
    const rawText = await extractResumeText(file)
    const material = buildResumeMaterial(rawText)

    return NextResponse.json({
      fileName: file.name,
      text: material.text,
      experiences: material.experiences,
      removedFields: material.removedFields,
      removedLineCount: material.removedLineCount,
      rawCharCount: material.rawCharCount
    })
  } catch {
    return NextResponse.json(
      { error: "Could not parse this resume. Try exporting the PDF as text or upload another file." },
      { status: 422 }
    )
  }
}

async function extractResumeText(file: File) {
  if (file.type.includes("text") || /\.(txt|md)$/i.test(file.name)) {
    return file.text()
  }

  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parser = new PDFParse({ data: buffer })

    try {
      const result = await parser.getText()
      return result.text
    } finally {
      await parser.destroy()
    }
  }

  throw new Error(`Unsupported resume file: ${file.name}`)
}
