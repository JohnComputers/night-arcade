import test from 'node:test';
import assert from 'node:assert/strict';
import {io,type Socket} from 'socket.io-client';
import {roomEntryIp} from '../server/network.js';
import {createApp} from '../server/app.js';
import type {Ack} from '../shared/types.js';

test('room-entry IP ignores forwarded headers outside an explicitly marked Render process',()=>{
  const headers={'cf-connecting-ip':'203.0.113.10','x-forwarded-for':'198.51.100.1','true-client-ip':'198.51.100.2'};
  for(const marker of [undefined,'','false','TRUE','1'])assert.equal(roomEntryIp(headers,'127.0.0.1',marker),'127.0.0.1');
  assert.equal(roomEntryIp({'x-forwarded-for':'203.0.113.10'},'127.0.0.1','true'),'127.0.0.1');
});

test('Render room-entry IP accepts one valid edge address and rejects chains, duplicates, ports and malformed values',()=>{
  assert.equal(roomEntryIp({'cf-connecting-ip':'203.0.113.10'},'10.0.0.1','true'),'203.0.113.10');
  assert.equal(roomEntryIp({'cf-connecting-ip':' 2001:DB8::10 '},'10.0.0.1','true'),'2001:db8::10');
  for(const value of [undefined,'','invalid','203.0.113.999','203.0.113.10:8080','203.0.113.10, 198.51.100.5','[2001:db8::1]','fe80::1%eth0',['203.0.113.10','198.51.100.5']]){
    assert.equal(roomEntryIp({'cf-connecting-ip':value},'10.0.0.1','true'),'10.0.0.1');
  }
});

test('Render clients behind one proxy have separate room-entry buckets while the same real IP shares its limit',async()=>{
  const previous=process.env.RENDER;process.env.RENDER='true';let server:ReturnType<typeof createApp>;
  try{server=createApp({tick:false});}finally{if(previous===undefined)delete process.env.RENDER;else process.env.RENDER=previous;}
  await new Promise<void>(resolve=>server.http.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${(server.http.address() as {port:number}).port}`,sockets:Socket[]=[];
  const connect=(address:string)=>new Promise<Socket>((resolve,reject)=>{
    const socket=io(url,{transports:['websocket'],forceNew:true,reconnection:false,timeout:3000,extraHeaders:{'cf-connecting-ip':address,'x-forwarded-for':'192.0.2.1'}});sockets.push(socket);socket.once('connect',()=>resolve(socket));socket.once('connect_error',reject);
  });
  const attempt=(socket:Socket)=>new Promise<Ack>((resolve,reject)=>socket.timeout(3000).emit('room:join',{name:'Guest',code:'ZZZZZZ',token:'proxy-test-session-123456789000'},(error:Error|null,result:Ack)=>error?reject(error):resolve(result)));
  try{
    const first=await connect('203.0.113.10'),second=await connect('203.0.113.10'),sameAddress=await connect('203.0.113.10'),otherAddress=await connect('198.51.100.20');
    for(let n=0;n<60;n++){assert.equal((await attempt(first)).error,'ROOM_NOT_FOUND');assert.equal((await attempt(second)).error,'ROOM_NOT_FOUND');}
    assert.equal((await attempt(sameAddress)).error,'RATE_LIMITED');
    assert.equal((await attempt(otherAddress)).error,'ROOM_NOT_FOUND','A different visitor remains able to enter a room behind the same proxy.');
  }finally{for(const socket of sockets)socket.disconnect();await server.close();}
});
