import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from "docx";
import { saveAs } from "file-saver";
import type { TranscriptEntry } from "@/types/session";

interface ExportOptions {
  title: string;
  date: string;
  duration: string;
  transcript: TranscriptEntry[];
  note: string;
  billingCodes: Array<{ code: string; name: string; points: number; reason: string }>;
}

export async function exportToDocx(options: ExportOptions) {
  const { title, date, duration, transcript, note, billingCodes } = options;

  const children: Paragraph[] = [];

  // Header
  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, spacing: { after: 100 } })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Datum: ${date}`, color: "666666", size: 20 }),
        new TextRun({ text: `   Délka: ${duration}`, color: "666666", size: 20 }),
      ],
      spacing: { after: 400 },
    })
  );

  // Clinical note
  children.push(
    new Paragraph({ text: "Klinická zpráva", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } })
  );

  for (const line of note.split("\n")) {
    if (line.startsWith("## ")) {
      children.push(
        new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 50 } })
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.slice(4), bold: true, size: 22 })],
          spacing: { before: 150, after: 40 },
        })
      );
    } else if (line.startsWith("- ")) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `• ${line.slice(2)}`, size: 22 })],
          indent: { left: 400 },
          spacing: { after: 40 },
        })
      );
    } else if (line.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 60 },
        })
      );
    }
  }

  // Billing codes
  if (billingCodes.length > 0) {
    children.push(
      new Paragraph({ text: "Vykázané výkony", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 } })
    );

    for (const bc of billingCodes) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${bc.code}`, bold: true, size: 20 }),
            new TextRun({ text: `  ${bc.name}`, size: 20 }),
            new TextRun({ text: `  (${bc.points} b)`, color: "666666", size: 20 }),
          ],
          spacing: { after: 20 },
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: bc.reason, size: 18, color: "888888", italics: true })],
          indent: { left: 200 },
          spacing: { after: 80 },
        })
      );
    }

    const totalPoints = billingCodes.reduce((sum, bc) => sum + bc.points, 0);
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Celkem: ${totalPoints} bodů`, bold: true, size: 22 })],
        alignment: AlignmentType.RIGHT,
        spacing: { before: 100, after: 200 },
      })
    );
  }

  // Transcript
  children.push(
    new Paragraph({ text: "Přepis rozhovoru", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 } })
  );

  let lastSpeaker = "";
  for (const entry of transcript) {
    if (entry.speaker !== lastSpeaker) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: entry.speaker === "doctor" ? "Lékař:" : "Pacient:",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 120, after: 20 },
        })
      );
      lastSpeaker = entry.speaker;
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text: entry.text, size: 20 })],
        spacing: { after: 30 },
        indent: { left: entry.speaker === "patient" ? 300 : 0 },
      })
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const safeName = title.replace(/[^a-zA-Z0-9áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ _-]/g, "");
  saveAs(blob, `${safeName}_${date.split("T")[0]}.docx`);
}
