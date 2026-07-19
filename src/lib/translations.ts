/**
 * Multi-language support dictionary for MedSnap AI.
 * Supports English (en), Spanish (es), French (fr), German (de), and Arabic (ar).
 */

export type SupportedLanguage = "en" | "es" | "fr" | "de" | "ar";

export const LANGUAGES: { code: SupportedLanguage; name: string; native: string; flag: string }[] = [
  { code: "en", name: "English", native: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "Arabic", native: "العربية", flag: "🇸🇦" },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    home: "Home",
    history: "History",
    scan: "Scan",
    browse: "Browse",
    settings: "Settings",
    searchPlaceholder: "Search medicines (e.g. Panadol, Ibuprofen)...",
    scanAMedicine: "Scan a medicine",
    takePhotoToIdentify: "Take a photo to identify instantly",
    cloudHistory: "Cloud History",
    allergies: "Allergies",
    registries: "Registries",
    recentHistory: "Recent History",
    commonMedications: "Common Medications",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    scanNextMedicine: "Scan Next Medicine",
    browseMoreMedicines: "Browse More Medicines",
    downloadPDFReport: "Download PDF Report",
    timelineView: "Timeline View",
    favorites: "Favorites",
    filters: "Filters",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    all: "All",
    labReport: "Lab Report",
    prescription: "Prescription",
    vaccine: "Vaccine",
    emergency: "Emergency",
    whatItsUsedFor: "What it's used for",
    howItWorks: "How it works",
    composition: "Composition",
    pharmacology: "Pharmacology",
    commonSideEffects: "Common side effects",
    seriousSideEffects: "Serious side effects",
    overdoseSymptoms: "Overdose symptoms",
    interactions: "Interactions",
    whoShouldAvoid: "Who should avoid it",
    dietaryAdvice: "Dietary advice",
    ifYouMissADose: "If you miss a dose",
    relatedMedicines: "Related medicines",
    storageInstructions: "Storage instructions",
    sources: "Sources",
    strength: "Strength",
    imprint: "Imprint",
    form: "Form",
    translateOCR: "Translate OCR",
    searchReport: "Search Report",
    editOCR: "Edit OCR Corrections",
    compare: "Compare",
    notes: "Notes",
    pdf: "PDF Report",
    share: "Share",
    report: "Report",
    matchIntegrity: "Registry Match Integrity",
    dosage: "Dosage",
    frequency: "Prescribed Frequency",
    duration: "Treatment Duration",
  },
  es: {
    home: "Inicio",
    history: "Historial",
    scan: "Escanear",
    browse: "Explorar",
    settings: "Ajustes",
    searchPlaceholder: "Buscar medicamentos (p. ej., Panadol, Ibuprofeno)...",
    scanAMedicine: "Escanear un medicamento",
    takePhotoToIdentify: "Toma una foto para identificar al instante",
    cloudHistory: "Historial en la Nube",
    allergies: "Alergias",
    registries: "Registros",
    recentHistory: "Historial Reciente",
    commonMedications: "Medicamentos Comunes",
    goodMorning: "Buenos días",
    goodAfternoon: "Buenas tardes",
    goodEvening: "Buenas noches",
    scanNextMedicine: "Escanear siguiente medicamento",
    browseMoreMedicines: "Explorar más medicamentos",
    downloadPDFReport: "Descargar informe PDF",
    timelineView: "Vista de Línea de Tiempo",
    favorites: "Favoritos",
    filters: "Filtros",
    today: "Hoy",
    thisWeek: "Esta Semana",
    thisMonth: "Este Mes",
    all: "Todos",
    labReport: "Informe de Laboratorio",
    prescription: "Receta Médica",
    vaccine: "Vacuna",
    emergency: "Emergencia",
    whatItsUsedFor: "Para qué se usa",
    howItWorks: "Cómo funciona",
    composition: "Composición",
    pharmacology: "Farmacología",
    commonSideEffects: "Efectos secundarios comunes",
    seriousSideEffects: "Efectos secundarios graves",
    overdoseSymptoms: "Síntomas de sobredosis",
    interactions: "Interacciones medicamentosas",
    whoShouldAvoid: "Quién debe evitarlo",
    dietaryAdvice: "Consejo dietético",
    ifYouMissADose: "Si olvida una dosis",
    relatedMedicines: "Medicamentos relacionados",
    storageInstructions: "Instrucciones de almacenamiento",
    sources: "Fuentes verificadas",
    strength: "Concentración",
    imprint: "Grabado",
    form: "Forma",
    translateOCR: "Traducir OCR",
    searchReport: "Buscar en informe",
    editOCR: "Editar correcciones OCR",
    compare: "Comparar",
    notes: "Notas",
    pdf: "Informe PDF",
    share: "Compartir",
    report: "Reportar",
    matchIntegrity: "Integridad de coincidencia del registro",
    dosage: "Dosis",
    frequency: "Frecuencia recetada",
    duration: "Duración del tratamiento",
  },
  fr: {
    home: "Accueil",
    history: "Historique",
    scan: "Scanner",
    browse: "Parcourir",
    settings: "Paramètres",
    searchPlaceholder: "Rechercher des médicaments (ex. Doliprane, Ibuprofène)...",
    scanAMedicine: "Scanner un médicament",
    takePhotoToIdentify: "Prenez une photo pour l'identifier instantanément",
    cloudHistory: "Historique Cloud",
    allergies: "Allergies",
    registries: "Registres",
    recentHistory: "Historique Récents",
    commonMedications: "Médicaments Courants",
    goodMorning: "Bonjour",
    goodAfternoon: "Bon après-midi",
    goodEvening: "Bonsoir",
    scanNextMedicine: "Scanner le médicament suivant",
    browseMoreMedicines: "Parcourir plus de médicaments",
    downloadPDFReport: "Télécharger le rapport PDF",
    timelineView: "Vue Chronologique",
    favorites: "Favoris",
    filters: "Filtres",
    today: "Aujourd'hui",
    thisWeek: "Cette Semaine",
    thisMonth: "Ce Mois",
    all: "Tous",
    labReport: "Rapport de Laboratoire",
    prescription: "Ordonnance",
    vaccine: "Vaccin",
    emergency: "Urgence",
    whatItsUsedFor: "Indications et utilisation",
    howItWorks: "Mode d'action",
    composition: "Composition",
    pharmacology: "Pharmacologie",
    commonSideEffects: "Effets secondaires fréquents",
    seriousSideEffects: "Effets secondaires graves",
    overdoseSymptoms: "Symptômes de surdosage",
    interactions: "Interactions médicamenteuses",
    whoShouldAvoid: "Contre-indications",
    dietaryAdvice: "Conseils alimentaires",
    ifYouMissADose: "En cas d'oubli de dose",
    relatedMedicines: "Médicaments similaires",
    storageInstructions: "Consignes de conservation",
    sources: "Sources vérifiées",
    strength: "Dosage",
    imprint: "Empreinte",
    form: "Forme",
    translateOCR: "Traduire l'OCR",
    searchReport: "Rechercher dans le rapport",
    editOCR: "Modifier le texte OCR",
    compare: "Comparer",
    notes: "Notes",
    pdf: "Rapport PDF",
    share: "Partager",
    report: "Signaler",
    matchIntegrity: "Intégrité du registre",
    dosage: "Posologie",
    frequency: "Fréquence prescrite",
    duration: "Durée du traitement",
  },
  de: {
    home: "Startseite",
    history: "Verlauf",
    scan: "Scannen",
    browse: "Durchsuchen",
    settings: "Einstellungen",
    searchPlaceholder: "Medikamente suchen (z. B. Ibuprofen, Aspirin)...",
    scanAMedicine: "Medikament scannen",
    takePhotoToIdentify: "Foto machen zur sofortigen Identifizierung",
    cloudHistory: "Cloud-Verlauf",
    allergies: "Allergien",
    registries: "Register",
    recentHistory: "Letzte Suchen",
    commonMedications: "Häufige Medikamente",
    goodMorning: "Guten Morgen",
    goodAfternoon: "Guten Tag",
    goodEvening: "Guten Abend",
    scanNextMedicine: "Nächstes Medikament scannen",
    browseMoreMedicines: "Weitere Medikamente durchsuchen",
    downloadPDFReport: "PDF-Bericht herunterladen",
    timelineView: "Zeitleiste",
    favorites: "Favoriten",
    filters: "Filter",
    today: "Heute",
    thisWeek: "Diese Woche",
    thisMonth: "Diesen Monat",
    all: "Alle",
    labReport: "Laborbericht",
    prescription: "Rezept",
    vaccine: "Impfung",
    emergency: "Notfall",
    whatItsUsedFor: "Anwendungsgebiete",
    howItWorks: "Wirkungsweise",
    composition: "Zusammensetzung",
    pharmacology: "Pharmakologie",
    commonSideEffects: "Häufige Nebenwirkungen",
    seriousSideEffects: "Schwere Nebenwirkungen",
    overdoseSymptoms: "Überdosierungssymptome",
    interactions: "Wechselwirkungen",
    whoShouldAvoid: "Gegenanzeigen",
    dietaryAdvice: "Ernährungshinweise",
    ifYouMissADose: "Bei vergessener Dosis",
    relatedMedicines: "Verwandte Medikamente",
    storageInstructions: "Lagerungshinweise",
    sources: "Verifizierte Quellen",
    strength: "Stärke",
    imprint: "Prägung",
    form: "Form",
    translateOCR: "OCR übersetzen",
    searchReport: "Bericht durchsuchen",
    editOCR: "OCR korrigieren",
    compare: "Vergleichen",
    notes: "Notizen",
    pdf: "PDF-Bericht",
    share: "Teilen",
    report: "Melden",
    matchIntegrity: "Registerübereinstimmung",
    dosage: "Dosierung",
    frequency: "Verordnete Häufigkeit",
    duration: "Behandlungsdauer",
  },
  ar: {
    home: "الرئيسية",
    history: "السجل",
    scan: "مسح ضوئي",
    browse: "تصفح",
    settings: "الإعدادات",
    searchPlaceholder: "ابحث عن الأدوية (مثل بنادول، إيبوبروفين)...",
    scanAMedicine: "مسح دواء ضوئياً",
    takePhotoToIdentify: "التقط صورة للتعرف عليه فوراً",
    cloudHistory: "سجل السحابة",
    allergies: "الحساسية",
    registries: "السجلات الطبية",
    recentHistory: "السجل الحديث",
    commonMedications: "الأدوية الشائعة",
    goodMorning: "صباح الخير",
    goodAfternoon: "مساء الخير",
    goodEvening: "مساء الخير",
    scanNextMedicine: "مسح الدواء التالي",
    browseMoreMedicines: "تصفح المزيد من الأدوية",
    downloadPDFReport: "تحميل تقرير PDF",
    timelineView: "عرض الجدول الزمني",
    favorites: "المفضلة",
    filters: "تصفية",
    today: "اليوم",
    thisWeek: "هذا الأسبوع",
    thisMonth: "هذا الشهر",
    all: "الكل",
    labReport: "تقرير المختبر",
    prescription: "وصفة طبية",
    vaccine: "لقاح",
    emergency: "طوارئ",
    whatItsUsedFor: "دواعي الاستعمال",
    howItWorks: "آلية العمل",
    composition: "التركيب الدوائي",
    pharmacology: "علم الفارماكولوجي",
    commonSideEffects: "الآثار الجانبية الشائعة",
    seriousSideEffects: "الآثار الجانبية الخطيرة",
    overdoseSymptoms: "أعراض الجرعة الزائدة",
    interactions: "التداخلات الدوائية",
    whoShouldAvoid: "موانع الاستعمال",
    dietaryAdvice: "التعليمات الغذائية",
    ifYouMissADose: "في حال نسيان الجرعة",
    relatedMedicines: "الأدوية المماثلة",
    storageInstructions: "تعليمات التخزين",
    sources: "المصادر المعتمدة",
    strength: "التركيز",
    imprint: "النقش",
    form: "الشكل الدوائي",
    translateOCR: "ترجمة النص الضوئي",
    searchReport: "البحث في التقرير",
    editOCR: "تعديل نص المسح الضوئي",
    compare: "مقارنة",
    notes: "ملاحظات",
    pdf: "تقرير PDF",
    share: "مشاركة",
    report: "بلاغ",
    matchIntegrity: "دقة مطابقة السجل",
    dosage: "الجرعة",
    frequency: "التكرار الموصى به",
    duration: "مدة العلاج",
  },
};

