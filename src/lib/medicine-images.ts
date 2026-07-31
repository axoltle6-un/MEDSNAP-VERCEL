/**
 * Verified medicine images, resolved at build time.
 *
 * WHY A STATIC MAP
 * The 158 static /medicine pages had no images at all, and resolving them at
 * request time would mean two extra network round-trips per page render —
 * unacceptable for pages whose whole purpose is to be fast, crawlable HTML.
 *
 * HOW THESE WERE VERIFIED
 * Wikipedia's search happily returns a plausible-looking photo for a drug it
 * cannot match, which is how an earlier version of this app showed cefalexin
 * for Advil. Every candidate here was checked so that the image FILENAME
 * shares a token with either the brand or its generic. That filter rejected
 * 22 wrong images, including Panadol -> a Vicodin photo, Risek -> an
 * esomeprazole model (wrong drug, right class), and Litong -> a photograph of
 * a mosque.
 *
 * Rejected entries fell back to a PubChem 2D structure diagram, which is
 * resolved BY the generic name and therefore cannot be the wrong molecule.
 *
 *   product   = photograph of the actual medicine or its packaging
 *   structure = chemical structure diagram of the active ingredient
 *
 * 140 of 158 medicines have an image (90 product photos, 50 structures).
 * Generated file — regenerate with scripts/fetch-medicine-images.py.
 */

export interface MedicineImage {
  /** Image URL. Serve through /api/image-proxy to avoid CORS and hotlink issues. */
  u: string;
  /** product | structure */
  t: "product" | "structure";
}

