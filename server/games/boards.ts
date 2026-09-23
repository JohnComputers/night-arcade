import type {GameContext, GameDefinition, GamePlayer, GameView} from '../../shared/types.js';
import {gameMeta} from '../../shared/catalog.js';
import {boardInstructions, cardRank, cardSuit, presidentStrength} from '../../shared/board-rules.js';
import {BaseGame, assert, pick, shuffle} from './base.js';

const integer = (v: unknown, min: number, max: number): number => {
  assert(typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max);
  return v as number;
};
const actionObject = (action: unknown): Record<string, any> => {
  assert(action !== null && typeof action === 'object' && !Array.isArray(action));
  return action as Record<string, any>;
};
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const winner3 = (board: number[]): number => {
  for (const [a,b,c] of lines) if (board[a] > 0 && board[a] === board[b] && board[a] === board[c]) return board[a];
  return 0;
};

abstract class TurnGame extends BaseGame {
  turn = 0;
  message = '';
  winner: string | null = null;
  turnMs = 30_000;
  timeouts:Record<string,number>=Object.create(null);
  private automaticTurn = false;
  constructor(id: string, players: GamePlayer[], now: number, context?:GameContext) {
    super(id, players, now,context);
    const seconds=integer(this.config.turnSeconds??(id==='checkers'?60:30),5,180);
    this.turnMs=seconds*1000;this.deadline=now+this.turnMs;
    this.turn=Math.max(0,Math.floor(context?.matchIndex??0))%players.length;
    for(const p of players)this.timeouts[p.id]=0;
  }
  timely(now:number) {assert(this.automaticTurn||now<this.deadline);}
  check(id: string, action: unknown, now:number): Record<string, any> {
    this.eligible(id);this.timely(now);assert(this.players[this.turn]?.id === id);return actionObject(action);
  }
  next(now: number) {this.turn=(this.turn+1)%this.players.length;this.deadline=now+this.turnMs;}
  played(id:string) {this.timeouts[id]=0;}
  forfeit(id:string,now:number,reason:string) {this.finish(this.players.find(p=>p.id!==id)!.id,now,reason);}
  finish(winner: string | null, now: number, reason: string) {
    this.winner=winner;this.message=reason;
    for (const p of this.players) this.scores[p.id]=winner ? (p.id===winner ? 100 : 0) : 50;
    this.roundEnd(now);
  }
  view(): GameView {return {...this.base(),turn:this.players[this.turn]?.id,order:this.players.map(p=>p.id),message:this.message,winner:this.winner,turnSeconds:this.turnMs/1000,timeouts:{...this.timeouts},rules:boardInstructions(this.id,this.turnMs/1000)};}
  abstract auto(now: number): void;
  tick(now: number, _dt: number) {if (!this.done && now >= this.deadline){this.automaticTurn=true;try{this.auto(now);}finally{this.automaticTurn=false;}}}
}

export class ConnectFour extends TurnGame {
  board=Array<number>(42).fill(0);
  winningCells: number[]=[];
  constructor(players: GamePlayer[], now: number,context?:GameContext) {super('connect-four',players,now,context);}
  input(id: string, action: unknown, now: number) {
    const a=this.check(id,action,now);assert(a.type==='drop');const col=integer(a.column,0,6);
    let row=5;while (row>=0 && this.board[row*7+col]) row--;
    assert(row>=0);const token=this.turn+1;this.board[row*7+col]=token;
    for (const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]]) {
      const cells=[row*7+col];
      for (const sign of [-1,1]) {
        let x=col+dx*sign,y=row+dy*sign;
        while (x>=0&&x<7&&y>=0&&y<6&&this.board[y*7+x]===token) {cells.push(y*7+x);x+=dx*sign;y+=dy*sign;}
      }
      if (cells.length>=4) {this.winningCells=cells;this.finish(id,now,'Four in a row!');return;}
    }
    if (this.board.every(Boolean)) this.finish(null,now,'The board is full — a draw.');else this.next(now);
  }
  auto(now:number) {this.forfeit(this.players[this.turn].id,now,'The turn timer expired. The other player wins by forfeit.');}
  serialize(_id:string|null) {return {...this.view(),board:[...this.board],winningCells:[...this.winningCells]};}
}

