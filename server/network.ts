import {isIP} from 'node:net';
import type {IncomingHttpHeaders} from 'node:http';

/** Render's public edge overwrites this header. Direct/self-hosted requests must not trust it. */
export function roomEntryIp(headers:IncomingHttpHeaders,remoteAddress:string,renderMarker:string|undefined):string {
  const forwarded=headers['cf-connecting-ip'];
  if(renderMarker==='true'&&typeof forwarded==='string'){
    const address=forwarded.trim();
    if(!address.includes('%')&&isIP(address))return address.toLowerCase();
  }
  return remoteAddress;
}
