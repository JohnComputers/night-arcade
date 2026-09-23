import type {GameConfig,GameContext,GameInstance,GamePlayer,GameView} from '../../shared/types.js';
import {randomInt} from 'node:crypto';
import {ShuffleBag} from '../content/shuffle-bag.js';
export const pick=<T>(items:T[]):T=>items[randomInt(items.length)];
export const shuffle=<T>(items:T[]):T[]=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
export const clean=(v:unknown,max=120):string=>typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,max):'';
export const norm=(v:unknown):string=>clean(v).toLowerCase().replace(/[^a-z0-9]/g,'');
export const number=(v:unknown,min:number,max:number):number=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('INVALID_ACTION');return v;};
export const assert=(v:unknown,message='INVALID_ACTION'):void=>{if(!v)throw Error(message);};
export abstract class BaseGame implements GameInstance {
  done=false; scores:Record<string,number>={}; phase='playing'; round=1; deadline=0; disconnected=new Set<string>();
  scoreDirection:'asc'|'desc'='desc';placementScores?:Record<string,number>;tieBreaks:Record<string,number[]>={};participationOnly=false;
  config:GameConfig;context:GameContext;private content=new ShuffleBag();
  constructor(public id:string,public players:GamePlayer[],public startedAt:number,context?:GameContext){this.context=context??{config:{},matchIndex:0};this.config=this.context.config;for(const p of players)this.scores[p.id]=0;}
  abstract input(playerId:string,action:any,now:number):void;
  abstract tick(now:number,dt:number):void;
  abstract serialize(playerId:string|null):GameView;
  publicState(){return this.serialize(null);}
  privateState(playerId:string){return this.serialize(this.players.some(p=>p.id===playerId)?playerId:null);}
  endCondition(){return this.done;}
  score(){return {...this.scores};}
  protected drawContent<T>(key:string,items:readonly T[]):T{return (this.context.content??this.content).draw(`${this.id}:${key}`,items);}
  join(_id:string,_now:number){}
  leave(id:string,_now:number){this.disconnected.add(id);}
  reconnect(id:string,_now:number){this.disconnected.delete(id);}
  roundEnd(_now:number){this.done=true;this.phase='finished';}
  cleanup(){this.disconnected.clear();}
  base():GameView{return {id:this.id,phase:this.phase,round:this.round,deadline:this.deadline,scores:{...this.scores},scoreDirection:this.scoreDirection,participationOnly:this.participationOnly};}
  add(id:string,points:number){if(id in this.scores)this.scores[id]+=points;}
  eligible(id:string){assert(this.players.some(p=>p.id===id)&&!this.done);}
}
