// v1.2 role policy. This module does not activate new roles in the API until migration and route audit are complete.
export const ROLES=Object.freeze(['admin','manager','supervisor','coordinator','finance_admin','technician']);
export const ACTIONS=Object.freeze(['users.manage','settings.manage','workOrders.create','workOrders.assign','workOrders.progressOwn','workOrders.readAll','workOrders.readOwn','purchaseOrders.create','purchaseOrders.supervisorApprove','purchaseOrders.managerApprove','pm.manage','people.update','reports.operational','reports.own','reports.finance','finance.manage','audit.read']);
const POLICY={
 admin:['*'],
 manager:['workOrders.create','workOrders.readAll','purchaseOrders.create','purchaseOrders.managerApprove','reports.operational'],
 supervisor:['workOrders.assign','workOrders.readAll','purchaseOrders.supervisorApprove','reports.operational'],
 coordinator:['pm.manage','people.update','workOrders.readAll','reports.operational'],
 finance_admin:['finance.manage','reports.finance'],
 technician:['workOrders.progressOwn','workOrders.readOwn','reports.own']
};
export function validRole(role){return ROLES.includes(role);}
export function roleAllows(role,action){return ACTIONS.includes(action)&&validRole(role)&&(POLICY[role].includes('*')||POLICY[role].includes(action));}
export function canAccess(session,action,record=null){
 if(!session||!roleAllows(session.role,action))return false;
 if(['workOrders.progressOwn','workOrders.readOwn','reports.own'].includes(action)){
  if(!session.personId)return false;
  if(record&&record.assigneeId!==session.personId)return false;
 }
 return true;
}
export function requireAccess(session,action,record=null){if(!canAccess(session,action,record))throw Object.assign(Error('Permission denied: '+action),{status:403});}
export function roleActions(role){return ACTIONS.filter(action=>roleAllows(role,action));}
