/**
 * OCR Accuracy Test Suite — 58 test cases
 * Run with: node /home/z/my-project/scripts/ocr-test.js
 */

const Tesseract = require("tesseract.js");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const TEST_CASES = [
  // OTC medicines (20)
  ["Tylenol", "TYLENOL Acetaminophen 500 mg Pain Reliever Fever Reducer 24 Tablets"],
  ["Advil", "ADVIL Ibuprofen 200 mg Pain Reliever NSAID 30 Tablets"],
  ["Aleve", "ALEVE Naproxen Sodium 220 mg Pain Reliever 50 Caplets"],
  ["Aspirin", "ASPIRIN 81 mg Low Dose Pain Reliever 120 Tablets"],
  ["Benadryl", "BENADRYL Diphenhydramine HCl 25 mg Antihistamine 24 Tablets"],
  ["Claritin", "CLARITIN Loratadine 10 mg Allergy Relief 30 Tablets"],
  ["Zyrtec", "ZYRTEC Cetirizine HCl 10 mg Allergy Relief 30 Tablets"],
  ["Mucinex", "MUCINEX Guaifenesin 600 mg Expectorant 20 Tablets"],
  ["Pepto-Bismol", "PEPTO-BISMOL Bismuth Subsalicylate 262 mg Upset Stomach Relief"],
  ["Imodium", "IMODIUM Loperamide HCl 2 mg Anti-Diarrheal 24 Caplets"],
  ["Sudafed", "SUDAFED Pseudoephedrine 30 mg Nasal Decongestant 24 Tablets"],
  ["Tums", "TUMS Calcium Carbonate 750 mg Antacid 96 Tablets"],
  ["Rolaids", "ROLAIDS Calcium Carbonate 550 mg Antacid 150 Tablets"],
  ["NyQuil", "NYQUIL Acetaminophen 325 mg Cold and Flu Relief 12 oz"],
  ["DayQuil", "DAYQUIL Acetaminophen 325 mg Cold and Flu Relief 12 oz"],
  ["Dramamine", "DRAMAMINE Dimenhydrinate 50 mg Motion Sickness Relief 12 Tablets"],
  ["Hydrocortisone", "HYDROCORTISONE 1% Anti-Itch Cream 1 oz Tube"],
  ["Neosporin", "NEOSPORIN Antibiotic Ointment 0.5 oz Tube"],
  ["Melatonin", "MELATONIN 3 mg Sleep Aid 60 Tablets"],
  ["Vitamin C", "VITAMIN C 1000 mg Immune Support 60 Tablets"],
  // Prescription (15)
  ["Amoxicillin", "AMOXICILLIN 500 mg Capsule 21 Capsules Rx Only"],
  ["Metformin", "METFORMIN HCl 500 mg Tablet 60 Tablets Rx Only"],
  ["Lipitor", "LIPITOR Atorvastatin 20 mg Cholesterol 30 Tablets Rx"],
  ["Lisinopril", "LISINOPRIL 10 mg Tablet 30 Tablets Rx Blood Pressure"],
  ["Losartan", "LOSARTAN 50 mg Tablet 30 Tablets Rx Blood Pressure"],
  ["Omeprazole", "OMEPRAZOLE 20 mg Delayed Release 14 Capsules"],
  ["Sertraline", "SERTRALINE 50 mg Tablet 30 Tablets Rx Antidepressant"],
  ["Levothyroxine", "LEVOTHYROXINE 50 mcg Tablet 30 Tablets Rx Thyroid"],
  ["Atorvastatin", "ATORVASTATIN 40 mg Tablet 30 Tablets Rx Cholesterol"],
  ["Azithromycin", "AZITHROMYCIN 250 mg Tablet 6 Tablets Rx Antibiotic"],
  ["Ciprofloxacin", "CIPROFLOXACIN 500 mg Tablet 20 Tablets Rx Antibiotic"],
  ["Doxycycline", "DOXYCYCLINE 100 mg Capsule 30 Capsules Rx Antibiotic"],
  ["Prednisone", "PREDNISONE 20 mg Tablet 20 Tablets Rx Steroid"],
  ["Albuterol", "ALBUTEROL 90 mcg Inhaler 200 Doses Rx Asthma"],
  ["Gabapentin", "GABAPENTIN 300 mg Capsule 30 Capsules Rx Nerve Pain"],
  // Imprint codes (10)
  ["L484", "L484 White Oval Tablet Acetaminophen 500 mg"],
  ["IP 115", "IP 115 White Oval Hydrocodone 10 mg"],
  ["M367", "M367 White Oblong Hydrocodone 10/325 mg"],
  ["TEVA 833", "TEVA 833 Green Round Clonazepam 1 mg"],
  ["WG 10", "WG 10 White Round Lisinopril 10 mg"],
  ["AMOX 500", "AMOX 500 Red Yellow Capsule Amoxicillin 500 mg"],
  ["V 3601", "V 3601 Yellow Oval Hydrocodone 10/325"],
  ["CET 10", "CET 10 White Oval Cetirizine 10 mg"],
  ["MET 500", "MET 500 White Round Metformin 500 mg"],
  ["20 PD", "20 PD White Oval Atorvastatin 20 mg"],
  // Packaging (8)
  ["Cortizone-10", "CORTIZONE-10 Sensitive Skin Hydrocortisone 1% Anti-Itch Cream 2 oz"],
  ["Excedrin", "EXCEDRIN Extra Strength Acetaminophen 250 mg Aspirin 250 mg Caffeine 65 mg"],
  ["Robitussin", "ROBITUSSIN Dextromethorphan 10 mg Cough Suppressant 4 oz Syrup"],
  ["Miralax", "MIRALAX Polyethylene Glycol 3350 17 g Laxative 14 Doses"],
  ["Metamucil", "METAMUCIL Psyllium Fiber 5.8 g 72 Servings"],
  ["Nicorette", "NICORETTE Nicotine Polacrilex 2 mg Stop Smoking 110 Pieces"],
  ["Flonase", "FLONASE Fluticasone 50 mcg Allergy Nasal Spray 120 Sprays"],
  ["Prevacid", "PREVACID Lansoprazole 15 mg Acid Reducer 14 Capsules"],
  // Garbled/partial (5)
  ["Acetaminophen", "Acetaminophn 500 mg Tablt Pain Rleiver"],
  ["Ibuprofen", "Ibuprofn 200 mg NSAID 30 Tabets"],
  ["Amoxicillin", "Amoxicilin 500 mg Capsl Antibotic"],
  ["Hydrocortisone", "Hydrocortsone 1% Creme Anti Itch"],
  ["Loratadine", "Loratdine 10 mg Allrgy 30 Tablts"],
];

