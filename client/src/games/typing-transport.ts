export interface TypingInput {text:string;server:string;ack?:string;disabled:boolean}
export interface TypingPacket {type:'type';requestId:string;index:number;segment:string}
/** Keep one idempotent segment in flight, including while the socket is reconnecting. */
export class TypingTransport {
  private sequence=0;private acknowledged='';
  private pending:{packet:TypingPacket;signature:string;text:string;sentAt:number}|null=null;
  constructor(private sessionId=`t${Date.now().toString(36)}_${Math.random().toString(36).slice(2,9)}`){}
  next({text,server,ack,disabled}:TypingInput,now:number):TypingPacket|null{
    if(disabled)return null;
    const pending=this.pending;
    if(pending){
      if(ack===pending.packet.requestId||server.length>pending.packet.index){
        // A partially accepted packet includes a typo we already counted. Only a
        // local edit may submit it again; a fully consumed batch may send its tail.
        this.acknowledged=server.length<pending.packet.index+pending.packet.segment.length?`${server.length}:${pending.text}`:pending.signature;
        this.pending=null;
      }else{if(now-pending.sentAt>=650){pending.sentAt=now;return pending.packet;}return null;}
    }
    if(text===server||!text.startsWith(server))return null;
    const signature=`${server.length}:${text}`;if(signature===this.acknowledged)return null;
    const packet:TypingPacket={type:'type',requestId:`${this.sessionId}_${this.sequence++}`,index:server.length,segment:text.slice(server.length,server.length+12)};
    this.pending={packet,signature,text,sentAt:now};return packet;
  }
}
