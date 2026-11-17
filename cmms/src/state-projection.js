import {canAccess} from './role-policy.js';

// Server-side read projection: never send an unrestricted state snapshot to a technician.
export function projectStateForSession(source,session){
 if(!session)throw Object.assign(Error('Login required'),{status:401});
 const state=structuredClone(source);
 if(session.role==='admin')return state;
 if(session.role==='technician'){
  state.workOrders=(state.workOrders||[]).filter(w=>canAccess(session,'workOrders.readOwn',w));
  // Keep only the minimal data required for assigned work-order display.
  const assigned=state.workOrders;
  const assetIds=new Set(assigned.map(w=>w.assetId).filter(Boolean));
  const locationIds=new Set(assigned.map(w=>w.locationId).filter(Boolean));
  state.assets=(state.assets||[]).filter(a=>assetIds.has(a.id));
  state.locations=(state.locations||[]).filter(l=>locationIds.has(l.id));
  state.people=(state.people||[]).filter(p=>p.id===session.personId).map(p=>({id:p.id,name:p.name,trade:p.trade,jobTitle:p.jobTitle}));
  for(const key of ['vendors','requisitions','purchaseOrders','costEntries','parts','inspections','readings','plans'])state[key]=[];
  return state;
 }
 // New roles are denied state snapshot access until explicit per-role projections are implemented.
 throw Object.assign(Error('Role-specific state access is not yet enabled'),{status:403});
}