const MEDICINE_DICT = [
  "acetaminophen","paracetamol","ibuprofen","aspirin","naproxen","diclofenac",
  "amoxicillin","ampicillin","penicillin","azithromycin","doxycycline","ciprofloxacin",
  "cephalexin","hydrocortisone","cortizone","loratadine","cetirizine","fexofenadine",
  "diphenhydramine","guaifenesin","dextromethorphan","pseudoephedrine","phenylephrine",
  "metformin","atorvastatin","simvastatin","rosuvastatin","lisinopril","losartan",
  "amlodipine","omeprazole","esomeprazole","lansoprazole","pantoprazole","sertraline",
  "fluoxetine","levothyroxine","prednisone","gabapentin","albuterol","salbutamol",
  "fluticasone","budesonide","montelukast","melatonin","nicotine","clonazepam",
  "hydrocodone","tylenol","advil","motrin","aleve","benadryl","sudafed","claritin",
  "zyrtec","allegra","mucinex","pepto","tums","rolaids","imodium","nyquil","dayquil",
  "dramamine","neosporin","flonase","prevacid","excedrin","robitussin","miralax",
  "metamucil","nicorette","cetirizine","bismuth","loperamide","dimenhydrinate",
  "polyethylene","psyllium","lansoprazole","fluticasone","vitamin","calcium","iron",
  "zinc","magnesium","potassium","naproxen","ranitidine","famotidine","pantoprazole",
];

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
    }
  }
  return dp[m][n];
}

function correctWithDictionary(text) {
  const words = text.split(/(\s+)/);
  return words.map(token => {
    if (/^\s+$/.test(token)) return token;
    if (/^\d+$/.test(token) || token.length < 4) return token;
    const lower = token.toLowerCase().replace(/[^a-z]/g, "");
    if (lower.length < 4) return token;
    const exact = MEDICINE_DICT.find(d => d.toLowerCase() === lower);
    if (exact) {
      if (token === token.toUpperCase()) return exact.toUpperCase();
      if (token[0] === token[0].toUpperCase()) return exact.charAt(0).toUpperCase() + exact.slice(1);
      return exact;
    }
    let bestMatch = null, bestDist = 3;
    for (const dict of MEDICINE_DICT) {
      if (Math.abs(dict.length - lower.length) > 3) continue;
      const dist = levenshtein(lower, dict);
      if (dist < bestDist) { bestDist = dist; bestMatch = dict; }
    }
    if (bestMatch && bestDist <= 2) {
      if (token === token.toUpperCase()) return bestMatch.toUpperCase();
      if (token[0] === token[0].toUpperCase()) return bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1);
      return bestMatch;
    }
    return token;
  }).join("");
}

async function generateTestImage(text, index) {
  const canvas = createCanvas(600, 300);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 600, 300);
  const words = text.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).length > 35) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  ctx.fillStyle = "black";
  ctx.font = "bold 28px Arial";
  let y = 50;
  for (const line of lines) { ctx.fillText(line, 30, y); y += 40; }
  const fp = path.join("/tmp", `ocr-test-${index}.png`);
  fs.writeFileSync(fp, canvas.toBuffer("image/png"));
  return fp;
}

