import {requireAccess} from './role-policy.js';
import {validateRecord} from './validation.js';

// Pure, narrowly scoped mutation. Caller owns transaction, revision check and audit.
export function assignWorkOrder(source,session,input){
 requireAccess(session,'workOrders.assign');
 if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['workOrderId','assigneeId'].includes(k)))throw Object.assign(Error('Unexpected assignment fields'),{status:400});
 const id=input.workOrderId,assigneeId=input.assigneeId;
 if(typeof id!=='string'||!id||typeof assigneeId!=='string'||!assigneeId)throw Object.assign(Error('Work order and assignee required'),{status:400});
 const original=(source.workOrders||[]).find(w=>w.id===id);
 if(!original)throw Object.assign(Error('Work order not found'),{status:404});
 if(['Completed','Cancelled'].includes(original.status))throw Object.assign(Error('Closed work orders cannot be reassigned'),{status:409});
 if(!(source.people||[]).some(p=>p.id===assigneeId))throw Object.assign(Error('Technician not found'),{status:400});
 const next=structuredClone(source);
 const row=next.workOrders.find(w=>w.id===id);
 row.assigneeId=assigneeId;
 if(row.status==='Open')row.status='Assigned';
 const issues=validateRecord('workOrders',row,next,id);
 if(issues.length)throw Object.assign(Error(issues.map(i=>i.message).join(' ')),{status:400});
 return {next,before:original,after:row};
}
