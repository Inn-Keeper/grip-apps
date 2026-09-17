import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { categories } from "@grip-apps/core/prepData";
import { extractTechsFromText } from "@grip-apps/core/cvTechs";

const KNOWN_TECHS = categories.flatMap((c) => c.items.map((item) => item.tech));

// pdfjs is browser-only — there's no on-device PDF text extractor here. TXT is
// read natively; PDFs are routed to web (cv_techs syncs via the profile, so a
// web import already shows up on mobile). See PLAN.md CV feature notes.
export class CvImportError extends Error {}

export type CvImportResult =
  | { kind: "techs"; techs: string[] }
  | { kind: "empty" } // file read, but no known techs matched
  | { kind: "pdf-unsupported" }
  | { kind: "canceled" };

export async function importCvTechs(): Promise<CvImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/plain", "application/pdf"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { kind: "canceled" };

  const asset = result.assets[0];
  if (!asset) return { kind: "canceled" };

  const isPdf = asset.mimeType === "application/pdf" || asset.name.toLowerCase().endsWith(".pdf");
  if (isPdf) return { kind: "pdf-unsupported" };

  let text: string;
  try {
    text = await new File(asset.uri).text();
  } catch {
    throw new CvImportError("read-failed");
  }

  const techs = extractTechsFromText(text, KNOWN_TECHS).map((s) => s.tech);
  return techs.length ? { kind: "techs", techs } : { kind: "empty" };
}
