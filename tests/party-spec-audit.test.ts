import test from 'node:test';
import assert from 'node:assert/strict';
import {PartyGame} from '../server/games/party-engine.js';
import {rankScores} from '../server/games/utilities.js';

const players=Array.from({length:4},(_,i)=>({id:`audit${i}`,name:`Audit ${i}`,color:'#ffffff'}));
const game=(id:string,count=4,config:Record<string,number|string|boolean>={})=>new PartyGame(id,players.slice(0,count),1000,{config,matchIndex:0});
const stroke=(id:string)=>({type:'stroke',strokeId:id,tool:'pen',color:'#112233',width:8,points:[[0.1,0.2],[0.3,0.4]]});

test('audit: drawing answers stay private and partial-second speed scoring matches the spec',()=>{
  const g=game('draw-guess',3),drawer=g.publicState().drawer as string,guessers=players.slice(0,3).filter(p=>p.id!==drawer),word=g.privateState(drawer).secret;
  g.input(drawer,stroke('drawing-gesture'),1200);
  assert.throws(()=>g.input(guessers[0].id,stroke('wrong-artist'),1300));
  for(const id of [null,guessers[0].id,guessers[1].id,'unknown'])assert.equal(g.serialize(id).secret,undefined);
  g.input(guessers[0].id,{type:'submit',value:word},1550);
  assert.equal(g.scores[guessers[0].id],995);assert.equal(g.scores[drawer],250);
  assert.equal(g.phase,'draw');assert.equal(g.publicState().chat.at(-1).text,'guessed it!');
  assert.equal(g.privateState(guessers[1].id).strokes.length,1);
  assert.throws(()=>g.input(guessers[0].id,{type:'submit',value:word},1700));
  g.input(guessers[1].id,{type:'submit',value:word},1800);
  assert.equal(g.phase,'reveal');assert.equal(g.publicState().reveal.answer,word);
});

test('audit: impostor votes can change privately until the deadline and only the caught impostor can guess',()=>{
  const g=game('impostor-word'),role=players.find(p=>g.privateState(p.id).role==='impostor')!.id,civilians=players.filter(p=>p.id!==role),secret=g.privateState(civilians[0].id).secret;
  assert.equal(g.privateState(role).secret,undefined);assert.equal(g.publicState().secret,undefined);
  g.tick(g.deadline,0);assert.equal(g.phase,'discuss');g.tick(g.deadline,0);assert.equal(g.phase,'vote');
  const now=g.deadline-1000;
  g.input(civilians[0].id,{type:'submit',value:civilians[1].id},now);
  g.input(civilians[0].id,{type:'submit',value:role},now+100);
  for(const p of civilians.slice(1))g.input(p.id,{type:'submit',value:role},now+100);
  g.input(role,{type:'submit',value:civilians[0].id},now+100);
  assert.equal(g.phase,'vote');assert.equal(g.publicState().votes,undefined);assert.equal(g.privateState(role).yourChoice,civilians[0].id);
  assert.equal(g.privateState(civilians[0].id).yourChoice,role);assert.equal(g.publicState().yourChoice,undefined);
  g.tick(g.deadline,0);assert.equal(g.phase,'guess');assert.equal(g.deadline-now,16000);
  assert.throws(()=>g.input(civilians[0].id,{type:'submit',value:secret},g.deadline-1000));
  g.input(role,{type:'submit',value:secret},g.deadline-900);
  assert.equal(g.scores[role],500);for(const p of civilians)assert.equal(g.scores[p.id],500);
  assert.equal(g.publicState().reveal.stolen,true);
});

test('audit: tied impostor vote survives rather than awarding an arbitrary caught result',()=>{
  const g=game('impostor-word',3);g.tick(g.deadline,0);g.tick(g.deadline,0);
  for(let i=0;i<3;i++)g.input(players[i].id,{type:'submit',value:players[(i+1)%3].id},g.deadline-500);
  g.tick(g.deadline,0);const reveal=g.publicState().reveal;
  assert.equal(reveal.caught,false);assert.equal(g.scores[reveal.impostor],750);
});

test('audit: bomb transfer preserves hidden fuse, challenge privacy, and disconnect forfeiture',()=>{
  const g=game('bomb-pass',4,{roundSeconds:5}),internal=g as any,holder=g.publicState().holder as string,target=players.find(p=>p.id!==holder)!.id,fuse=internal.fuse;
  assert.equal(g.deadline,6000);
  for(const id of [null,target,'unknown']){const view=g.serialize(id);assert.equal(view.challenge,undefined);assert.equal(view.fuse,undefined);assert.equal(view.explosionAt,undefined);}
  internal.data.challenge={kind:'math',question:'1 + 1'};internal.secret='2';
  g.input(holder,{type:'submit',value:'2'},1300);assert.equal(g.publicState().deadline,undefined);
  g.input(holder,{type:'pass',target},1400);assert.equal(internal.fuse,fuse);assert.equal(g.publicState().holder,target);assert.equal(g.privateState(holder).challenge,undefined);assert.ok(g.privateState(target).challenge);
  g.leave(target,1500);g.tick(1500,0);g.tick(3500,0);
  assert.ok(!g.alive.includes(target));assert.equal(internal.fuse,fuse);assert.notEqual(g.publicState().holder,target);assert.equal(g.done,false);
});