export function getTranslation(lang: SupportedLanguage | undefined, key: string): string {
  const selectedLang = lang && TRANSLATIONS[lang] ? lang : "en";
  return TRANSLATIONS[selectedLang][key] || TRANSLATIONS["en"][key] || key;
}

const MEDICAL_PHRASES: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  es: {
    "Twice daily after meals": "Dos veces al día después de las comidas",
    "Once daily": "Una vez al día",
    "7 days prescribed": "7 días de tratamiento recetado",
    "Take after food": "Tomar después de las comidas",
    "Avoid alcohol": "Evitar el consumo de alcohol",
    "Dosage": "Dosis",
    "Tablet": "Comprimido",
    "Capsule": "Cápsula",
    "Syrup": "Jarabe",
  },
  fr: {
    "Twice daily after meals": "Deux fois par jour après les repas",
    "Once daily": "Une fois par jour",
    "7 days prescribed": "7 jours de traitement prescrit",
    "Take after food": "Prendre après le repas",
    "Avoid alcohol": "Éviter l'alcool",
    "Dosage": "Posologie",
    "Tablet": "Comprimé",
    "Capsule": "Gélule",
    "Syrup": "Sirop",
  },
  de: {
    "Twice daily after meals": "Zweimal täglich nach den Mahlzeiten",
    "Once daily": "Einmal täglich",
    "7 days prescribed": "7 Tage verschrieben",
    "Take after food": "Nach dem Essen einnehmen",
    "Avoid alcohol": "Alkohol meiden",
    "Dosage": "Dosierung",
    "Tablet": "Tablette",
    "Capsule": "Kapsel",
    "Syrup": "Sirup",
  },
  ar: {
    "Twice daily after meals": "مرتين يومياً بعد الوجبات",
    "Once daily": "مرة واحدة يومياً",
    "7 days prescribed": "وصفة لمدة ٧ أيام",
    "Take after food": "تؤخذ بعد الطعام",
    "Avoid alcohol": "تجنب الكحول",
    "Dosage": "الجرعة",
    "Tablet": "قرص",
    "Capsule": "كبسولة",
    "Syrup": "شراب",
  },
};

