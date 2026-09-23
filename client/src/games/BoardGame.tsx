import {useEffect, useRef, useState} from 'react';
import type {CSSProperties, PointerEvent as ReactPointerEvent, RefObject} from 'react';
import type {GameRenderProps} from '../../../shared/types';
import {boardInstructions, cardLabel, cardRank, cardSuit, presidentStrength, SUITS} from '../../../shared/board-rules';
import './boards.css';

type DraftShip={x:number;y:number;vertical:boolean;length:number;cells:number[]};
type PublicShot={cell:number;result:string};

export default function BoardGame(props:GameRenderProps) {
  const {view,playerId,players,spectator,now}=props;
  const player=players.find(p=>p.id===view.turn);
  const myTurn=!spectator&&view.turn===playerId&&view.phase==='playing';
  const seconds=Math.max(0,Math.ceil(((view.deadline||0)-now)/1000));
  const color=(index:number)=>players.find(p=>p.id===(view.order||[])[index])?.color||['#a78bfa','#fb923c','#38bdf8','#4ade80','#f472b6','#facc15'][index%6];
  const label=(id:string)=>players.find(p=>p.id===id)?.name||'Player';
  return <div className="board-game">
    <div className="board-status" aria-live="polite">
      <span className={myTurn?'board-turn is-you':'board-turn'}>{view.phase==='finished'?(view.winner?`${label(view.winner)} wins`:'Game complete'):view.phase==='placement'?'Arrange your fleet':myTurn?'Your turn':`${player?.name||'Player'}’s turn`}</span>
      {view.phase!=='finished'&&<span className="board-clock">{seconds}s</span>}
    </div>
    {view.message&&<p className="board-message" aria-live="polite">{view.message}</p>}
    {view.id==='connect-four'&&<ConnectGrid {...props} active={myTurn} color={color}/>}
    {view.id==='ultimate-tic-tac-toe'&&<UltimateGrid {...props} active={myTurn} color={color}/>}
    {view.id==='dots-boxes'&&<DotsGrid {...props} active={myTurn} color={color}/>}
    {view.id==='battleship'&&<FleetGrid {...props} active={myTurn}/>}
    {view.id==='checkers'&&<CheckersGrid {...props} active={myTurn} color={color}/>}
    {(view.id==='crazy-eights'||view.id==='president')&&<CardTable {...props} active={myTurn}/>}
    <details className="board-rules"><summary>Rules & controls</summary><p>{view.rules||boardInstructions(view.id,view.turnSeconds)}</p></details>
  </div>;
}

type BoardProps=GameRenderProps&{active:boolean;color:(index:number)=>string};
function ConnectGrid({view,send,active,color}:BoardProps) {
  const board=view.board as number[];
  return <div className="connect-wrap">
    <div className="connect-controls">{Array.from({length:7},(_,c)=><button key={c} className="connect-drop" aria-label={`Drop in column ${c+1}`} disabled={!active||!!board[c]} onClick={()=>send({type:'drop',column:c})}>↓<span>{c+1}</span></button>)}</div>
    <div className="connect-grid" role="img" aria-label="Connect Four board; choose a column above to drop a disc">{board.map((value,i)=><div className={`connect-cell ${(view.winningCells||[]).includes(i)?'is-winning':''}`} key={i} style={{'--disc':value?color(value-1):'transparent'} as CSSProperties}><span>{value===1?'●':value===2?'◉':''}</span></div>)}</div>
    <p className="board-hint">Drop a disc using the arrows above the board.</p>
  </div>;
}

