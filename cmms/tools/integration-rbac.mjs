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
let child,chrome,created=false,passes=0;
const ok=(name)=>{passes++;console.log('PASS '+name)};
const base='http://127.0.0.1:3097';
async function request(path,{method='GET',cookie,body}={}){const r=await fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});let data={};try{data=await r.json()}catch{}return {status:r.status,data,cookie:r.headers.get('set-cookie')?.split(';')[0],setCookie:r.headers.get('set-cookie')};}
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
 for(const asset of ['/','/src/main.js','/src/restricted-workspace.js','/src/role-policy.js']){const response=await fetch(base+asset);assert.equal(response.status,200,'UI asset '+asset);const body=await response.text();assert.ok(body.length>50,'UI asset nonempty '+asset);}ok('all required restricted browser modules served');
 const forbidden=await fetch(base+'/src/role-migration.js');assert.equal(forbidden.status,404);ok('non-public source module remains blocked');
 const preflight=await fetch(base+'/api/me');assert.equal(preflight.status,401);assert.equal(preflight.headers.get('cache-control'),'no-store');assert.equal(preflight.headers.get('x-content-type-options'),'nosniff');ok('unauthenticated API fails closed with no-store and nosniff');
 const forged=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://attacker.invalid'},body:JSON.stringify({username:'nobody',password:'invalid'})});assert.equal(forged.status,403);ok('cross-origin login blocked');
 const malformed=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:'{invalid'});assert.equal(malformed.status,400);ok('malformed JSON rejected');
 const cookies={};for(const role of Object.keys(users)){const r=await request('/api/login',{method:'POST',body:{username:users[role].username,password:pw}});assert.equal(r.status,200,role+' login');cookies[role]=r.cookie;}ok('all six role sessions authenticated');
 const cookieProbe=await request('/api/login',{method:'POST',body:{username:users.manager.username,password:pw}});assert.equal(cookieProbe.status,200);const loginCookie=cookieProbe.setCookie;
 assert.match(loginCookie,/HttpOnly/i);assert.match(loginCookie,/SameSite=Strict/i);assert.match(loginCookie,/Path=\/api/i);ok('session cookie security attributes set');
 const logout=await request('/api/logout',{method:'POST',cookie:cookies.admin});assert.equal(logout.status,200);assert.equal((await request('/api/me',{cookie:cookies.admin})).status,401);ok('logout invalidates session token');
 const adminLogin=await request('/api/login',{method:'POST',body:{username:users.admin.username,password:pw}});assert.equal(adminLogin.status,200);cookies.admin=adminLogin.cookie;

 for(const role of ['manager','supervisor','coordinator']){const r=await request('/api/operational/work-orders',{cookie:cookies[role]});assert.equal(r.status,200,role);assert.ok(Array.isArray(r.data.workOrders));assert.ok(!('people' in r.data));}ok('operational projection permits only intended roles');
 for(const role of ['finance_admin','technician'])assert.equal((await request('/api/operational/work-orders',{cookie:cookies[role]})).status,403);ok('operational projection denies finance and technician');
 for(const role of ['finance_admin','admin'])assert.equal((await request('/api/finance/summary?start=2026-11-01&end=2026-11-30',{cookie:cookies[role]})).status,200);for(const role of ['manager','supervisor','coordinator','technician'])assert.equal((await request('/api/finance/summary?start=2026-11-01&end=2026-11-30',{cookie:cookies[role]})).status,403);ok('finance role separation');
 for(const role of ['manager','supervisor','coordinator','finance_admin'])assert.equal((await request('/api/state',{cookie:cookies[role]})).status,403);ok('legacy full state fails closed');
 // Real Chromium browser smoke tests over CDP, isolated from user profiles.
 const chromePort=14000+Math.floor(Math.random()*1000);
 chrome=spawn('/usr/bin/google-chrome',['--headless=new','--no-first-run','--no-default-browser-check','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--remote-debugging-port='+chromePort,'--user-data-dir=/tmp/cmms-cdp-'+TEMP,'about:blank'],{stdio:'ignore'});
 let pageTarget;for(let i=0;i<60;i++){try{const list=await (await fetch('http://127.0.0.1:'+chromePort+'/json')).json();pageTarget=list.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(pageTarget)break}catch{}await delay(150)}assert.ok(pageTarget,'Chrome CDP target');
 const ws=new WebSocket(pageTarget.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 let seq=0;const pending=new Map();ws.addEventListener('message',ev=>{const x=JSON.parse(ev.data);if(x.id&&pending.has(x.id)){const {resolve,reject}=pending.get(x.id);pending.delete(x.id);x.error?reject(Error(x.error.message)):resolve(x.result)}});
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.text);return result.result?.value};
 await cdp('Page.enable');await cdp('Network.enable');
 for(const role of ['manager','supervisor','coordinator','finance_admin','technician','admin']){
  await cdp('Network.clearBrowserCookies');await cdp('Network.setCookie',{name:'cmms_session',value:cookies[role].split('=')[1],url:base+'/api/me',path:'/api',httpOnly:true,sameSite:'Strict'});
  await cdp('Page.navigate',{url:base+'/'});
  let content='';for(let i=0;i<65;i++){await delay(140);content=await evaluate('document.getElementById("app")?.innerText||""');if(content.includes(role==='finance_admin'?'Finance summary':role==='technician'?'MariaDB':role==='admin'?'MariaDB':'Operational work orders'))break;}
  assert.ok(content.includes(role==='finance_admin'?'Finance summary':role==='technician'?'MariaDB':role==='admin'?'MariaDB':'Operational work orders'),'Chrome rendered '+role+': '+content.slice(0,140));
  if(role==='manager'){assert.ok(content.includes('Create work order'));assert.ok(!content.includes('Assign work order'));}
  if(role==='supervisor'){assert.ok(content.includes('Assign work order'));assert.ok(!content.includes('Create work order'));}
  if(role==='coordinator'){assert.ok(!content.includes('Create work order')&&!content.includes('Assign work order'));}
  if(role==='finance_admin'){assert.ok(!content.includes('Operational work orders'));}
  ok('Chromium browser renders '+role+' authorized workspace');
 }
 // Browser-level manager creation: use CDP Input key events, avoid blocking JS evaluation on submit.
 await cdp('Network.clearBrowserCookies');await cdp('Network.setCookie',{name:'cmms_session',value:cookies.manager.split('=')[1],url:base+'/api/me',path:'/api',httpOnly:true,sameSite:'Strict'});await cdp('Page.navigate',{url:base+'/'});
 let formReady=false;for(let i=0;i<60;i++){await delay(120);formReady=await evaluate('!!document.getElementById("restrictedCreate")');if(formReady)break}assert.ok(formReady,'manager form available');
 await evaluate('(()=>{const f=document.getElementById("restrictedCreate");f.elements.namedItem("title").value="Browser-created maintenance order";f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));return "submitted"})()');
 let browserCreated=false;for(let i=0;i<50;i++){await delay(120);const [[row]]=await db.query('SELECT data FROM cmms_state WHERE id=1');browserCreated=JSON.parse(row.data).workOrders.some(w=>w.title==='Browser-created maintenance order');if(browserCreated)break}
 if(!browserCreated)throw Error('Browser manager creation not persisted: '+String(await evaluate('document.getElementById("restrictedError")?.innerText||""')));
 ok('Chromium manager form submits and persists work order');
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
 const newOrder=await request('/api/operational/work-orders/create',{method:'POST',cookie:cookies.manager,body:{revision:assigned.data.revision,workOrder:{title:'Browser supervisor assignment target'}}});assert.equal(newOrder.status,201);
 await cdp('Network.clearBrowserCookies');await cdp('Network.setCookie',{name:'cmms_session',value:cookies.supervisor.split('=')[1],url:base+'/api/me',path:'/api',httpOnly:true,sameSite:'Strict'});await cdp('Page.navigate',{url:base+'/'});
 let assignReady=false;for(let i=0;i<60;i++){await delay(120);assignReady=await evaluate('!!document.getElementById("restrictedAssign")');if(assignReady)break}assert.ok(assignReady,'supervisor form available');
 await evaluate('(()=>{const f=document.getElementById("restrictedAssign");f.elements.namedItem("workOrderId").value='+JSON.stringify(newOrder.data.workOrderId)+';f.elements.namedItem("assigneeId").value='+JSON.stringify(state.people[0].id)+';f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));return "submitted"})()');
 let browserAssigned=false;for(let i=0;i<50;i++){await delay(120);const [[row]]=await db.query('SELECT data FROM cmms_state WHERE id=1');browserAssigned=JSON.parse(row.data).workOrders.find(w=>w.id===newOrder.data.workOrderId)?.assigneeId===state.people[0].id;if(browserAssigned)break}
 if(!browserAssigned)throw Error('Browser supervisor assignment not persisted: '+String(await evaluate('document.getElementById("restrictedError")?.innerText||""')));
 ok('Chromium supervisor form assigns and persists work order');
 const pmRevision=(await request('/api/operational/work-orders',{cookie:cookies.coordinator})).data.revision;
 const pmBody={revision:pmRevision,plan:{title:'Quarterly HVAC inspection',startDate:'2026-12-01',interval:90}};
 for(const role of ['manager','supervisor','finance_admin','technician'])assert.equal((await request('/api/operational/pm/plans/create',{method:'POST',cookie:cookies[role],body:pmBody})).status,403);ok('PM plan creation denied to unauthorized roles');
 const pmCreated=await request('/api/operational/pm/plans/create',{method:'POST',cookie:cookies.coordinator,body:pmBody});assert.equal(pmCreated.status,201,JSON.stringify(pmCreated.data));ok('coordinator creates PM plan');
 assert.equal((await request('/api/operational/pm/plans/create',{method:'POST',cookie:cookies.coordinator,body:pmBody})).status,409);ok('stale PM revision rejected');
 const pmList=await request('/api/operational/pm/plans',{cookie:cookies.coordinator});assert.equal(pmList.status,200);assert.ok(pmList.data.plans.some(p=>p.id===pmCreated.data.planId));assert.ok(!('people' in pmList.data));ok('PM plan persisted and restricted read projection');
 for(const role of ['manager','supervisor','finance_admin','technician'])assert.equal((await request('/api/operational/pm/plans',{cookie:cookies[role]})).status,403);ok('PM read denied to unauthorized roles');
 const [[pmAudit]]=await db.query("SELECT COUNT(*) AS n FROM cmms_audit_events WHERE entity_id=? AND action='create'",[pmCreated.data.planId]);assert.ok(Number(pmAudit.n)>=1);ok('PM creation audit recorded');
 await cdp('Network.clearBrowserCookies');await cdp('Network.setCookie',{name:'cmms_session',value:cookies.coordinator.split('=')[1],url:base+'/api/me',path:'/api',httpOnly:true,sameSite:'Strict'});await cdp('Page.navigate',{url:base+'/'});
 let pmFormReady=false;for(let i=0;i<60;i++){await delay(120);pmFormReady=await evaluate('!!document.getElementById("restrictedPmCreate")');if(pmFormReady)break}assert.ok(pmFormReady,'coordinator PM form available');
 await evaluate('(()=>{const f=document.getElementById("restrictedPmCreate");f.elements.namedItem("title").value="Browser PM pump service";f.elements.namedItem("startDate").value="2026-12-10";f.elements.namedItem("interval").value="30";f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));return "submitted"})()');
 let browserPm=false;for(let i=0;i<50;i++){await delay(120);const [[row]]=await db.query('SELECT data FROM cmms_state WHERE id=1');browserPm=JSON.parse(row.data).plans.some(p=>p.title==='Browser PM pump service');if(browserPm)break}
 if(!browserPm)throw Error('Coordinator PM browser submit not persisted: '+String(await evaluate('document.getElementById("restrictedError")?.innerText||""')));
 ok('Chromium coordinator PM form persists plan');
 const peopleRevision=(await request('/api/operational/work-orders',{cookie:cookies.coordinator})).data.revision;
 const contactBody={revision:peopleRevision,contact:{personId:state.people[0].id,email:'coordinator-test@example.invalid'}};
 for(const role of ['manager','supervisor','finance_admin','technician'])assert.equal((await request('/api/operational/people/contact',{method:'POST',cookie:cookies[role],body:contactBody})).status,403);ok('employee contact mutation denied to unauthorized roles');
 const contactUpdated=await request('/api/operational/people/contact',{method:'POST',cookie:cookies.coordinator,body:contactBody});assert.equal(contactUpdated.status,200,JSON.stringify(contactUpdated.data));ok('coordinator updates employee contact');
 assert.equal((await request('/api/operational/people/contact',{method:'POST',cookie:cookies.coordinator,body:contactBody})).status,409);ok('stale employee contact revision rejected');
 const directory=await request('/api/operational/people',{cookie:cookies.coordinator});assert.equal(directory.status,200);assert.equal(directory.data.people.find(p=>p.id===state.people[0].id).email,'coordinator-test@example.invalid');assert.ok(!('salary' in directory.data.people[0]));ok('restricted employee directory excludes private records');
 for(const role of ['manager','supervisor','finance_admin','technician'])assert.equal((await request('/api/operational/people',{cookie:cookies[role]})).status,403);ok('employee directory denied to unauthorized roles');
 const [[contactAudit]]=await db.query("SELECT COUNT(*) AS n FROM cmms_audit_events WHERE entity_id=? AND action='update'",[state.people[0].id]);assert.ok(Number(contactAudit.n)>=1);ok('employee contact audit recorded');
 await cdp('Network.clearBrowserCookies');await cdp('Network.setCookie',{name:'cmms_session',value:cookies.coordinator.split('=')[1],url:base+'/api/me',path:'/api',httpOnly:true,sameSite:'Strict'});await cdp('Page.navigate',{url:base+'/'});
 let contactReady=false;for(let i=0;i<60;i++){await delay(120);contactReady=await evaluate('!!document.getElementById("restrictedPeopleContact")');if(contactReady)break}assert.ok(contactReady,'coordinator contact form available');
 await evaluate('(()=>{const f=document.getElementById("restrictedPeopleContact");f.elements.namedItem("personId").value='+JSON.stringify(state.people[0].id)+';f.elements.namedItem("email").value="browser-contact@example.invalid";f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));return "submitted"})()');
 let browserContact=false;for(let i=0;i<50;i++){await delay(120);const [[row]]=await db.query('SELECT data FROM cmms_state WHERE id=1');browserContact=JSON.parse(row.data).people.find(p=>p.id===state.people[0].id)?.email==='browser-contact@example.invalid';if(browserContact)break}
 if(!browserContact)throw Error('Coordinator contact browser submit not persisted: '+String(await evaluate('document.getElementById("restrictedError")?.innerText||""')));
 ok('Chromium coordinator employee contact form persists update');
 const financeRevision=(await request('/api/finance/summary?start=2026-11-01&end=2026-11-30',{cookie:cookies.finance_admin})).data.revision;
 const costBody={revision:financeRevision,cost:{workOrderId:createdWO.data.workOrderId,category:'services',date:'2026-11-21',description:'External pump service',amount:175.25}};
 for(const role of ['manager','supervisor','coordinator','technician'])assert.equal((await request('/api/finance/costs/post',{method:'POST',cookie:cookies[role],body:costBody})).status,403);ok('finance posting denied to operational roles');
 const costPosted=await request('/api/finance/costs/post',{method:'POST',cookie:cookies.finance_admin,body:costBody});assert.equal(costPosted.status,201,JSON.stringify(costPosted.data));ok('finance administrator posts maintenance cost');
 assert.equal((await request('/api/finance/costs/post',{method:'POST',cookie:cookies.finance_admin,body:costBody})).status,409);ok('stale finance posting rejected');
 const financeSummary=await request('/api/finance/summary?start=2026-11-01&end=2026-11-30',{cookie:cookies.finance_admin});assert.equal(financeSummary.status,200);assert.ok(financeSummary.data.report.rows.some(e=>e.id===costPosted.data.costId));ok('finance posting appears in date-filtered report');
 const [[financeAudit]]=await db.query("SELECT COUNT(*) AS n FROM cmms_audit_events WHERE entity_id=? AND action='post'",[costPosted.data.costId]);assert.ok(Number(financeAudit.n)>=1);ok('finance posting audit recorded');
 await cdp('Network.clearBrowserCookies');
 await cdp('Network.setCookie',{name:'cmms_session',value:cookies.finance_admin.split('=')[1],url:base+'/api/me',path:'/api',httpOnly:true,sameSite:'Strict'});
 await cdp('Page.navigate',{url:base+'/'});
 let financeFormReady=false;
 for(let i=0;i<60;i++){await delay(120);financeFormReady=await evaluate('!!document.getElementById("restrictedCostPost")');if(financeFormReady)break}
 assert.ok(financeFormReady,'finance form available in browser');
 const expression=`(()=>{const f=document.getElementById('restrictedCostPost');f.elements.namedItem('workOrderId').value=${JSON.stringify(createdWO.data.workOrderId)};f.elements.namedItem('category').value='services';f.elements.namedItem('date').value='2026-11-21';f.elements.namedItem('description').value='Browser maintenance service';f.elements.namedItem('amount').value='240.50';f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return true})()`;
 await evaluate(expression);
 let financeSaved=false;
 for(let i=0;i<60;i++){await delay(120);const [[r]]=await db.query('SELECT data FROM cmms_state WHERE id=1');financeSaved=JSON.parse(r.data).costEntries.some(e=>e.description==='Browser maintenance service'&&e.amount===240.5);if(financeSaved)break}
 assert.ok(financeSaved,'finance form submission persisted to disposable database');
 ok('Chromium finance form posts persisted maintenance cost');
 ws.close();
 const [[finalRecord]]=await db.query('SELECT revision FROM cmms_state WHERE id=1');assert.equal(Number(finalRecord.revision),Number(costPosted.data.revision)+1);ok('rejected writes do not advance revision beyond authorized browser changes');
 // Live revocation checks run only after all existing browser and workflow assertions.
 const techId=users.technician.id;
 const revoke=await request('/api/users/status',{method:'POST',cookie:cookies.admin,body:{id:techId,active:false}});
 assert.equal(revoke.status,200,'admin disables technician');
 assert.equal((await request('/api/me',{cookie:cookies.technician})).status,401,'disabled account old token revoked');
 assert.equal((await request('/api/login',{method:'POST',body:{username:users.technician.username,password:pw}})).status,401,'disabled account cannot log in');
 ok('deactivation revokes session and blocks login');
 assert.equal((await request('/api/users/status',{method:'POST',cookie:cookies.admin,body:{id:techId,active:true}})).status,200);
 const reenabled=await request('/api/login',{method:'POST',body:{username:users.technician.username,password:pw}});
 assert.equal(reenabled.status,200,'reenabled technician login');
 // Separation is permitted only when two technicians share an employee record.
 const secondId=randomUUID();
 await db.execute('INSERT INTO cmms_users(id,username,password_hash,role,person_id,active) SELECT ?,?,password_hash,role,person_id,1 FROM cmms_users WHERE id=?',[secondId,'it_shared_technician',techId]);
 const preSeparate=await request('/api/login',{method:'POST',body:{username:users.technician.username,password:pw}});
 assert.equal(preSeparate.status,200,'pre-separation technician session');
 const separated=await request('/api/users/separate',{method:'POST',cookie:cookies.admin,body:{id:techId,name:'Isolated Security Test Technician'}});
 assert.equal(separated.status,200,'separate shared technician record');
 assert.notEqual(separated.data.personId,'it_person');
 assert.equal((await request('/api/me',{cookie:preSeparate.cookie})).status,401,'old employee-scope session revoked');
 const [[separatedUser]]=await db.execute('SELECT person_id FROM cmms_users WHERE id=?',[techId]);
 assert.equal(separatedUser.person_id,separated.data.personId,'employee link committed');
 ok('employee separation commits new scope and revokes old session');
 const changed=await request('/api/users',{method:'PATCH',cookie:cookies.admin,body:{id:users.admin.id,username:users.admin.username,role:'admin',personId:'',password:randomBytes(18).toString('hex')}});
 assert.equal(changed.status,200,'admin changes own password');
 assert.equal((await request('/api/me',{cookie:cookies.admin})).status,401,'password change revokes old session');
 ok('password change revokes authenticated session');
 // Negative authorization matrix: no mutation on forbidden calls.
 const [[matrixBefore]]=await db.query('SELECT revision,data FROM cmms_state WHERE id=1');
 const forbiddenRoutes=[
  ['/api/users/status','POST',{id:techId,active:false}],
  ['/api/users/separate','POST',{id:techId,name:'Forbidden'}],
  ['/api/users','PATCH',{id:techId,username:'forbidden',role:'admin',personId:''}],
  ['/api/permissions','PATCH',{id:techId,permissions:{}}],
  ['/api/audit/settings','PATCH',{category:'users',enabled:false}],
 ];
 for(const [path,method,body] of forbiddenRoutes){
  assert.equal((await request(path,{method,body})).status,401,'anonymous denied '+path);
  assert.equal((await request(path,{method,cookie:cookies.manager,body})).status,403,'manager denied '+path);
 }
 const [[matrixAfter]]=await db.query('SELECT revision,data FROM cmms_state WHERE id=1');
 assert.equal(Number(matrixAfter.revision),Number(matrixBefore.revision));
 assert.equal(matrixAfter.data,matrixBefore.data);
 ok('ten anonymous and manager mutation attempts denied; state unchanged');
 // Simultaneous read requests must all reject a revoked token after a completed update.
 const staleRequests=await Promise.all(Array.from({length:12},()=>request('/api/me',{cookie:preSeparate.cookie})));
 assert.ok(staleRequests.every(r=>r.status===401),'all post-revocation concurrent reads fail closed');
 ok('twelve concurrent stale-token requests denied');
 // A DB-side account revocation must also block a stale in-memory session on state PUT.
 const dbRevocationLogin=await request('/api/login',{method:'POST',body:{username:users.technician.username,password:pw}});
 assert.equal(dbRevocationLogin.status,200);
 const [[revocationState]]=await db.query('SELECT revision,data FROM cmms_state WHERE id=1');
 await db.execute('UPDATE cmms_users SET active=0 WHERE id=?',[techId]);
 const staleWrite=await request('/api/state',{method:'PUT',cookie:dbRevocationLogin.cookie,body:{revision:Number(revocationState.revision),state:JSON.parse(revocationState.data)}});
 assert.equal(staleWrite.status,401,'DB-revoked technician token denied on state mutation');
 const [[unchangedRevocationState]]=await db.query('SELECT revision,data FROM cmms_state WHERE id=1');
 assert.equal(unchangedRevocationState.revision,revocationState.revision);
 assert.equal(unchangedRevocationState.data,revocationState.data);
 await db.execute('UPDATE cmms_users SET active=1 WHERE id=?',[techId]);
 ok('database-side account revocation rejects stale state mutation without commit');
 const [[beforePermission]]=await db.execute('SELECT permissions FROM cmms_users WHERE id=?',[techId]);
 const freshLogin=await request('/api/login',{method:'POST',body:{username:users.manager.username,password:pw}});
 assert.equal(freshLogin.status,200);
 assert.equal((await request('/api/permissions',{method:'PATCH',cookie:freshLogin.cookie,body:{id:techId,permissions:{}}})).status,403,'manager cannot edit technician permissions');
 const [[afterPermission]]=await db.execute('SELECT permissions FROM cmms_users WHERE id=?',[techId]);
 assert.equal(afterPermission.permissions,beforePermission.permissions,'forbidden permission update left DB unchanged');
 ok('non-admin permission escalation rejected without database mutation');
 await db.end();console.log('INTEGRATION PASS '+passes+'/'+passes);
}catch(e){console.error('INTEGRATION FAIL after '+passes+' checks: '+e.message);process.exitCode=1}finally{if(chrome){chrome.kill('SIGTERM')}if(child){child.kill('SIGTERM');await delay(300);if(child.exitCode===null)child.kill('SIGKILL')}if(created)await conn.query('DROP DATABASE `'+TEMP+'`');await conn.end();console.log('Disposable test database removed')}
