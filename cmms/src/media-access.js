import {canAccess} from './role-policy.js';

// Fail closed for unknown records and for users without an explicit operational scope.
export function canReadOperationalAttachment(session,type,entityId,state){
 if(!session||!['assets','inspections'].includes(type)||!entityId)return false;
 const records=type==='assets'?state?.assets:state?.inspections;
 const record=Array.isArray(records)?records.find(row=>row.id===entityId):null;
 if(!record)return false;
 if(session.role==='admin')return true;
 if(canAccess(session,'workOrders.readAll'))return true;
 if(session.role!=='technician'||!session.personId)return false;
 const assetId=type==='assets'?record.id:record.assetId;
 if(!assetId)return false;
 return (state?.workOrders||[]).some(order=>order.assetId===assetId&&canAccess(session,'workOrders.readOwn',order));
}
