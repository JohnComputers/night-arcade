import {catalog} from '../../shared/catalog.js';
import type {GameDefinition} from '../../shared/types.js';
import {PartyGame,partyInstructions} from './party-engine.js';
export {PartyGame,partyInstructions} from './party-engine.js';
export const partyDefinitions:GameDefinition[]=catalog.filter(g=>g.family==='party').map(metadata=>({metadata:{...metadata,instructions:partyInstructions[metadata.id]},init:(players,now,context)=>new PartyGame(metadata.id,players,now,context)}));
