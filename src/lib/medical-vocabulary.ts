/**
 * Czech medical vocabulary for STT keyterm prompting.
 * ElevenLabs Scribe v2 Batch supports up to 1000 keyterms.
 * Terms are organized by medical specialty.
 */

export type MedicalSpecialty =
  | "general"
  | "internal"
  | "cardiology"
  | "orthopedics"
  | "neurology"
  | "pediatrics"
  | "dermatology"
  | "gastroenterology";

export const SPECIALTY_LABELS: Record<MedicalSpecialty, string> = {
  general: "Praktické lékařství",
  internal: "Interní medicína",
  cardiology: "Kardiologie",
  orthopedics: "Ortopedie",
  neurology: "Neurologie",
  pediatrics: "Pediatrie",
  dermatology: "Dermatologie",
  gastroenterology: "Gastroenterologie",
};

// ── Common terms used across all specialties ────────────────────────────

const COMMON_VITALS = [
  "krevní tlak", "systolický tlak", "diastolický tlak", "tepová frekvence",
  "teplota", "saturace", "BMI", "hmotnost", "výška", "puls", "dechová frekvence",
  "glykémie", "SpO2",
];

const COMMON_DRUGS = [
  // Analgesics / NSAIDs
  "Ibalgin", "Paralen", "Novalgin", "Brufen", "Ibuprofen", "Paracetamol",
  "Diklofenak", "Nimesil", "Ketonal", "Tramadol", "Nurofen",
  // Cardiovascular
  "Warfarin", "Ramipril", "Amlodipin", "Bisoprolol", "Furosemid", "Heparin",
  "Prestarium", "Atorvastatin", "Simvastatin", "Rosuvastatin", "Enoxaparin",
  "Clopidogrel", "Kyselina acetylsalicylová", "Anopyrin", "Valsartan",
  "Losartan", "Telmisartan", "Metoprolol", "Perindopril", "Indapamid",
  "Spironolakton", "Digoxin", "Amiodaron", "Propafenon", "Rivaroxaban",
  "Apixaban", "Dabigatran",
  // Diabetes
  "Metformin", "Insulin", "Glimepirid", "Pioglitazon", "Sitagliptin",
  "Empagliflozin", "Dapagliflozin", "Liraglutid", "Semaglutid",
  // GI
  "Omeprazol", "Helicid", "Pantoprazol", "Lanzoprazol", "Famotidin",
  "Degan", "Smecta", "Lactulose",
  // Respiratory
  "Salbutamol", "Ventolin", "Budesonid", "Seretide", "Montelukast",
  "Theofylin", "Tiotropium",
  // Antibiotics
  "Amoxicilin", "Augmentin", "Azitromycin", "Ciprofloxacin", "Klaritromycin",
  "Doxycyklin", "Cefuroxim", "Metronidazol", "Cotrimoxazol", "Penicilin",
  // Psychotropic
  "Sertralin", "Escitalopram", "Venlafaxin", "Diazepam", "Alprazolam",
  "Zolpidem", "Quetiapin", "Risperidon",
  // Corticosteroids
  "Prednison", "Methylprednisolon", "Dexamethason", "Hydrokortison",
  // Thyroid
  "Letrox", "Euthyrox", "Levothyroxin", "Carbimazol",
  // Other common
  "Vigantol", "Vitamin D", "Calcium", "Magnézium", "Ferronat", "Acidum folicum",
];

const COMMON_LAB = [
  "krevní obraz", "sedimentace", "CRP", "kreatinin", "urea", "jaterní testy",
  "ALT", "AST", "GGT", "bilirubin", "albumin", "celkový protein",
  "elektrolyty", "sodík", "draslík", "chloridy", "vápník", "fosfor",
  "glykovaný hemoglobin", "HbA1c", "lipidogram", "cholesterol", "triglyceridy",
  "HDL", "LDL", "TSH", "fT4", "fT3", "krevní plyny", "INR", "APTT",
  "D-dimery", "troponin", "NT-proBNP", "prokalcitonin", "laktát",
  "moč chemicky", "moč sediment", "kultivace", "hemokultura", "stěr",
];

const COMMON_IMAGING = [
  "ultrazvuk", "rentgen", "RTG", "CT vyšetření", "magnetická rezonance",
  "MRI", "PET CT", "scintigrafie", "echokardiografie", "ECHO", "EKG",
  "Holter EKG", "ambulantní monitorace", "angiografie", "doppler",
  "mamografie", "denzitometrie", "spirometrie", "SONO",
];

const COMMON_PROCEDURES = [
  "odběr krve", "infuze", "injekce", "převaz", "sutury", "biopsie",
  "punkce", "drenáž", "katetrizace", "intubace", "kanylace",
  "transfuze", "dialýza", "endoskopie", "laparoskopie",
];

