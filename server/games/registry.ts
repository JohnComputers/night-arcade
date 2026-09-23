import {boardDefinitions} from './boards.js';
import {arcadeDefinitions} from './arcade.js';
import {partyDefinitions} from './party.js';
import type {GameDefinition} from '../../shared/types.js';
import {canonicalGameId} from '../../shared/catalog.js';
class GameRegistry extends Map<string,GameDefinition>{
  override get(id:string){return super.get(canonicalGameId(id));}
  override has(id:string){return super.has(canonicalGameId(id));}
}
export const registry=new GameRegistry([...boardDefinitions,...arcadeDefinitions,...partyDefinitions].map(g=>[g.metadata.id,g]));
