import test from 'node:test';
import assert from 'node:assert/strict';
import {PartyGame,partyDefinitions} from '../server/games/party.js';
import {DrawingCanvasEngine,responseGroups} from '../server/games/party-tools.js';
import {TypingTransport} from '../client/src/games/typing-transport.js';
import {defaultConfig} from '../shared/game-config.js';
import {rankScores} from '../server/rooms.js';
import {categories,commonWords,trivia} from '../server/content/party.js';
const roster=(n=4)=>Array.from({length:n},(_,i)=>({id:'p'+i,name:'Player '+i,color:'#bdff47'}));
const game=(id:string,n=4,config:Record<string,number|string|boolean>={})=>new PartyGame(id,roster(n),1000,{config:{...defaultConfig(id),...config},matchIndex:0});
const raw=(g:PartyGame)=>g as any;
const advance=(g:PartyGame)=>{const at=g.deadline+1;g.tick(at,50);return at;};
const submitAll=(g:PartyGame,values:any[],offset=100)=>values.forEach((value,i)=>g.input('p'+i,{type:'submit',value},raw(g).phaseStart+offset));
const stroke=(id='stroke-1')=>({type:'stroke',strokeId:id,tool:'pen',points:[[.12,.24],[.3,.42]],width:8,color:'#112233'});

test('all 25 party definitions reject invalid inputs and finish at both roster limits while AFK',()=>{
  assert.equal(partyDefinitions.length,25);
  for(const d of partyDefinitions)for(const count of new Set([d.metadata.min,d.metadata.max])){
    const g=d.init(roster(count),1000,{config:defaultConfig(d.metadata.id),matchIndex:0});assert.doesNotThrow(()=>JSON.stringify(g.publicState()));assert.throws(()=>g.input('p0',{type:'__invalid_action__',score:999999},1100),d.metadata.id);assert.throws(()=>g.input('stranger',{type:'submit',value:1},1100));
    for(const p of roster(count))g.leave(p.id,1200);let now=1000;for(let i=0;i<2500&&!g.endCondition();i++){now+=30000;g.tick(now,50);assert.doesNotThrow(()=>JSON.stringify(g.publicState()));}assert.ok(g.done,`${d.metadata.id}/${count} must end with AFK players`);assert.ok(Object.values(g.score()).every(Number.isFinite));g.cleanup();assert.doesNotThrow(()=>JSON.stringify(g.serialize(null)));
  }
});

test('drawing validates normalized strokes, keeps gesture undo atomic, and requires clear confirmation',()=>{
  const canvas=new DrawingCanvasEngine();canvas.input('p0',stroke('one'),1000);canvas.input('p0',{...stroke('one'),points:[[.3,.42],[.8,.8]]},1040);canvas.input('p0',stroke('two'),1080);canvas.input('p0',{type:'undo'},1120);assert.equal(canvas.canvases.p0.length,2);canvas.input('p0',{type:'undo'},1160);assert.equal(canvas.canvases.p0.length,0);
  assert.throws(()=>canvas.input('p0',{...stroke(),points:[[1000,700]]},1200));assert.throws(()=>canvas.input('p0',{...stroke(),width:5},1240));canvas.input('p0',stroke(),1280);assert.throws(()=>canvas.input('p0',{type:'clear'},1320));canvas.input('p0',{type:'clear',confirm:true},1360);assert.equal(canvas.canvases.p0.length,0);
});

test('Draw & Guess private word, precise speed score, redacted correct chat, and equal drawer rotation',()=>{
  const g=game('draw-guess',3,{rounds:4}),counts:Record<string,number>={};assert.equal(g.serialize(null).maxRounds,6);
  for(let round=0;round<6;round++){
    const drawer=g.serialize(null).drawer,secret=g.serialize(drawer).secret;counts[drawer]=(counts[drawer]??0)+1;assert.equal(g.publicState().secret,undefined);const guessers=roster(3).filter(p=>p.id!==drawer);assert.equal(g.serialize(guessers[0].id).secret,undefined);const start=raw(g).phaseStart;g.input(drawer,stroke(`round${round}`),start+100);assert.equal(g.serialize(guessers[0].id).strokes.length,1);const before=g.scores[guessers[0].id];g.input(guessers[0].id,{value:secret},start+550);assert.equal(g.scores[guessers[0].id]-before,995);assert.ok(!g.serialize(guessers[1].id).chat.some((c:any)=>c.text===secret));g.input(guessers[1].id,{value:secret},start+700);assert.equal(g.phase,'reveal');assert.equal(g.publicState().reveal.answer,secret);advance(g);
  }assert.deepEqual(Object.values(counts).sort(),[2,2,2]);assert.ok(g.done);
});

