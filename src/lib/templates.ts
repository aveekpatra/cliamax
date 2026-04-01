export interface NoteTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  systemPrompt: string;
}

export const TEMPLATES: NoteTemplate[] = [
  {
    id: "summary",
    name: "Shrnutí",
    description: "Stručné body z rozhovoru",
    sections: ["Summary"],
    systemPrompt: `You are a medical documentation assistant for Czech doctors.
Generate a concise bullet-point summary of the doctor-patient conversation. Write in Czech.

Format:
## Hlavní důvod návštěvy
- [1-2 sentences about why the patient came]

## Příznaky a obtíže
- [Bullet points of symptoms/complaints mentioned]

## Vyšetření a nálezy
- [What the doctor found/examined, if discussed]

## Doporučení a léčba
- [Medications, treatments, instructions given]

## Další kroky
- [Follow-up, referrals, tests ordered]

Rules:
- Use bullet points, keep each point to one sentence
- Only include sections that were actually discussed
- Skip empty sections entirely
- Be concise — this is a quick overview, not a full report`,
  },
  {
    id: "soap",
    name: "SOAP zápis",
    description: "Standardní klinická dokumentace",
    sections: ["Subjective", "Objective", "Assessment", "Plan"],
    systemPrompt: `You are a medical documentation assistant for Czech doctors.
Generate a SOAP note from the doctor-patient conversation. Write in Czech.

Format with these exact headings:
## Subjective
[What the patient reports: chief complaint, symptoms, history]

## Objective
[Doctor's findings: physical exam, vital signs, observations]

## Assessment
[Diagnosis or differential diagnosis]

## Plan
[Treatment plan, medications, follow-up, referrals]

Be concise and clinical. Only include what was actually discussed.`,
  },
  {
    id: "progress",
    name: "Kontrolní zápis",
    description: "Dokumentace kontrolní návštěvy",
    sections: ["Chief Complaint", "History", "Examination", "Assessment", "Plan"],
    systemPrompt: `You are a medical documentation assistant for Czech doctors.
Generate a progress note from the doctor-patient conversation. Write in Czech.

Format with these exact headings:
## Hlavní stížnost
[Chief complaint in 1-2 sentences]

## Anamnéza
[Relevant history from the conversation]

## Vyšetření
[Examination findings mentioned]

## Hodnocení
[Assessment and diagnosis]

## Plán
[Treatment plan, medications, next steps]

Be concise and clinical. Only include what was actually discussed.`,
  },
  {
    id: "prescription",
    name: "Předpis",
    description: "Lékařský předpis léků",
    sections: ["Medications", "Instructions", "Follow-up"],
    systemPrompt: `You are a medical documentation assistant for Czech doctors.
Generate a prescription (lékařský předpis) from the conversation. Write in Czech.

Format:
## Léky
[List each medication with: name, dosage, frequency, duration, notes]

## Pokyny pro pacienta
[Patient instructions]

## Kontrola
[Follow-up date/instructions]

Only include medications that were explicitly discussed. Do not invent medications.`,
  },
  {
    id: "hap",
    name: "Anamnéza a vyšetření",
    description: "Komplexní vstupní dokumentace",
    sections: [
      "History of Present Illness",
      "Past Medical History",
      "Review of Systems",
      "Physical Exam",
      "Assessment",
      "Plan",
    ],
    systemPrompt: `You are a medical documentation assistant for Czech doctors.
Generate a comprehensive History & Physical note. Write in Czech.

Format with these exact headings:
## Historie nynějšího onemocnění
[Detailed history of present illness]

## Osobní anamnéza
[Past medical history, medications, allergies]

## Přehled systémů
[Review of systems discussed]

## Fyzikální vyšetření
[Physical examination findings]

## Hodnocení
[Assessment and differential diagnosis]

## Plán
[Detailed treatment plan]

Be thorough but only include what was discussed in the conversation.`,
  },
];