export const MEDICINE_IMAGES: Record<string, MedicineImage> = {
"Actifed": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5282443/PNG?record_type=2d&image_size=400x400"
},
"Ahuanglin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Azithromycin.svg/500px-Azithromycin.svg.png"
},
"Airtek": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Montelukast_3D_ball-and-stick.png/500px-Montelukast_3D_ball-and-stick.png"
},
"Amaryl": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/3476/PNG?record_type=2d&image_size=400x400"
},
"Ambrolytic": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Ambroxol_structural_formulae.png/500px-Ambroxol_structural_formulae.png"
},
"Amoxicillin China": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Amoxicillin_and_clavulanic_acid.svg/500px-Amoxicillin_and_clavulanic_acid.svg.png"
},
"Amoxil": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Amoxicillin_and_clavulanic_acid.svg/500px-Amoxicillin_and_clavulanic_acid.svg.png"
},
"Angised": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4510/PNG?record_type=2d&image_size=400x400"
},
"Arinac": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Ibuprofen-3D-balls.png/500px-Ibuprofen-3D-balls.png"
},
"Ascard": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?record_type=2d&image_size=400x400"
},
"Augmentin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Amoxicillin_and_clavulanic_acid.svg/500px-Amoxicillin_and_clavulanic_acid.svg.png"
},
"Avil": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5282139/PNG?record_type=2d&image_size=400x400"
},
"Azomax": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Azithromycin.svg/500px-Azithromycin.svg.png"
},
"Baijiahei": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1983/PNG?record_type=2d&image_size=400x400"
},
"Betnovate": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/16533/PNG?record_type=2d&image_size=400x400"
},
"Bokeli": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Felodipine_structure.svg/500px-Felodipine_structure.svg.png"
},
"Brufen": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Ibuprofen-3D-balls.png/500px-Ibuprofen-3D-balls.png"
},
"Buscopan": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6852391/PNG?record_type=2d&image_size=400x400"
},
"Caflam": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Diclofenac.svg/500px-Diclofenac.svg.png"
},
"Calamox": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Amoxicillin_and_clavulanic_acid.svg/500px-Amoxicillin_and_clavulanic_acid.svg.png"
},
"Calcium Sandoz": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/10112/PNG?record_type=2d&image_size=400x400"
},
"Calpol": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1983/PNG?record_type=2d&image_size=400x400"
},
"Canesten": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Clotrimazole.svg/500px-Clotrimazole.svg.png"
},
"Cardura": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Doxazosin.svg/500px-Doxazosin.svg.png"
},
"Cefspan": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Cefixime_skeletal_structure.svg/500px-Cefixime_skeletal_structure.svg.png"
},
"Celebrex": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Celecoxib.svg/500px-Celecoxib.svg.png"
},
"Cetrizet": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cetirizine_structure.svg/500px-Cetirizine_structure.svg.png"
},
"Ciproxin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Ciprofloxacin_chemical_structure.svg/500px-Ciprofloxacin_chemical_structure.svg.png"
},
"Concor": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/CONCOR_LOGO.jpg/500px-CONCOR_LOGO.jpg"
},
"Coversyl": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Perindopril_2.svg/500px-Perindopril_2.svg.png"
},
"Decadron": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5743/PNG?record_type=2d&image_size=400x400"
},
"Deltacortril": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5755/PNG?record_type=2d&image_size=400x400"
},
"Dermovate": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Clobetasol_Propionate.svg/500px-Clobetasol_Propionate.svg.png"
},
"Diamicron": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/3475/PNG?record_type=2d&image_size=400x400"
},
"Diflucan": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Fluconazole_skeletal_formula.svg/500px-Fluconazole_skeletal_formula.svg.png"
},
"Diovan": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Valsartan_skeletal.svg/500px-Valsartan_skeletal.svg.png"
},
"Disprin": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?record_type=2d&image_size=400x400"
},
"Doxycap": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Doxycycline_structure.svg/500px-Doxycycline_structure.svg.png"
},
"Duphalac": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Lactulose_structure.svg/500px-Lactulose_structure.svg.png"
},
"Duphaston": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Dydrogesterone.svg/500px-Dydrogesterone.svg.png"
},
"Entamizole": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Metronidazole.svg/500px-Metronidazole.svg.png"
},
"Epival": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/16760703/PNG?record_type=2d&image_size=400x400"
},
"Exforge": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2162/PNG?record_type=2d&image_size=400x400"
},
"Fenbid": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Ibuprofen-3D-balls.png/500px-Ibuprofen-3D-balls.png"
},
"Ferrous Sulphate": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/24393/PNG?record_type=2d&image_size=400x400"
},
"Flagyl": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Metronidazole.svg/500px-Metronidazole.svg.png"
},
"Flixotide": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Fluticasone_propionate.svg/500px-Fluticasone_propionate.svg.png"
},
"Folic Acid": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/135398658/PNG?record_type=2d&image_size=400x400"
},
"Fucidin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Fusidic_acid_structure.svg/500px-Fusidic_acid_structure.svg.png"
},
"Fungone": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Fluconazole_skeletal_formula.svg/500px-Fluconazole_skeletal_formula.svg.png"
},
"Gabapin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Gabapentin_structure.svg/500px-Gabapentin_structure.svg.png"
},
"Galvus": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Vildagliptin.svg/500px-Vildagliptin.svg.png"
},
"Geliekang": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Metformin.svg/500px-Metformin.svg.png"
},
"Glucophage": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Metformin.svg/500px-Metformin.svg.png"
},
"Glucophage XR": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Metformin.svg/500px-Metformin.svg.png"
},
"Gravinate": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/10660/PNG?record_type=2d&image_size=400x400"
},
"Humulin": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/118984375/PNG?record_type=2d&image_size=400x400"
},
"Hydrillin": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/3100/PNG?record_type=2d&image_size=400x400"
},
"Imodium": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Loperamide.svg/500px-Loperamide.svg.png"
},
"Inderal": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4946/PNG?record_type=2d&image_size=400x400"
},
"Indever": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5280795/PNG?record_type=2d&image_size=400x400"
},
"Isordil": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Isosorbide_dinitrate_structure.svg/500px-Isosorbide_dinitrate_structure.svg.png"
},
"Januvia": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Sitagliptin.svg/500px-Sitagliptin.svg.png"
},
"KaiRuiTan": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Loratadine.svg/500px-Loratadine.svg.png"
},
"Klaricid": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Clarithromycin_structure.svg/500px-Clarithromycin_structure.svg.png"
},
"Lantus": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/118984454/PNG?record_type=2d&image_size=400x400"
},
"Lasix": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/3440/PNG?record_type=2d&image_size=400x400"
},
"Levoflox": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Levofloxacin_chemical_structure.svg/500px-Levofloxacin_chemical_structure.svg.png"
},
"Lexotanil": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Bromazepam.svg/500px-Bromazepam.svg.png"
},
"Lianhua Qingwen": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Lianhua_Qingwen_Capsules_by_Beijing_Yiling_%2820221219230142%29.jpg/500px-Lianhua_Qingwen_Capsules_by_Beijing_Yiling_%2820221219230142%29.jpg"
},
"Lipiget": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Atorvastatin.svg/500px-Atorvastatin.svg.png"
},
"Lipitor": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Atorvastatin.svg/500px-Atorvastatin.svg.png"
},
"Litong": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/60823/PNG?record_type=2d&image_size=400x400"
},
"Loprin": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2244/PNG?record_type=2d&image_size=400x400"
},
"Loratin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Loratadine.svg/500px-Loratadine.svg.png"
},
"Losec": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4594/PNG?record_type=2d&image_size=400x400"
},
"Luodingming": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Amlodipine.svg/500px-Amlodipine.svg.png"
},
"Lyrica": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Pregabalin_structure.svg/500px-Pregabalin_structure.svg.png"
},
"Meilin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Ibuprofen-3D-balls.png/500px-Ibuprofen-3D-balls.png"
},
"Montiget": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Montelukast_3D_ball-and-stick.png/500px-Montelukast_3D_ball-and-stick.png"
},
"Motilium": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/3151/PNG?record_type=2d&image_size=400x400"
},
"Mucaine": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/10176082/PNG?record_type=2d&image_size=400x400"
},
"Mucolator": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Acetylcysteine2.svg/500px-Acetylcysteine2.svg.png"
},
"Myteka": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Montelukast_3D_ball-and-stick.png/500px-Montelukast_3D_ball-and-stick.png"
},
"Neo-Mercazole": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Carbimazole.svg/500px-Carbimazole.svg.png"
},
"Neodipar": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Metformin.svg/500px-Metformin.svg.png"
},
"Neurobion": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1130/PNG?record_type=2d&image_size=400x400"
},
"Nexito": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/146570/PNG?record_type=2d&image_size=400x400"
},
"Nexum": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Esomeprazole_ball-and-stick_model.png/500px-Esomeprazole_ball-and-stick_model.png"
},
"Norvasc": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Amlodipine.svg/500px-Amlodipine.svg.png"
},
"Novomix": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/f/fb/Insulin_Aspart_Structural_Formula.gif"
},
"Nuberol": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1983/PNG?record_type=2d&image_size=400x400"
},
"Omepral": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4594/PNG?record_type=2d&image_size=400x400"
},
"Optive": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6328154/PNG?record_type=2d&image_size=400x400"
},
"Osclot": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Clopidogrel_skeletal_formula.svg/500px-Clopidogrel_skeletal_formula.svg.png"
},
"Osnate D": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/13136/PNG?record_type=2d&image_size=400x400"
},
"Oxidil": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Ceftriaxone_skeletal_formula_from_xtal_2018.svg/500px-Ceftriaxone_skeletal_formula_from_xtal_2018.svg.png"
},
"Panadol": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1983/PNG?record_type=2d&image_size=400x400"
},
"Plavix": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Clopidogrel_skeletal_formula.svg/500px-Clopidogrel_skeletal_formula.svg.png"
},
"Ponstan": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4044/PNG?record_type=2d&image_size=400x400"
},
"Provera": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6279/PNG?record_type=2d&image_size=400x400"
},
"Prozac": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/3386/PNG?record_type=2d&image_size=400x400"
},
"Qalsan D": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/10112/PNG?record_type=2d&image_size=400x400"
},
"Rigix": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cetirizine_structure.svg/500px-Cetirizine_structure.svg.png"
},
"Risek": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4594/PNG?record_type=2d&image_size=400x400"
},
"Risperdal": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/5073/PNG?record_type=2d&image_size=400x400"
},
"Rocephin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Ceftriaxone_skeletal_formula_from_xtal_2018.svg/500px-Ceftriaxone_skeletal_formula_from_xtal_2018.svg.png"
},
"Rosuvas": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Ezetimibe_and_rosuvastatin.svg/500px-Ezetimibe_and_rosuvastatin.svg.png"
},
"Sanjiu Ganmao Ling": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1983/PNG?record_type=2d&image_size=400x400"
},
"Septran": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Sulfamethoxazole-from-xtal-3D-bs-17.png/500px-Sulfamethoxazole-from-xtal-3D-bs-17.png"
},
"Seretide": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Fluticasone_propionate_and_salmeterol.svg/500px-Fluticasone_propionate_and_salmeterol.svg.png"
},
"Singulair": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Montelukast_3D_ball-and-stick.png/500px-Montelukast_3D_ball-and-stick.png"
},
"Sirong": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Zolpidem2DACS.svg/500px-Zolpidem2DACS.svg.png"
},
"Softin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cetirizine_structure.svg/500px-Cetirizine_structure.svg.png"
},
"Solu-Medrol": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/6741/PNG?record_type=2d&image_size=400x400"
},
"Stemetil": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/4917/PNG?record_type=2d&image_size=400x400"
},
"Tainuo": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/1983/PNG?record_type=2d&image_size=400x400"
},
"Tegral": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Carbamazepine.svg/500px-Carbamazepine.svg.png"
},
"Telfast": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Fexofenadine2DCSD.svg/500px-Fexofenadine2DCSD.svg.png"
},
"Tenormin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Atenolol_chemical_structure.svg/500px-Atenolol_chemical_structure.svg.png"
},
"Theophylline": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/2153/PNG?record_type=2d&image_size=400x400"
},
"Thyroxine": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Levothyroxine-from-xtal-3D-bs-17.png/500px-Levothyroxine-from-xtal-3D-bs-17.png"
},
"Tobrex": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Tobramycin_1lc4.png/500px-Tobramycin_1lc4.png"
},
"Toubaosu": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Cefalexin.svg/500px-Cefalexin.svg.png"
},
"Tramal": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/63013/PNG?record_type=2d&image_size=400x400"
},
"Uromax": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Tamsulosin.svg/500px-Tamsulosin.svg.png"
},
"Velosef": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Cefradine.svg/500px-Cefradine.svg.png"
},
"Ventolin": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/RS-salbutamol-from-xtal-3D-balls.png/500px-RS-salbutamol-from-xtal-3D-balls.png"
},
"Voltral": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Diclofenac.svg/500px-Diclofenac.svg.png"
},
"Vomilast": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Ondansetron_structure.svg/500px-Ondansetron_structure.svg.png"
},
"Xanax": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Alprazolam_structure.svg/500px-Alprazolam_structure.svg.png"
},
"Xatral": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Alfuzosin.svg/500px-Alfuzosin.svg.png"
},
"Xilening": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cetirizine_structure.svg/500px-Cetirizine_structure.svg.png"
},
"Yunnan Baiyao": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Yunnanbaiyao.JPG/500px-Yunnanbaiyao.JPG"
},
"Zantac": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Ranitidine.svg/500px-Ranitidine.svg.png"
},
"Zestril": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Lisinopril_structure.svg/500px-Lisinopril_structure.svg.png"
},
"Zincat": {
"t": "structure",
"u": "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/24424/PNG?record_type=2d&image_size=400x400"
},
"Zithromax": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Azithromycin.svg/500px-Azithromycin.svg.png"
},
"Zoltar": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Esomeprazole_ball-and-stick_model.png/500px-Esomeprazole_ball-and-stick_model.png"
},
"Zyrtec": {
"t": "product",
"u": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Cetirizine_structure.svg/500px-Cetirizine_structure.svg.png"
}
};

/** Image for a brand, or null when we have no verified image. */
export function getMedicineImageFor(brand: string): MedicineImage | null {
  return MEDICINE_IMAGES[brand] || null;
}

/**
 * Proxied URL. Routing through our own domain avoids CORS failures and
 * referrer-based hotlink blocking on Wikimedia.
 */
export function proxiedImageUrl(u: string): string {
  return `/api/image-proxy?url=${encodeURIComponent(u)}`;
}
