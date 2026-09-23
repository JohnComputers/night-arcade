import test from 'node:test';
import assert from 'node:assert/strict';
import {Battleship, Checkers, ConnectFour, CrazyEights, DotsBoxes, President, UltimateTicTacToe, boardDefinitions} from '../server/games/boards.js';
import {cardRank, cardSuit, presidentStrength} from '../shared/board-rules.js';
import type {GamePlayer} from '../shared/types.js';

const players:GamePlayer[]=Array.from({length:8},(_,i)=>({id:`p${i}`,name:`Player ${i+1}`,color:['#a78bfa','#fb923c','#22d3ee'][i%3]}));
const pair=players.slice(0,2);
const invalid=(fn:()=>void)=>assert.throws(fn,{message:'INVALID_ACTION'});
const fleet=[{x:0,y:0,vertical:false},{x:0,y:2,vertical:false},{x:0,y:4,vertical:false},{x:0,y:6,vertical:false},{x:0,y:8,vertical:false}];

test('Connect Four enforces turns, gravity, integer input, and vertical wins',()=>{
  const g=new ConnectFour(pair,0);
  invalid(()=>g.input('p1',{type:'drop',column:0},1));
  invalid(()=>g.input('p0',{type:'drop',column:0.5},1));
  invalid(()=>g.input('p0',null,1));
  for(const [i,col] of [0,1,0,1,0,1,0].entries())g.input(`p${i%2}`,{type:'drop',column:col},i+1);
  assert.equal(g.board[35],1);assert.equal(g.board[14],1);assert.equal(g.done,true);assert.equal(g.scores.p0,100);assert.equal(g.winningCells.length,4);
  invalid(()=>g.input('p1',{type:'drop',column:1},10));
});

test('Connect Four recognizes diagonal and horizontal lines and rejects full columns',()=>{
  const horizontal=new ConnectFour(pair,0);
  for(const [i,col] of [0,6,1,6,2,5,3].entries())horizontal.input(`p${i%2}`,{type:'drop',column:col},i+1);
  assert.equal(horizontal.winner,'p0');
  const diagonal=new ConnectFour(pair,0);
  diagonal.board[35]=1;diagonal.board[29]=1;diagonal.board[23]=1;
  diagonal.board[24]=2;diagonal.board[31]=2;diagonal.board[38]=2;
  diagonal.input('p0',{type:'drop',column:3},1);assert.equal(diagonal.winner,'p0');
  const full=new ConnectFour(pair,0);for(let y=0;y<6;y++)full.board[y*7]=y%2+1;
  invalid(()=>full.input('p0',{type:'drop',column:0},1));
});

test('Ultimate Tic-Tac-Toe redirects turns and frees players when the target is closed',()=>{
  const g=new UltimateTicTacToe(pair,0);
  g.input('p0',{type:'mark',board:4,cell:2},1);assert.equal(g.forced,2);
  invalid(()=>g.input('p1',{type:'mark',board:3,cell:0},2));
  g.owners[4]=1;
  g.input('p1',{type:'mark',board:2,cell:4},2);assert.equal(g.forced,-1);
  invalid(()=>g.input('p0',{type:'mark',board:4,cell:1},3));
  invalid(()=>g.input('p0',{type:'mark',board:Infinity,cell:1},3));
});

test('Ultimate Tic-Tac-Toe requires three won boards; tied boards do not win',()=>{
  const g=new UltimateTicTacToe(pair,0);g.owners[0]=1;g.owners[1]=1;g.boards[2]=[1,1,0,0,2,0,0,0,2];
  g.input('p0',{type:'mark',board:2,cell:2},1);assert.equal(g.winner,'p0');
  const tied=new UltimateTicTacToe(pair,0);tied.owners=[-1,-1,0,1,2,1,2,1,2];tied.boards[2]=[1,2,1,1,2,2,2,1,0];
  tied.input('p0',{type:'mark',board:2,cell:8},1);assert.equal(tied.done,true);assert.equal(tied.winner,null);assert.equal(tied.scores.p0,50);
});

test('Dots & Boxes awards two adjacent boxes and an extra turn without accepting duplicate edges',()=>{
  const g=new DotsBoxes(players.slice(0,3),0);
  for(const i of [0,1,5,6])g.horizontal[i]=2;g.vertical[0]=2;g.vertical[2]=2;
  g.input('p0',{type:'edge',axis:'v',index:1},1);
  assert.equal(g.scores.p0,2);assert.equal(g.turn,0);assert.deepEqual(g.boxes.slice(0,2),[1,1]);
  invalid(()=>g.input('p0',{type:'edge',axis:'v',index:1},2));
  g.input('p0',{type:'edge',axis:'h',index:29},3);assert.equal(g.turn,1);
});

