import {ROLES} from '../src/role-policy.js';

// Explicit, non-destructive schema migration. Never run automatically on startup.
// Existing account rows, password hashes, employee links and permissions are preserved.
export const ROLE_COLUMN_SQL="ALTER TABLE cmms_users MODIFY COLUMN role ENUM('admin','manager','supervisor','coordinator','finance_admin','technician') NOT NULL";
export const LEGACY_ROLE_COLUMN_SQL="enum('admin','technician')";
export function migrationNeeded(column){
 if(!column||column.Field!=='role')throw Error('Unexpected cmms_users role column');
 if(column.Null!=='NO')throw Error('Role column must be NOT NULL');
 const type=String(column.Type).toLowerCase().replaceAll(' ','');
 if(type===LEGACY_ROLE_COLUMN_SQL)return true;
 const expected='enum('+ROLES.map(x=>"'"+x+"'").join(',')+')';
 if(type===expected)return false;
 throw Error('Unknown role schema: '+column.Type+'. Manual review required');
}
export async function inspectRoleMigration(connection){
 const [columns]=await connection.query('SHOW COLUMNS FROM cmms_users');
 const [roles]=await connection.query('SELECT role, COUNT(*) AS accounts FROM cmms_users GROUP BY role');
 return {needed:migrationNeeded(columns.find(x=>x.Field==='role')),roles:roles.map(x=>({role:x.role,accounts:Number(x.accounts)}))};
}
export async function applyRoleMigration(connection,{confirm=false}={}){
 if(!confirm)throw Error('Explicit confirmation required before changing role schema');
 const before=await inspectRoleMigration(connection);
 if(before.needed)await connection.query(ROLE_COLUMN_SQL);
 const after=await inspectRoleMigration(connection);
 if(after.needed)throw Error('Role migration did not take effect');
 const counts=x=>x.roles.reduce((n,row)=>n+row.accounts,0);
 if(counts(before)!==counts(after))throw Error('Account count changed unexpectedly; investigate immediately');
 return {changed:before.needed,before,after};
}