test('audit: odd drawings are private before an anonymous gallery and voting rejects own entry',()=>{
  const g=game('guess-drawing');for(const p of players)g.input(p.id,stroke(`gesture-${p.id}`),1200);
  for(const p of players){assert.equal(g.privateState(p.id).strokes.length,1);assert.equal(g.privateState(p.id).strokes[0].strokeId,`gesture-${p.id}`);assert.equal(g.privateState(p.id).role,undefined);}
  assert.deepEqual(g.publicState().strokes,[]);assert.equal(g.publicState().secret,undefined);
  for(const p of players)g.input(p.id,{type:'submit'},1500);
  assert.equal(g.phase,'inspect');assert.equal(g.publicState().gallery.length,4);
  assert.ok(g.publicState().gallery.every((entry:any)=>entry.author===undefined&&entry.yours===false));
  for(const p of players)assert.equal(g.privateState(p.id).gallery.filter((entry:any)=>entry.yours).length,1);
  const own=g.privateState(players[0].id).gallery.find((entry:any)=>entry.yours).index;
  assert.throws(()=>g.input(players[0].id,{type:'submit',value:(own+1)%4},1600));
  g.tick(g.deadline,0);assert.equal(g.phase,'vote');assert.throws(()=>g.input(players[0].id,{type:'submit',value:own},g.deadline-1000));
});

test('audit: auctions stay sealed until deadline and tied bids use the earliest final revision',()=>{
  const g=game('auction-wars',3),start=g.deadline;
  g.input(players[0].id,{type:'submit',value:100},1200);g.input(players[1].id,{type:'submit',value:100},1300);g.input(players[0].id,{type:'submit',value:100},1400);g.input(players[2].id,{type:'submit',value:50},1400);
  assert.equal(g.phase,'bid');assert.equal(g.deadline,start);assert.equal(g.publicState().value,undefined);assert.equal(g.publicState().bids,undefined);assert.equal(g.privateState(players[2].id).yourBid,50);
  assert.throws(()=>g.input(players[2].id,{type:'submit',value:1001},1500));assert.throws(()=>g.input(players[2].id,{type:'submit',value:1.5},1600));
  g.tick(g.deadline,0);const result=g.publicState().reveal;
  assert.equal(result.winner,players[1].id);assert.equal(result.budgets[players[1].id],900);assert.equal(g.scores[players[1].id],result.value+225);assert.equal(g.scores[players[0].id],250);
});

test('audit: telephone privately rotates every chain exactly once through every player',()=>{
  const g=game('doodle-telephone',4,{roundSeconds:20});
  for(const [i,p] of players.entries())g.input(p.id,{type:'submit',value:`Original phrase ${i}`},1500);
  assert.equal(g.phase,'draw');assert.equal(g.deadline,21500);
  for(const [i,p] of players.entries()){const view=g.privateState(p.id);assert.equal(view.assignment.text,`Original phrase ${(i+3)%4}`);assert.equal(view.assignment.author,undefined);assert.equal(view.chains,undefined);}
  assert.equal(g.publicState().assignment,undefined);
  for(const p of players){g.input(p.id,stroke(`telephone-${p.id}`),1800);g.input(p.id,{type:'submit'},2000);}
  assert.equal(g.phase,'describe');for(const [i,p] of players.entries()){const assignment=g.privateState(p.id).assignment;assert.equal(assignment.kind,'drawing');assert.equal(assignment.strokes[0].strokeId,`telephone-${players[(i+3)%4].id}`);assert.equal(assignment.author,undefined);assert.equal(assignment.text,undefined);}
  for(const [i,p]of players.entries())g.input(p.id,{type:'submit',value:`Later description ${i}`},2300);
  assert.equal(g.phase,'draw');for(const p of players)g.input(p.id,{type:'submit'},2500);
  assert.equal(g.phase,'reveal');assert.equal(g.participationOnly,true);const chains=g.publicState().reveal.chains;
  assert.equal(chains.length,4);for(const chain of chains){assert.equal(chain.length,4);assert.equal(new Set(chain.map((entry:any)=>entry.author)).size,4);assert.deepEqual(chain.map((entry:any)=>entry.kind),['text','drawing','text','drawing']);}
  assert.ok(Object.values(g.scores).every(score=>score===0));
});