test('Impostor read/discuss/vote phases preserve secrets, permit vote changes and survive tied highest votes',()=>{
  const g=game('impostor-word'),role=raw(g).role,civilians=roster().filter(p=>p.id!==role);assert.equal(g.phase,'read');assert.equal(g.serialize(role).secret,undefined);assert.equal(g.publicState().secret,undefined);assert.equal(g.publicState().role,undefined);assert.equal(g.serialize(civilians[0].id).secret,raw(g).secret);advance(g);assert.equal(g.phase,'discuss');advance(g);assert.equal(g.phase,'vote');const start=raw(g).phaseStart;
  g.input(civilians[0].id,{value:role},start+100);g.input(civilians[0].id,{value:civilians[1].id},start+200);assert.equal(g.serialize(civilians[0].id).yourChoice,civilians[1].id);assert.equal(g.serialize(civilians[1].id).yourChoice,undefined);assert.throws(()=>g.input(role,{value:role},start+100));
  g.input(civilians[1].id,{value:role},start+100);g.input(civilians[2].id,{value:role},start+100);g.input(role,{value:civilians[1].id},start+200);assert.equal(g.phase,'vote','revisable vote waits for deadline');advance(g);assert.equal(g.phase,'reveal');assert.equal(g.scores[role],750);assert.equal(g.publicState().reveal.caught,false);
});

test('caught impostor alone receives final-guess opportunity and can earn 500',()=>{
  const g=game('impostor-word'),role=raw(g).role,secret=raw(g).secret;advance(g);advance(g);const start=raw(g).phaseStart;for(const p of roster())g.input(p.id,{value:p.id===role?roster().find(q=>q.id!==role)!.id:role},start+100);advance(g);assert.equal(g.phase,'guess');assert.equal(g.publicState().secret,undefined);assert.equal(g.serialize(role).secret,undefined);const civilian=roster().find(p=>p.id!==role)!;assert.throws(()=>g.input(civilian.id,{value:secret},raw(g).phaseStart+100));g.input(role,{value:secret},raw(g).phaseStart+200);assert.equal(g.scores[role],500);assert.ok(g.publicState().reveal.stolen);
});

test('Type Race accepts only incremental target prefixes, counts typos, and deduplicates reconnect retries',()=>{
  const g=game('type-race',2),phrase=g.serialize('p0').phrase;assert.throws(()=>g.input('p0',{type:'type',index:0,segment:phrase},1200));g.input('p0',{type:'type',requestId:'retry1',index:0,segment:phrase[0]+'###'},1400);assert.equal(g.serialize('p0').yourText,phrase[0]);assert.equal(g.serialize('p0').racers[0].accuracy,25);g.input('p0',{type:'type',requestId:'retry1',index:0,segment:phrase[0]+'###'},2200);assert.equal(g.serialize('p0').racers[0].accuracy,25);assert.equal(g.serialize('p0').typingAck,'retry1');assert.equal(g.serialize('p1').typingAck,undefined);
  let now=3000;for(let i=1;i<phrase.length;i++){g.input('p0',{type:'type',index:i,segment:phrase[i],requestId:'char'+i},now);now+=100;}assert.ok(g.serialize('p0').racers[0].finished);advance(g);assert.equal(g.scores.p0,2000);assert.equal(g.scores.p1,0);assert.ok(g.tieBreaks.p0[0]<0);
});

