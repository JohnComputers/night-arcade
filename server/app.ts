import express from 'express';
import {createServer} from 'node:http';
import {Server} from 'socket.io';
import {resolve} from 'node:path';
import {existsSync} from 'node:fs';
import {RoomManager} from './rooms.js';
import {registry} from './games/registry.js';
import {roomEntryIp} from './network.js';
import type {ClientEvents,ServerEvents,Ack} from '../shared/types.js';

const messages:Record<string,string>={ROOM_NOT_FOUND:'That room was not found. Check the six-letter code.',ROOM_FULL:'This room already has 20 players.',NAME_INVALID:'Enter a display name of 1–25 characters.',GAME_FULL:'Too many players for this game. Choose a game with a higher player limit.',NOT_HOST:'Only the room host can do that.',INVALID_ACTION:'That move is not available. Check the game instructions.',GAME_IN_PROGRESS:'Finish this round or return to the lobby first.',NOT_ENOUGH_PLAYERS:'Invite more friends before starting this game.',KICKED:'You were removed from this room.',INVALID_SESSION:'Your session could not be restored. Reload and try again.',ALREADY_IN_ROOM:'Leave your current room before joining another.',SERVER_BUSY:'The server is full. Try again shortly.',RATE_LIMITED:'A little too fast. Give it a moment and try again.'};
export function createApp(options:{tick?:boolean}={}){
  messages.INVALID_CONFIG='Choose values within the ranges shown in game settings.';
  const app=express();app.disable('x-powered-by');
  app.use((_req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');next();});
  const http=createServer(app);
  const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  const io=new Server<ClientEvents,ServerEvents>(http,{maxHttpBufferSize:32_768,cors:origins.length?{origin:origins}:undefined,allowRequest:(req,cb)=>{const origin=req.headers.origin;cb(null,!origins.length||!origin||origins.includes(origin));},pingInterval:10_000,pingTimeout:15_000});
  const manager=new RoomManager(registry,(id,event,payload)=>{(io.to(id) as any).emit(event,payload);},id=>io.sockets.sockets.get(id)?.disconnect(true),Math.max(5,Number(process.env.ROOM_IDLE_MINUTES)||120)*60_000,Math.max(1,Number(process.env.MAX_ROOMS)||200));
  const ipBuckets=new Map<string,{count:number;until:number}>();
  const renderMarker=process.env.RENDER;
  const ipAllowed=(ip:string,now:number)=>{let b=ipBuckets.get(ip);if(!b||now>b.until){b={count:0,until:now+60_000};ipBuckets.set(ip,b);}return ++b.count<=120;};
  io.on('connection',socket=>{
    const entryIp=roomEntryIp(socket.handshake.headers,socket.handshake.address,renderMarker);
    let pingAt=0;
    socket.conn.on('packetCreate',packet=>{if(packet.type==='ping')pingAt=Date.now();});
    socket.conn.on('packet',packet=>{if(packet.type==='pong'&&pingAt){manager.recordLatency(socket.id,Date.now()-pingAt);pingAt=0;}});
    let tokens=120,last=Date.now();
    const allow=()=>{const now=Date.now();tokens=Math.min(120,tokens+(now-last)*.07);last=now;if(tokens<1)throw Error('RATE_LIMITED');tokens--;};
    const handle=(name:string,fn:(p:any,now:number)=>any)=>{(socket as any).on(name,(payload:unknown,callback:unknown)=>{let result:Ack;try{allow();if(!payload||typeof payload!=='object'||Array.isArray(payload))throw Error('INVALID_ACTION');result={ok:true,...fn(payload,Date.now())};}catch(error){const code=error instanceof Error?error.message:'INVALID_ACTION';result={ok:false,error:code in messages?code:'INVALID_ACTION',message:messages[code]||'That action could not be accepted.'};}if(typeof callback==='function')callback(result);});};
    handle('room:create',(p,now)=>{if(!ipAllowed(entryIp,now))throw Error('RATE_LIMITED');return manager.create(socket.id,p.name,p.token,now);});
    handle('room:join',(p,now)=>{if(!ipAllowed(entryIp,now))throw Error('RATE_LIMITED');return manager.join(socket.id,p.code,p.name,p.token,now);});
    handle('room:leave',(_p,now)=>manager.leave(socket.id,now));
    handle('room:kick',(p,now)=>manager.kick(socket.id,p.playerId,now));
    handle('player:ready',(p,now)=>manager.ready(socket.id,p.ready,now));
    handle('game:select',(p,now)=>manager.select(socket.id,p.gameId,now));
    handle('game:configure',(p,now)=>manager.configure(socket.id,p.settings,p.reset,now));
    handle('game:vote',(p,now)=>manager.vote(socket.id,p.gameId,now));
    handle('game:start',(_p,now)=>manager.start(socket.id,now));
    handle('game:lobby',(_p,now)=>manager.lobby(socket.id,now));
    handle('game:input',(p,now)=>manager.input(socket.id,p.seq,p.action,now));
    socket.on('ping:sync',(p,cb)=>{try{allow();if(p&&typeof p.sentAt==='number'&&Number.isFinite(p.sentAt)&&typeof cb==='function')cb({sentAt:p.sentAt,serverTime:Date.now()});}catch{}});
    socket.on('disconnect',()=>manager.disconnect(socket.id,Date.now()));
  });
  app.get('/api/health',(_req,res)=>res.json({ok:true,games:registry.size,rooms:manager.rooms.size}));
  app.get('/api/games',(_req,res)=>res.json([...registry.values()].map(g=>g.metadata)));
  const client=resolve('dist/client');
  if(existsSync(resolve(client,'index.html'))){app.use(express.static(client,{maxAge:'1h',index:false}));app.get('/{*path}',(_req,res)=>{res.setHeader('Cache-Control','no-cache');res.sendFile(resolve(client,'index.html'));});}
  let previous=Date.now();const timer=options.tick===false?null:setInterval(()=>{const now=Date.now();manager.tick(now,now-previous);previous=now;for(const [ip,b]of ipBuckets)if(now>b.until)ipBuckets.delete(ip);},50);timer?.unref();
  return {app,http,io,manager,close:async()=>{if(timer)clearInterval(timer);manager.close();await new Promise<void>(r=>io.close(()=>r()));}};
}