test('Battleship rejects overlaps, invalid orientations, and out-of-bounds fleets atomically',()=>{
  const g=new Battleship(pair,0);
  invalid(()=>g.input('p0',{type:'place',ships:fleet.map(()=>({x:0,y:0,vertical:false}))},1));
  invalid(()=>g.input('p0',{type:'place',ships:[{x:8,y:0,vertical:false},...fleet.slice(1)]},1));
  invalid(()=>g.input('p0',{type:'place',ships:[{x:0,y:0,vertical:'yes'},...fleet.slice(1)]},1));
  assert.equal(g.ready.p0,false);assert.deepEqual(g.fleets.p0,[]);
  g.input('p0',{type:'place',ships:fleet},1);invalid(()=>g.input('p0',{type:'auto-place'},2));
});

test('Battleship keeps layouts private, tracks hits/sinking, and alternates turns after hits',()=>{
  const g=new Battleship(pair,0);g.input('p0',{type:'place',ships:fleet},1);g.input('p1',{type:'place',ships:fleet},1);
  assert.equal(g.serialize('p0').ownShips.length,5);assert.equal(g.serialize(null).ownShips.length,0);assert.equal(g.serialize('stranger').ownShips.length,0);assert.deepEqual(g.serialize('constructor').ownShips,[]);
  assert.equal('fleets' in g.serialize('p0'),false);
  for(let x=0;x<5;x++) {
    g.input('p0',{type:'shoot',cell:x},2+x*2);assert.equal(g.turn,1);
    g.input('p1',{type:'shoot',cell:90+x},3+x*2);
  }
  assert.equal(g.shots.p0.every(s=>s.result==='sunk'),true);
  invalid(()=>g.input('p0',{type:'shoot',cell:0},20));
  invalid(()=>g.input('p0',{type:'shoot',cell:NaN},20));
  assert.equal(g.serialize('p0').shots.p1.length,5);
});

test('Battleship concludes only after the whole fleet is sunk; AFK placement does not deadlock',()=>{
  const g=new Battleship(pair,0);g.tick(60_001,0);assert.equal(g.phase,'playing');assert.equal(g.ready.p0,true);assert.equal(g.ready.p1,true);
  const cells=g.fleets.p1.flatMap(s=>s.cells);g.shots.p0=cells.slice(0,-1).map(cell=>({cell,result:'hit' as const}));
  g.input('p0',{type:'shoot',cell:cells.at(-1)},60_002);assert.equal(g.winner,'p0');assert.equal(g.done,true);
});

test('Checkers forces captures, maintains multi-jump ownership, and rejects invalid moves',()=>{
  const g=new Checkers(pair,0);g.board.fill(0);g.board[42]=1;g.board[40]=1;g.board[35]=-1;g.board[21]=-1;g.board[7]=-1;
  invalid(()=>g.input('p0',{type:'move',from:40,to:33},1));
  g.input('p0',{type:'move',from:42,to:28},1);assert.equal(g.chain,28);assert.equal(g.turn,0);assert.equal(g.board[35],0);
  invalid(()=>g.input('p1',{type:'move',from:7,to:14},2));
  invalid(()=>g.input('p0',{type:'move',from:40,to:33},2));
  g.input('p0',{type:'move',from:28,to:14},3);assert.equal(g.chain,null);assert.equal(g.turn,1);assert.equal(g.board[21],0);
});

test('Checkers gives kings backward captures and ends a promotion jump immediately',()=>{
  const king=new Checkers(pair,0);king.board.fill(0);king.board[26]=1;king.board[35]=-1;king.board[7]=-1;
  invalid(()=>king.input('p0',{type:'move',from:26,to:44},1));king.board[26]=2;
  king.input('p0',{type:'move',from:26,to:44},2);assert.equal(king.board[35],0);assert.equal(king.board[44],2);
  const promotion=new Checkers(pair,0);promotion.board.fill(0);promotion.board[17]=1;promotion.board[10]=-1;promotion.board[12]=-1;
  promotion.input('p0',{type:'move',from:17,to:3},1);assert.equal(promotion.board[3],2);assert.equal(promotion.chain,null);assert.equal(promotion.turn,1);
});