export class UltimateTicTacToe extends TurnGame {
  boards=Array.from({length:9},()=>Array<number>(9).fill(0));
  owners=Array<number>(9).fill(0);
  forced=-1;
  constructor(players:GamePlayer[],now:number,context?:GameContext) {super('ultimate-tic-tac-toe',players,now,context);}
  input(id:string,action:unknown,now:number) {
    const a=this.check(id,action,now);assert(a.type==='mark');const b=integer(a.board,0,8),c=integer(a.cell,0,8);
    assert((this.forced===-1||b===this.forced)&&!this.owners[b]&&!this.boards[b][c]);
    this.boards[b][c]=this.turn+1;
    this.owners[b]=winner3(this.boards[b]) || (this.boards[b].every(Boolean)?-1:0);
    const won=winner3(this.owners);
    if(won) {this.finish(this.players[won-1].id,now,'Three small boards in a row!');return;}
    if(this.owners.every(Boolean)) {
      const totals=[1,2].map(token=>this.owners.filter(owner=>owner===token).length);
      this.finish(totals[0]===totals[1]?null:this.players[totals[0]>totals[1]?0:1].id,now,totals[0]===totals[1]?'Every small board is finished with equal totals — a draw.':`Every small board is finished. ${Math.max(...totals)} won boards beats ${Math.min(...totals)}.`);return;
    }
    this.forced=this.owners[c] ? -1 : c;this.next(now);
  }
  auto(now:number) {
    const moves:{board:number;cell:number}[]=[];
    this.boards.forEach((b,i)=>{if(!this.owners[i]&&(this.forced<0||this.forced===i))b.forEach((v,c)=>{if(!v)moves.push({board:i,cell:c});});});
    if(moves.length)this.input(this.players[this.turn].id,{type:'mark',...pick(moves)},now);
  }
  serialize(_id:string|null) {return {...this.view(),boards:this.boards.map(b=>[...b]),owners:[...this.owners],forced:this.forced,subboardCounts:Object.fromEntries(this.players.map((p,i)=>[p.id,this.owners.filter(owner=>owner===i+1).length]))};}
}

export class DotsBoxes extends TurnGame {
  size=5;
  horizontal=Array<number>(30).fill(0);
  vertical=Array<number>(30).fill(0);
  boxes=Array<number>(25).fill(0);
  idlePasses=0;
  constructor(players:GamePlayer[],now:number,context?:GameContext) {super('dots-boxes',players,now,context);}
  input(id:string,action:unknown,now:number) {
    const a=this.check(id,action,now);assert(a.type==='edge'&&(a.axis==='h'||a.axis==='v'));const i=integer(a.index,0,29);
    const edges=a.axis==='h'?this.horizontal:this.vertical;assert(!edges[i]);edges[i]=this.turn+1;this.idlePasses=0;
    let claimed=0;
    for(let y=0;y<5;y++) for(let x=0;x<5;x++) {
      const box=y*5+x;
      if(!this.boxes[box]&&this.horizontal[y*5+x]&&this.horizontal[(y+1)*5+x]&&this.vertical[y*6+x]&&this.vertical[y*6+x+1]) {
        this.boxes[box]=this.turn+1;this.add(id,1);claimed++;
      }
    }
    if(this.boxes.every(Boolean)) {
      this.finishBoxes(now,'Every box claimed.');
    } else if(claimed) {this.message=`${claimed} box${claimed>1?'es':''} claimed — another turn.`;this.deadline=now+this.turnMs;} else {this.message='';this.next(now);}
  }
  finishBoxes(now:number,message:string){const high=Math.max(...Object.values(this.scores)),winners=this.players.filter(p=>this.scores[p.id]===high);this.winner=winners.length===1?winners[0].id:null;this.message=message;this.roundEnd(now);}
  auto(now:number) {this.idlePasses++;if(this.idlePasses>=this.players.length*2)this.finishBoxes(now,'Two full idle cycles ended the game. Current box totals decide placement.');else{this.message='The turn expired and passed without an edge.';this.next(now);}}
  serialize(_id:string|null) {return {...this.view(),size:this.size,horizontal:[...this.horizontal],vertical:[...this.vertical],boxes:[...this.boxes],idlePasses:this.idlePasses,idleLimit:this.players.length*2};}
}

