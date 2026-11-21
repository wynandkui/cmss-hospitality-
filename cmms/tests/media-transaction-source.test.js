import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../server/api.js',import.meta.url),'utf8');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return source.slice(a,b);}
test('attachment upload transaction revalidates account and commits metadata with audit',()=>{
 const h=section("if(path==='/api/files'&&method==='POST'",'const fileMatch=path.match');
 const begin=h.indexOf('await connection.beginTransaction()'),auth=h.indexOf('await revalidateAccountForWrite(connection,session)'),insert=h.indexOf("await connection.execute('INSERT INTO cmms_files"),audit=h.indexOf('await auditEvent(connection,session'),commit=h.indexOf('await connection.commit()');
 assert.ok(begin>=0&&begin<auth&&auth<insert&&insert<audit&&audit<commit);
 assert.match(h,/await connection\.rollback\(\)\.catch/);
 assert.match(h,/await unlink\(join\(MEDIA_ROOT,fileId\)\)\.catch\(\(\)=>\{\}\)/);
 assert.match(h,/finally\{connection\?\.release\(\)/);
});
test('media upload does not bypass initial role/capability authorization',()=>{
 const h=section("if(path==='/api/files'&&method==='POST'",'const fileMatch=path.match');
 assert.match(h,/if\(type==='quotes'\)assertCapability\(session,'requestPurchase'\);else admin\(session\)/);
});