test('Checkers resolves no-move victories and threefold repetition',()=>{
  const win=new Checkers(pair,0);win.board.fill(0);win.board[17]=1;win.board[10]=-1;
  win.input('p0',{type:'move',from:17,to:3},1);assert.equal(win.done,true);assert.equal(win.winner,'p0');
  const draw=new Checkers(pair,0);draw.board.fill(0);draw.board[56]=2;draw.board[7]=-2;draw.positions.clear();draw.recordPosition();
  const cycle=[[56,49],[7,14],[49,56],[14,7]];
  for(let i=0;i<8;i++)draw.input(`p${i%2}`,{type:'move',from:cycle[i%4][0],to:cycle[i%4][1]},i+1);
  assert.equal(draw.done,true);assert.equal(draw.winner,null);assert.equal(draw.scores.p1,50);
});

test('Crazy Eights has private hands, correct deck sizes, and a non-eight opener',()=>{
  for(const n of [2,3,8]){
    const g=new CrazyEights(players.slice(0,n),0),expected=n===2?7:5;
    assert.equal(g.serialize('p0').hand.length,expected);assert.deepEqual(g.serialize(null).hand,[]);assert.deepEqual(g.serialize('stranger').hand,[]);assert.deepEqual(g.serialize('__proto__').hand,[]);
    assert.equal('hands' in g.serialize('p0'),false);assert.equal('deck' in g.serialize('p0'),false);assert.notEqual(cardRank(g.discard[0]),8);
    const all=[...Object.values(g.hands).flat(),...g.deck,...g.discard];assert.equal(all.length,52);assert.equal(new Set(all).size,52);
  }
});

test('Crazy Eights validates matches and wild suits before changing a private hand',()=>{
  const g=new CrazyEights(pair,0);g.discard=[4];g.suit=0;g.hands.p0=[24,30];g.hands.p1=[8];
  invalid(()=>g.input('p0',{type:'play',card:30},1));
  invalid(()=>g.input('p0',{type:'play',card:24,suit:4},1));assert.deepEqual(g.hands.p0,[24,30]);
  g.input('p0',{type:'play',card:24,suit:2},2);assert.equal(g.suit,2);assert.equal(g.turn,1);assert.equal(g.discard.at(-1),24);
});

test('Crazy Eights allows keeping a playable drawn card and safely recycles all but the top discard',()=>{
  const g=new CrazyEights(pair,0);g.discard=[4];g.suit=0;g.hands.p0=[30];g.hands.p1=[8];g.deck=[12];
  g.input('p0',{type:'draw'},1);assert.equal(g.drawn,12);assert.equal(g.turn,0);assert.equal(g.serialize('p1').drawn,null);
  invalid(()=>g.input('p0',{type:'draw'},2));g.input('p0',{type:'pass'},2);assert.equal(g.turn,1);assert.deepEqual(g.hands.p0,[30,12]);
  const recycle=new CrazyEights(pair,0);recycle.deck=[];recycle.discard=[1,2,3,4];
  const card=recycle.drawCard();assert.notEqual(card,4);assert.deepEqual(recycle.discard,[4]);assert.equal(recycle.deck.length,2);
});

test('Crazy Eights scores an empty-hand winner and resolves a truly blocked deck',()=>{
  const g=new CrazyEights(pair,0);g.discard=[4];g.suit=0;g.hands.p0=[8];g.hands.p1=[24];g.input('p0',{type:'play',card:8},1);
  assert.equal(g.done,true);assert.equal(g.scores.p0,200);assert.equal(g.scores.p1,50);
  const blocked=new CrazyEights(pair,0);blocked.deck=[];blocked.discard=[4];blocked.suit=0;blocked.hands.p0=[30];blocked.hands.p1=[35];
  blocked.input('p0',{type:'draw'},1);blocked.input('p1',{type:'draw'},2);assert.equal(blocked.done,true);assert.equal(blocked.winner,'p0');
});

test('President Quick enforces set sizes/ranks, strict climbing, and private hands',()=>{
  const g=new President(players.slice(0,3),0),id=g.players[g.turn].id;
  assert.deepEqual(g.serialize(null).hand,[]);assert.equal('hands' in g.serialize(id),false);
  g.hands[id]=[4,5,8,12];invalid(()=>g.input(id,{type:'play',cards:[4,4]},1));invalid(()=>g.input(id,{type:'play',cards:[4,8]},1));
  g.input(id,{type:'play',cards:[4,5]},1);
  const next=g.players[g.turn].id;g.hands[next]=[6,7,8,9];
  invalid(()=>g.input(next,{type:'play',cards:[8]},2));invalid(()=>g.input(next,{type:'play',cards:[6,7]},2));
  g.input(next,{type:'play',cards:[8,9]},2);assert.deepEqual(g.pile,[8,9]);
  assert.ok(presidentStrength(0)>presidentStrength(48));assert.equal(cardSuit(4),0);
});

