import {assert,clean,number,norm,shuffle} from './base.js';

export interface DrawingStroke {strokeId:string;points:number[][];tool:'pen'|'eraser';width:number;color:string}
/** Each streamed segment retains its gesture ID; undo removes that whole gesture. */
export class DrawingCanvasEngine {
  canvases:Record<string,DrawingStroke[]>={};private lastPacket:Record<string,number>={};
  input(id:string,action:any,now:number){
    const strokes=this.canvases[id]??=[];
    if(action.type==='clear'){assert(action.confirm===true,'Confirm before clearing your drawing.');this.canvases[id]=[];return;}
    if(action.type==='undo'){const last=strokes.at(-1)?.strokeId;if(last)this.canvases[id]=strokes.filter(s=>s.strokeId!==last);return;}
    assert(now-(this.lastPacket[id]??-Infinity)>=25,'Drawing packets are arriving too quickly.');
    assert(action.type==='stroke'&&typeof action.strokeId==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(action.strokeId));
    assert(action.tool==='pen'||action.tool==='eraser');assert([3,8,16,30].includes(action.width));
    assert(typeof action.color==='string'&&/^#[0-9a-f]{6}$/i.test(action.color));
    assert(Array.isArray(action.points)&&action.points.length>=1&&action.points.length<=100);
    const points=action.points.map((p:any)=>{assert(Array.isArray(p)&&p.length===2);return [number(p[0],0,1),number(p[1],0,1)];});
    assert(strokes.length<2500&&strokes.reduce((n,s)=>n+s.points.length,0)+points.length<=60000,'Canvas is full. Undo or clear to continue.');
    const earlier=strokes.find(s=>s.strokeId===action.strokeId);if(earlier)assert(earlier.color===action.color&&earlier.width===action.width&&earlier.tool===action.tool,'One stroke must keep the same pen.');
    strokes.push({strokeId:action.strokeId,points,tool:action.tool,width:action.width,color:action.color});this.lastPacket[id]=now;
  }
  reset(){this.canvases={};this.lastPacket={};}
}
export const exact=(answer:unknown,target:string,aliases:string[]=[])=>[target,...aliases].some(v=>norm(answer)===norm(v));
export const emojiNorm=(v:unknown)=>norm(clean(v).replace(/^(a|an|the)\s+/i,''));
export const categoryNorm=(v:unknown)=>norm(v).replace(/ies$/,'y').replace(/(?<!s)s$/,'');
export function scramble(word:string){let value=word;for(let i=0;i<40&&value===word;i++)value=shuffle(word.split('')).join('');if(value===word)value=word.slice(1)+word[0];return value;}
export function responseGroups(answers:Record<string,any>){const counts:Record<string,number>=Object.create(null);for(const value of Object.values(answers)){const key=String(value);counts[key]=(counts[key]??0)+1;}return counts;}
export const rankPoints=(rank:number)=>rank===1?1000:Math.max(300,800-(rank-1)*100);
