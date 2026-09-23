import type {GameInstance,GameView,Placement} from '../../shared/types.js';

export class ServerTimer {
  constructor(public startedAt:number,public durationMs:number){}
  get deadline(){return this.startedAt+this.durationMs;}
  expired(now:number){return now>=this.deadline;}
  remaining(now:number){return Math.max(0,this.deadline-now);}
  reset(now:number,durationMs=this.durationMs){this.startedAt=now;this.durationMs=durationMs;}
}

/** Serializers are explicit allowlists; this boundary additionally rejects unknown seats. */
export function securePrivateState(game:GameInstance,playerId:string|null,eligibleIds:ReadonlySet<string>):GameView {
  return playerId&&eligibleIds.has(playerId)?game.privateState(playerId):game.publicState();
}

export function rankScores(scores:Record<string,number>,options:{direction?:'asc'|'desc';placementScores?:Record<string,number>;tieBreaks?:Record<string,number[]>}={}):Placement[]{
  const primary=options.placementScores&&Object.keys(options.placementScores).length?options.placementScores:scores,direction=options.direction==='asc'?1:-1;
  const compare=(a:string,b:string)=>{
    let difference=(primary[a]-primary[b])*direction;if(difference)return difference;
    const left=options.tieBreaks?.[a]??[],right=options.tieBreaks?.[b]??[];
    for(let i=0;i<Math.max(left.length,right.length);i++){difference=(right[i]??0)-(left[i]??0);if(difference)return difference;}
    return 0;
  };
  const ids=Object.keys(scores);
  for(const id of ids)if(!Number.isFinite(scores[id])||!Number.isFinite(primary[id])||(options.tieBreaks?.[id]??[]).some(n=>!Number.isFinite(n)))throw Error('INVALID_GAME_SCORE');
  ids.sort((a,b)=>compare(a,b)||a.localeCompare(b));
  let place=1;
  return ids.map((playerId,index)=>{if(index&&compare(ids[index-1],playerId)!==0)place=index+1;return {playerId,score:scores[playerId],place};});
}
export const placementPoints=(place:number,participationOnly=false)=>participationOnly?1:place===1?5:place===2?3:place===3?2:1;
