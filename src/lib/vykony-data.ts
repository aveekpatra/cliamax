// Czech health insurance procedure codes grouped by specialty (odbornost)
// First 2 digits of code = specialty code
// Source: https://szv.mzcr.cz/Vykon — ~4,246 codes total, 178 specialties
// TODO: Replace with full dataset parsed from official registry

export interface VykonCode {
  code: string;
  name: string;
  points: number;
}

export interface SpecialtyGroup {
  id: string;
  name: string;
  codes: VykonCode[];
}

export const SPECIALTY_GROUPS: SpecialtyGroup[] = [
  {
    id: "001",
    name: "Všeobecné praktické lékařství (GP)",
    codes: [
      { code: "09513", name: "Komplexní vyšetření praktickým lékařem", points: 350 },
      { code: "09523", name: "Kontrolní vyšetření praktickým lékařem", points: 150 },
      { code: "09533", name: "Cílené vyšetření praktickým lékařem", points: 200 },
      { code: "09543", name: "Preventivní prohlídka", points: 400 },
      { code: "09553", name: "Předoperační vyšetření", points: 450 },
      { code: "09119", name: "Konzilium – vyšetření na žádost jiného lékaře", points: 250 },
      { code: "01021", name: "Ošetření a převaz rány", points: 100 },
      { code: "01023", name: "Ošetření komplikované rány", points: 180 },
      { code: "02031", name: "Aplikace injekce i.m.", points: 60 },
      { code: "02033", name: "Aplikace injekce i.v.", points: 80 },
      { code: "02039", name: "Aplikace infúze i.v.", points: 150 },
      { code: "03031", name: "Odběr biologického materiálu", points: 50 },
      { code: "91111", name: "Očkování", points: 80 },
      { code: "97011", name: "Telefonická konzultace", points: 50 },
      { code: "97013", name: "Telemedicínská konzultace", points: 150 },
      { code: "97015", name: "Edukace pacienta", points: 100 },
      { code: "97017", name: "Výpis ze zdravotní dokumentace", points: 80 },
    ],
  },
  {
    id: "002",
    name: "Pediatrie",
    codes: [
      { code: "14011", name: "Komplexní vyšetření pediatrem", points: 350 },
      { code: "14021", name: "Kontrolní vyšetření pediatrem", points: 150 },
      { code: "14031", name: "Cílené vyšetření pediatrem", points: 200 },
      { code: "14041", name: "Preventivní prohlídka dítěte", points: 400 },
      { code: "14051", name: "Očkování dětí dle kalendáře", points: 120 },
    ],
  },
  {
    id: "101",
    name: "Vnitřní lékařství (Internal Medicine)",
    codes: [
      { code: "09211", name: "Komplexní vyšetření internistou", points: 400 },
      { code: "09221", name: "Kontrolní vyšetření internistou", points: 200 },
      { code: "09231", name: "Cílené vyšetření internistou", points: 250 },
    ],
  },
  {
    id: "104",
    name: "Chirurgie",
    codes: [
      { code: "11011", name: "Komplexní vyšetření chirurgem", points: 400 },
      { code: "11021", name: "Kontrolní vyšetření chirurgem", points: 200 },
      { code: "11111", name: "Excize kožního útvaru", points: 300 },
      { code: "11113", name: "Excize podkožního útvaru", points: 400 },
      { code: "93111", name: "Anestezie lokální", points: 100 },
      { code: "93113", name: "Anestezie celková", points: 2000 },
    ],
  },
  {
    id: "107",
    name: "Kardiologie",
    codes: [
      { code: "17021", name: "Komplexní vyšetření kardiologem", points: 990 },
      { code: "17022", name: "Cílené vyšetření kardiologem", points: 499 },
      { code: "17023", name: "Kontrolní vyšetření kardiologem", points: 250 },
      { code: "43311", name: "EKG 12svodové", points: 200 },
      { code: "43313", name: "EKG Holter 24h", points: 600 },
      { code: "43315", name: "Echokardiografie", points: 700 },
      { code: "43411", name: "Ergometrie (zátěžový test)", points: 500 },
    ],
  },
  {
    id: "209",
    name: "Neurologie",
    codes: [
      { code: "15011", name: "Komplexní vyšetření neurologem", points: 450 },
      { code: "15021", name: "Kontrolní vyšetření neurologem", points: 250 },
      { code: "51411", name: "Elektroencefalografie (EEG)", points: 400 },
      { code: "51413", name: "Elektromyografie (EMG)", points: 500 },
    ],
  },
  {
    id: "305",
    name: "Psychiatrie",
    codes: [
      { code: "17011", name: "Komplexní vyšetření psychiatrem", points: 500 },
      { code: "17021", name: "Kontrolní vyšetření psychiatrem", points: 300 },
    ],
  },
  {
    id: "403",
    name: "Gynekologie",
    codes: [
      { code: "13011", name: "Komplexní vyšetření gynekologem", points: 400 },
      { code: "13021", name: "Kontrolní vyšetření gynekologem", points: 200 },
      { code: "44315", name: "Ultrazvuk prsou", points: 350 },
    ],
  },
  {
    id: "705",
    name: "Oftalmologie",
    codes: [
      { code: "20011", name: "Komplexní vyšetření oftalmologem", points: 400 },
      { code: "20021", name: "Kontrolní vyšetření oftalmologem", points: 200 },
    ],
  },
  {
    id: "shared",
    name: "Sdílené výkony (Shared procedures)",
    codes: [
      { code: "81101", name: "Odběr kapilární krve", points: 50 },
      { code: "81111", name: "Odběr žilní krve", points: 70 },
      { code: "81211", name: "Krevní obraz", points: 100 },
      { code: "81213", name: "Diferenciální krevní obraz", points: 120 },
      { code: "81311", name: "Biochemie – základní panel", points: 200 },
      { code: "81313", name: "Glykémie", points: 50 },
      { code: "81315", name: "Glykovaný hemoglobin (HbA1c)", points: 150 },
      { code: "81317", name: "Lipidový profil", points: 180 },
      { code: "81319", name: "Jaterní testy", points: 150 },
      { code: "81321", name: "Ledvinné funkce (kreatinin, urea)", points: 120 },
      { code: "81323", name: "C-reaktivní protein (CRP)", points: 80 },
      { code: "81325", name: "Thyroidní panel (TSH, fT3, fT4)", points: 250 },
      { code: "81411", name: "Vyšetření moči chemicky + sediment", points: 80 },
      { code: "81413", name: "Kultivace moči", points: 120 },
      { code: "81511", name: "Koagulační vyšetření", points: 180 },
      { code: "82111", name: "Mikrobiologická kultivace", points: 200 },
      { code: "82113", name: "Citlivost na antibiotika", points: 150 },
      { code: "85111", name: "Histologické vyšetření", points: 500 },
      { code: "85113", name: "Cytologické vyšetření", points: 300 },
      { code: "44311", name: "Ultrazvuk břicha", points: 400 },
      { code: "44313", name: "Ultrazvuk štítné žlázy", points: 300 },
      { code: "44317", name: "Ultrazvuk kloubů", points: 300 },
      { code: "44319", name: "Ultrazvuk cév (Doppler)", points: 450 },
      { code: "63411", name: "RTG hrudníku", points: 300 },
      { code: "63413", name: "RTG páteře", points: 300 },
      { code: "63415", name: "RTG končetiny", points: 250 },
      { code: "63511", name: "CT hlavy", points: 1500 },
      { code: "63513", name: "CT hrudníku", points: 1500 },
      { code: "63515", name: "CT břicha", points: 1500 },
      { code: "63611", name: "MRI hlavy", points: 3000 },
      { code: "63613", name: "MRI páteře", points: 3000 },
      { code: "63615", name: "MRI kloubu", points: 2500 },
      { code: "72211", name: "Fyzioterapie individuální", points: 200 },
      { code: "72213", name: "Fyzioterapie skupinová", points: 100 },
      { code: "95111", name: "Ošetření v lékařské pohotovosti", points: 300 },
      { code: "95113", name: "Příjem k hospitalizaci", points: 400 },
      { code: "95115", name: "Propuštění z hospitalizace", points: 200 },
    ],
  },
];

// Get codes for a specific specialty + shared codes
export function getCodesForSpecialty(specialtyId: string): VykonCode[] {
  const specialty = SPECIALTY_GROUPS.find((g) => g.id === specialtyId);
  const shared = SPECIALTY_GROUPS.find((g) => g.id === "shared");
  return [...(specialty?.codes || []), ...(shared?.codes || [])];
}

// Format codes as a compact string for LLM context
export function formatCodesForPrompt(codes: VykonCode[]): string {
  return codes.map((c) => `${c.code} | ${c.name} | ${c.points}b`).join("\n");
}
