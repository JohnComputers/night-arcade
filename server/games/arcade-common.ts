import {BaseGame,assert,number} from './base.js';
import type {GameContext,GamePlayer} from '../../shared/types.js';
export type Point={x:number;y:number};
export type Pawn=Point&{alive:boolean;lastMove:number;[key:string]:any};
export type Rect=Point&{w:number;h:number};
export const dirs=[{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export const cellKey=(p:Point)=>`${p.x},${p.y}`;
export const int=(n:unknown,min:number,max:number)=>{const v=number(n,min,max);assert(Number.isInteger(v));return v;};
export const vector=(a:any)=>{let x=number(a.x,-1,1),y=number(a.y,-1,1);const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}return{x,y};};
export const overlaps=(p:Point,r:number,b:Rect)=>p.x+r>b.x&&p.x-r<b.x+b.w&&p.y+r>b.y&&p.y-r<b.y+b.h;
export const seeded=(seed:number)=>()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
export abstract class ArcadeBase extends BaseGame {
  pawns:Record<string,Pawn>={};
  placementScores:Record<string,number>={};
  constructor(id:string,players:GamePlayer[],now:number,context?:GameContext){super(id,players,now,context);}
  setting(key:string,fallback:number){const v=this.config[key];return typeof v==='number'&&Number.isFinite(v)?v:fallback;}
  protected check(id:string,action:any,now:number,checkDeadline=true){this.eligible(id);assert(!this.disconnected.has(id));assert(!checkDeadline||!this.deadline||now<this.deadline,'This round has ended.');assert(action&&typeof action==='object'&&!Array.isArray(action)&&typeof action.type==='string');}
  protected finish(now:number){if(!this.done)this.roundEnd(now);}
  protected alive(id:string){assert(this.pawns[id]?.alive,'You are out this round.');}
  protected eliminate(id:string,now:number){const p=this.pawns[id];if(p.alive){p.alive=false;p.eliminatedAt=now;this.scores[id]=Math.max(0,now-this.startedAt)/1000;}}
  protected survivorEnd(now:number){if(Object.values(this.pawns).filter(p=>p.alive).length<=1){for(const[id,p]of Object.entries(this.pawns))if(p.alive)this.scores[id]=(now-this.startedAt)/1000+0.001;this.finish(now);}}
}