test('audit: password protects both cluegivers and restricts the active team to one collective guess',()=>{
  const g=game('password',4,{roundSeconds:17}),view=g.publicState(),givers=view.givers as string[],secret=g.privateState(givers[0]).secret;
  assert.equal(g.deadline,18000);for(const p of players)assert.equal(g.privateState(p.id).secret,givers.includes(p.id)?secret:undefined);assert.equal(g.publicState().secret,undefined);
  g.input(view.giver,{type:'submit',value:'qzxmy'},1200);assert.equal(g.phase,'guess');assert.equal(g.deadline,18200);
  assert.throws(()=>g.input(givers[0],{type:'submit',value:secret},1400));assert.throws(()=>g.input(givers[1],{type:'submit',value:secret},1400));
  const guesser=players.find(p=>view.members.includes(p.id)&&!givers.includes(p.id))!;
  g.input(guesser.id,{type:'submit',value:'qzxmy'},1500);assert.equal(g.phase,'clue');assert.equal(g.publicState().team,1);assert.equal(g.publicState().clueNumber,2);
  assert.throws(()=>g.input(guesser.id,{type:'submit',value:secret},1700));
  const second=g.publicState(),secondGuesser=players.find(p=>second.members.includes(p.id)&&!givers.includes(p.id))!;
  g.input(second.giver,{type:'submit',value:'qzxmy'},1800);g.input(secondGuesser.id,{type:'submit',value:secret},2000);
  assert.equal(g.phase,'reveal');for(const p of players)assert.equal(g.scores[p.id],second.members.includes(p.id)?3:0);
});

test('audit: secret number keeps each hint private, enforces rate and attempt limits, and ranks nonsolvers',()=>{
  const g=game('secret-number',3);(g as any).secret='500';
  g.input(players[0].id,{type:'submit',value:499},1500);g.input(players[1].id,{type:'submit',value:600},1500);
  assert.equal(g.privateState(players[0].id).low,500);assert.equal(g.privateState(players[0].id).high,1000);assert.equal(g.privateState(players[1].id).low,1);assert.equal(g.privateState(players[1].id).high,599);assert.deepEqual(g.publicState().history,[]);assert.deepEqual(g.privateState(players[2].id).history,[]);
  assert.throws(()=>g.input(players[1].id,{type:'submit',value:501},1600));g.input(players[1].id,{type:'submit',value:501},2000);
  g.tick(g.deadline,0);assert.equal(g.scores[players[0].id],1000);assert.equal(g.scores[players[1].id],700);assert.equal(g.scores[players[2].id],0);
  const limit=game('secret-number',2);(limit as any).secret='500';for(let i=0;i<20;i++)limit.input(players[0].id,{type:'submit',value:400},1500+i*500);
  assert.equal(limit.privateState(players[0].id).attempts,20);assert.equal(limit.privateState(players[1].id).attempts,0);assert.throws(()=>limit.input(players[0].id,{type:'submit',value:500},12000));
});

test('audit: Sequence transmits individual timed pads and preserves reconnect-wait survivor placement',()=>{
  const g=game('sequence',2,{rounds:20}),waiting=players[1].id,active=players[0].id;
  for(let round=1;round<=3;round++){
    assert.equal(g.phase,'show');const show=g.publicState();assert.equal(show.sequence,undefined);assert.equal(show.currentPad,null);assert.throws(()=>g.input(active,{type:'submit',value:0},g.deadline-100));
    g.tick(show.phaseStart+550,0);assert.equal(g.publicState().currentPad,g.sequence[0]);assert.equal(g.publicState().sequence,undefined);
    g.leave(waiting,show.phaseStart+600);g.reconnect(waiting,show.phaseStart+700);assert.equal(g.privateState(waiting).waitingNextRound,true);
    g.tick(g.deadline,0);const now=g.deadline-1000;assert.equal(g.phase,'repeat');assert.equal(g.publicState().currentPad,undefined);assert.throws(()=>g.input(waiting,{type:'submit',value:g.sequence[0]},now));
    if(round===1)g.sequence.forEach((value,index)=>g.input(active,{type:'submit',value},now+index*100));else g.input(active,{type:'submit',value:(g.sequence[0]+1)%4},now);
    assert.equal(g.phase,'reveal');g.tick(g.deadline,0);
  }
  assert.equal(g.done,true);assert.deepEqual(g.alive,[waiting]);assert.equal(g.scores[active],100);assert.equal(g.scores[waiting],0);
  assert.equal(rankScores(g.score(),{placementScores:g.placementScores,tieBreaks:g.tieBreaks})[0].playerId,waiting);
});

test('audit: Type Race counts the entire submitted segment and preserves confirmed progress on reconnect',()=>{
  const g=game('type-race',2),phrase=g.publicState().phrase as string,wrong=phrase[1]==='x'?'z':'x';
  g.input(players[0].id,{type:'type',index:0,segment:phrase[0]+wrong.repeat(3)},1200);
  assert.equal(g.privateState(players[0].id).yourText,phrase[0]);assert.equal(g.privateState(players[0].id).racers[0].accuracy,25);
  g.leave(players[0].id,1300);g.reconnect(players[0].id,1400);assert.equal(g.privateState(players[0].id).yourText,phrase[0]);
  assert.throws(()=>g.input(players[0].id,{type:'type',index:0,segment:phrase.slice(0,2)},1500));
  g.input(players[0].id,{type:'type',index:1,segment:phrase[1]},1600);assert.equal(g.privateState(players[0].id).yourText,phrase.slice(0,2));
});
