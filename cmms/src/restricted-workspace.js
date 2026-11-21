import {roleAllows} from './role-policy.js';
export const isRestrictedRole=role=>['manager','supervisor','coordinator','finance_admin'].includes(role);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function restrictedEndpoint(role){if(roleAllows(role,'workOrders.readAll'))return '/api/operational/work-orders';if(roleAllows(role,'reports.finance'))return '/api/finance/summary';return null;}
export function restrictedWorkspace(role,data={}){
 if(!isRestrictedRole(role))throw Error('Not a restricted workspace role');
 let content='';
 if(roleAllows(role,'workOrders.readAll')){
  const orders=Array.isArray(data.workOrders)?data.workOrders:[];
  content='<h2>Operational work orders</h2><p>Restricted operational view. Other modules are unavailable until authorized workflows are released.</p>';
  content+='<table><thead><tr><th>Reference</th><th>Status</th><th>Priority</th><th>Description</th></tr></thead><tbody>'+orders.map(w=>'<tr><td>'+esc(w.code||w.number||w.id)+'</td><td>'+esc(w.status)+'</td><td>'+esc(w.priority)+'</td><td>'+esc(w.title||w.description)+'</td></tr>').join('')+'</tbody></table>';
  if(roleAllows(role,'people.update'))content+='<form id="restrictedPeopleContact"><h3>Update employee contact</h3><label>Employee ID<input name="personId" required></label><label>Email<input type="email" name="email" required></label><button type="submit">Update contact</button></form>';
  if(roleAllows(role,'pm.manage'))content+='<form id="restrictedPmCreate"><h3>Create preventive maintenance plan</h3><label>Title<input name="title" maxlength="200" required></label><label>First due date<input type="date" name="startDate" required></label><label>Interval (days)<input type="number" name="interval" min="1" max="365" required></label><button type="submit">Create PM plan</button></form>';
  if(roleAllows(role,'workOrders.create'))content+='<form id="restrictedCreate"><h3>Create work order</h3><label>Title<input name="title" maxlength="200" required></label><label>Priority<select name="priority"><option>Medium</option><option>Low</option><option>High</option><option>Critical</option></select></label><button type="submit">Create open work order</button></form>';
  if(roleAllows(role,'workOrders.assign'))content+='<form id="restrictedAssign"><h3>Assign work order</h3><label>Work order ID<input name="workOrderId" required></label><label>Employee ID<input name="assigneeId" required></label><button type="submit">Assign</button></form>';
 }else if(roleAllows(role,'reports.finance')){
  content='<h2>Finance summary</h2><p>Restricted aggregated cost reporting and append-only maintenance cost posting.</p><pre>'+esc(JSON.stringify(data.report??{},null,2))+'</pre><form id="restrictedCostPost"><h3>Post maintenance cost</h3><label>Work order ID<input name="workOrderId" required></label><label>Category<select name="category"><option value="labour">Labour</option><option value="services">Services</option><option value="other">Other</option></select></label><label>Date<input type="date" name="date" required></label><label>Description<input name="description" required></label><label>Amount (ZAR)<input type="number" min="0.01" step="0.01" name="amount" required></label><button type="submit">Post cost</button></form>';
 }else content='<p>No authorized workspace is available.</p>';
 return '<div class="auth-page"><section class="panel pad" style="width:min(100%,1000px);max-height:95vh;overflow:auto"><h1>CMMS · '+esc(role.replaceAll('_',' '))+'</h1><button id="restrictedLogout" type="button">Sign out</button><button id="restrictedRefresh" type="button">Refresh</button><p id="restrictedError" role="alert"></p>'+content+'</section></div>';
}