export interface Ship {x:number;y:number;vertical:boolean;length:number;cells:number[]}
export interface Shot {cell:number;result:'hit'|'miss'|'sunk'}
export class Battleship extends TurnGame {
  lengths=[5,4,3,3,2];
  fleets:Record<string,Ship[]>={};
  placements:Record<string,(Ship|null)[]>={};
  placementRevisions:Record<string,number>={};
  ready:Record<string,boolean>={};
  shots:Record<string,Shot[]>={};
  lastShot:{by:string;cell:number;result:string}|null=null;
  constructor(players:GamePlayer[],now:number,context?:GameContext) {
    super('battleship',players,now,context);this.phase='placement';this.deadline=now+60_000;
    for(const p of players){this.fleets[p.id]=[];this.placements[p.id]=Array<Ship|null>(5).fill(null);this.placementRevisions[p.id]=0;this.ready[p.id]=false;this.shots[p.id]=[];}
  }
  parseFleet(raw:unknown):Ship[] {
    const placement=this.parsePlacement(raw);assert(placement.every(Boolean));return placement as Ship[];
  }
  parsePlacement(raw:unknown):(Ship|null)[] {
    assert(Array.isArray(raw)&&raw.length===5);const occupied=new Set<number>();
    return (raw as any[]).map((data,i)=>{
      if(data===null)return null;
      const s=actionObject(data),x=integer(s.x,0,9),y=integer(s.y,0,9);assert(typeof s.vertical==='boolean');
      const length=this.lengths[i];assert((s.vertical?y:x)+length<=10);
      const cells=Array.from({length},(_,k)=>(y+(s.vertical?k:0))*10+x+(s.vertical?0:k));
      for(const cell of cells){assert(!occupied.has(cell));occupied.add(cell);}
      return {x,y,vertical:s.vertical,length,cells};
    });
  }
  randomFleet(partial:(Ship|null)[]=Array<Ship|null>(5).fill(null)):Ship[] {
    const fleet=[...partial],occupied=new Set<number>(partial.flatMap(ship=>ship?.cells??[]));
    for(let index=0;index<this.lengths.length;index++) {
      if(fleet[index])continue;const length=this.lengths[index];
      const options:Ship[]=[];
      for(const vertical of [false,true])for(let y=0;y<10;y++)for(let x=0;x<10;x++){
        if((vertical?y:x)+length>10)continue;
        const cells=Array.from({length},(_,k)=>(y+(vertical?k:0))*10+x+(vertical?0:k));
        if(cells.every(c=>!occupied.has(c)))options.push({x,y,vertical,length,cells});
      }
      // A 10 × 10 board always leaves space for this 17-cell fleet.
      if(!options.length)return this.randomFleet();
      const ship=pick(options);fleet[index]=ship;ship.cells.forEach(c=>occupied.add(c));
    }
    return fleet as Ship[];
  }
  input(id:string,action:unknown,now:number) {
    this.eligible(id);this.timely(now);const a=actionObject(action);
    if(this.phase==='placement') {
      assert(!this.ready[id]);
      if(a.type==='randomize'){this.placements[id]=this.randomFleet();this.placementRevisions[id]++;return;}
      if(a.type==='move-ship'||a.type==='remove-ship'){
        const index=integer(a.index,0,4),proposed=this.placements[id].map(ship=>ship?{x:ship.x,y:ship.y,vertical:ship.vertical}:null);
        proposed[index]=a.type==='remove-ship'?null:{x:integer(a.x,0,9),y:integer(a.y,0,9),vertical:a.vertical};
        this.placements[id]=this.parsePlacement(proposed);this.placementRevisions[id]++;return;
      }
      assert(a.type==='place'||a.type==='auto-place'||a.type==='ready');
      const fleet=a.type==='auto-place'?this.randomFleet(this.placements[id]):a.type==='ready'?this.parseFleet(this.placements[id]):this.parseFleet(a.ships);
      this.fleets[id]=fleet;this.placements[id]=fleet;this.placementRevisions[id]++;this.ready[id]=true;
      if(this.players.every(p=>this.ready[p.id])){this.phase='playing';this.deadline=now+this.turnMs;}
      return;
    }
    this.check(id,a,now);assert(a.type==='shoot');const cell=integer(a.cell,0,99);assert(!this.shots[id].some(s=>s.cell===cell));
    this.played(id);this.message='';
    const enemy=this.players[1-this.turn].id,fleet=this.fleets[enemy],ship=fleet.find(s=>s.cells.includes(cell));
    const shot:Shot={cell,result:ship?'hit':'miss'};this.shots[id].push(shot);
    if(ship&&ship.cells.every(c=>this.shots[id].some(s=>s.cell===c)))for(const s of this.shots[id])if(ship.cells.includes(s.cell))s.result='sunk';
    this.lastShot={by:id,cell,result:shot.result};
    if(fleet.every(s=>s.cells.every(c=>this.shots[id].some(t=>t.cell===c))))this.finish(id,now,'The enemy fleet has been sunk.');else this.next(now);
  }
  auto(now:number) {
    if(this.phase==='placement') {for(const p of this.players)if(!this.ready[p.id])this.input(p.id,{type:'auto-place'},now);return;}
    const id=this.players[this.turn].id;this.timeouts[id]++;
    if(this.timeouts[id]>=2)this.forfeit(id,now,'Two consecutive missed turns forfeited the fleet.');
    else{this.message='A shot timer expired. Turn passed; one more consecutive timeout forfeits.';this.next(now);}
  }
  serialize(id:string|null):GameView {
    const member=id!==null&&Object.hasOwn(this.fleets,id);
    return {...this.view(),ready:{...this.ready},lengths:[...this.lengths],ownShips:member?this.fleets[id!].map(s=>({...s,cells:[...s.cells]})):[],ownPlacement:member?this.placements[id!].map(s=>s?{...s,cells:[...s.cells]}:null):[],placementRevision:member?this.placementRevisions[id!]:0,shots:Object.fromEntries(Object.entries(this.shots).map(([p,s])=>[p,s.map(x=>({...x}))])),lastShot:this.lastShot?{...this.lastShot}:null};
  }
}