test('Type Race client retries dropped packets without double-counting a partially accepted typo',()=>{
  const transport=new TypingTransport('test'),initial={text:'ax',server:'',disabled:false};const packet=transport.next(initial,0)!;assert.equal(packet.segment,'ax');assert.equal(transport.next(initial,649),null);assert.deepEqual(transport.next(initial,650),packet,'offline retries reuse the same ID');
  const partial={...initial,server:'a',ack:packet.requestId};assert.equal(transport.next(partial,700),null);assert.equal(transport.next(partial,2000),null,'the already-counted x must wait for a local edit');
  assert.equal(transport.next({...partial,text:'a'},2100),null);const corrected=transport.next({...partial,text:'ab'},2200)!;assert.equal(corrected.index,1);assert.equal(corrected.segment,'b');assert.notEqual(corrected.requestId,packet.requestId);
  const batch=new TypingTransport('batch'),text='abcdefghijklmnopqrstuvwx',first=batch.next({text,server:'',disabled:false},0)!;assert.equal(first.segment.length,12);const next=batch.next({text,server:text.slice(0,12),ack:first.requestId,disabled:false},100)!;assert.equal(next.segment,text.slice(12));assert.equal(next.index,12,'fully accepted batches continue with unsent characters');
});

test('Bomb challenges unlock a separate pass and keep the continuing fuse and answers private',()=>{
  const g=game('bomb-pass',3,{roundSeconds:6}),holder=g.serialize(null).holder,start=raw(g).phaseStart,fuse=raw(g).fuse,target=roster(3).find(p=>p.id!==holder)!.id;
  assert.equal(g.deadline-start,6000);assert.equal(g.publicState().challenge,undefined);assert.equal(g.serialize(target).challenge,undefined);assert.ok(!('fuse' in g.publicState()));assert.throws(()=>g.input(holder,{type:'pass',target},start+100));
  raw(g).secret='7';g.data.challenge={kind:'math',question:'3 + 4'};g.input(holder,{value:'7'},start+200);assert.ok(g.serialize(holder).unlocked);assert.equal(g.serialize(target).unlocked,undefined);g.input(holder,{type:'pass',target},start+400);assert.equal(g.serialize(null).holder,target);assert.equal(raw(g).fuse,fuse);assert.equal(g.serialize(holder).challenge,undefined);g.tick(fuse+1,50);assert.equal(g.phase,'reveal');assert.ok(!g.alive.includes(target));assert.equal(g.deadline-fuse,2001);
});

test('Bomb wrong answers wait one second and disconnect holders cannot escape elimination',()=>{
  const g=game('bomb-pass',3),holder=g.serialize(null).holder;raw(g).fuse=20000;raw(g).secret='7';g.data.challenge={kind:'math',question:'3 + 4'};g.input(holder,{value:'9'},1300);assert.equal(g.phase,'retry');g.tick(2299,50);assert.equal(g.phase,'retry');g.tick(2300,50);assert.equal(g.phase,'challenge');g.leave(holder,2400);g.tick(2400,50);g.tick(4400,50);assert.ok(!g.alive.includes(holder));assert.notEqual(g.serialize(null).holder,holder);assert.equal(raw(g).fuse,20000);
});

test('Odd Drawing uses private paired prompts, inspection and anonymous gallery voting',()=>{
  const g=game('guess-drawing',3),odd=raw(g).role;assert.equal(g.publicState().secret,undefined);assert.notEqual(g.serialize(odd).secret,g.serialize(roster(3).find(p=>p.id!==odd)!.id).secret);g.input('p0',stroke(),1200);assert.equal(g.serialize('p1').strokes.length,0);for(const p of roster(3))g.input(p.id,{type:'submit'},1400);assert.equal(g.phase,'inspect');const gallery=g.serialize('p0').gallery;assert.ok(gallery.every((e:any)=>!('author' in e)));assert.throws(()=>g.input('p0',{value:0},1600));advance(g);assert.equal(g.phase,'vote');const self=g.serialize('p0').gallery.find((e:any)=>e.yours).index;assert.throws(()=>g.input('p0',{value:self},raw(g).phaseStart+100));advance(g);assert.equal(g.publicState().reveal.oddPlayer,odd);assert.equal(g.scores[odd],750);
});

