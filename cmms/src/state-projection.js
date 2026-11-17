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
  state.audit=[];
  state.settings={facility:String(state.settings?.facility||'')};
  return state;
 }
 // New roles are denied state snapshot access until explicit per-role projections are implemented.
 throw Object.assign(Error('Role-specific state access is not yet enabled'),{status:403});
}

/**
 * Reconstruct a complete snapshot from a technician's projected edit.
 * Never use a projected client snapshot as the database replacement.
 * Existing work-order fields not present in the projection remain unchanged;
 * changed fields are checked by the server's checkStateChanges function.
 */
export function mergeTechnicianState(original,submitted,session){
 if(session?.role!=='technician')throw Object.assign(Error('Technician account required'),{status:403});
 if(!session.personId)throw Object.assign(Error('Employee link required'),{status:403});
 const baseline=structuredClone(original);
 const incoming=submitted?.workOrders;
 if(!Array.isArray(incoming))throw Object.assign(Error('Work orders required'),{status:400});
 const own=new Map((original.workOrders||[]).filter(w=>w.assigneeId===session.personId).map(w=>[w.id,w]));
 if(incoming.length!==own.size||new Set(incoming.map(w=>w.id)).size!==incoming.length||incoming.some(w=>!own.has(w.id)))throw Object.assign(Error('Work order scope mismatch'),{status:403});
 const allowed=new Set(['status','completionNotes','completedAt','laborHours','materialCost','checklist']);
 const edits=new Map();
 for(const row of incoming){
  const before=own.get(row.id);
  for(const key of Object.keys(row)){
   if(!Object.hasOwn(before,key)&&!allowed.has(key))throw Object.assign(Error('Unexpected work order field'),{status:403});
   if(!allowed.has(key)&&JSON.stringify(row[key])!==JSON.stringify(before[key]))throw Object.assign(Error('Work order field is read-only'),{status:403});
  }
  edits.set(row.id,Object.fromEntries(Object.entries(row).filter(([key])=>allowed.has(key))));
 }
 baseline.workOrders=(original.workOrders||[]).map(row=>own.has(row.id)?{...row,...edits.get(row.id)}:row);
 // No other client-supplied collections or settings are accepted.
 return baseline;
}
