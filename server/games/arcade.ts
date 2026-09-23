import {catalog} from '../../shared/catalog.js';
import type {GameContext,GameDefinition,GamePlayer} from '../../shared/types.js';
import {TerritoryGame,SnakeGame,GridGame} from './arcade-grids.js';
import {ArenaGame} from './arcade-arenas.js';
import {GolfGame,DifferenceGame} from './arcade-precision.js';
import {RaceGame,ReactionGame,ButtonBashGame} from './arcade-reactions.js';
export {TerritoryGame,SnakeGame,GridGame,snakeCollisions,type Snake} from './arcade-grids.js';
export {ArenaGame} from './arcade-arenas.js';
export {GolfGame,DifferenceGame,golfCourses} from './arcade-precision.js';
export {RaceGame,ReactionGame,ButtonBashGame} from './arcade-reactions.js';
const create=(id:string,players:GamePlayer[],now:number,context?:GameContext)=>{
  if(id==='territory-wars')return new TerritoryGame(players,now,context);
  if(id==='snake-arena')return new SnakeGame(players,now,context);
  if(['maze-race','last-tile','platform-panic','color-dash'].includes(id))return new GridGame(id,players,now,context);
  if(['pixel-battle','sumo-circles','dodge','coin-rush','capture-crown'].includes(id))return new ArenaGame(id,players,now,context);
  if(id==='mini-golf')return new GolfGame(players,now,context);
  if(['red-light','one-button-racing'].includes(id))return new RaceGame(id,players,now,context);
  if(id==='button-bash')return new ButtonBashGame(players,now,context);
  if(['quick-draw','reaction-tournament'].includes(id))return new ReactionGame(id,players,now,context);
  if(id==='spot-difference')return new DifferenceGame(players,now,context);
  throw Error(`Missing arcade game ${id}`);
};
export const arcadeInstructions:Record<string,string>={
  'territory-wars':'Select one adjacent boundary tile each planning turn. All choices resolve simultaneously: highest adjacent support wins, ties change nothing; enemy tiles need more support than the defender. Enclosed neutral regions convert. Most of the 24×18 tiles wins.',
  'quick-draw':'Seven rounds by default. READY lasts two seconds, then WAIT for a secret GO signal. Tap React or Space once. Early clicks are invalid with a 1000ms penalty. Correct reaction ranks earn 5/3/2/1 points; ties use average valid reaction time.',
  'snake-arena':'Steer with arrows/WASD or touch controls. The 50×36 arena advances ten times per second. Food grows your snake and scores ten. Walls, bodies and simultaneous head-on collisions eliminate. Last survivor wins; at the time cap, food score then length then survival time decides.',
  'pixel-battle':'Move with arrows/WASD or touch controls. Aim and fire at the arena, or use Space. 100 HP, 25 damage per hit, 300ms shot cooldown. Death respawns after two seconds with a 1.5-second shield. Most kills wins, then fewer deaths and more damage.',
  'mini-golf':'Six handcrafted holes; lowest raw strokes wins, then faster completion. Drag BACK from your ball and release to shoot forward, or use the aim/power sliders. Balls are independent. Ten strokes means pickup plus two penalty strokes; water/out-of-bounds resets the last shot with one penalty.',
  'last-tile':'Arrows/WASD or touch pad move across a 25×18 grid. Departed tiles crumble for 700ms then disappear. Falling or standing on a disappearing tile eliminates you. After 30 seconds the outside tiles begin crumbling. Last alive wins.',
  'one-button-racing':'Run automatically through the shared generated course. Hold Space or Jump for up to 400ms to jump higher; no extra jump while airborne. Hurdles and pits reset you to your checkpoint. Finish order wins; unfinished racers rank by progress.',
  'maze-race':'Navigate the same perfect 25×19 maze with arrows/WASD or touch controls. First to the green exit wins; others continue for placements. Unfinished players rank by remaining path distance at the time limit.',
  'platform-panic':'Hop orthogonally with arrows/WASD or touch controls, at most five moves per second. Every 2.5 seconds several platforms warn for one second, then fall. Gaps block movement. Last alive wins; final shared platform survivors tie.',
  'color-dash':'Move onto the named color before its timer expires. One mistake gives a strike and a rescue; the second eliminates. Non-target tiles drop for a second, then the grid regenerates. Rounds accelerate; last alive or fewest strikes at the cap wins.',
  'sumo-circles':'Accelerate with arrows/WASD or touch controls. Space/Dash gives a 500-unit impulse every two seconds. Circle collisions transfer momentum. Leaving the shrinking arena eliminates you; the circle starts shrinking after 30 seconds. Last alive wins.',
  'dodge':'Move with arrows/WASD or touch controls to dodge boundary projectiles. Hazard rate increases every ten seconds; large rectangles warn before moving. Last alive wins; survivors at the time limit tie.',
  'coin-rush':'Collect the fifteen continuously respawning coins. Move with arrows/WASD or touch controls and dash every three seconds. Dashing into another player can steal one coin; victims are protected for two seconds. Most coins wins; tied scores share placement.',
  'capture-crown':'Touch the center crown and hold it for 30 seconds total. Holders run 10% slower. Tagging drops the crown; it does not instantly transfer. The previous holder cannot pick it up for one second. Space/Dash recharges every three seconds.',
  'red-light':'Hold Run, Space or W on GREEN; release immediately on RED. Running more than 100ms after red eliminates you. First legal finisher wins; others continue for placements. The future light schedule is secret.',
  'reaction-tournament':'Eight rounds mix GO, arrow matching, color matching, odd symbols, do-not-click decoys and three-second alternating A/B challenges. Use arrows, Space and Z/X or touch buttons. Correct reactions score up to 1000; everyone stays in the tournament.',
  'spot-difference':'Find five differences in two generated vector scenes. Tap their locations in the RIGHT scene, including the empty location of a missing object. Each find scores 200; completing all five adds a speed bonus. Wrong clicks lock input for one second.',
  'button-bash':'Match your current command using arrows, Z for A, X for B, or six touch buttons. Everyone receives the same sequence at their own pace. Correct answers score one; the timer accelerates from 1200ms to 350ms. Three strikes eliminate. Only the current command is revealed.'
};
export const arcadeDefinitions:GameDefinition[]=catalog.filter(m=>m.family==='arcade').map(metadata=>({metadata:{...metadata,instructions:arcadeInstructions[metadata.id]},init:(players,now,context)=>create(metadata.id,players,now,context)}));