function UltimateGrid({view,send,active,color,players}:BoardProps) {
  const boards=view.boards as number[][],owners=view.owners as number[];
  return <div className="ultimate-wrap">
    <p className="board-hint">{view.forced<0?'Choose any open small board.':`Play in small board ${view.forced+1}, highlighted below.`}</p>
    <p className="board-hint">Small boards won: {view.order.map((id:string)=>`${players.find(p=>p.id===id)?.name||'Player'} ${view.subboardCounts?.[id]??0}`).join(' · ')}</p>
    <div className="ultimate-grid">{boards.map((board,b)=>{
      const open=!owners[b]&&(view.forced===-1||view.forced===b);
      return <div key={b} className={`ultimate-mini ${open?'is-open':''} ${owners[b]?'is-closed':''}`} aria-label={`Small board ${b+1}`}>
        {board.map((value,c)=><button key={c} disabled={!active||!open||!!value} aria-label={`Small board ${b+1}, square ${c+1}${value?`, ${value===1?'X':'O'}`:''}`} style={{color:value?color(value-1):undefined}} onClick={()=>send({type:'mark',board:b,cell:c})}>{value===1?'×':value===2?'○':''}</button>)}
        {!!owners[b]&&<div className="ultimate-owner" style={{color:owners[b]>0?color(owners[b]-1):'#94a3b8'}}>{owners[b]===1?'×':owners[b]===2?'○':'—'}</div>}
      </div>;
    })}</div>
  </div>;
}

function DotsGrid({view,send,active,color}:BoardProps) {
  return <div className="dots-wrap"><div className="dots-grid">{Array.from({length:121},(_,i)=>{
    const x=i%11,y=Math.floor(i/11);
    if(x%2===0&&y%2===0)return <span key={i} className="dots-dot"/>;
    if(x%2===1&&y%2===1){const owner=view.boxes[Math.floor(y/2)*5+Math.floor(x/2)];return <span key={i} className="dots-box" style={owner?{background:`${color(owner-1)}30`,color:color(owner-1)}:{}}>{owner||''}</span>;}
    const axis=y%2===0?'h':'v',index=axis==='h'?(y/2)*5+Math.floor(x/2):Math.floor(y/2)*6+x/2,owner=(axis==='h'?view.horizontal:view.vertical)[index];
    return <button key={i} className={`dots-edge ${axis==='h'?'horizontal':'vertical'} ${owner?'is-drawn':''}`} style={{'--edge':owner?color(owner-1):undefined} as CSSProperties} disabled={!active||!!owner} aria-label={`${axis==='h'?'Horizontal':'Vertical'} edge, row ${Math.floor(y/2)+1}, column ${Math.floor(x/2)+1}`} onClick={()=>send({type:'edge',axis,index})}/>;
  })}</div><p className="board-hint">Select an empty line between two dots. Complete a box to go again.{view.idlePasses>0&&` Idle turns: ${view.idlePasses}/${view.idleLimit}; a move resets this count.`}</p></div>;
}

function Sea({ships,shots,onCell,interactive,label,gridRef,onCellPointerDown,selectedCells=[],preview}:{ships:DraftShip[];shots:PublicShot[];onCell?:(cell:number)=>void;interactive:boolean;label:string;gridRef?:RefObject<HTMLDivElement|null>;onCellPointerDown?:(event:ReactPointerEvent<HTMLButtonElement>,cell:number)=>void;selectedCells?:number[];preview?:{cells:number[];valid:boolean}|null}) {
  const occupied=new Set(ships.flatMap(s=>s.cells)),shotMap=new Map(shots.map(s=>[s.cell,s.result]));
  return <div ref={gridRef} className={`sea-grid ${onCellPointerDown?'is-editing':''}`} aria-label={label}>{Array.from({length:100},(_,cell)=>{
    const status=shotMap.get(cell),ship=occupied.has(cell),name=`${String.fromCharCode(65+Math.floor(cell/10))}${cell%10+1}`;
    return <button key={cell} className={`sea-cell ${ship?'has-ship':''} ${status?`shot-${status}`:''} ${selectedCells.includes(cell)?'selected-ship':''} ${preview?.cells.includes(cell)?preview.valid?'placement-preview':'placement-invalid':''}`} disabled={!interactive||!!status} onPointerDown={event=>onCellPointerDown?.(event,cell)} onClick={()=>onCell?.(cell)} aria-label={`${label}, ${name}${status?`, ${status}`:ship?', your ship':''}`}>{status==='miss'?'·':status==='hit'?'×':status==='sunk'?'✕':ship?'▪':''}<span className="sea-coordinate">{name}</span></button>;
  })}</div>;
}