const COMMON_DOCUMENTATION = [
  "lékařská zpráva", "neschopenka", "recept", "žádanka", "výmenný list",
  "doporučení", "propouštěcí zpráva", "ambulantní zpráva",
  "anamnéza", "diagnóza", "diferenciální diagnóza", "prognóza",
  "indikace", "kontraindikace", "vyšetření", "léčba", "terapie",
  "dispenzarizace", "rehabilitace", "kontrola",
];

const COMMON_ANATOMY = [
  "hlava", "krk", "hrudník", "břicho", "záda", "páteř", "pánev",
  "horní končetina", "dolní končetina", "rameno", "loket", "zápěstí",
  "kyčel", "koleno", "kotník", "játra", "ledviny", "plíce", "srdce",
  "žaludek", "střeva", "slinivka", "slezina", "mozek", "mícha",
  "štítná žláza", "nadledviny", "prostata", "děloha", "vaječníky",
];

// ── Specialty-specific terms ────────────────────────────────────────────

const SPECIALTY_TERMS: Record<MedicalSpecialty, string[]> = {
  general: [
    "preventivní prohlídka", "očkování", "RAST", "pracovní neschopnost",
    "dočasná pracovní neschopnost", "dispenzární prohlídka", "registrace",
    "přeregistrace", "potvrzení", "způsobilost", "očkovací průkaz",
    "zdravotní pojištění", "VZP", "screeningové vyšetření",
    "antropometrické měření", "orientační vyšetření", "stolice na okultní krvácení",
  ],
  internal: [
    "diabetes mellitus", "diabetes prvního typu", "diabetes druhého typu",
    "hypertenze", "arteriální hypertenze", "hyperlipidémie", "dyslipidemie",
    "fibrilace síní", "flutter síní", "srdeční selhání", "NYHA",
    "CHOPN", "chronická obstrukční plicní nemoc", "astma bronchiale",
    "pneumonie", "bronchopneumonie", "plicní embolie",
    "hluboká žilní trombóza", "anémie", "sideropenická anémie",
    "tyreotoxikóza", "hypotyreóza", "hypertyreóza", "metabolický syndrom",
    "osteoporóza", "dna", "hyperurikémie", "chronické onemocnění ledvin",
    "glomerulonefritida", "pyelonefritida", "jaterní cirhóza",
    "hepatopatie", "ikterus", "ascites", "pleurální výpotek",
    "kardiomyopatie", "perikarditida", "endokarditida",
    "tromboembolická nemoc", "ischemická choroba srdeční",
  ],
  cardiology: [
    "fibrilace síní", "flutter síní", "infarkt myokardu", "STEMI", "NSTEMI",
    "angina pectoris", "stabilní angina", "nestabilní angina",
    "srdeční selhání", "ejekční frakce", "LVEF",
    "kardiomyopatie", "dilatační kardiomyopatie", "hypertrofická kardiomyopatie",
    "arytmie", "supraventrikulární tachykardie", "komorová tachykardie",
    "bradykardie", "sick sinus syndrom", "AV blokáda",
    "echokardiografie", "transezofageální ECHO", "koronarografie",
    "perkutánní koronární intervence", "PCI", "stent", "bypass", "CABG",
    "troponin", "NT-proBNP", "BNP", "kardiostimulátor", "ICD", "defibrilátor",
    "katetrizace", "ablace", "valvuloplastika", "perikardiální výpotek",
    "aortální stenóza", "mitrální regurgitace", "trikuspidální regurgitace",
    "srdeční vada", "endokarditida", "myokarditida",
  ],
  orthopedics: [
    "fraktura", "zlomenina", "luxace", "subluxace", "distorze", "ruptura",
    "artroskopie", "artrotomie", "endoprotéza", "TEP", "totální endoprotéza",
    "meniskus", "mediální meniskus", "laterální meniskus",
    "přední křížový vaz", "ACL", "zadní křížový vaz", "PCL",
    "postranní vaz", "Achillova šlacha", "rotátorová manžeta",
    "sádra", "dlaha", "ortéza", "osteosyntéza", "hřeb", "dlažba", "šrouby",
    "rehabilitace", "fyzioterapie", "krční páteř", "hrudní páteř",
    "bederní páteř", "Cp", "Thp", "Lp", "sakroiliakální skloubení",
    "hernie disku", "diskopatie", "spondylóza", "spondylolistéza",
    "artróza", "koxartróza", "gonartróza",
    "osteoporóza", "osteomyelitida", "tendinitida", "bursitida",
    "epikondylitida", "fasceitida", "syndrom karpálního tunelu",
    "impingement syndrom", "hallux valgus",
  ],
  neurology: [
    "cévní mozková příhoda", "CMP", "ischemická CMP", "hemoragická CMP",
    "tranzitorní ischemická ataka", "TIA",
    "epilepsie", "status epilepticus", "tonicko-klonický záchvat",
    "migréna", "migréna s aurou", "tenzní cefalea", "cluster headache",
    "Parkinsonova choroba", "parkinsonismus", "třes", "tremor", "rigidita",
    "roztroušená skleróza", "RS", "polyneuropatie", "mononeuropatie",
    "radikulopatie", "vertebrogenní algický syndrom",
    "elektromyografie", "EMG", "elektroneurografie", "ENG",
    "lumbální punkce", "CT mozku", "MRI mozku", "EEG",
    "paréza", "plegie", "hemiparéza", "paraparéza", "tetraparéza",
    "Alzheimerova choroba", "demence", "delirium",
    "syndrom karpálního tunelu", "meningitida", "encefalitida",
    "myastenia gravis", "Guillain-Barré syndrom",
    "neuralgie trigeminu", "zvýšený intrakraniální tlak",
  ],
  pediatrics: [
    "kojenec", "batolata", "novorozenec", "předčasně narozený",
    "percentil", "růstový graf", "hmotnostní křivka",
    "očkovací kalendář", "hexavakcína", "MMR", "pneumokoková vakcína",
    "febrilní křeče", "exantém", "enantém",
    "otitida", "akutní otitis media", "tonzilitida", "faryngitida",
    "bronchiolitida", "laryngitida", "kruup", "epiglotitida",
    "rotavirus", "norovirus", "dehydratace", "rehydratace",
    "fontanela", "Mantoux", "Apgar skóre",
    "neprospívání", "alergické projevy", "atopická dermatitida",
    "potravinová alergie", "celiakální sprue", "Downův syndrom",
    "vrozená vývojová vada", "ADHD", "autismus",
  ],
  dermatology: [
    "ekzém", "atopický ekzém", "kontaktní dermatitida",
    "psoriáza", "ložisková psoriáza", "gutátní psoriáza",
    "melanom", "bazaliom", "bazaliocelulární karcinom",
    "spinocelulární karcinom", "aktinická keratóza",
    "akné", "akné vulgaris", "rosácea",
    "urtirárie", "angioedém", "mykóza", "onychomykóza", "tinea",
    "herpes simplex", "herpes zoster", "pásový opar",
    "verruca", "bradavice", "molluscum contagiosum",
    "biopsie kůže", "excize", "kryoterapie", "dermatoskopie",
    "kortikoid", "antimykotikum", "retinoidy",
    "erytém", "makula", "papula", "vezikula", "pustula", "bula",
    "ulcerace", "erose", "krustra", "pigmentace",
  ],
  gastroenterology: [
    "gastroskopie", "koloskopie", "ERCP", "endosonografie",
    "gastroezofageální reflux", "GERD", "refluxní choroba",
    "peptický vřed", "duodenální vřed", "žaludeční vřed",
    "Helicobacter pylori", "eradikace",
    "Crohnova choroba", "ulcerózní kolitida", "nespecifický střevní zánět",
    "celiakie", "celiakální sprue", "malabsorpce",
    "cirhóza", "jaterní cirhóza", "portální hypertenze",
    "hepatitida", "hepatitida A", "hepatitida B", "hepatitida C",
    "pankreatitida", "akutní pankreatitida", "chronická pankreatitida",
    "cholecystolitiáza", "choledocholitiáza", "cholecystitida",
    "kolorektální karcinom", "karcinom pankreatu",
    "polyp", "adenom", "divertikl", "divertikulitida",
    "bilirubin", "amyláza", "lipáza", "elastáza",
    "jícnové varixy", "Barrettův jícen", "achalázie",
    "ileus", "obstipace", "průjem", "melena", "hemateméza",
  ],
};