test('Trivia confirmation lasts 500ms and private correctness only scores at reveal',()=>{
  const g=game('trivia-blitz',2),view=g.serialize('p0'),answer=trivia.find(q=>q.question===view.question)!.answer,index=view.options.indexOf(answer);g.input('p0',{value:(index+1)%4},1500);g.input('p0',{value:index},1700);assert.equal(g.serialize('p1').pending,undefined);assert.equal(g.scores.p0,0);g.tick(1999,50);assert.equal(g.serialize('p0').youSubmitted,false);g.tick(2000,50);assert.equal(g.serialize('p0').youSubmitted,true);assert.throws(()=>g.input('p0',{value:0},2100));g.input('p1',{value:(index+1)%4},2100);g.tick(2600,50);assert.equal(g.phase,'reveal');assert.equal(g.scores.p0,500+Math.floor(500*(13000-1700)/12000));assert.equal(g.scores.p1,0);assert.equal(g.publicState().reveal.answer,answer);assert.equal(g.publicState().reveal.distribution.length,4);
});

test('Word Chain enforces alphabetic dictionary entries and the configured turn cap',()=>{
  const g=game('word-chain',3,{rounds:20}),start=raw(g).phaseStart,current=g.serialize(null).current;g.data.previous='cat';g.used.add('cat');assert.throws(()=>g.input(current,{value:'t1ger'},start+100));g.input(current,{value:'tiger'},start+200);assert.equal(g.scores[current],1);assert.equal(g.serialize(null).previous,'tiger');assert.equal(g.deadline-(start+200),8000);assert.equal(g.serialize(null).turnLimit,20);
  for(const p of roster(3))g.strikes[p.id]=0;raw(g).turnCount=19;g.data.previous='cat';g.used.delete('tree');const next=g.serialize(null).current;g.input(next,{value:'tree'},raw(g).phaseStart+300);assert.equal(g.phase,'reveal');assert.equal(g.publicState().maxRounds,1);
});

test('Simon sends only the current light and requires ordered private reproduction',()=>{
  for(const id of ['memory-mayhem','sequence']){
    const g=game(id,2);assert.equal(g.sequence.length,3);const snapshot=g.publicState();assert.equal(snapshot.sequence,undefined);assert.equal(snapshot.currentPad,null);g.tick(1500,50);assert.equal(g.publicState().currentPad,g.sequence[0]);assert.equal(g.publicState().sequence,undefined);assert.throws(()=>g.input('p0',{value:g.sequence[0]},1600));const expected=[...g.sequence];advance(g);assert.equal(g.phase,'repeat');assert.equal(g.serialize('p0').sequence,undefined);let now=raw(g).phaseStart+100;for(const value of expected){g.input('p0',{value},now);now+=100;}assert.equal(g.scores.p0,100);assert.equal(g.serialize('p1').progress,0);assert.throws(()=>g.input('p0',{value:expected[0]},now+100));g.input('p1',{value:(expected[0]+1)%4},now+200);assert.equal(g.strikes.p1,1);assert.equal(g.phase,'reveal');assert.deepEqual(g.publicState().reveal.sequence,expected);advance(g);assert.equal(g.sequence.length,4);
  }
});

test('Simon reconnect during playback waits until the next round without leaking future steps',()=>{
  const g=game('sequence',3);g.leave('p0',1200);g.reconnect('p0',1400);assert.ok(g.serialize('p0').waitingNextRound);assert.equal(g.serialize('p0').canPlay,false);assert.equal(g.serialize('p0').sequence,undefined);advance(g);assert.throws(()=>g.input('p0',{value:g.sequence[0]},raw(g).phaseStart+100));advance(g);assert.equal(g.strikes.p0,0);advance(g);assert.equal(g.serialize('p0').waitingNextRound,false);
});

test('The Liar hides role and submissions until anonymous discussion, then scores correct civilians',()=>{
  const g=game('the-liar'),liar=raw(g).role;assert.equal(g.publicState().role,undefined);g.input('p0',{value:'My quiet moon garden'},1300);assert.ok(!JSON.stringify(g.serialize('p1')).includes('quiet moon garden'));for(let i=1;i<4;i++)g.input('p'+i,{value:'Personal response '+i},1300);assert.equal(g.phase,'inspect');assert.equal(g.deadline-raw(g).phaseStart,45000);advance(g);const target=raw(g).galleryOrder.indexOf(liar),start=raw(g).phaseStart;for(const p of roster())g.input(p.id,{value:p.id===liar?(target+1)%4:target},start+100);assert.equal(g.phase,'reveal');for(const p of roster())assert.equal(g.scores[p.id],p.id===liar?0:500);
});

