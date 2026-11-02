import lighthouse from 'lighthouse';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {cpus,totalmem,platform,release} from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.resolve('lighthouse'));
const {launch}=await import(pathToFileURL(require.resolve('chrome-launcher')).href);
const origin=new URL(process.argv[2]);
assert.equal(origin.hostname,'127.0.0.1');assert.equal(origin.protocol,'http:');assert.ok(!origin.username&&!origin.password&&!origin.search&&!origin.hash&&origin.pathname==='/');
const output=process.argv[3] || 'artifacts/lighthouse';assert.match(output,/^artifacts\/[a-z0-9/-]+$/);mkdirSync(output,{recursive:true});
const routes=['/','/publikasi/artikel','/publikasi/artikel/demo-artikel-01','/kegiatan'];
const dataset=await(await fetch(new URL('/api/public/articles?limit=48',origin))).json();assert.equal(dataset.totalDocs,24,'Use the fresh benchmark seed, not a mixed test database');
assert.ok(dataset.docs.every(row=>row.slug.startsWith('demo-artikel-')));
const hash=createHash('sha256').update(JSON.stringify(dataset)).digest('hex');
const summary={date:new Date().toISOString(),sourceCommit:execFileSync('git',['-c','safe.directory=D:/project/gibei-uisi','rev-parse','HEAD'],{encoding:'utf8'}).trim(),base:origin.origin,datasetHash:hash,publicArticles:24,machine:{platform:platform(),release:release(),cpu:cpus()[0].model,logicalCpus:cpus().length,memoryGiB:Math.round(totalmem()/2**30)},runs:[],pages:[]};
const chrome=await launch({chromePath:chromium.executablePath(),chromeFlags:['--headless=new','--no-sandbox','--disable-gpu'],logLevel:'error'});
try{
 for(let page=0;page<routes.length;page++){
  const scores=[];
  for(let run=0;run<4;run++){
   const result=await lighthouse(new URL(routes[page],origin).href,{port:chrome.port,onlyCategories:['performance'],output:['json','html'],logLevel:'error',formFactor:'mobile'});
   assert.ok(result&&!result.lhr.runtimeError,'A valid Lighthouse report is required');
   const {lhr}=result,name=`page-${page}-${run===0?'warmup':`run-${run}`}`;
   writeFileSync(`${output}/${name}.json`,result.report[0]);writeFileSync(`${output}/${name}.html`,result.report[1]);
   summary.lighthouse=lhr.lighthouseVersion;summary.browser=lhr.environment.hostUserAgent;summary.settings=lhr.configSettings;
   const metrics={score:Math.round(lhr.categories.performance.score*100),fcp:lhr.audits['first-contentful-paint'].numericValue,lcp:lhr.audits['largest-contentful-paint'].numericValue,tbt:lhr.audits['total-blocking-time'].numericValue,cls:lhr.audits['cumulative-layout-shift'].numericValue};
   summary.runs.push({route:routes[page],run,warmup:run===0,file:`${name}.json`,...metrics});if(run)scores.push(metrics.score);
   console.log(JSON.stringify({route:routes[page],run,warmup:run===0,...metrics}));
   writeFileSync(`${output}/summary.json`,JSON.stringify(summary,null,2));
  }
  summary.pages.push({route:routes[page],scores,median:[...scores].sort((a,b)=>a-b)[1],target:85});
 }
 const after=await(await fetch(new URL('/api/public/articles?limit=48',origin))).json();assert.equal(createHash('sha256').update(JSON.stringify(after)).digest('hex'),hash,'The public dataset must remain unchanged');
 summary.passed=summary.pages.every(row=>row.median>=85);writeFileSync(`${output}/summary.json`,JSON.stringify(summary,null,2));
 console.log(JSON.stringify({passed:summary.passed,pages:summary.pages}));if(!summary.passed)process.exitCode=1;
}finally{await chrome.kill();}
