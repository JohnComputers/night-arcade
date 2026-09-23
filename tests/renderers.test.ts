import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {registry} from '../server/games/registry.js';

test('all 50 real React renderers accept initial, spectator, timed phase and finished server views',async()=>{
  await build({entryPoints:['client/src/games/BoardGame.tsx','client/src/games/PartyGame.tsx','client/src/games/ArcadeGame.tsx'],outdir:'test-results/renderers',bundle:true,format:'esm',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
  const components:Record<string,any>={};for(const [family,file]of Object.entries({board:'BoardGame',party:'PartyGame',arcade:'ArcadeGame'}))components[family]=(await import(pathToFileURL(resolve(`test-results/renderers/${file}.js`)).href)).default;
  for(const def of registry.values()){
    const players=Array.from({length:def.metadata.min},(_,i)=>({id:'p'+i,name:'Player '+i,color:'#bdff47',connected:true,ready:false,spectator:false,joinedAt:1000,stats:{wins:0,games:0,points:0}}));
    const game=def.init(players,1000);let now=1000;const seen=new Set<string>();
    for(let step=0;step<300&&!game.done;step++){
      const phase=game.serialize(null).phase;
      if(!seen.has(phase)){seen.add(phase);for(const id of ['p0',null]){const view=game.serialize(id);assert.doesNotThrow(()=>{const markup=renderToStaticMarkup(createElement(components[def.metadata.family],{view,send:()=>{},playerId:id??'spectator',players,now,spectator:id===null}));assert.ok(markup.length>100);},`${def.metadata.id}: ${phase} (${id??'spectator'})`);}}
      now+=30000;game.tick(now,50);
    }
    assert.ok(game.done,`${def.metadata.id} must finish under timeout inputs`);
    assert.doesNotThrow(()=>renderToStaticMarkup(createElement(components[def.metadata.family],{view:game.serialize('p0'),send:()=>{},playerId:'p0',players,now,spectator:false})),`${def.metadata.id}: final recap`);
    game.cleanup();
  }
});
