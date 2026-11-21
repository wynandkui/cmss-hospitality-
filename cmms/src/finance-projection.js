import {requireAccess} from './role-policy.js';
import {costReport} from './finance.js';

// Read-only aggregate reporting; no vendor, invoice, bank or employee records.
export function projectFinanceSummary(source,session,start,end){
 requireAccess(session,'reports.finance');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||start>end||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end)))throw Object.assign(Error('Valid date range required'),{status:400});
 const report=costReport(source,start,end);
 return {start,end,report};
}