test('President passes last through the trick and resets to the last player who played',()=>{
  const g=new President(players.slice(0,3),0);g.opening=false;g.turn=0;g.hands.p0=[4,12];g.hands.p1=[8,16];g.hands.p2=[20,24];
  g.input('p0',{type:'play',cards:[4]},1);g.input('p1',{type:'pass'},2);g.input('p2',{type:'play',cards:[20]},3);
  assert.equal(g.turn,0);invalid(()=>g.input('p1',{type:'play',cards:[16]},4));
  g.input('p0',{type:'pass'},4);assert.equal(g.turn,2);assert.deepEqual(g.pile,[]);assert.equal(g.passed.size,0);
  g.input('p2',{type:'play',cards:[24]},5);assert.deepEqual(g.finished,['p2']);
  g.input('p0',{type:'pass'},6);g.input('p1',{type:'pass'},7);assert.equal(g.turn,0);assert.deepEqual(g.pile,[]);
  g.input('p0',{type:'play',cards:[12]},8);assert.equal(g.done,true);assert.deepEqual(g.finished,['p2','p0','p1']);assert.deepEqual(g.scores,{p0:100,p1:0,p2:200});
});

test('Every board engine handles lifecycle hooks, privacy for observers, and idle timeouts',()=>{
  assert.equal(boardDefinitions.length,7);
  for(const definition of boardDefinitions){
    const g=definition.init(players.slice(0,definition.metadata.min),0);
    assert.equal(g.id,definition.metadata.id);g.join('watcher',1);g.leave('p0',2);g.reconnect('p0',3);
    const before=JSON.stringify(g.serialize(null));g.tick(65_000,65_000);const after=JSON.stringify(g.serialize(null));assert.notEqual(after,before,`${g.id} advances on timeout`);
    invalid(()=>g.input('watcher',{type:'drop',column:0},65_001));g.roundEnd(70_000);g.cleanup();assert.equal(g.done,true);
  }
});

test('All board/card games reach a result under continuous automatic turns',()=>{
  for(const definition of boardDefinitions){
    const g=definition.init(players.slice(0,definition.metadata.min),0);
    for(let turn=1;turn<=2000&&!g.done;turn++)g.tick(turn*65_000,65_000);
    assert.equal(g.done,true,`${g.id} terminates without input`);assert.ok(Object.values(g.scores).every(Number.isFinite));g.cleanup();
  }
});

test('Expired board turns reject late moves while server timeout actions still advance',()=>{
  const g=new ConnectFour(pair,0),deadline=g.deadline;
  invalid(()=>g.input('p0',{type:'drop',column:0},deadline));
  invalid(()=>g.input('p0',{type:'drop',column:0},deadline+1));
  assert.ok(g.board.every(cell=>cell===0));
  g.tick(deadline,0);assert.equal(g.board.filter(Boolean).length,0);assert.equal(g.done,true);assert.equal(g.winner,'p1');
  invalid(()=>g.input('p1',{type:'drop',column:1},deadline+1));
  const ships=new Battleship(pair,0),placementDeadline=ships.deadline;
  invalid(()=>ships.input('p0',{type:'place',ships:fleet},placementDeadline));
  assert.equal(ships.ready.p0,false);
  ships.tick(placementDeadline,0);assert.equal(ships.phase,'playing');assert.ok(pair.every(p=>ships.ready[p.id]));
  const shotDeadline=ships.deadline;
  invalid(()=>ships.input('p0',{type:'shoot',cell:0},shotDeadline));
  ships.tick(shotDeadline,0);assert.equal(ships.shots.p0.length,0);assert.equal(ships.turn,1);assert.equal(ships.timeouts.p0,1);
});

