import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,canonicalGameId,gameMeta} from '../shared/catalog.js';
import {defaultConfig,validateConfig} from '../shared/game-config.js';
import {ShuffleBag} from '../server/content/shuffle-bag.js';
import {rankScores,ServerTimer,securePrivateState} from '../server/games/utilities.js';
import {BaseGame} from '../server/games/base.js';
import {RoomManager} from '../server/rooms.js';
import type {GameContext,GamePlayer} from '../shared/types.js';

class FixtureGame extends BaseGame {
  constructor(players:GamePlayer[],now:number,context?:GameContext){super('trivia-blitz',players,now,context);}
  input(id:string,_action:unknown,_now:number){this.eligible(id);}
  tick(){}
  serialize(id:string|null){return {...this.base(),...(id?{privateWord:`secret-for-${id}`}:{})};}
}
function roomFixture(){
  const contexts:GameContext[]=[];
  const definition={metadata:gameMeta('trivia-blitz'),init:(players:GamePlayer[],now:number,context?:GameContext)=>{contexts.push(context!);return new FixtureGame(players,now,context);}};
  const manager=new RoomManager(new Map([['trivia-blitz',definition]]),()=>{});
  const host=manager.create('s0','A','host-token-12345678901234567890',0);
  for(let i=1;i<4;i++)manager.join(`s${i}`,host.code,`P${i}`,`guest-token-${i}-12345678901234567890`,i);
  manager.select('s0','trivia-blitz',10);return {manager,room:manager.rooms.get(host.code)!,contexts};
}

test('all 50 game schemas have meaningful bounded recommended defaults and stable spec aliases',()=>{
  for(const meta of catalog){assert.equal(meta.minPlayers,meta.min);assert.equal(meta.maxPlayers,meta.max);assert.ok(meta.controls);assert.ok(meta.settings!.length);assert.equal(canonicalGameId(meta.specId!),meta.id);assert.deepEqual(validateConfig(meta.id,defaultConfig(meta.id)),defaultConfig(meta.id));for(const field of meta.settings!){assert.throws(()=>validateConfig(meta.id,{[field.key]:Infinity}));assert.throws(()=>validateConfig(meta.id,{[field.key]:null}));}}
  assert.equal(canonicalGameId('odd_drawing'),'guess-drawing');assert.equal(canonicalGameId('ultimate_ttt'),'ultimate-tic-tac-toe');
  for(const payload of [null,[],{unknown:4},{rounds:6},{rounds:'10'},JSON.parse('{"__proto__":5}')])assert.throws(()=>validateConfig('trivia-blitz',payload));
});
test('host settings persist per game, broadcast to every seat, reject tampering and freeze during countdown',()=>{
  const {manager,room}=roomFixture();
  assert.throws(()=>manager.configure('s1',{rounds:5},undefined,11),/NOT_HOST/);
  manager.configure('s0',{rounds:15,roundSeconds:20},undefined,12);
  assert.deepEqual(manager.snapshot(room,room.players[1].id,13).gameConfig,{rounds:15,roundSeconds:20});
  assert.throws(()=>manager.configure('s0',{rounds:99},undefined,14),/INVALID_CONFIG/);assert.equal(room.configs['trivia-blitz'].rounds,15);
  manager.start('s0',20);assert.equal(room.countdownEnd,3020);assert.throws(()=>manager.configure('s0',{},true,21),/GAME_IN_PROGRESS/);
  manager.lobby('s0',30);manager.configure('s0',undefined,true,31);assert.deepEqual(room.configs['trivia-blitz'],defaultConfig('trivia-blitz'));manager.close();
});
test('session placement points, tied wins, participation-only rounds and rematch context are authoritative',()=>{
  const {manager,room,contexts}=roomFixture();manager.start('s0',20);manager.lobby('s0',21);manager.start('s0',30);manager.tick(room.countdownEnd,50);
  assert.equal(contexts[0].matchIndex,0);assert.equal(contexts[0].content,room.content);
  room.players.forEach((p,i)=>room.game!.scores[p.id]=[1000,1000,100,0][i]);room.game!.roundEnd(4000);manager.tick(4000,50);manager.finish(room,4001);
  assert.deepEqual(room.results.map(r=>r.place),[1,1,3,4]);assert.deepEqual(room.players.map(p=>p.stats.points),[5,5,2,1]);assert.deepEqual(room.players.map(p=>p.stats.wins),[1,1,0,0]);
  manager.start('s0',5000);manager.tick(room.countdownEnd,50);assert.equal(contexts[1].matchIndex,1);room.game!.participationOnly=true;room.game!.roundEnd(9000);manager.tick(9000,50);
  assert.deepEqual(room.players.map(p=>p.stats.points),[6,6,3,2]);assert.deepEqual(room.players.map(p=>p.stats.wins),[1,1,0,0]);assert.ok(room.players.every(p=>p.stats.games===2));manager.close();
});
test('rankings retain raw game scores while supporting lower scores, finish overrides and tie breaks',()=>{
  const golf=rankScores({a:12,b:11,c:11},{direction:'asc',tieBreaks:{b:[-5000],c:[-4000]}});assert.deepEqual(golf.map(r=>[r.playerId,r.score,r.place]),[['c',11,1],['b',11,2],['a',12,3]]);
  const snake=rankScores({a:100,b:20},{placementScores:{a:0,b:1}});assert.deepEqual(snake.map(r=>[r.playerId,r.score]),[['b',20],['a',100]]);
  assert.deepEqual(rankScores({a:3,b:1},{placementScores:{}}),rankScores({a:3,b:1}));
  assert.throws(()=>rankScores({a:NaN}));assert.throws(()=>rankScores({a:1},{tieBreaks:{a:[Infinity]}}));
});
test('shuffle bags exhaust banks between repeats and keep room ownership independent',()=>{
  const bag=new ShuffleBag(),bank=['one','two','three','four'];const cycle=bank.map(()=>bag.draw('words',bank));assert.equal(new Set(cycle).size,bank.length);
  const next=bag.draw('words',bank);assert.notEqual(next,cycle.at(-1));const remainder=bank.slice(1).map(()=>bag.draw('words',[...bank]));assert.equal(new Set([next,...remainder]).size,bank.length);
  assert.equal(bag.draw('changed',['only']), 'only');assert.equal(new ShuffleBag().draw('words',['elsewhere']),'elsewhere');assert.throws(()=>bag.draw('empty',[]));bag.clear();
});
test('private view boundary excludes spectators and foreign seat identifiers',()=>{
  const game=new FixtureGame([{id:'p0',name:'A',color:'#fff'}],0);const seats=new Set(['p0']);
  assert.equal(securePrivateState(game,'p0',seats).privateWord,'secret-for-p0');
  for(const id of [null,'stranger','constructor','__proto__'])assert.equal(securePrivateState(game,id,seats).privateWord,undefined);
  assert.equal(game.privateState('stranger').privateWord,undefined);assert.equal(game.endCondition(),false);game.roundEnd(1);assert.equal(game.endCondition(),true);
});
test('server timers have exact expiration boundaries and never negative remaining time',()=>{
  const timer=new ServerTimer(1000,3000);assert.equal(timer.expired(3999),false);assert.equal(timer.expired(4000),true);assert.equal(timer.remaining(9000),0);timer.reset(5000,1000);assert.equal(timer.deadline,6000);
});
