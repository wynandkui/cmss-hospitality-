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
test('attachment deletion locks metadata, revalidates administrator and commits audit atomically',()=>{
 const h=section("if(fileMatch&&method==='DELETE'", "if(path.startsWith('/api/'))");
 const begin=h.indexOf('await connection.beginTransaction()'),auth=h.indexOf('await revalidateAccountForWrite(connection,session)'),lock=h.indexOf('FOR UPDATE'),del=h.indexOf("await connection.execute('DELETE FROM cmms_files"),audit=h.indexOf('await auditEvent(connection,session'),commit=h.indexOf('await connection.commit()'),cleanup=h.indexOf('await unlink(join(MEDIA_ROOT,file.id))');
 assert.ok(begin>=0&&begin<auth&&auth<lock&&lock<del&&del<audit&&audit<commit&&commit<cleanup);
 assert.match(h,/catch\(e\)\{await connection\.rollback\(\);throw e;\}finally\{connection\.release\(\);\}/);
});

test('media read endpoints revalidate live database account before serving metadata or bytes',()=>{
 for(const [start,end] of [["if(photoMatch&&method==='GET')","if(path==='/api/files'&&method==='GET')"],["if(path==='/api/files'&&method==='GET')","if(path==='/api/files'&&method==='POST')"],["if(fileMatch&&method==='GET')","if(fileMatch&&method==='DELETE')"]]){
  const h=section(start,end);assert.match(h,/guard\(req,session\);await revalidateAccountForMediaRead\(session\)/);
 }
 assert.match(source,/async function revalidateAccountForMediaRead\(session\)/);
});
