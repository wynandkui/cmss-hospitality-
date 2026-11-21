import {requireAccess} from './role-policy.js';

// Read-only operational API projection; never expose the unrestricted state document.
export function projectOperationalWorkOrders(source,session){
 requireAccess(session,'workOrders.readAll');
 const orders=(source.workOrders||[]).map(w=>({id:w.id,number:w.number,status:w.status,priority:w.priority,description:w.description,assetId:w.assetId,locationId:w.locationId,assigneeId:w.assigneeId,createdAt:w.createdAt,dueDate:w.dueDate,completedAt:w.completedAt}));
 const assetIds=new Set(orders.map(w=>w.assetId).filter(Boolean));
 const locationIds=new Set(orders.map(w=>w.locationId).filter(Boolean));
 return {
  workOrders:orders,
  assets:(source.assets||[]).filter(a=>assetIds.has(a.id)).map(a=>({id:a.id,name:a.name,code:a.code})),
  locations:(source.locations||[]).filter(l=>locationIds.has(l.id)).map(l=>({id:l.id,name:l.name})),
 };
}
