import {randomInt} from 'node:crypto';
import type {ContentPicker} from '../../shared/types.js';

/** A room owns its bags, so rematches exhaust a bank before repeating. */
export class ShuffleBag implements ContentPicker {
  private bags=new Map<string,{source:readonly unknown[];remaining:unknown[];last:unknown}>();
  draw<T>(key:string,items:readonly T[]):T {
    if(!items.length)throw Error('EMPTY_CONTENT_BANK');
    let bag=this.bags.get(key);
    // Callers may filter a bank, so compare values rather than array identity alone.
    if(!bag||bag.source.length!==items.length||bag.source.some((value,i)=>value!==items[i])){
      bag={source:[...items],remaining:[],last:undefined};this.bags.set(key,bag);
    }
    if(!bag.remaining.length){
      bag.remaining=[...items];
      for(let i=bag.remaining.length-1;i>0;i--){const j=randomInt(i+1);[bag.remaining[i],bag.remaining[j]]=[bag.remaining[j],bag.remaining[i]];}
      if(items.length>1&&bag.remaining.at(-1)===bag.last){const swap=randomInt(items.length-1);[bag.remaining[swap],bag.remaining[items.length-1]]=[bag.remaining[items.length-1],bag.remaining[swap]];}
    }
    const next=bag.remaining.pop() as T;bag.last=next;return next;
  }
  clear(){this.bags.clear();}
}
