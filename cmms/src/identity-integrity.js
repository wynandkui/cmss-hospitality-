/** Pure, read-only identity checks. Never include names, passwords or contact data in findings. */
export function inspectIdentityIntegrity(users,people){
 if(!Array.isArray(users)||!Array.isArray(people))throw new TypeError('Expected user and people arrays');
 const findings=[];
 const peopleIds=new Set();
 for(const person of people){
  const id=String(person?.id??'').trim();
  if(!id){findings.push({code:'EMPLOYEE_ID_MISSING',severity:'high'});continue;}
  if(peopleIds.has(id))findings.push({code:'EMPLOYEE_ID_DUPLICATE',severity:'high',personId:id});
  peopleIds.add(id);
 }
 const accountIds=new Set(),linked=new Map();
 for(const user of users){
  const id=String(user?.id??'').trim(),role=String(user?.role??'');
  if(!id||accountIds.has(id))findings.push({code:'ACCOUNT_ID_INVALID_OR_DUPLICATE',severity:'high'});
  if(id)accountIds.add(id);
  if(role!=='technician')continue;
  const personId=String(user?.personId??user?.person_id??'').trim();
  if(!personId){findings.push({code:'TECHNICIAN_UNLINKED',severity:'high',accountId:id});continue;}
  if(!peopleIds.has(personId))findings.push({code:'TECHNICIAN_ORPHAN_LINK',severity:'high',accountId:id,personId});
  const linkedAccounts=linked.get(personId)||[];linkedAccounts.push(id);linked.set(personId,linkedAccounts);
 }
 for(const [personId,accounts] of linked){
  if(accounts.length>1)findings.push({code:'TECHNICIAN_SHARED_EMPLOYEE',severity:'critical',personId,accountIds:accounts});
 }
 return {accounts:users.length,employees:people.length,technicians:users.filter(u=>u?.role==='technician').length,findings,passed:findings.length===0};
}