async function runOCR(filePath) {
  const result = await Tesseract.recognize(filePath, "eng", {
    tessedit_pageseg_mode: "6",
    tessedit_ocr_engine_mode: "1",
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:%()-/ \n",
    user_defined_dpi: "300",
  });
  return result.data.text || "";
}

function extractQuery(text) {
  const lowerText = text.toLowerCase();
  const words = text.split(/[\s\n]+/);

  // Strategy 0: If the FIRST word looks like an imprint code, use it
  // Imprint codes: L484, IP115, M367, V3601, 20PD, etc.
  const firstWord = words[0] || "";
  if (/^[A-Z]{1,3}\d{1,5}$|^\d{1,5}[A-Z]{1,3}$/.test(firstWord)) {
    return firstWord;
  }
  // Check "XX 123" pattern (two-word imprint like "IP 115", "V 3601")
  if (words.length >= 2 && /^[A-Z]{1,3}$/.test(firstWord) && /^\d{1,5}$/.test(words[1])) {
    return firstWord + " " + words[1];
  }
  // Check "123 XX" pattern (two-word imprint like "20 PD")
  if (words.length >= 2 && /^\d{1,5}$/.test(firstWord) && /^[A-Z]{1,3}$/.test(words[1])) {
    return firstWord + " " + words[1];
  }

  // Strategy 1: ALL CAPS words — brand names on packaging are in ALL CAPS
  // Exclude common abbreviations that aren't medicine names
  const capsExclude = new Set(["NSAID", "RX", "OTC", "NDC", "FDA", "NIH", "MG", "MCG", "ML", "API"]);
  const allCaps = words.filter(w => w.length >= 4 && w.length <= 20 && /^[A-Z]+$/.test(w) && !capsExclude.has(w));
  if (allCaps.length > 0) {
    return allCaps[0]; // First ALL CAPS word = brand name
  }

  // Strategy 2: Known dictionary match
  const found = MEDICINE_DICT.find(b => {
    const re = new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(lowerText);
  });
  if (found) return found.charAt(0).toUpperCase() + found.slice(1);

  // Strategy 3: Imprint pattern anywhere in text
  const imprintMatch = text.match(/\b([A-Z]{1,3}\d{1,5}|\d{1,5}[A-Z]{1,3})\b/);
  if (imprintMatch) return imprintMatch[1];

  // Strategy 4: Capitalized word
  const brandLike = words.find(w => /^[A-Z][a-z]{3,}$/.test(w));
  if (brandLike) return brandLike;

  return words.slice(0, 2).join(" ");
}

function isMatch(expected, extracted) {
  const e = expected.toLowerCase(), x = extracted.toLowerCase();
  if (e === x) return true;
  if (x.includes(e) || e.includes(x)) return true;
  if (levenshtein(e, x) <= 2) return true;
  for (const w of x.split(/\s+/)) {
    if (w.includes(e) || e.includes(w)) return true;
    if (w.length >= 4 && levenshtein(e, w) <= 2) return true;
  }
  return false;
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║       MedSnap OCR Accuracy Test Suite (" + TEST_CASES.length + " tests)     ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  let correct = 0;
  const results = [];
  for (let i = 0; i < TEST_CASES.length; i++) {
    const [expected, labelText] = TEST_CASES[i];
    process.stdout.write(`[${String(i+1).padStart(2)}/${TEST_CASES.length}] "${expected}"... `);
    try {
      const imgPath = await generateTestImage(labelText, i);
      const rawText = await runOCR(imgPath);
      const corrected = correctWithDictionary(rawText);
      const extracted = extractQuery(corrected);
      const match = isMatch(expected, extracted);
      if (match) { correct++; console.log("PASS → \"" + extracted + "\""); }
      else console.log("FAIL → \"" + extracted + "\" (expected \"" + expected + "\")");
      results.push({ expected, extracted, match });
      try { fs.unlinkSync(imgPath); } catch {}
    } catch (err) {
      console.log("ERROR → " + err.message);
      results.push({ expected, extracted: "ERROR", match: false });
    }
  }
  const accuracy = ((correct / TEST_CASES.length) * 100).toFixed(1);
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log(`║  Results: ${correct}/${TEST_CASES.length} passed`);
  console.log(`║  Accuracy: ${accuracy}%`);
  console.log("╚══════════════════════════════════════════════════════╝\n");
  const cats = { "OTC": [0,20], "Rx": [20,35], "Imprint": [35,45], "Pkg": [45,53], "Garbled": [53,58] };
  for (const [cat,[s,e]] of Object.entries(cats)) {
    const r = results.slice(s,e), c = r.filter(x=>x.match).length;
    console.log(`  ${cat}: ${c}/${r.length} (${((c/r.length)*100).toFixed(0)}%)`);
  }
  const fails = results.filter(r => !r.match);
  if (fails.length) { console.log("\nFailures:"); for (const f of fails) console.log(`  ❌ "${f.expected}" → "${f.extracted}"`); }
}

main().catch(console.error);
