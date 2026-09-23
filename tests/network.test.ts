import test from 'node:test';
import assert from 'node:assert/strict';
import {io,Socket} from 'socket.io-client';
import {createApp} from '../server/app.js';
import type {Ack} from '../shared/types.js';
import {catalog} from '../shared/catalog.js';
const connect=(url:string)=>new Promise<Socket>((resolve,reject)=>{const s=io(url,{transports:['websocket'],forceNew:true,reconnection:false,timeout:4000});s.once('connect',()=>resolve(s));s.once('connect_error',reject);});
const ask=(s:Socket,event:string,payload:object={})=>new Promise<Ack>((resolve,reject)=>{s.timeout(4000).emit(event,payload,(err:Error|null,r:Ack)=>err?reject(err):resolve(r));});
test('separate real WebSocket clients create/join/play/end/reconnect/migrate/return to persistent lobby',async()=>{
  const server=createApp({tick:false});await new Promise<void>(resolve=>server.http.listen(0,'127.0.0.1',resolve));const address=server.http.address() as {port:number};const url=`http://127.0.0.1:${address.port}`;const sockets:Socket[]=[];
  try{const a=await connect(url),b=await connect(url);sockets.push(a,b);const tokenA='network-host-token-123456789000',tokenB='network-guest-token-123456789000';const host=await ask(a,'room:create',{name:'Host',token:tokenA});assert.ok(host.ok);const invalid=await ask(b,'room:join',{name:'Friend',token:tokenB,code:'ZZZZZZ'});assert.equal(invalid.error,'ROOM_NOT_FOUND');const guest=await ask(b,'room:join',{name:'Friend',token:tokenB,code:host.code});assert.ok(guest.ok);
    assert.ok((await ask(a,'game:select',{gameId:'connect-four'})).ok);assert.ok((await ask(a,'game:start')).ok);const room=server.manager.rooms.get(host.code!)!;server.manager.tick(room.countdownEnd+1,50);assert.equal(room.phase,'PLAYING');let sequenceA=0,sequenceB=0;for(let i=0;i<4;i++){assert.ok((await ask(a,'game:input',{seq:sequenceA++,action:{type:'drop',column:i}})).ok);if(i<3)assert.ok((await ask(b,'game:input',{seq:sequenceB++,action:{type:'drop',column:6}})).ok);}server.manager.tick(Date.now()+5000,50);assert.equal(room.phase,'RESULTS');assert.equal(room.players[0].stats.wins,1);
    const disconnected=new Promise<void>(resolve=>server.io.sockets.sockets.get(a.id!)!.once('disconnect',()=>resolve()));a.disconnect();await disconnected;assert.equal(room.hostId,guest.playerId);const refresh=await connect(url);sockets.push(refresh);const restored=await ask(refresh,'room:join',{name:'Host',token:tokenA,code:host.code});assert.equal(restored.playerId,host.playerId);assert.equal(room.players.length,2);assert.equal((await ask(refresh,'game:lobby')).error,'NOT_HOST');assert.ok((await ask(b,'game:lobby')).ok);assert.equal(room.phase,'LOBBY');assert.equal(room.players.find(p=>p.id===host.playerId)?.stats.wins,1);assert.ok((await ask(b,'game:vote',{gameId:'trivia-blitz'})).ok);assert.equal(room.votes[guest.playerId!],'trivia-blitz');
    assert.ok((await ask(b,'game:select',{gameId:'speed-math'})).ok);assert.ok((await ask(b,'game:start')).ok);
    server.manager.tick(room.countdownEnd+1,50);assert.equal(room.phase,'PLAYING');
    const [left,operator,right]=room.game!.serialize(guest.playerId!).question.split(' '),x=Number(left),y=Number(right);
    const answer=operator==='+'?x+y:(operator==='-'||operator==='−')?x-y:operator==='×'?x*y:x/y;
    assert.ok((await ask(b,'game:input',{seq:sequenceB++,action:{type:'submit',value:answer}})).ok);
    room.game!.tick(room.game!.publicState().deadline!+1,50);
    assert.ok(room.game!.scores[guest.playerId!]>0,'numeric answer travels through the real socket and scores');
    assert.equal(room.players.find(p=>p.id===host.playerId)?.stats.wins,1,'starting the next game preserves session wins');
    assert.ok((await ask(b,'game:lobby')).ok);assert.equal(room.phase,'LOBBY');
  }finally{for(const socket of sockets)socket.disconnect();await server.close();}
});

test('all 50 games run at minimum roster through real sockets and deliver identical public results',async()=>{
  const server=createApp({tick:false});await new Promise<void>(resolve=>server.http.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${(server.http.address() as {port:number}).port}`;
  const sockets:Socket[]=[],states:any[]=[];let seated=0;
  const nextState=(socket:Socket,phase:string)=>new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{socket.off('room:state',listener);reject(Error(`No ${phase} state`));},5000);const listener=(state:any)=>{if(state.phase===phase){clearTimeout(timer);socket.off('room:state',listener);resolve(state);}};socket.on('room:state',listener);});
  try{
    for(let i=0;i<4;i++){const socket=await connect(url);sockets.push(socket);socket.on('room:state',state=>{states[i]=state;});}
    const identity=(i:number)=>({name:`Matrix ${i+1}`,token:`matrix-player-${i}-12345678901234567890`});
    const created=await ask(sockets[0],'room:create',identity(0));assert.ok(created.ok);seated=1;
    const room=server.manager.rooms.get(created.code!)!;
    for(const meta of catalog){
      while(seated>meta.min){assert.ok((await ask(sockets[seated-1],'room:leave')).ok);seated--;}
      while(seated<meta.min){assert.ok((await ask(sockets[seated],'room:join',{...identity(seated),code:created.code})).ok);seated++;}
      assert.ok((await ask(sockets[0],'game:select',{gameId:meta.specId})).ok,meta.id);
      assert.ok((await ask(sockets[0],'game:configure',{reset:true})).ok,meta.id);
      assert.ok((await ask(sockets[0],'game:start')).ok,meta.id);
      const starts=sockets.slice(0,seated).map(socket=>nextState(socket,'PLAYING'));
      let now=room.countdownEnd+1;server.manager.tick(now,50);
      const started=await Promise.all(starts);assert.ok(started.every(state=>state.game.id===meta.id));
      const done=sockets.slice(0,seated).map(socket=>nextState(socket,'RESULTS'));const allDone=Promise.allSettled(done);
      for(let step=0;step<600&&room.phase==='PLAYING';step++){now+=30000;server.manager.tick(now,50);}
      assert.equal(room.phase,'RESULTS',`${meta.id} must finish naturally by its timeout rules`);
      const outcomes=await allDone;const rejected=outcomes.find(result=>result.status==='rejected');if(rejected?.status==='rejected')throw rejected.reason;const finished=outcomes.map(result=>(result as PromiseFulfilledResult<any>).value);for(const state of finished){assert.deepEqual(state.results,finished[0].results,`${meta.id}: common result`);assert.equal(state.code,created.code);assert.ok(state.results.every((result:any)=>Number.isFinite(result.score)&&result.sessionPoints>=1));}
      assert.ok((await ask(sockets[0],'game:lobby')).ok);assert.equal(room.phase,'LOBBY');
      await new Promise(resolve=>setTimeout(resolve,35));
    }
    assert.equal(room.players[0].stats.games,50);assert.ok(room.players[0].stats.points>=50);
  }finally{for(const socket of sockets)socket.disconnect();await server.close();}
});