export interface CheckerMove {from:number;to:number;capture:number|null}
export class Checkers extends TurnGame {
  // ±1 are men; ±2 are kings. Positive pieces start at the bottom and move upward.
  board=Array<number>(64).fill(0);
  chain:number|null=null;
  quietPly=0;
  positions=new Map<string,number>();
  blackIndex=0;
  constructor(players:GamePlayer[],now:number,context?:GameContext) {
    super('checkers',players,now,context);this.blackIndex=this.turn;
    for(let y=0;y<8;y++)for(let x=0;x<8;x++)if((x+y)%2)this.board[y*8+x]=y<3?-1:y>4?1:0;
    this.recordPosition();
  }
  pieceMoves(from:number,capturesOnly=false):CheckerMove[] {
    const piece=this.board[from];if(!piece)return[];const x=from%8,y=Math.floor(from/8),moves:CheckerMove[]=[];
    const dirs=Math.abs(piece)===2?[-1,1]:[piece>0?-1:1];
    for(const dy of dirs)for(const dx of [-1,1]){
      const nx=x+dx,ny=y+dy;if(nx<0||nx>7||ny<0||ny>7)continue;
      const near=ny*8+nx;
      if(!capturesOnly&&!this.board[near])moves.push({from,to:near,capture:null});
      const tx=x+dx*2,ty=y+dy*2;
      if(this.board[near]*piece<0&&tx>=0&&tx<8&&ty>=0&&ty<8&&!this.board[ty*8+tx])moves.push({from,to:ty*8+tx,capture:near});
    }
    return moves;
  }
  legalMoves():CheckerMove[] {
    if(this.chain!==null)return this.pieceMoves(this.chain,true);
    const sign=this.turn===this.blackIndex?1:-1,moves:CheckerMove[]=[];
    this.board.forEach((p,i)=>{if(p*sign>0)moves.push(...this.pieceMoves(i));});
    const captures=moves.filter(m=>m.capture!==null);return captures.length?captures:moves;
  }
  recordPosition():number {const key=`${this.turn}:${this.board.join(',')}`;const count=(this.positions.get(key)||0)+1;this.positions.set(key,count);return count;}
  input(id:string,action:unknown,now:number) {
    const a=this.check(id,action,now);assert(a.type==='move');const from=integer(a.from,0,63),to=integer(a.to,0,63),move=this.legalMoves().find(m=>m.from===from&&m.to===to);assert(move);
    this.played(id);
    const piece=this.board[from];this.board[from]=0;this.board[to]=piece;
    if(move!.capture!==null)this.board[move!.capture]=0;
    const crowned=Math.abs(piece)===1&&(piece>0?to<8:to>=56);if(crowned)this.board[to]=piece*2;
    this.quietPly=move!.capture!==null||Math.abs(piece)===1?0:this.quietPly+1;
    if(move!.capture!==null&&!crowned&&this.pieceMoves(to,true).length){this.chain=to;this.deadline=now+this.turnMs;this.message='Continue jumping with the same piece.';return;}
    this.chain=null;this.message='';this.next(now);
    if(!this.legalMoves().length){this.finish(id,now,'The opponent has no legal move.');return;}
    if(this.quietPly>=80||this.recordPosition()>=3)this.finish(null,now,'Draw by repetition or 80 quiet turns.');
  }
  auto(now:number) {const id=this.players[this.turn].id;if(!this.legalMoves().length){this.finish(this.players[1-this.turn].id,now,'No legal moves remain.');return;}this.timeouts[id]++;if(this.timeouts[id]>=2)this.forfeit(id,now,'Two consecutive missed turns forfeited the game.');else{this.message='Turn timer expired. Make a move before the next timer expires to avoid forfeiting.';this.deadline=now+this.turnMs;}}
  serialize(_id:string|null) {return {...this.view(),board:[...this.board],chain:this.chain,moves:this.done?[]:this.legalMoves(),quietPly:this.quietPly,blackIndex:this.blackIndex,piecePlayers:[this.players[this.blackIndex].id,this.players[1-this.blackIndex].id]};}
}

