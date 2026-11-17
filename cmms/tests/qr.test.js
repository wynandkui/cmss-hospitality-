import test from 'node:test';
import assert from 'node:assert/strict';
import {assetPayload,workOrderPayload,qrSvg} from '../src/qr.js';

test('asset QR contains every asset field and resolved location',()=>{
 const asset={id:'asset-1',code:'GEN-01',name:'Standby generator',manufacturer:'Perkins',serial:'ABC123',notes:'Service annually',installDate:'2024-01-01'};
 const result=JSON.parse(assetPayload(asset,{code:'ENC',name:'Energy centre'},'Hotel'));
 assert.equal(result.kind,'CMMS_ASSET');assert.deepEqual(result.asset,asset);assert.equal(result.location.name,'Energy centre');
});
test('work-order QR contains identification and assignment without private employee data',()=>{
 const result=JSON.parse(workOrderPayload({id:'wo-1',code:'WO-01',title:'Inspect',status:'Assigned',dueDate:'2026-12-01'},{code:'GEN-01'},{name:'Energy centre'},{name:'David',dateOfBirth:'1990-01-01'},'Hotel'));
 assert.equal(result.code,'WO-01');assert.equal(result.assetCode,'GEN-01');assert.equal(result.assignedTechnician,'David');assert.ok(!JSON.stringify(result).includes('1990-01-01'));
});
test('QR SVG has quiet zone and module geometry',()=>{
 const svg=qrSvg(assetPayload({id:'a',code:'A1',name:'Pump'}));
 assert.match(svg,/^<svg /);assert.match(svg,/aria-label="QR code"/);assert.match(svg,/<rect /);assert.match(svg,/<path /);
});
test('asset payload requires saved record',()=>assert.throws(()=>assetPayload({code:'A1'}),/Save the asset/));
test('oversized QR payload produces actionable error',()=>assert.throws(()=>qrSvg('x'.repeat(10000)),/maximum scannable capacity/));