test('Higher/Lower uses a 52-card no-replacement deck, equal pushes and two-strike elimination',()=>{
  const g=game('higher-lower',2),values=[g.data.current,g.data.next];for(let i=2;i<52;i++)values.push(raw(g).card());for(let rank=1;rank<=13;rank++)assert.equal(values.filter(v=>v===rank).length,4);
  g.data.current=5;g.data.next=5;submitAll(g,['higher','lower']);assert.deepEqual(g.strikes,{p0:0,p1:0});advance(g);g.data.current=5;g.data.next=6;submitAll(g,['higher','lower']);assert.equal(g.scores.p0,100);assert.equal(g.strikes.p1,1);advance(g);g.data.current=5;g.data.next=6;submitAll(g,['higher','lower']);assert.equal(g.alive.length,1);assert.equal(g.placementScores!.p0>g.placementScores!.p1,true);advance(g);assert.ok(g.done);
});

test('Fake Answer rejects truth aliases and duplicate fakes, anonymizes votes and scores truth/deception',()=>{
  const g=game('fake-answer',3),secret=raw(g).secret;raw(g).aliases=['truth alias'];assert.ok(!JSON.stringify(g.publicState()).includes(`"answer":"${secret}"`));assert.throws(()=>g.input('p0',{value:'truth alias'},1200));g.input('p0',{value:'A purple teapot'},1300);assert.throws(()=>g.input('p1',{value:'a purple teapot!'},1300));g.input('p1',{value:'A moon spoon'},1500);g.input('p2',{value:'A rainbow hammock'},1500);assert.equal(g.phase,'vote');const view=g.serialize('p0'),own=view.disabledOptions[0],truth=view.options.indexOf(secret);assert.equal(g.publicState().disabledOptions.length,0);assert.equal(g.publicState().optionOwners,undefined);assert.throws(()=>g.input('p0',{value:own},1700));g.input('p0',{value:truth},1800);g.input('p1',{value:own},1800);g.input('p2',{value:truth},1800);assert.equal(g.scores.p0,1500);assert.equal(g.scores.p1,0);assert.equal(g.scores.p2,1000);
});

test('sealed Auction bids are revisable, final highest timestamps break ties, and cash counts at quarter value',()=>{
  const g=game('auction-wars',3);assert.equal(g.serialize('p0').budgets.p0,1000);assert.equal(g.publicState().value,undefined);g.data.value=300;g.input('p0',{value:100},1500);g.input('p1',{value:100},1600);g.input('p0',{value:100},1800);g.input('p2',{value:0},1800);assert.equal(g.serialize('p1').yourBid,100);assert.equal(g.publicState().yourBid,undefined);assert.equal(g.phase,'bid');assert.throws(()=>g.input('p2',{value:1001},2000));advance(g);assert.equal(g.publicState().reveal.winner,'p1');assert.equal(g.scores.p1,525);assert.equal(g.scores.p0,250);assert.equal(g.publicState().reveal.budgets.p1,900);
});

test('Doodle Telephone privately routes each predecessor, uses configured drawing time and participation only',()=>{
  const g=game('doodle-telephone',4,{roundSeconds:60});submitAll(g,['Cloud number zero','Cloud number one','Cloud number two','Cloud number three']);assert.equal(g.phase,'draw');assert.equal(g.deadline-raw(g).phaseStart,60000);assert.equal(g.serialize('p1').assignment.text,'Cloud number zero');assert.equal(g.publicState().assignment,undefined);assert.ok(!JSON.stringify(g.serialize('p1')).includes('Cloud number two'));for(const p of roster())g.input(p.id,{type:'submit'},raw(g).phaseStart+100);assert.equal(g.phase,'describe');assert.equal(g.deadline-raw(g).phaseStart,25000);submitAll(g,['A cloud','Another cloud','A star','A feather']);for(const p of roster())g.input(p.id,{type:'submit'},raw(g).phaseStart+100);const result=g.publicState().reveal;assert.equal(result.chains.length,4);assert.ok(result.chains.every((c:any[])=>c.length===4));assert.ok(g.participationOnly);assert.deepEqual(Object.values(g.scores),[0,0,0,0]);
});

