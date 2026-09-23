import test from 'node:test';
import assert from 'node:assert/strict';
import {registry} from '../server/games/registry.js';
import {catalog} from '../shared/catalog.js';
test('exactly 50 unique selectable catalog entries match the server registry',()=>{assert.equal(catalog.length,50);assert.equal(registry.size,50);assert.equal(new Set(catalog.map(g=>g.id)).size,50);assert.deepEqual(catalog.map(g=>g.number),Array.from({length:50},(_,i)=>i+1));for(const m of catalog)assert.ok(registry.has(m.id));});
for(const definition of registry.values())test(`${String(definition.metadata.number).padStart(2,'0')} ${definition.metadata.name}: min/max startup, state boundaries, invalid input, timeout and cleanup`,()=>{
  const m=definition.metadata;assert.ok(m.name&&m.description&&m.instructions&&m.controls);assert.ok(m.min>=2&&m.max>=m.min&&m.max<=20);assert.equal(registry.get(m.specId!),definition);
  for(const count of new Set([m.min,m.max])){
    const players=Array.from({length:count},(_,i)=>({id:'p'+i,name:'Player '+i,color:'#bdff47'}));const game=definition.init(players,1000);assert.equal(game.id,m.id);assert.equal(game.endCondition(),false);
    for(const p of players){assert.ok(Number.isFinite(game.score()[p.id]));game.join(p.id,1010);game.leave(p.id,1020);game.reconnect(p.id,1030);const view=game.privateState(p.id);assert.equal(view.id,m.id);assert.ok(JSON.stringify(view).length<400_000);}
    assert.equal(game.publicState().id,m.id);assert.deepEqual(game.privateState('intruder'),game.publicState());game.tick(1040,40);assert.throws(()=>game.input('intruder',{type:'whatever',score:99999},1050));
    assert.throws(()=>game.input('p0',{type:'__invalid_action__',score:99999},1050),`${m.id}: invalid member action`);
    let now=1040;for(let step=0;step<600&&!game.endCondition();step++){now+=30000;game.tick(now,50);}
    assert.ok(game.endCondition(),`${m.id} at ${count} players must have a finite AFK completion path`);assert.ok(Object.values(game.score()).every(Number.isFinite));game.roundEnd(now);game.cleanup();game.cleanup();assert.doesNotThrow(()=>JSON.stringify(game.publicState()));
  }
});
