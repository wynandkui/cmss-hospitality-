import test from 'node:test';import assert from 'node:assert/strict';import {cents,validateLines,invoicePosting} from '../server/accounting-engine.js';
test('ZAR money is converted to exact cents',()=>{assert.equal(cents('123.45'),12345);assert.throws(()=>cents(-1));});
test('double-entry journal must balance',()=>{assert.deepEqual(validateLines([{account:'1000',debit:100,credit:0},{account:'2000',debit:0,credit:100}]),{debit:10000,credit:10000});assert.throws(()=>validateLines([{account:'1000',debit:100,credit:0},{account:'2000',debit:0,credit:99}]),/balance/);});
test('VAT input posting balances payables',()=>{const lines=invoicePosting({net:100,vat:15,treatment:'standard'});assert.equal(lines.find(l=>l.account==='1300').debit,15);assert.equal(validateLines(lines).debit,11500);});
test('non-claimable VAT increases expense not VAT input',()=>{const lines=invoicePosting({net:100,vat:15,treatment:'non_claimable'});assert.equal(lines.some(l=>l.account==='1300'),false);assert.equal(validateLines(lines).debit,11500);});
test('zero and exempt VAT classifications cannot carry VAT',()=>{assert.throws(()=>invoicePosting({net:100,vat:15,treatment:'zero'}),/zero/);});
