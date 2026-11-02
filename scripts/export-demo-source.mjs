import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes,createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,realpathSync,lstatSync} from 'node:fs';
import path from 'node:path';
const root=realpathSync(process.cwd()),destination=path.resolve('.tools',`clean-start-${randomBytes(6).toString('hex')}`);
assert.ok(destination.startsWith(path.join(root,'.tools')+path.sep));assert.ok(!existsSync(destination));mkdirSync(destination,{recursive:true});
const files=[...new Set(execFileSync('git',['-c','safe.directory=D:/project/gibei-uisi','ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean))].sort();
const hash=createHash('sha256');let count=0;
for(const file of files){
 if(file.startsWith('.env')&&!['.env.example','.env.test.example'].includes(file))continue;
 const source=path.resolve(root,file),target=path.resolve(destination,file);assert.ok(source.startsWith(root+path.sep));assert.ok(target.startsWith(destination+path.sep));
 assert.ok(!lstatSync(source).isSymbolicLink(),'Export contains source files, never symlinks');
 const bytes=readFileSync(source);hash.update(file);hash.update(bytes);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,bytes);count++;
}
assert.ok(!existsSync(path.join(destination,'.env.local')));assert.ok(!existsSync(path.join(destination,'node_modules')));
const proof={date:new Date().toISOString(),sourceCommit:execFileSync('git',['-c','safe.directory=D:/project/gibei-uisi','rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTreeSnapshot:true,files:count,sourceHash:hash.digest('hex'),destination,environmentFilesExcluded:true};
writeFileSync(path.join(destination,'source-manifest.json'),JSON.stringify(proof,null,2));mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/clean-start-source.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
