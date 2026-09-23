// Reads a CV file to plain text, in the browser. The file is never uploaded;
// it's parsed here and discarded — only extracted techs get persisted.
//
// .txt is free (Blob.text()). .pdf lazy-loads pdfjs-dist so its ~1.5MB stays
// out of the initial bundle. Image-only (scanned) PDFs have no text layer; we
// surface that as an error rather than silently returning "".

const MAX_BYTES = 5 * 1024 * 1024; // 5MB — a text CV is far smaller; caps abuse.

export class CvParseError extends Error {}

export async function readCvText(file: File): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new CvParseError("File is too large. Please upload a CV under 5MB.");
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");

  if (isTxt) return file.text();
  if (isPdf) return readPdfText(file);
  throw new CvParseError("Unsupported file. Please upload a PDF or TXT.");
}

async function readPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite resolves the worker URL; pdfjs runs parsing off the main thread.
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let text = "";
  for (let page = 1; page <= doc.numPages; page++) {
    const content = await (await doc.getPage(page)).getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }

  if (!text.trim()) {
    throw new CvParseError("No text found. Scanned or image-only PDFs can't be read. Try a text-based PDF or TXT.");
  }
  return text;
}