function FleetGrid({view,send,playerId,spectator,players,active}:GameRenderProps&{active:boolean}) {
  const [draft,setDraft]=useState<(DraftShip|null)[]>(view.ownPlacement?.length===5?view.ownPlacement:Array(5).fill(null)),[selected,setSelected]=useState(0),[vertical,setVertical]=useState(false),[notice,setNotice]=useState('');
  const [preview,setPreview]=useState<{cells:number[];valid:boolean}|null>(null);
  const seaRef=useRef<HTMLDivElement>(null),skipClick=useRef(false),drag=useRef<{index:number;offsetX:number;offsetY:number;startX:number;startY:number;moved:boolean;vertical:boolean}|null>(null);
  const placement=view.phase==='placement',ready=!!view.ready?.[playerId],lengths=(view.lengths||[5,4,3,3,2]) as number[];
  const editing=placement&&!spectator&&!ready;
  const myId=spectator?view.order[0]:playerId,enemyId=view.order.find((id:string)=>id!==myId),shots=view.shots as Record<string,PublicShot[]>;
  const name=(id:string)=>players.find(p=>p.id===id)?.name||'Player';
  const draftKey=JSON.stringify(view.ownPlacement??[]);
  useEffect(()=>{setDraft(view.ownPlacement?.length===5?view.ownPlacement:Array(5).fill(null));},[draftKey,playerId,view.placementRevision]);
  useEffect(()=>{if(draft[selected])setVertical(draft[selected]!.vertical);},[draft,selected]);
  useEffect(()=>{if(!editing){drag.current=null;setPreview(null);}},[editing]);
  const makeShip=(index:number,x:number,y:number,direction:boolean)=>{
    const length=lengths[index],cells=Array.from({length},(_,k)=>(y+(direction?k:0))*10+x+(direction?0:k));
    const occupied=new Set(draft.flatMap((ship,i)=>i===index?[]:ship?.cells??[]));
    const valid=x>=0&&y>=0&&x<10&&y<10&&(direction?y:x)+length<=10&&!cells.some(c=>occupied.has(c));
    return {ship:{x,y,vertical:direction,length,cells},valid};
  };
  const place=(index:number,x:number,y:number,direction:boolean)=>{
    if(!editing)return;const {ship,valid}=makeShip(index,x,y,direction);
    if(!valid){setNotice('That position overlaps a ship or extends beyond the sea. Move it or rotate it.');return;}
    setDraft(old=>old.map((current,i)=>i===index?ship:current));setNotice('');setSelected(index);setVertical(direction);
    send({type:'move-ship',index,x,y,vertical:direction});
  };
  const choose=(index:number)=>{setSelected(index);setVertical(draft[index]?.vertical??vertical);setNotice('');};
  const startDrag=(event:ReactPointerEvent<HTMLButtonElement>,index:number,cell?:number)=>{
    if(!editing||event.button!==0)return;choose(index);const ship=draft[index];
    drag.current={index,offsetX:cell===undefined?0:cell%10-(ship?.x??0),offsetY:cell===undefined?0:Math.floor(cell/10)-(ship?.y??0),startX:event.clientX,startY:event.clientY,moved:false,vertical:ship?.vertical??vertical};
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerPosition=(event:ReactPointerEvent)=>{
    const sea=seaRef.current;if(!sea)return null;const bounds=sea.getBoundingClientRect(),style=getComputedStyle(sea);
    const insetX=parseFloat(style.paddingLeft)+parseFloat(style.borderLeftWidth),insetY=parseFloat(style.paddingTop)+parseFloat(style.borderTopWidth);
    return {x:Math.floor((event.clientX-bounds.left-insetX)/(bounds.width-insetX*2)*10),y:Math.floor((event.clientY-bounds.top-insetY)/(bounds.height-insetY*2)*10)};
  };
  const moveDrag=(event:ReactPointerEvent)=>{
    const current=drag.current;if(!current)return;
    if(Math.hypot(event.clientX-current.startX,event.clientY-current.startY)>5)current.moved=true;
    if(!current.moved)return;const position=pointerPosition(event);if(!position)return;
    const {ship,valid}=makeShip(current.index,position.x-current.offsetX,position.y-current.offsetY,current.vertical);setPreview({cells:ship.cells.filter(c=>c>=0&&c<100),valid});
  };
  const endDrag=(event:ReactPointerEvent)=>{
    const current=drag.current;drag.current=null;setPreview(null);if(!current?.moved)return;
    skipClick.current=true;const position=pointerPosition(event);if(position)place(current.index,position.x-current.offsetX,position.y-current.offsetY,current.vertical);
  };
  const cellClick=(cell:number)=>{
    if(skipClick.current){skipClick.current=false;return;}
    const index=draft.findIndex(ship=>ship?.cells.includes(cell));
    if(index>=0){choose(index);return;}place(selected,cell%10,Math.floor(cell/10),vertical);
  };
  return <div className="fleet-wrap" onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={()=>{drag.current=null;setPreview(null);}}>
    {editing&&<div className="fleet-controls">
      <p>Drag a ship onto your sea, or select it and tap its starting square.</p>
      <div className="ship-tray" aria-label="Choose a ship">{lengths.map((length,index)=><button key={index} className={selected===index?'selected':''} aria-pressed={selected===index} onPointerDown={event=>startDrag(event,index)} onClick={()=>{skipClick.current=false;choose(index);}}><strong>{['Carrier','Battleship','Cruiser','Submarine','Destroyer'][index]}</strong><span aria-hidden="true">{'▪'.repeat(length)}</span><small>{length} squares · {draft[index]?'placed':'in tray'}</small></button>)}</div>
      <div className="board-actions"><button onClick={()=>{const ship=draft[selected];if(ship)place(selected,ship.x,ship.y,!ship.vertical);else setVertical(!vertical);}}>Rotate: {vertical?'vertical ↕':'horizontal ↔'}</button><button disabled={!draft[selected]} onClick={()=>{setDraft(old=>old.map((ship,i)=>i===selected?null:ship));send({type:'remove-ship',index:selected});setNotice('');}}>Remove ship</button><button onClick={()=>{send({type:'randomize'});setNotice('');}}>Randomize fleet</button><button className="primary" disabled={!draft.every(Boolean)} onClick={()=>send({type:'ready'})}>Lock fleet</button></div>
      {notice&&<p className="board-local-error" role="status">{notice}</p>}
    </div>}
    {placement&&ready&&<p className="board-hint">Fleet locked. Waiting for the other captain.</p>}
    {placement&&<div className="fleet-ready">{view.order.map((id:string)=><span key={id}>{name(id)}: {view.ready[id]?'ready ✓':'placing ships'}</span>)}</div>}
    <div className="fleet-seas">
      <section><h3>{spectator?`${name(myId)}’s sea`:'Your sea'}</h3><Sea gridRef={seaRef} ships={spectator?[]:ready||!placement?view.ownShips:draft.filter((ship):ship is DraftShip=>ship!==null)} shots={shots[enemyId]||[]} interactive={editing} onCell={cellClick} onCellPointerDown={editing?(event,cell)=>{const index=draft.findIndex(ship=>ship?.cells.includes(cell));if(index>=0)startDrag(event,index,cell);}:undefined} selectedCells={editing?draft[selected]?.cells:[]} preview={preview} label={spectator?`${name(myId)}’s sea`:'Your sea'}/></section>
      <section><h3>{spectator?`${name(enemyId)}’s sea`:'Target sea'}</h3><Sea ships={[]} shots={shots[myId]||[]} interactive={active} onCell={cell=>send({type:'shoot',cell})} label="Target sea"/></section>
    </div>
    <p className="board-hint">{placement?'Ships extend right or down. Drag placed ships to move them. Your draft is saved privately; lock the fleet when ready.':'× Hit · dot Miss · glowing red Sunk. A hit still ends your turn.'}</p>
  </div>;
}

function CheckersGrid({view,send,active,color,playerId}:BoardProps) {
  const [selected,setSelected]=useState<number|null>(null);
  const moves=(view.moves||[]) as {from:number;to:number;capture:number|null}[];
  useEffect(()=>{setSelected(view.turn===playerId&&view.chain!==null?view.chain:null);},[view.turn,view.chain,playerId,view.round]);
  const sources=new Set(moves.map(m=>m.from)),targets=new Set(moves.filter(m=>m.from===selected).map(m=>m.to));
  const reversed=view.piecePlayers?.[1]===playerId;
  const cells=Array.from({length:64},(_,i)=>reversed?63-i:i);
  return <div className="checkers-wrap"><p className="board-hint">Black moves first. You play {view.piecePlayers?.[0]===playerId?'black':view.piecePlayers?.[1]===playerId?'red':'as an observer'}. {view.chain!==null?'Continue the highlighted jump chain.':moves.some(m=>m.capture!==null)?'A capture is available and must be taken.':'Choose a highlighted piece, then a destination.'}</p>
    <div className="checkers-grid">{cells.map(cell=>{
      const piece=view.board[cell] as number,dark=(Math.floor(cell/8)+cell%8)%2===1,chosen=selected===cell,target=targets.has(cell);
      const enabled=active&&(sources.has(cell)||target);
      return <button key={cell} className={`checker-square ${dark?'dark':'light'} ${chosen?'selected':''} ${target?'destination':''}`} disabled={!enabled} aria-label={`Row ${Math.floor(cell/8)+1}, column ${cell%8+1}${piece?`, ${piece>0?'black':'red'} ${Math.abs(piece)===2?'king':'man'}`:''}${target?', legal destination':''}`} onClick={()=>{if(target&&selected!==null){send({type:'move',from:selected,to:cell});setSelected(null);}else setSelected(cell);}}>
        {piece!==0&&<span className={`checker-piece ${active&&sources.has(cell)?'can-move':''}`} style={{background:piece>0?'#242736':'#dc4752',color:'#f1f5f9',borderColor:color(piece>0?view.blackIndex:1-view.blackIndex)}}>{Math.abs(piece)===2?'♛':piece>0?'●':'◉'}</span>}{!piece&&target&&<span className="checker-target"/>}
      </button>;
    })}</div>
  </div>;
}

function PlayingCard({card,selected,disabled,onClick}:{card:number;selected?:boolean;disabled?:boolean;onClick?:()=>void}) {
  const red=cardSuit(card)===1||cardSuit(card)===2;
  if(!onClick)return <span className={`playing-card ${red?'red':''}`} aria-label={cardLabel(card)}><b>{cardLabel(card)}</b><span>{SUITS[cardSuit(card)]}</span></span>;
  return <button className={`playing-card ${red?'red':''} ${selected?'selected':''}`} aria-label={cardLabel(card)} aria-pressed={!!selected} disabled={disabled} onClick={onClick}><b>{cardLabel(card)}</b><span>{SUITS[cardSuit(card)]}</span></button>;
}

function CardTable({view,send,playerId,players,spectator,active}:GameRenderProps&{active:boolean}) {
  const [chosen,setChosen]=useState<number[]>([]),[suit,setSuit]=useState(0);
  const crazy=view.id==='crazy-eights',hand=(view.hand||[]) as number[],pile=crazy?[view.top]:(view.pile||[]) as number[];
  const handKey=hand.join(',');
  useEffect(()=>{setChosen([]);},[handKey,view.turn,view.id]);
  const sorted=[...hand].sort((a,b)=>crazy?a-b:presidentStrength(a)-presidentStrength(b)||a-b);
  const name=(id:string)=>players.find(p=>p.id===id)?.name||'Player';
  const validPresident=chosen.length>0&&chosen.length<=4&&chosen.every(c=>cardRank(c)===cardRank(chosen[0]))&&(!pile.length||(chosen.length===pile.length&&presidentStrength(chosen[0])>presidentStrength(pile[0])));
  const validCrazy=chosen.length===1&&(view.playable||[]).includes(chosen[0])&&(view.drawn===null||view.drawn===chosen[0]);
  const choose=(card:number)=>setChosen(crazy?(chosen[0]===card?[]:[card]):chosen.includes(card)?chosen.filter(c=>c!==card):chosen.length<4?[...chosen,card]:chosen);
  return <div className="card-table">
    {!crazy&&<p className="board-hint">{view.mode||'President – Quick'} · No card exchanges</p>}
    <div className="card-opponents">{view.order.map((id:string)=>{
      const finish=(view.finished||[]).indexOf(id),passed=(view.passed||[]).includes(id);
      return <div key={id} className={`card-player ${id===view.turn?'current':''}`}><span>{id===playerId?'You':name(id)}</span><strong>{finish>=0?`#${finish+1}`:`${view.counts[id]} cards`}</strong>{passed&&<small>passed</small>}</div>;
    })}</div>
    <div className="table-center"><div className="table-pile">{pile.length?pile.map(card=><PlayingCard key={card} card={card}/>):<div className="empty-trick">Fresh trick<br/><small>Lead any matching set</small></div>}</div>
      {crazy?<p>Active suit <strong className={view.suit===1||view.suit===2?'red-text':''}>{SUITS[view.suit]}</strong><span className="deck-count">{view.deckCount} in draw pile</span></p>:<p>{view.opening?'Open with any matching set.':pile.length?`Beat ${pile.length} ${pile.length===1?'card':'cards'} of rank ${cardLabel(pile[0]).slice(0,-1)}.`:'3 low · 2 high'}</p>}
    </div>
    {!spectator&&<>
      <p className="board-hint">{(view.finished||[]).includes(playerId)?'You have finished. Watch the remaining places play out.':crazy?view.drawn!==null?'Play only the newly drawn card, or keep it and pass.':'Play a matching card or choose to draw one. Eights let you choose the active suit.':'Select 1–4 cards of the same rank, then play your set.'}</p>
      <div className="player-hand" aria-label="Your private hand">{sorted.map(card=><PlayingCard key={card} card={card} selected={chosen.includes(card)} disabled={!active||(crazy&&(!(view.playable||[]).includes(card)||(view.drawn!==null&&view.drawn!==card)))} onClick={()=>choose(card)}/>)}</div>
      <div className="board-actions card-actions">
        {crazy&&chosen.length===1&&cardRank(chosen[0])===8&&<label className="suit-picker">New suit <select value={suit} onChange={e=>setSuit(Number(e.target.value))}>{SUITS.map((s,i)=><option key={s} value={i}>{s} {['Clubs','Diamonds','Hearts','Spades'][i]}</option>)}</select></label>}
        <button className="primary" disabled={!active||!(crazy?validCrazy:validPresident)} onClick={()=>{send(crazy?{type:'play',card:chosen[0],suit}:{type:'play',cards:chosen});setChosen([]);}}>Play {crazy?'card':chosen.length>1?`${chosen.length} cards`:'card'}</button>
        {crazy&&<button disabled={!active||view.drawn!==null} onClick={()=>send({type:'draw'})}>Draw one</button>}
        <button disabled={!active||(crazy?view.drawn===null:!pile.length)} onClick={()=>send({type:'pass'})}>{crazy?'Keep drawn card & pass':'Pass this trick'}</button>
      </div>
    </>}
    {spectator&&<p className="board-hint">Spectating · hands stay private.</p>}
  </div>;
}