test('Speed Math validates genuine numeric payloads, ramps through 12 rounds and scores only correct answers',()=>{
  for(const value of [undefined,'',{},[],Infinity,NaN,'not a number']){const invalid=game('speed-math',2);assert.throws(()=>invalid.input('p0',{value},1200));}const g=game('speed-math',2);for(let r=1;r<=12;r++){assert.equal(g.round,r);const answer=Number(raw(g).secret),start=raw(g).phaseStart;if(r>=9)assert.ok(/[()]/.test(g.data.question)||g.data.question.includes('÷')&&g.data.question.includes('+'));g.input('p0',{value:answer},start+200);g.input('p1',{value:answer+1},start+200);assert.equal(g.scores.p0,r*990);assert.equal(g.scores.p1,0);advance(g);}assert.ok(g.done);assert.equal(g.tieBreaks.p0[0],-2400);
});

test('Closest Wins awards competition-rank ties and exact bonuses with sorted error results',()=>{
  const g=game('closest-wins'),answer=Number(raw(g).secret);submitAll(g,[answer+1,answer+1,answer+3,answer]);assert.deepEqual(g.scores,{p0:500,p1:500,p2:0,p3:1250});assert.deepEqual(g.publicState().reveal.estimates.map((e:any)=>e.error),[0,1,1,3]);
});

test('Categories normalizes simple singular/plural duplicates and rejects invalid categories',()=>{
  const g=game('categories');g.data={category:'Animals',letter:'T',question:'Animals beginning with T'};submitAll(g,['tiger','tigers','turtle','teapot']);assert.deepEqual(g.scores,{p0:250,p1:250,p2:500,p3:0});assert.deepEqual(g.publicState().reveal.validity,{p0:true,p1:true,p2:true,p3:false});
});

test('Scramble preserves letters, differs from answer, rate limits attempts and ranks solvers',()=>{
  const g=game('word-scramble',3),secret=raw(g).secret;assert.notEqual(g.data.scramble,secret);assert.deepEqual([...g.data.scramble].sort(),[...secret].sort());g.input('p0',{value:'wrong guess'},1200);assert.throws(()=>g.input('p0',{value:secret},1600));g.input('p0',{value:secret},1800);g.input('p1',{value:secret},1900);g.input('p2',{value:secret},2000);assert.deepEqual(g.scores,{p0:1000,p1:700,p2:600});
});

test('Hangman privately tracks letters, ignores repeats, penalizes full misses twice, and scores solve order',()=>{
  const g=game('hangman-battle',3);raw(g).secret='moon garden';g.input('p0',{value:'z'},1300);g.input('p0',{value:'z'},1500);assert.equal(g.serialize('p0').mistakes,1);g.input('p0',{value:'wrong phrase'},1700);assert.equal(g.serialize('p0').mistakes,3);g.input('p0',{value:'m'},1900);assert.ok(g.serialize('p0').mask.includes('m'));assert.ok(!g.serialize('p1').mask.includes('m'));assert.deepEqual(g.serialize('p1').letters,[]);g.input('p0',{value:'moon garden'},2100);g.input('p1',{value:'moon garden'},2200);g.input('p2',{value:'moon garden'},2300);assert.deepEqual(g.scores,{p0:1000,p1:700,p2:500});
});

