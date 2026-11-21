import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../server/api.js',import.meta.url),'utf8');
function handler(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert.ok(a>=0&&b>a);return source.slice(a,b);}
test('technician separation invalidates pre-existing sessions after commit',()=>{
 const h=handler("if(path==='/api/users/separate'", "if(path==='/api/users/status'");
 assert.match(h,/await connection\.commit\(\);for\(const \[token,activeSession\] of sessions\)if\(activeSession\.userId===accountId\)sessions\.delete\(token\)/);
});
test('account edit and deactivation invalidate existing sessions',()=>{
 assert.match(handler("if(path==='/api/users'&&method==='PATCH'", "if(path==='/api/users/separate'"),/sessions\.delete\(token\)/);
 assert.match(handler("if(path==='/api/users/status'", "if(path==='/api/"),/sessions\.delete\(token\)/);
});