export const cardValue=(card:number):number=>cardRank(card)===8?50:cardRank(card)===14?1:Math.min(10,cardRank(card));
abstract class CardGame extends TurnGame {
  hands:Record<string,number[]>={};
  constructor(id:string,players:GamePlayer[],now:number,context?:GameContext){super(id,players,now,context);for(const p of players)this.hands[p.id]=[];}
  cardView(id:string|null):GameView{return {...this.view(),hand:id&&Object.hasOwn(this.hands,id)?[...this.hands[id]]:[],counts:Object.fromEntries(this.players.map(p=>[p.id,this.hands[p.id].length]))};}
}
export class CrazyEights extends CardGame {
  deck=shuffle(Array.from({length:52},(_,i)=>i));
  discard:number[]=[];
  suit=0;
  drawn:number|null=null;
  blocked=0;
  movesPlayed=0;
  constructor(players:GamePlayer[],now:number,context?:GameContext) {
    super('crazy-eights',players,now,context);
    const count=players.length===2?7:5;
    for(let n=0;n<count;n++)for(const p of players)this.hands[p.id].push(this.deck.pop()!);
    const index=this.deck.findIndex(c=>cardRank(c)!==8),card=this.deck.splice(index,1)[0];this.discard=[card];this.suit=cardSuit(card);
  }
  playable(id:string):number[] {const top=this.discard[this.discard.length-1];return this.hands[id].filter(c=>cardRank(c)===8||cardRank(c)===cardRank(top)||cardSuit(c)===this.suit);}
  drawCard():number|null {
    if(!this.deck.length&&this.discard.length>1){const top=this.discard.pop()!;this.deck=shuffle(this.discard);this.discard=[top];}
    return this.deck.pop()??null;
  }
  endCards(winners:string[],now:number,reason:string) {
    for(const p of this.players)this.scores[p.id]=winners.includes(p.id)?200:Math.max(0,100-this.hands[p.id].reduce((n,c)=>n+cardValue(c),0));
    this.winner=winners.length===1?winners[0]:null;this.message=reason;this.roundEnd(now);
  }
  settleBlocked(now:number,reason='The deck is blocked. Lowest remaining hand value wins.') {
    const values=this.players.map(p=>this.hands[p.id].reduce((n,c)=>n+cardValue(c),0)),min=Math.min(...values);
    this.endCards(this.players.filter((_,i)=>values[i]===min).map(p=>p.id),now,reason);
  }
  input(id:string,action:unknown,now:number) {
    const a=this.check(id,action,now);assert(a.type==='play'||a.type==='draw'||a.type==='pass');
    if(a.type==='play') {
      const card=integer(a.card,0,51);assert(this.hands[id].includes(card)&&this.playable(id).includes(card));
      if(this.drawn!==null)assert(card===this.drawn);
      const suit=cardRank(card)===8?integer(a.suit,0,3):cardSuit(card);
      this.hands[id].splice(this.hands[id].indexOf(card),1);this.discard.push(card);this.suit=suit;this.drawn=null;this.blocked=0;this.movesPlayed++;this.message='';
      if(!this.hands[id].length){this.endCards([id],now,'An empty hand wins!');return;}
      this.next(now);
    } else if(a.type==='draw') {
      assert(this.drawn===null);
      const card=this.drawCard();
      if(card===null) {this.blocked++;if(this.blocked>=this.players.length&&this.players.every(p=>this.playable(p.id).length===0)){this.settleBlocked(now);return;}this.message='The deck is empty; turn passes.';this.next(now);}
      else {this.blocked=0;this.hands[id].push(card);if(this.playable(id).includes(card)){this.drawn=card;this.message='Play your drawn card or pass.';}else{this.message='A card was drawn; turn passes.';this.next(now);}}
    } else {
      assert(this.drawn!==null);this.drawn=null;this.message='';this.next(now);
    }
  }
  auto(now:number) {
    const id=this.players[this.turn].id;
    if(this.drawn!==null){this.input(id,{type:'pass'},now);return;}
    this.input(id,{type:'draw'},now);
    if(!this.done&&this.players[this.turn].id===id&&this.drawn!==null)this.input(id,{type:'pass'},now);
  }
  tick(now:number,dt:number) {if(!this.done&&now-this.startedAt>=30*60_000)this.settleBlocked(now,'Thirty-minute limit reached. Lowest remaining hand value wins.');else super.tick(now,dt);}
  serialize(id:string|null):GameView {return {...this.cardView(id),top:this.discard[this.discard.length-1],suit:this.suit,deckCount:this.deck.length,discardCount:this.discard.length,playable:id===this.players[this.turn].id&&!this.done?(this.drawn===null?this.playable(id):[this.drawn]):[],drawn:id===this.players[this.turn].id?this.drawn:null};}
}

