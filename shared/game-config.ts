import type {GameConfig,GameSetting} from './types.js';
const number=(key:string,label:string,value:number,min:number,max:number,step=1):GameSetting=>({key,label,type:'number',defaultValue:value,min,max,step});
const rounds=(n:number,max=20)=>number('rounds','Rounds',n,1,max);
const seconds=(key:string,label:string,n:number,min=5,max=180)=>number(key,label,n,min,max);
const question=(n:number,time:number)=>[rounds(n),seconds('roundSeconds','Answer time (seconds)',time)];
const timed=(time:number,min=30,max=300)=>[seconds('time','Time limit (seconds)',time,min,max)];
const social=(n=3)=>[rounds(n),seconds('discussionSeconds','Discussion time (seconds)',45,10,180),seconds('voteSeconds','Voting time (seconds)',20,5,60)];
const schema:Record<string,GameSetting[]>={
  'draw-guess':[number('rounds','Minimum drawing rounds',1,1,36),seconds('roundSeconds','Drawing time (seconds)',75,30,120)],
  'impostor-word':[rounds(3),seconds('discussionSeconds','Discussion time (seconds)',90,10,180),seconds('voteSeconds','Voting time (seconds)',30,5,60)],
  'territory-wars':[rounds(60,100),seconds('turnSeconds','Planning time (seconds)',3,1,10)],
  'quick-draw':[rounds(7)],
  'type-race':[rounds(1,5),seconds('roundSeconds','Race time (seconds)',120,30,180)],
  'snake-arena':timed(180),
  'bomb-pass':[seconds('roundSeconds','Challenge time (seconds)',8,5,15)],
  'guess-drawing':[rounds(3),seconds('roundSeconds','Drawing time (seconds)',45,20,90),seconds('voteSeconds','Voting time (seconds)',20,5,60)],
  'trivia-blitz':[{key:'rounds',label:'Questions',type:'select',defaultValue:10,options:[5,10,15,20].map(value=>({value,label:String(value)}))},seconds('roundSeconds','Answer time (seconds)',12)],
  'word-chain':[seconds('turnSeconds','Turn time (seconds)',8,5,30),number('rounds','Turn limit',100,20,100)],
  'pixel-battle':timed(180),
  'memory-mayhem':[rounds(20)],
  'the-liar':social(),
  'higher-lower':[rounds(52,104),seconds('roundSeconds','Prediction time (seconds)',5,3,15)],
  'mini-golf':[seconds('time','Time per hole (seconds)',90,30,180)],
  'last-tile':timed(120),
  'one-button-racing':timed(90),
  'fake-answer':[rounds(5),seconds('roundSeconds','Writing time (seconds)',30,10,90),seconds('voteSeconds','Voting time (seconds)',20,5,60)],
  'auction-wars':[rounds(10),seconds('roundSeconds','Bidding time (seconds)',15,5,60)],
  'doodle-telephone':[seconds('roundSeconds','Drawing time (seconds)',45,20,120)],
  'connect-four':[seconds('turnSeconds','Turn time (seconds)',30)],
  'ultimate-tic-tac-toe':[seconds('turnSeconds','Turn time (seconds)',30)],
  'dots-boxes':[seconds('turnSeconds','Turn time (seconds)',30)],
  'battleship':[seconds('turnSeconds','Turn time (seconds)',30)],
  'checkers':[seconds('turnSeconds','Turn time (seconds)',60)],
  'crazy-eights':[seconds('turnSeconds','Turn time (seconds)',30)],
  'president':[seconds('turnSeconds','Turn time (seconds)',30)],
  'speed-math':question(12,10),
  'closest-wins':question(8,20),
  'categories':question(8,15),
  'word-scramble':question(10,20),
  'hangman-battle':question(1,90),
  'password':[rounds(8),seconds('roundSeconds','Clue or guess time (seconds)',30,10,60)],
  'emoji-guess':question(10,20),
  'would-you-rather':question(10,12),
  'majority-rules':question(10,12),
  'minority-rules':question(10,12),
  'secret-number':question(5,60),
  'maze-race':timed(90),
  'platform-panic':timed(120),
  'color-dash':[rounds(20),...timed(120)],
  'sumo-circles':timed(120),
  'dodge':timed(120,30,120),
  'coin-rush':timed(90),
  'capture-crown':timed(180),
  'red-light':timed(120),
  'reaction-tournament':[rounds(8)],
  'spot-difference':timed(90),
  'sequence':[rounds(20)],
  'button-bash':[rounds(100,100)]
};
export const settingsFor=(id:string):GameSetting[]=>schema[id]??[];
export const defaultConfig=(id:string):GameConfig=>Object.fromEntries(settingsFor(id).map(field=>[field.key,field.defaultValue]));
/** Treat the settings object as an untrusted socket payload. No coercion or unknown keys. */
export function validateConfig(id:string,input:unknown,current:GameConfig=defaultConfig(id)):GameConfig {
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('INVALID_CONFIG');
  const fields=settingsFor(id),values=input as Record<string,unknown>,next={...defaultConfig(id),...current};
  for(const [key,value] of Object.entries(values)){
    const field=fields.find(f=>f.key===key);if(!field)throw Error('INVALID_CONFIG');
    if(field.type==='select'){if(!field.options?.some(option=>option.value===value))throw Error('INVALID_CONFIG');}
    else if(typeof value!=='number'||!Number.isFinite(value)||!Number.isInteger(value)||value<(field.min??0)||value>(field.max??Infinity)||(value-(field.min??0))%(field.step??1)!==0)throw Error('INVALID_CONFIG');
    next[key]=value as number|string;
  }
  return next;
}