test('Every board engine applies configured timers, lifecycle wrappers, and rematch starter rotation',()=>{
  for(const definition of boardDefinitions){
    const roster=players.slice(0,definition.metadata.min),first=definition.init(roster,100,{config:{turnSeconds:5},matchIndex:0}),rematch=definition.init(roster,100,{config:{turnSeconds:17},matchIndex:1});
    assert.equal(first.publicState().turn,'p0',definition.metadata.id);assert.equal(rematch.publicState().turn,'p1',definition.metadata.id);
    assert.equal(rematch.publicState().turnSeconds,17);assert.equal(rematch.publicState().rules.includes('{turnSeconds}'),false);assert.equal(rematch.endCondition(),false);assert.deepEqual(rematch.score(),rematch.scores);
    assert.equal(rematch.publicState().deadline,definition.metadata.id==='battleship'?60_100:17_100);
    assert.deepEqual(rematch.privateState('stranger'),rematch.publicState());
    invalid(()=>definition.init(roster,0,{config:{turnSeconds:4},matchIndex:0}));
    invalid(()=>definition.init(roster,0,{config:{turnSeconds:Infinity},matchIndex:0}));
    invalid(()=>definition.init(roster,0,{config:{turnSeconds:'30'},matchIndex:0}));
  }
});

test('Ultimate Tic-Tac-Toe awards a majority of finished small boards when no global line exists',()=>{
  const g=new UltimateTicTacToe(pair,0);g.owners=[1,2,1,2,1,2,2,1,0];g.boards[8]=[1,1,0,2,2,1,2,1,2];
  g.input('p0',{type:'mark',board:8,cell:2},1);
  assert.equal(g.done,true);assert.equal(g.winner,'p0');assert.deepEqual(g.serialize(null).subboardCounts,{p0:5,p1:4});
  const majority=new UltimateTicTacToe(pair,0);majority.owners=[1,2,1,2,-1,2,1,1,0];majority.boards[8]=[1,2,1,1,2,2,2,1,0];
  majority.input('p0',{type:'mark',board:8,cell:8},1);assert.equal(majority.done,true);assert.equal(majority.winner,'p0');assert.match(majority.message,/won boards/);
});

test('Dots timeouts pass without edges, reset after activity, and finish fully idle tables',()=>{
  const g=new DotsBoxes(players.slice(0,3),0,{config:{turnSeconds:5},matchIndex:0});g.tick(5000,0);
  assert.equal(g.turn,1);assert.equal(g.idlePasses,1);assert.ok(g.horizontal.every(v=>v===0));assert.ok(g.vertical.every(v=>v===0));
  g.input('p1',{type:'edge',axis:'h',index:0},5001);assert.equal(g.idlePasses,0);
  for(let n=0;n<6;n++)g.tick(g.deadline,0);
  assert.equal(g.done,true);assert.equal(g.winner,null);assert.deepEqual(g.scores,{p0:0,p1:0,p2:0});assert.equal(g.horizontal.filter(Boolean).length,1);
});

test('Battleship drafts persist privately and validate every move, rotation, removal, and ready action',()=>{
  const g=new Battleship(pair,0);
  g.input('p0',{type:'move-ship',index:0,x:0,y:0,vertical:false},1);
  g.input('p0',{type:'move-ship',index:1,x:6,y:0,vertical:true},2);
  const before=JSON.stringify(g.placements.p0);invalid(()=>g.input('p0',{type:'move-ship',index:1,x:2,y:0,vertical:true},3));assert.equal(JSON.stringify(g.placements.p0),before);
  invalid(()=>g.input('p0',{type:'move-ship',index:1,x:6,y:7,vertical:true},3));invalid(()=>g.input('p0',{type:'ready'},3));
  g.input('p0',{type:'move-ship',index:0,x:0,y:0,vertical:true},4);assert.deepEqual(g.privateState('p0').ownPlacement[0].cells,[0,10,20,30,40]);
  g.leave('p0',5);g.reconnect('p0',6);assert.equal(g.privateState('p0').ownPlacement.filter(Boolean).length,2);
  assert.ok(g.privateState('p1').ownPlacement.every((ship:unknown)=>ship===null));assert.deepEqual(g.publicState().ownPlacement,[]);assert.equal('placements' in g.publicState(),false);
  g.input('p0',{type:'remove-ship',index:1},7);assert.equal(g.privateState('p0').ownPlacement[1],null);
  g.input('p0',{type:'randomize'},8);assert.equal(g.ready.p0,false);assert.equal(new Set(g.privateState('p0').ownPlacement.flatMap((ship:any)=>ship.cells)).size,17);
  g.input('p0',{type:'ready'},9);invalid(()=>g.input('p0',{type:'randomize'},10));g.tick(60_000,0);assert.equal(g.phase,'playing');
});