export class President extends CardGame {
  pile:number[]=[];
  passed=new Set<string>();
  finished:string[]=[];
  lastPlayed:string|null=null;
  opening=true;
  constructor(players:GamePlayer[],now:number,context?:GameContext) {
    super('president',players,now,context);const deck=shuffle(Array.from({length:52},(_,i)=>i));
    deck.forEach((c,i)=>this.hands[players[i%players.length].id].push(c));
  }
  remaining():string[] {return this.players.map(p=>p.id).filter(id=>!this.finished.includes(id));}
  finishPlayer(id:string){if(!this.finished.includes(id)){this.finished.push(id);this.scores[id]=(this.players.length-this.finished.length)*100;}}
  advance(now:number) {
    const remaining=this.remaining();
    if(remaining.length<=1){if(remaining.length)this.finishPlayer(remaining[0]);this.winner=this.finished[0];this.message='Every place has been decided.';this.roundEnd(now);return;}
    const contenders=remaining.filter(id=>!this.passed.has(id));
    if(this.pile.length && (contenders.length===0||(contenders.length===1&&contenders[0]===this.lastPlayed))) {
      const oldLeader=this.players.findIndex(p=>p.id===this.lastPlayed);let next=oldLeader;
      if(!remaining.includes(this.lastPlayed!)){do{next=(next+1)%this.players.length;}while(!remaining.includes(this.players[next].id));}
      this.turn=next;this.pile=[];this.passed.clear();this.lastPlayed=null;this.message='Fresh trick — lead any matching set.';this.deadline=now+this.turnMs;return;
    }
    do{this.turn=(this.turn+1)%this.players.length;}while(this.finished.includes(this.players[this.turn].id)||this.passed.has(this.players[this.turn].id));
    this.deadline=now+this.turnMs;
  }
  input(id:string,action:unknown,now:number) {
    const a=this.check(id,action,now);assert(!this.finished.includes(id)&&!this.passed.has(id));assert(a.type==='play'||a.type==='pass');
    if(a.type==='pass') {assert(this.pile.length>0);this.passed.add(id);this.message='';this.advance(now);return;}
    assert(Array.isArray(a.cards)&&a.cards.length>=1&&a.cards.length<=4);
    const cards=(a.cards as unknown[]).map(c=>integer(c,0,51));assert(new Set(cards).size===cards.length);
    assert(cards.every(c=>this.hands[id].includes(c)&&cardRank(c)===cardRank(cards[0])));
    if(this.pile.length)assert(cards.length===this.pile.length&&presidentStrength(cards[0])>presidentStrength(this.pile[0]));
    this.hands[id]=this.hands[id].filter(c=>!cards.includes(c));this.pile=cards;this.lastPlayed=id;this.opening=false;this.message='';
    if(!this.hands[id].length)this.finishPlayer(id);
    this.advance(now);
  }
  legalSets(id:string):number[][] {
    const groups=new Map<number,number[]>();for(const c of this.hands[id]){const rank=presidentStrength(c);groups.set(rank,[...(groups.get(rank)||[]),c]);}
    const length=this.pile.length||1;
    return [...groups.entries()].sort(([a],[b])=>a-b).filter(([rank,cards])=>cards.length>=length&&(!this.pile.length||rank>presidentStrength(this.pile[0]))).map(([,cards])=>cards.slice(0,length));
  }
  auto(now:number) {const id=this.players[this.turn].id,sets=this.legalSets(id);this.input(id,sets.length?{type:'play',cards:sets[0]}:{type:'pass'},now);}
  serialize(id:string|null):GameView {return {...this.cardView(id),pile:[...this.pile],passed:[...this.passed],finished:[...this.finished],lastPlayed:this.lastPlayed,opening:this.opening,mode:'President – Quick'};}
}

export const boardDefinitions:GameDefinition[]=[
  ['connect-four',ConnectFour],['ultimate-tic-tac-toe',UltimateTicTacToe],['dots-boxes',DotsBoxes],['battleship',Battleship],['checkers',Checkers],['crazy-eights',CrazyEights],['president',President],
].map(([id,Engine])=>({metadata:{...gameMeta(id as string),instructions:boardInstructions(id as string)},init:(players:GamePlayer[],now:number,context?:GameContext)=>new (Engine as typeof ConnectFour)(players,now,context)}));
