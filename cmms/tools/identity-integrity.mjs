/** Explicitly offline: reads only a user-supplied JSON fixture, never DB or HTTP. */
import {readFileSync} from 'node:fs';
import {inspectIdentityIntegrity} from '../src/identity-integrity.js';
const file=process.argv[2];
if(!file){console.error('Usage: node tools/identity-integrity.mjs /path/to/offline-fixture.json');process.exit(2)}
const input=JSON.parse(readFileSync(file,'utf8'));
const report=inspectIdentityIntegrity(input.users,input.people);
console.log(JSON.stringify(report,null,2));
if(!report.passed)process.exitCode=1;