test('Battleship placement timeout retains a valid partial fleet and repeated shot timeouts forfeit',()=>{
  const g=new Battleship(pair,0,{config:{turnSeconds:5},matchIndex:0});g.input('p0',{type:'move-ship',index:0,x:0,y:0,vertical:false},1);g.tick(60_000,0);
  assert.deepEqual(g.fleets.p0[0].cells,[0,1,2,3,4]);g.tick(g.deadline,0);assert.equal(g.turn,1);assert.equal(g.done,false);
  g.input('p1',{type:'shoot',cell:99},g.deadline-1);g.input('p0',{type:'shoot',cell:99},g.deadline-1);assert.equal(g.timeouts.p0,0);
  g.input('p1',{type:'shoot',cell:98},g.deadline-1);g.tick(g.deadline,0);g.input('p1',{type:'shoot',cell:97},g.deadline-1);g.tick(g.deadline,0);
  assert.equal(g.done,true);assert.equal(g.winner,'p1');assert.equal(g.shots.p0.length,1);
});

test('Checkers rematches switch black ownership, and timeout warning preserves board and jump chain',()=>{
  const g=new Checkers(pair,0,{config:{turnSeconds:5},matchIndex:1});assert.equal(g.turn,1);assert.equal(g.blackIndex,1);assert.deepEqual(g.serialize(null).piecePlayers,['p1','p0']);
  assert.ok(g.legalMoves().every(move=>g.board[move.from]>0));const before=[...g.board];g.tick(5000,0);assert.deepEqual(g.board,before);assert.equal(g.turn,1);assert.equal(g.timeouts.p1,1);
  g.input('p1',{type:'move',...g.legalMoves()[0]},5001);assert.equal(g.timeouts.p1,0);assert.equal(g.turn,0);
  g.tick(g.deadline,0);g.tick(g.deadline,0);assert.equal(g.done,true);assert.equal(g.winner,'p1');
  const chain=new Checkers(pair,0,{config:{turnSeconds:5},matchIndex:0});chain.board.fill(0);chain.board[42]=1;chain.board[35]=-1;chain.board[21]=-1;chain.board[7]=-1;
  chain.input('p0',{type:'move',from:42,to:28},1);chain.tick(chain.deadline,0);assert.equal(chain.chain,28);assert.equal(chain.turn,0);chain.input('p0',{type:'move',from:28,to:14},chain.deadline-1);assert.equal(chain.timeouts.p0,0);
});

test('Crazy Eights permits voluntary drawing but then allows only the newly drawn card',()=>{
  const g=new CrazyEights(pair,0);g.discard=[4];g.suit=0;g.hands.p0=[8,30];g.hands.p1=[16];g.deck=[12];
  g.input('p0',{type:'draw'},1);assert.equal(g.drawn,12);assert.deepEqual(g.privateState('p0').playable,[12]);
  assert.equal(g.deadline,30_000,'Drawing stays within the original turn deadline');
  invalid(()=>g.input('p0',{type:'play',card:8},2));invalid(()=>g.input('p0',{type:'draw'},2));
  g.input('p0',{type:'play',card:12},3);assert.deepEqual(g.hands.p0,[8,30]);assert.equal(g.turn,1);
});

test('Crazy Eights timeout draws and passes without playing an existing legal card',()=>{
  const g=new CrazyEights(pair,0,{config:{turnSeconds:5},matchIndex:0});g.discard=[4];g.suit=0;g.hands.p0=[8];g.hands.p1=[16];g.deck=[12];g.tick(5000,0);
  assert.deepEqual(g.hands.p0,[8,12]);assert.deepEqual(g.discard,[4]);assert.equal(g.turn,1);assert.equal(g.drawn,null);assert.equal(g.done,false);
  const empty=new CrazyEights(pair,0);empty.discard=[4];empty.suit=0;empty.deck=[];empty.hands.p0=[8];empty.hands.p1=[16];empty.input('p0',{type:'draw'},1);empty.input('p1',{type:'draw'},2);assert.equal(empty.done,false);empty.input('p0',{type:'play',card:8},3);assert.equal(empty.winner,'p0');
});

test('President Quick accepts any legal opening single, pair, triple, or quad without 3 clubs',()=>{
  for(const count of [1,2,3,4]){
    const g=new President(players.slice(0,3),0,{config:{turnSeconds:5},matchIndex:1});const cards=[8,9,10,11].slice(0,count);g.hands.p1=[...cards,16];
    g.input('p1',{type:'play',cards},1);assert.deepEqual(g.pile,cards);assert.equal(g.opening,false);assert.equal(g.serialize(null).mode,'President – Quick');
  }
});
