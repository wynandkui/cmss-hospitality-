"""Dependency-free test of the Gate 0 importer, with no MariaDB access."""
import importlib.util,tempfile,zipfile,json,csv
from pathlib import Path
from xml.sax.saxutils import escape
spec=importlib.util.spec_from_file_location('gate0',Path(__file__).with_name('gate0-traceability.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
with tempfile.TemporaryDirectory(prefix='cmms-gate0-test-') as d:
    root=Path(d);xlsx=root/'baseline.xlsx';out=root/'output'
    rows=[m.HEADERS]+[[f'SEC-{i:03d}','Security & audit','session access controls and audit','P1','Gap / not demonstrated','baseline','Not assessed','Verify access','Unassigned','Not started','','No production changes'] for i in range(1,185)]
    xml=['<worksheet xmlns="'+m.NS['m']+'"><sheetData>']
    for ri,row in enumerate(rows,1):
        xml.append(f'<row r="{ri}">')
        for ci,value in enumerate(row):
            col=chr(65+ci)
            xml.append(f'<c r="{col}{ri}" t="inlineStr"><is><t>{escape(value)}</t></is></c>')
        xml.append('</row>')
    xml.append('</sheetData></worksheet>')
    with zipfile.ZipFile(xlsx,'w') as z:
        z.writestr('xl/workbook.xml','<workbook xmlns="'+m.NS['m']+'" xmlns:r="'+m.NS['r']+'"><sheets><sheet name="Requirements" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"/></Relationships>')
        z.writestr('xl/worksheets/sheet1.xml',''.join(xml))
    repo=Path(__file__).resolve().parents[2]
    m.run(xlsx,repo,out)
    assert len(list(csv.DictReader((out/'gate0-traceability.csv').open())))==184
    assert json.loads((out/'gate0-summary.json').read_text())['formal_status']=={'NOT ASSESSED':184}
    print('PASS Gate 0 importer preserves 184 IDs and never asserts acceptance')
