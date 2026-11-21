// Disposable MariaDB integration test. NEVER target the production database.
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {randomBytes,randomUUID,scryptSync} from 'node:crypto';
import assert from 'node:assert/strict';
import mysql from 'mysql2/promise';
import {setTimeout as delay} from 'node:timers/promises';
if(process.env.CMMS_RUN_DISPOSABLE_INTEGRATION!=='YES')throw Error('Explicit disposable integration opt-in required');
const env=Object.fromEntries(fs.readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/).filter(x=>/^[A-Z_][A-Z_0-9]*=/.test(x)).map(x=>{const [k,...v]=x.split('=');return [k,v.join('=').replace(/^['"]|['"]$/g,'')]}));
const SOURCE='CMMS_v12_restore_test';
if(env.DB_NAME!=='CMMS_putterdb')throw Error('Unexpected source configuration; stop and inspect');
const TEMP='CMMS_RBAC_IT_'+randomBytes(5).toString('hex');
const config={host:env.DB_HOST,port:Number(env.DB_PORT||3306),user:env.DB_USER,password:env.DB_PASSWORD};
const conn=await mysql.createConnection(config);
let child,created=false,passes=0;
const ok=(name)=>{passes++;console.log('PASS '+name)};
const base='http://127.0.0.1:3097';
async function request(path,{method='GET',cookie,body}={}){const r=await fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});let data={};try{data=await r.json()}catch{}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
try{
 await conn.query('CREATE DATABASE `'+TEMP+'`');created=true;
 const [tables]=await conn.query('SHOW TABLES FROM `'+SOURCE+'`');
 for(const item of tables){const t=Object.values(item)[0];if(!/^[a-zA-Z0-9_]+$/.test(t))throw Error('Unexpected table name');await conn.query('CREATE TABLE `'+TEMP+'`.`'+t+'` LIKE `'+SOURCE+'`.`'+t+'`');await conn.query('INSERT INTO `'+TEMP+'`.`'+t+'` SELECT * FROM `'+SOURCE+'`.`'+t+'`');}
 const db=await mysql.createConnection({...config,database:TEMP});
 const pw=randomBytes(18).toString('hex');const salt=randomBytes(16).toString('hex');const hash=salt+':'+scryptSync(pw,salt,64).toString('hex');
 const users={};
 for(const role of ['admin','manager','supervisor','coordinator','finance_admin','technician']){const id=randomUUID(),username='it_'+role;users[role]={id,username};await db.execute('INSERT INTO cmms_users(id,username,password_hash,role,person_id,active) VALUES(?,?,?,?,?,1)',[id,username,hash,role,role==='technician'?'it_person':'']);}
 child=spawn(process.execPath,['server/api.js'],{cwd:new URL('..',import.meta.url).pathname,env:{...process.env,...env,DB_NAME:TEMP,CMMS_PORT:'3097',CMMS_BIND:'127.0.0.1',CMMS_MEDIA_DIR:'/tmp/cmms-rbac-it-media-'+TEMP},stdio:'ignore'});
 let ready=false;for(let i=0;i<60;i++){if(child.exitCode!==null)throw Error('Isolated API exited');try{const r=await request('/api/status');if(r.status===200&&r.data.database===true){ready=true;break}}catch{}await delay(200)}if(!ready)throw Error('Isolated API did not become ready');ok('disposable isolated server ready');
 const cookies={};for(const role of Object.keys(users)){const r=await request('/api/login',{method:'POST',body:{username:users[role].username,password:pw}});assert.equal(r.status,200,role+' login');cookies[role]=r.cookie;}ok('all six role sessions authenticated');
 for(const role of ['manager','supervisor','coordinator']){const r=await request('/api/operational/work-orders',{cookie:cookies[role]});assert.equal(r.status,200,role);assert.ok(Array.isArray(r.data.workOrders));assert.ok(!('people' in r.data));}ok('operational projection permits only intended roles');
 for(const role of ['finance_admin','technician'])assert.equal((await request('/api/operational/work-orders',{cookie:cookies[role]})).status,403);ok('operational projection denies finance and technician');
 for(const role of ['finance_admin','admin'])assert.equal((await request('/api/finance/summary?start=2026-11-01&end=2026-11-30',{cookie:cookies[role]})).status,200);for(const role of ['manager','supervisor','coordinator','technician'])assert.equal((await request('/api/finance/summary?start=2026-11-01&end=2026-11-30',{cookie:cookies[role]})).status,403);ok('finance role separation');
 for(const role of ['manager','supervisor','coordinator','finance_admin'])assert.equal((await request('/api/state',{cookie:cookies[role]})).status,403);ok('legacy full state fails closed');
 const revision=(await request('/api/operational/work-orders',{cookie:cookies.manager})).data.revision;
 const createBody={revision,workOrder:{title:'Disposable integration pump test',priority:'High'}};
 for(const role of ['supervisor','coordinator','finance_admin','technician'])assert.equal((await request('/api/operational/work-orders/create',{method:'POST',cookie:cookies[role],body:createBody})).status,403);ok('unauthorized work order creation rejected');
 const createdWO=await request('/api/operational/work-orders/create',{method:'POST',cookie:cookies.manager,body:createBody});assert.equal(createdWO.status,201,JSON.stringify(createdWO.data));ok('manager creates work order');
 assert.equal((await request('/api/operational/work-orders/create',{method:'POST',cookie:cookies.manager,body:createBody})).status,409);ok('stale create revision rejected');
 const [people]=await db.query('SELECT data FROM cmms_state WHERE id=1');const state=JSON.parse(people[0].data);assert.ok(state.people.length>0,'fixture must include employee');
 const assignBody={revision:createdWO.data.revision,assignment:{workOrderId:createdWO.data.workOrderId,assigneeId:state.people[0].id}};
 for(const role of ['manager','coordinator','finance_admin','technician'])assert.equal((await request('/api/operational/work-orders/assign',{method:'POST',cookie:cookies[role],body:assignBody})).status,403);ok('unauthorized assignment rejected');
 const assigned=await request('/api/operational/work-orders/assign',{method:'POST',cookie:cookies.supervisor,body:assignBody});assert.equal(assigned.status,200,JSON.stringify(assigned.data));ok('supervisor assignment succeeds');
 assert.equal((await request('/api/operational/work-orders/assign',{method:'POST',cookie:cookies.supervisor,body:assignBody})).status,409);ok('stale assignment revision rejected');
 const [[record]]=await db.query('SELECT revision,data FROM cmms_state WHERE id=1');const saved=JSON.parse(record.data);assert.equal(saved.workOrders.find(w=>w.id===createdWO.data.workOrderId).assigneeId,state.people[0].id);ok('assigned work order persisted');
 const [[audit]]=await db.query("SELECT COUNT(*) AS n FROM cmms_audit_events WHERE entity_id=? AND action IN ('create','assign')",[createdWO.data.workOrderId]);assert.ok(Number(audit.n)>=2);ok('creation and assignment audit events recorded');
 const [[journal]]=await db.query('SELECT COUNT(*) AS n FROM cmms_transactions WHERE record_id=?',[createdWO.data.workOrderId]);assert.ok(Number(journal.n)>=2);ok('creation and assignment journal entries recorded');
 const unauthorized=await request('/api/operational/work-orders/create',{method:'POST',body:{revision:assigned.data.revision,workOrder:{title:'Anonymous'}}});assert.equal(unauthorized.status,401);ok('unauthenticated write rejected');
 const invalidCreate=await request('/api/operational/work-orders/create',{method:'POST',cookie:cookies.manager,body:{revision:assigned.data.revision,workOrder:{title:'Forged',status:'Completed'}}});assert.equal(invalidCreate.status,400);ok('manager cannot forge work order status');
 const invalidAssign=await request('/api/operational/work-orders/assign',{method:'POST',cookie:cookies.supervisor,body:{revision:assigned.data.revision,assignment:{workOrderId:createdWO.data.workOrderId,assigneeId:'nonexistent'}}});assert.equal(invalidAssign.status,400);ok('supervisor cannot assign nonexistent employee');
 const badFinance=await request('/api/finance/summary?start=2026-11-30&end=2026-11-01',{cookie:cookies.finance_admin});assert.equal(badFinance.status,400);ok('invalid finance date range rejected');
 const [[finalRecord]]=await db.query('SELECT revision FROM cmms_state WHERE id=1');assert.equal(Number(finalRecord.revision),Number(assigned.data.revision));ok('rejected writes do not advance revision');
 await db.end();console.log('INTEGRATION PASS '+passes+'/'+passes);
}catch(e){console.error('INTEGRATION FAIL after '+passes+' checks: '+e.message);process.exitCode=1}finally{if(child){child.kill('SIGTERM');await delay(300);if(child.exitCode===null)child.kill('SIGKILL')}if(created)await conn.query('DROP DATABASE `'+TEMP+'`');await conn.end();console.log('Disposable test database removed')}
