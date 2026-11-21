#!/usr/bin/env python3
"""Read-only Gate 0 evidence discovery. Uses Python standard library only.
Input: controlled xlsx; output: separate CSV and JSON, never the source workbook.
Matches are review candidates, NEVER proof of conformance.
"""
import argparse,csv,hashlib,json,re,subprocess,sys,zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
HEADERS=['Requirement ID','Module','Requirement','Priority','Evidence status','Evidence reference','Conformance verdict','Acceptance criteria','Owner','Action status','Test / issue reference','Change control']

def read_xlsx(path):
    with zipfile.ZipFile(path) as z:
        shared=[]
        if 'xl/sharedStrings.xml' in z.namelist():
            root=ET.fromstring(z.read('xl/sharedStrings.xml'))
            shared=[''.join(n.itertext()) for n in root.findall('m:si',NS)]
        workbook=ET.fromstring(z.read('xl/workbook.xml'))
        sheet=workbook.find('m:sheets/m:sheet',NS)
        if sheet is None or sheet.attrib.get('name')!='Requirements':raise ValueError('First worksheet must be Requirements')
        rel_id=sheet.attrib.get('{'+NS['r']+'}id')
        relroot=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        relation=next((n.attrib['Target'] for n in relroot if n.attrib.get('Id')==rel_id),None)
        if not relation:raise ValueError('Missing worksheet relation')
        target=relation.lstrip('/') if relation.startswith('/') else 'xl/'+relation
        root=ET.fromstring(z.read(target))
        rows=[]
        for row in root.findall('m:sheetData/m:row',NS):
            cells={}
            for cell in row.findall('m:c',NS):
                col=re.match('[A-Z]+',cell.attrib['r']).group();index=0
                for letter in col:index=index*26+ord(letter)-64
                v=cell.find('m:v',NS);inline=cell.find('m:is',NS)
                value=v.text if v is not None and v.text is not None else ''.join(inline.itertext()) if inline is not None else ''
                if cell.attrib.get('t')=='s':value=shared[int(value)]
                cells[index-1]=value
            rows.append([cells.get(i,'') for i in range(12)])
        return rows

def git(root,*args):
    p=subprocess.run(['git','-C',str(root),*args],capture_output=True,text=True,check=True)
    return p.stdout.strip()

def run(baseline,repo,out):
    rows=read_xlsx(baseline)
    if rows[0]!=HEADERS:raise ValueError('Controlled workbook headers differ; review baseline before importing')
    records=[dict(zip(HEADERS,row)) for row in rows[1:] if row[0]]
    ids=[r['Requirement ID'] for r in records]
    if len(ids)!=184 or len(set(ids))!=184:raise ValueError('Expected 184 unique requirement IDs, got %s rows / %s unique'%(len(ids),len(set(ids))))
    if any(not re.fullmatch(r'[A-Z]+-\d{3}',x) for x in ids):raise ValueError('Invalid requirement ID')
    if any(r['Priority'] not in ('P1','P2','P3') for r in records):raise ValueError('Invalid priority')
    if any(r['Conformance verdict']!='Not assessed' for r in records):raise ValueError('Baseline verdict modified; review required')
    commit=git(repo,'rev-parse','HEAD');branch=git(repo,'branch','--show-current')
    files=git(repo,'ls-files','cmms/src','cmms/server','cmms/tests','cmms/tools').splitlines()
    index={}
    for path in files:
        if not path.endswith(('.js','.mjs','.py')):continue
        try:index[path]=(repo/path).read_text(errors='replace').lower()
        except OSError:continue
    out.mkdir(parents=True,exist_ok=True)
    fields=['Requirement ID','Module','Requirement','Priority','Gate 0 status','Baseline evidence status','Baseline evidence reference','Candidate source files (unverified)','Candidate tests (unverified)','Acceptance criteria','Owner','Dependency / blocker','Acceptance result','Commit SHA']
    result=[]
    for r in records:
        words=[w.lower() for w in re.findall(r'[A-Za-z]{5,}',r['Requirement']) if w.lower() not in {'management','facility','system','records','record','support','using','based','configurable','automated','related','required'}]
        scored=[]
        for p,content in index.items():
            score=sum(1 for w in set(words) if re.search(r'\b'+re.escape(w)+r'\b',content))
            if score>=2:scored.append((score,p))
        scored.sort(key=lambda x:(-x[0],x[1]))
        sources=[p for _,p in scored if '/tests/' not in p][:3]
        tests=[p for _,p in scored if '/tests/' in p][:3]
        result.append(dict(zip(fields,[r['Requirement ID'],r['Module'],r['Requirement'],r['Priority'],'NOT ASSESSED',r['Evidence status'],r['Evidence reference'],'; '.join(sources),'; '.join(tests),r['Acceptance criteria'],r['Owner'],'Evidence review and acceptance tests required','NOT RUN',commit])))
    with (out/'gate0-traceability.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(result)
    summary={'baseline_sha256':hashlib.sha256(baseline.read_bytes()).hexdigest(),'repository_commit':commit,'branch':branch,'requirements':len(result),'priorities':dict(Counter(r['Priority'] for r in records)),'baseline_evidence':dict(Counter(r['Evidence status'] for r in records)),'formal_status':{'NOT ASSESSED':len(result)},'note':'Source and test matches are unverified discovery hints. No tests executed; no production access.'}
    (out/'gate0-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--baseline',type=Path,required=True);p.add_argument('--repo',type=Path,default=Path(__file__).resolve().parents[2]);p.add_argument('--output',type=Path,required=True)
    a=p.parse_args()
    try:run(a.baseline.resolve(),a.repo.resolve(),a.output.resolve())
    except (ValueError,KeyError,zipfile.BadZipFile,subprocess.CalledProcessError) as e:print('GATE 0 FAILED:',e,file=sys.stderr);sys.exit(1)
