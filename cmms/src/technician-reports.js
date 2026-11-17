export function technicianStats(state,{personId='',from='',to='',basis='completed'}={}){
 const dateOf=w=>basis==='assigned'?(w.createdAt||'').slice(0,10):(w.completedAt||'').slice(0,10);
 const orders=state.workOrders.filter(w=>(!personId||w.assigneeId===personId)&&(!from||dateOf(w)>=from)&&(!to||dateOf(w)<=to)&&(basis==='assigned'||w.status==='Completed'));
 const people=new Map(state.people.map(p=>[p.id,p.name]));
 const groups=new Map();for(const w of orders){const key=w.assigneeId||'unassigned';if(!groups.has(key))groups.set(key,{personId:key,technician:people.get(key)||'Unassigned',assigned:0,completed:0,open:0,preventive:0,corrective:0,hours:0,materialCost:0});const r=groups.get(key);r.assigned++;if(w.status==='Completed')r.completed++;else r.open++;if(w.type==='Preventive')r.preventive++;if(w.type==='Corrective')r.corrective++;r.hours+=Number(w.laborHours)||0;r.materialCost+=Number(w.materialCost)||0;}
 return {orders,rows:[...groups.values()].sort((a,b)=>a.technician.localeCompare(b.technician))};
}