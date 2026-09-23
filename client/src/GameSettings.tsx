import {useEffect,useState} from 'react';
import type {GameConfig,GameMeta} from '../../shared/types.js';
export default function GameSettings({meta,values,host,apply,reset}:{meta:GameMeta;values:GameConfig;host:boolean;apply:(settings:GameConfig)=>void;reset:()=>void}){
  const [draft,setDraft]=useState<GameConfig>(values);
  useEffect(()=>setDraft(values),[meta.id,JSON.stringify(values)]);
  return <details className="panel game-settings"><summary>Game settings <span>{host?'Customize this game':'Chosen by the host'}</span></summary>
    <p>Recommended defaults are shown beside each control. Settings apply to the next game.</p>
    <form onSubmit={event=>{event.preventDefault();apply(draft);}}>
      <div className="game-settings-fields">{meta.settings?.map(field=><label key={field.key}><strong>{field.label}</strong>{field.type==='select'?<select disabled={!host} value={String(draft[field.key]??field.defaultValue)} onChange={event=>{const value=field.options!.find(o=>String(o.value)===event.target.value)!.value;setDraft({...draft,[field.key]:value});}}>{field.options?.map(option=><option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}</select>:<input type="number" required disabled={!host} min={field.min} max={field.max} step={field.step??1} value={draft[field.key]===undefined?'':Number(draft[field.key])} onChange={event=>setDraft({...draft,[field.key]:event.target.value===''?'':Number(event.target.value)})}/>}<small>Recommended: {field.defaultValue}{field.description?` · ${field.description}`:''}</small></label>)}</div>
      {host&&<div className="button-row"><button className="primary" type="submit">Apply settings</button><button type="button" onClick={reset}>Reset recommended defaults</button></div>}
    </form>
  </details>;
}