export function translateMedicalText(text: string | undefined, lang: SupportedLanguage | undefined): string {
  if (!text) return "";
  const selectedLang = lang && LANGUAGES.some(l => l.code === lang) ? lang : "en";
  if (selectedLang === "en") return text;

  const phraseMap = MEDICAL_PHRASES[selectedLang];
  if (phraseMap && phraseMap[text]) {
    return phraseMap[text];
  }

  // Dynamic phrase pattern replacements
  let translated = text;
  if (selectedLang === "es") {
    translated = translated
      .replace(/Mild to moderate pain relief/gi, "Alivio del dolor leve a moderado")
      .replace(/headache, toothache, muscle ache/gi, "dolor de cabeza, dolor de muelas, dolor muscular")
      .replace(/Reducing fever/gi, "Reducción de la fiebre")
      .replace(/Cold and flu symptom relief/gi, "Alivio de los síntomas del resfriado y la gripe")
      .replace(/Usually well tolerated/gi, "Generalmente bien tolerado")
      .replace(/Rare nausea/gi, "Náuseas raras")
      .replace(/Mild rash/gi, "Erupción leve")
      .replace(/Store below 25°C/gi, "Almacenar a menos de 25°C")
      .replace(/Keep out of reach of children/gi, "Mantener fuera del alcance de los niños")
      .replace(/Twice daily after meals/gi, "Dos veces al día después de las comidas")
      .replace(/Once daily/gi, "Una vez al día")
      .replace(/after meals/gi, "después de las comidas")
      .replace(/days prescribed/gi, "días recetados")
      .replace(/Consult a doctor/gi, "Consulte a un médico")
      .replace(/Category B/gi, "Categoría B")
      .replace(/Pregnancy/gi, "Embarazo")
      .replace(/Dosage/gi, "Dosis");
  } else if (selectedLang === "fr") {
    translated = translated
      .replace(/Mild to moderate pain relief/gi, "Soulagement de la douleur légère à modérée")
      .replace(/headache, toothache, muscle ache/gi, "maux de tête, maux de dents, douleurs musculaires")
      .replace(/Reducing fever/gi, "Réduction de la fièvre")
      .replace(/Cold and flu symptom relief/gi, "Soulagement des symptômes du rhume et de la grippe")
      .replace(/Usually well tolerated/gi, "Généralement bien toléré")
      .replace(/Rare nausea/gi, "Nausées rares")
      .replace(/Mild rash/gi, "Éruption cutanée légère")
      .replace(/Store below 25°C/gi, "Conserver en dessous de 25°C")
      .replace(/Keep out of reach of children/gi, "Garder hors de portée des enfants")
      .replace(/Twice daily after meals/gi, "Deux fois par jour après les repas")
      .replace(/Once daily/gi, "Une fois par jour")
      .replace(/after meals/gi, "après les repas")
      .replace(/days prescribed/gi, "jours prescrits")
      .replace(/Consult a doctor/gi, "Consulter un médecin")
      .replace(/Category B/gi, "Catégorie B")
      .replace(/Pregnancy/gi, "Grossesse")
      .replace(/Dosage/gi, "Posologie");
  } else if (selectedLang === "de") {
    translated = translated
      .replace(/Mild to moderate pain relief/gi, "Linderung leichter bis mäßiger Schmerzen")
      .replace(/headache, toothache, muscle ache/gi, "Kopfschmerzen, Zahnschmerzen, Muskelschmerzen")
      .replace(/Reducing fever/gi, "Fiebersenkung")
      .replace(/Cold and flu symptom relief/gi, "Linderung von Erkältungs- und Grippesymptomen")
      .replace(/Usually well tolerated/gi, "Im Allgemeinen gut verträglich")
      .replace(/Rare nausea/gi, "Seltene Übelkeit")
      .replace(/Mild rash/gi, "Leichter Hautausschlag")
      .replace(/Store below 25°C/gi, "Unter 25°C lagern")
      .replace(/Keep out of reach of children/gi, "Außerhalb der Reichweite von Kindern aufbewahren")
      .replace(/Twice daily after meals/gi, "Zweimal täglich nach den Mahlzeiten")
      .replace(/Once daily/gi, "Einmal täglich")
      .replace(/after meals/gi, "nach den Mahlzeiten")
      .replace(/days prescribed/gi, "Tage verschrieben")
      .replace(/Consult a doctor/gi, "Konsultieren Sie einen Arzt")
      .replace(/Category B/gi, "Kategorie B")
      .replace(/Pregnancy/gi, "Schwangerschaft")
      .replace(/Dosage/gi, "Dosierung");
  } else if (selectedLang === "ar") {
    translated = translated
      .replace(/Mild to moderate pain relief/gi, "تخفيف الآلام الخفيفة إلى المتوسطة")
      .replace(/headache, toothache, muscle ache/gi, "الصداع، آلام الأسنان، آلام العضلات")
      .replace(/Reducing fever/gi, "خفض الحرارة والجمى")
      .replace(/Cold and flu symptom relief/gi, "تخفيف أعراض البرد والإنفلونزا")
      .replace(/Usually well tolerated/gi, "يتحمله الجسم جيداً بشكل عام")
      .replace(/Rare nausea/gi, "غثيان نادر")
      .replace(/Mild rash/gi, "طفح جلدي خفيف")
      .replace(/Store below 25°C/gi, "يحفظ في درجة حرارة أقل من ٢٥ مئوية")
      .replace(/Keep out of reach of children/gi, "يحفظ بعيداً عن متناول الأطفال")
      .replace(/Twice daily after meals/gi, "مرتين يومياً بعد الوجبات")
      .replace(/Once daily/gi, "مرة يومياً")
      .replace(/after meals/gi, "بعد الوجبات")
      .replace(/days prescribed/gi, "أيام علاج")
      .replace(/Consult a doctor/gi, "استشر الطبيب")
      .replace(/Category B/gi, "الفئة ب")
      .replace(/Pregnancy/gi, "الحمل")
      .replace(/Dosage/gi, "الجرعة");
  }

  return translated;
}