test('Password shares the word only with two clue-givers, alternates collective attempts and awards clue points',()=>{
  const g=game('password',4,{roundSeconds:40});raw(g).secret='parasol';let v=g.serialize('p0');for(const p of roster())assert.equal(Boolean(g.serialize(p.id).secret),v.givers.includes(p.id));assert.equal(g.publicState().secret,undefined);const giver=v.giver,start=raw(g).phaseStart;assert.throws(()=>g.input(giver,{value:'parasols'},start+100));g.input(giver,{value:'rain-proof'},start+200);assert.equal(g.phase,'guess');assert.equal(g.deadline-(start+200),40000);const guesser=v.members.find((p:string)=>!v.givers.includes(p));g.input(guesser,{value:'umbrella'},start+400);assert.equal(g.phase,'clue');assert.equal(g.serialize('p0').clueNumber,2);v=g.serialize('p0');g.input(v.giver,{value:'shade'},raw(g).phaseStart+200);const nextGuesser=v.members.find((p:string)=>!v.givers.includes(p));g.input(nextGuesser,{value:'parasol'},raw(g).phaseStart+200);assert.equal(g.phase,'reveal');for(const p of roster())assert.equal(g.scores[p.id],v.members.includes(p.id)?3:0);
});

test('Password ends an unsolved word after four timed clue opportunities',()=>{const g=game('password',4,{rounds:1});for(let i=0;i<4;i++)advance(g);assert.equal(g.phase,'reveal');advance(g);assert.ok(g.done);assert.deepEqual(Object.values(g.scores),[0,0,0,0]);});

test('Emoji Guess accepts articles and punctuation and uses the same paced solver ranking',()=>{const g=game('emoji-guess',3);raw(g).secret='ice cream';submitAll(g,['The ice-cream!','ICE CREAM','an ice cream']);assert.deepEqual(g.scores,{p0:1000,p1:700,p2:600});});

test('social games use private revisable choices and the specified majority/minority tie scoring',()=>{
  const rather=game('would-you-rather');submitAll(rather,[0,0,1,1]);assert.equal(rather.phase,'answer');assert.equal(rather.publicState().yourChoice,undefined);advance(rather);assert.deepEqual(Object.values(rather.scores),[250,250,250,250]);
  const majority=game('majority-rules');raw(majority).options=['Spring','Summer','Autumn','Winter'];submitAll(majority,[0,0,1,1]);advance(majority);assert.deepEqual(Object.values(majority.scores),[300,300,300,300]);
  const minority=game('minority-rules');raw(minority).options=['One','Two','Three'];submitAll(minority,[0,0,1,2]);advance(minority);assert.deepEqual(Object.values(minority.scores),[0,0,500,500]);
  const equal=game('minority-rules');submitAll(equal,[0,0,0,0]);advance(equal);assert.deepEqual(Object.values(equal.scores),[250,250,250,250]);assert.equal(equal.publicState().reveal.counts['0'],4);
  assert.deepEqual({...responseGroups({p0:'constructor',p1:'constructor',p2:'__proto__'})},{constructor:2,['__proto__']:1});
});

test('Secret Number races simultaneously with private hints, 20-attempt limits and no leaked histories',()=>{
  const g=game('secret-number',3);raw(g).secret='713';g.input('p0',{value:500},1200);g.input('p1',{value:800},1200);assert.equal(g.serialize('p0').low,501);assert.equal(g.serialize('p1').high,799);assert.equal(g.serialize('p2').history.length,0);assert.equal(g.publicState().history.length,0);assert.ok(!JSON.stringify(g.publicState()).includes('713'));assert.throws(()=>g.input('p0',{value:600},1600));g.input('p0',{value:713},1800);g.input('p1',{value:713},1900);assert.equal(g.scores.p0,1000);assert.equal(g.scores.p1,700);for(let i=0;i<20;i++)g.input('p2',{value:1},2000+i*500);assert.equal(g.phase,'reveal');assert.equal(g.publicState().reveal.histories,undefined);assert.equal(g.publicState().reveal.answer,'713');
});

test('Secret Number no-solver fallback ranks final error and fewer attempts without publishing guesses',()=>{
  const g=game('secret-number',3);raw(g).secret='713';g.input('p0',{value:710},1300);g.input('p1',{value:700},1300);g.input('p1',{value:710},1900);g.input('p2',{value:800},1300);advance(g);assert.deepEqual(g.scores,{p0:1000,p1:700,p2:600});const reveal=g.publicState().reveal;assert.equal(reveal.noSolvers,true);assert.equal(reveal.answers,undefined);assert.equal(reveal.history,undefined);
});
