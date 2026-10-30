import json, re, sys
W={'C':12.011,'H':1.008,'N':14.007,'O':15.999,'S':32.06,'Cl':35.45,'F':18.998}
def mass(f): return sum(W[e]*int(n or 1) for e,n in re.findall(r'([A-Z][a-z]?)(\d*)',f))
def cas_ok(c):
    d=c.replace('-',''); return sum(int(x)*(i+1) for i,x in enumerate(reversed(d[:-1])))%10==int(d[-1])
# id: (formule, masse PubChem g/mol, CAS, CID, nom IUPAC, synonymes)
D={
'ketoprofene':('C16H14O3',254.28,'22071-15-4',3825,'2-(3-benzoylphenyl)propanoic acid',['Ketoprofen']),
'amoxicilline':('C16H19N3O5S',365.4,'26787-78-0',33613,'(2S,5R,6R)-6-[[(2R)-2-amino-2-(4-hydroxyphenyl)acetyl]amino]-3,3-dimethyl-7-oxo-4-thia-1-azabicyclo[3.2.0]heptane-2-carboxylic acid',['Amoxicillin']),
'ampicilline':('C16H19N3O4S',349.4,'69-53-4',6249,'(2S,5R,6R)-6-[[(2R)-2-amino-2-phenylacetyl]amino]-3,3-dimethyl-7-oxo-4-thia-1-azabicyclo[3.2.0]heptane-2-carboxylic acid',['Ampicillin']),
'ciprofloxacine':('C17H18FN3O3',331.34,'85721-33-1',2764,'1-cyclopropyl-6-fluoro-4-oxo-7-piperazin-1-ylquinoline-3-carboxylic acid',['Ciprofloxacin']),
'metronidazole':('C6H9N3O3',171.15,'443-48-1',4173,'2-(2-methyl-5-nitroimidazol-1-yl)ethanol',[]),
'cafeine':('C8H10N4O2',194.19,'58-08-2',2519,'1,3,7-trimethylpurine-2,6-dione',['Caffeine']),
'lidocaine':('C14H22N2O',234.34,'137-58-6',3676,'2-(diethylamino)-N-(2,6-dimethylphenyl)acetamide',['Lidocaine']),
'propranolol':('C16H21NO2',259.34,'525-66-6',4946,'1-naphthalen-1-yloxy-3-(propan-2-ylamino)propan-2-ol',[]),
'metformine':('C4H11N5',129.16,'657-24-9',4091,'3-(diaminomethylidene)-1,1-dimethylguanidine',['Metformin']),
'omeprazole':('C17H19N3O3S',345.4,'73590-58-6',4594,'6-methoxy-2-[(4-methoxy-3,5-dimethylpyridin-2-yl)methylsulfinyl]-1H-benzimidazole',[]),
'fluoxetine':('C17H18F3NO',309.33,'54910-89-3',3386,'N-methyl-3-phenyl-3-[4-(trifluoromethyl)phenoxy]propan-1-amine',[]),
'diazepam':('C16H13ClN2O',284.74,'439-14-5',3016,'7-chloro-1-methyl-5-phenyl-3H-1,4-benzodiazepin-2-one',[]),
'loratadine':('C22H23ClN2O2',382.9,'79794-75-5',3957,'ethyl 4-(13-chloro-4-azatricyclo[9.4.0.0^{3,8}]pentadeca-1(11),3(8),4,6,12,14-hexaen-2-ylidene)piperidine-1-carboxylate',[]),
'hydrochlorothiazide':('C7H8ClN3O4S2',297.7,'58-93-5',3639,'6-chloro-1,1-dioxo-3,4-dihydro-2H-1,2,4-benzothiadiazine-7-sulfonamide',['Hydrochlorothiazide (HCTZ)']),
'simvastatine':('C25H38O5',418.6,'79902-63-9',54454,'[(1S,3R,7S,8S,8aR)-8-[2-[(2R,4R)-4-hydroxy-6-oxooxan-2-yl]ethyl]-3,7-dimethyl-1,2,3,7,8,8a-hexahydronaphthalen-1-yl] 2,2-dimethylbutanoate',['Simvastatin']),
}
p='data/molecules.json'; data=json.load(open(p,encoding='utf-8')); errs=0; n=0
for m in data['molecules']:
    if m['id'] not in D: continue
    f,mm,cas,cid,iupac,syn=D[m['id']]
    if abs(mass(f)-mm)>0.15: print('MASSE incohérente',m['id'],mass(f),mm); errs+=1
    if not cas_ok(cas): print('CAS invalide',m['id'],cas); errs+=1
    m.update(formula=f,molar_mass_g_mol=mm,cas_number=cas,pubchem_cid=cid,iupac_name=iupac,
      structure_image_url=f'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/PNG',
      pubchem_search_url=f'https://pubchem.ncbi.nlm.nih.gov/compound/{cid}',
      synonyms=syn or m.get('synonyms',[]),
      chemical_data_source={'name':'PubChem (identifiants, formule, masse) / CAS Common Chemistry','url':f'https://pubchem.ncbi.nlm.nih.gov/compound/{cid}','note':'Formule/masse recalculées et contrôle de la clé CAS effectués localement; revérifier la fiche PubChem avant publication.'})
    n+=1
if errs: sys.exit(1)
data['dataVersion']='1.0.0'
json.dump(data,open(p,'w',encoding='utf-8'),ensure_ascii=False,indent=2)
print(n,'molécules complétées, 0 erreur de validation')