// ── Exported functions ──────────────────────────────────────────────────

/**
 * Get all keyterms for ElevenLabs Scribe v2 Batch (up to 1000 terms).
 * Combines common + specialty-specific vocabulary.
 */
export function getKeytermsForBatch(specialty: MedicalSpecialty = "general"): string[] {
  const all = [
    ...COMMON_VITALS,
    ...COMMON_DRUGS,
    ...COMMON_LAB,
    ...COMMON_IMAGING,
    ...COMMON_PROCEDURES,
    ...COMMON_DOCUMENTATION,
    ...COMMON_ANATOMY,
    ...SPECIALTY_TERMS[specialty],
  ];
  // Deduplicate and limit to 1000 (ElevenLabs batch limit)
  const unique = [...new Set(all)];
  return unique.slice(0, 1000);
}

/**
 * Get keyterms for realtime / limited APIs (up to 100 terms).
 */
export function getKeyterms(specialty: MedicalSpecialty = "general"): string[] {
  const specialtyTerms = SPECIALTY_TERMS[specialty] || [];
  const combined = [...COMMON_DRUGS.slice(0, 50), ...COMMON_LAB.slice(0, 20), ...specialtyTerms.slice(0, 30)];
  return [...new Set(combined)].slice(0, 100);
}

/**
 * Get medical vocabulary context string for LLM correction prompts.
 */
export function getMedicalContext(specialty: MedicalSpecialty = "general"): string {
  const terms = getKeytermsForBatch(specialty).slice(0, 200);
  return `Lékařská terminologie k dispozici: ${terms.join(", ")}`;
}
