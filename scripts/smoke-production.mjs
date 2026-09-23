import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
const probe=createServer();
await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;
await new Promise(resolve=>probe.close(resolve));
const child=spawn(process.execPath,['--env-file-if-exists=.env','dist/server/index.js'],{env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let output='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>output+=x);
try{
  let ready=false;
  for(let attempt=0;attempt<100;attempt++){
    if(child.exitCode!==null)throw Error(output);
    try{const response=await fetch(`http://127.0.0.1:${port}/api/health`);const health=await response.json();assert.equal(health.games,50);assert.equal(health.ok,true);ready=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}
  }
  assert.ok(ready,'Compiled server did not become ready: '+output);
  for(const path of ['/','/room/ABCDEF']){const response=await fetch(`http://127.0.0.1:${port}${path}`);assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('Night Arcade'));assert.ok(html.includes('/assets/'));}
  console.log('Production smoke passed: compiled server, 50-game API, built frontend and room refresh route.');
}finally{child.kill();await new Promise(resolve=>{if(child.exitCode!==null)return resolve();child.once('exit',resolve);});}
