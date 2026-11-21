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

test('account edits and status changes revalidate administrator inside transaction',()=>{
 for(const [start,end] of [["if(path==='/api/users'&&method==='PATCH'","if(path==='/api/users/separate'"],["if(path==='/api/users/status'","if(path==='/api/operational/people'"]]){
  const h=handler(start,end);
  assert.match(h,/await connection\.beginTransaction\(\);await revalidateAccountForWrite\(connection,session\)/);
  assert.match(h,/await connection\.commit\(\)/);
  assert.match(h,/await connection\.rollback\(\)/);
  assert.ok(h.indexOf('await connection.commit()')<h.indexOf('sessions.delete(token)'));
 }
});

test('state-backed account creation and separation acquire state before account row locks',()=>{
 const creation=handler("if(path==='/api/users'&&method==='POST'","if(path==='/api/users'&&method==='PATCH'");
 const separation=handler("if(path==='/api/users/separate'","if(path==='/api/users/status'");
 const stateLock='SELECT revision,data FROM cmms_state WHERE id=1 FOR UPDATE';
 for(const [name,h] of [['creation',creation],['separation',separation]]){
  const state=h.indexOf(stateLock),admin=h.indexOf('await revalidateAccountForWrite(connection,session)');
  assert.ok(state>=0&&admin>state,name+' must lock state before administrator account');
 }
 const target=separation.indexOf('SELECT id,username,role,person_id AS personId FROM cmms_users WHERE id=? FOR UPDATE');
 assert.ok(target>separation.indexOf('await revalidateAccountForWrite(connection,session)'),'separation must lock target after state and actor');
 assert.equal((separation.match(/SELECT revision,data FROM cmms_state WHERE id=1 FOR UPDATE/g)||[]).length,1);
});
