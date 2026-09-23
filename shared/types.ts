export type Category = 'Party'|'Words'|'Trivia'|'Strategy'|'Arcade'|'Cards'|'Reaction';
export type GameConfig=Record<string,number|string|boolean>;
export interface GameSetting {key:string;label:string;description?:string;type:'number'|'select';defaultValue:number|string;min?:number;max?:number;step?:number;options?:{label:string;value:number|string}[]}
export interface ContentPicker {draw:<T>(key:string,items:readonly T[])=>T}
export interface GameContext {config:GameConfig;matchIndex:number;content?:ContentPicker;latencyMs?:Record<string,number>}
export interface GameMeta {id:string;number:number;name:string;category:Category;min:number;max:number;icon:string;description:string;instructions:string;family:'board'|'party'|'arcade';specId?:string;minPlayers?:number;maxPlayers?:number;controls?:string;settings?:GameSetting[]}
export interface GamePlayer {id:string;name:string;color:string}
export interface Player extends GamePlayer {connected:boolean;ready:boolean;spectator:boolean;joinedAt:number;stats:{wins:number;games:number;points:number}}
export interface GameView {id:string;phase:string;deadline?:number;round?:number;scores:Record<string,number>;[key:string]:any}
export interface GameInstance {id:string;done:boolean;scores:Record<string,number>;scoreDirection:'asc'|'desc';placementScores?:Record<string,number>;tieBreaks:Record<string,number[]>;participationOnly:boolean;input:(playerId:string,action:any,now:number)=>void;tick:(now:number,dt:number)=>void;serialize:(playerId:string|null)=>GameView;publicState:()=>GameView;privateState:(playerId:string)=>GameView;endCondition:()=>boolean;score:()=>Record<string,number>;join:(playerId:string,now:number)=>void;leave:(playerId:string,now:number)=>void;reconnect:(playerId:string,now:number)=>void;roundEnd:(now:number)=>void;cleanup:()=>void}
export interface GameDefinition {metadata:GameMeta;init:(players:GamePlayer[],now:number,context?:GameContext)=>GameInstance}
export interface GameRenderProps {view:GameView;send:(action:any)=>void;playerId:string;players:Player[];now:number;spectator:boolean}
export type RoomPhase='LOBBY'|'COUNTDOWN'|'PLAYING'|'RESULTS';
export interface Placement {playerId:string;score:number;place:number;sessionPoints?:number}
export interface RoomState {code:string;hostId:string;you:string;players:Player[];phase:RoomPhase;selectedGame:string;gameConfig:GameConfig;votes:Record<string,string>;serverTime:number;countdownEnd?:number;game:GameView|null;results:Placement[];revision:number}
export interface Ack {ok:boolean;error?:string;message?:string;token?:string;code?:string;playerId?:string}
export interface ClientEvents {'room:create':(p:{name:string;token:string},cb:(r:Ack)=>void)=>void;'room:join':(p:{name:string;code:string;token:string},cb:(r:Ack)=>void)=>void;'room:leave':(p:object,cb:(r:Ack)=>void)=>void;'room:kick':(p:{playerId:string},cb:(r:Ack)=>void)=>void;'player:ready':(p:{ready:boolean},cb:(r:Ack)=>void)=>void;'game:select':(p:{gameId:string},cb:(r:Ack)=>void)=>void;'game:vote':(p:{gameId:string},cb:(r:Ack)=>void)=>void;'game:start':(p:object,cb:(r:Ack)=>void)=>void;'game:lobby':(p:object,cb:(r:Ack)=>void)=>void;'game:input':(p:{seq:number;action:any},cb?:(r:Ack)=>void)=>void;'ping:sync':(p:{sentAt:number},cb:(r:{serverTime:number;sentAt:number})=>void)=>void}
export interface ServerEvents {'room:state':(state:RoomState)=>void;'game:state':(state:{game:GameView;serverTime:number;revision:number;strokeDelta?:{reset:boolean;from:number;items:any[]}})=>void;'room:removed':(reason:string)=>void;'server:error':(message:string)=>void}
export interface ClientEvents {'game:configure':(p:{settings?:GameConfig;reset?:boolean},cb:(r:Ack)=>void)=>void}
