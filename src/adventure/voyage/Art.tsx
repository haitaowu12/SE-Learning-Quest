import { useId } from 'react';
import type { Scene, VoyageState } from './types.ts';

const glyphs: Record<string, string> = {
  book: 'M4 5h8q4 0 4 3v20q0-3-4-3H4zM28 5h-8q-4 0-4 3v20q0-3 4-3h8z',
  seal: 'm16 3 4 3 5 1 1 5 3 4-3 4-1 5-5 1-4 3-4-3-5-1-1-5-3-4 3-4 1-5 5-1zM10 16l4 4 8-9',
  map: 'm3 7 8-4 10 4 8-4v22l-8 4-10-4-8 4zM11 3v22M21 7v22',
  flag: 'M7 29V4h18l-4 7 4 7H7',
  shield: 'M16 3 28 8v8c0 7-12 13-12 13S4 23 4 16V8zM10 16l4 4 8-9',
  link: 'm11 21-3 3a5 5 0 0 1-7-7l7-7a5 5 0 0 1 7 0M21 11l3-3a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7 0M10 22l12-12',
  relay: 'M9 27V13h14v14zM6 13l10-9 10 9zM16 4V1M13 17h6v5h-6zM5 27h22',
  crew: 'M12 10a4 4 0 1 0-8 0 4 4 0 0 0 8 0M28 10a4 4 0 1 0-8 0 4 4 0 0 0 8 0M2 28v-7a6 6 0 0 1 12 0v7M18 28v-7a6 6 0 0 1 12 0v7',
  tool: 'm21 4-6 6 7 7 6-6a9 9 0 0 1-11 12L8 31l-6-6 9-9A9 9 0 0 1 21 4z',
  eye: 'M2 16S7 6 16 6s14 10 14 10-5 10-14 10S2 16 2 16zM21 16a5 5 0 1 0-10 0 5 5 0 0 0 10 0',
  star: 'm16 2 4 9 10 1-8 7 2 11-8-6-8 6 2-11-8-7 10-1z',
  sun: 'M22 16a6 6 0 1 0-12 0 6 6 0 0 0 12 0M16 1v5M16 26v5M1 16h5M26 16h5M5 5l4 4M23 23l4 4M5 27l4-4M23 9l4-4',
  moon: 'M25 23A13 13 0 0 1 12 3a13 13 0 1 0 13 20z',
  storm: 'M7 21a7 7 0 1 1 3-13 8 8 0 0 1 15 3 5 5 0 0 1 0 10M17 18l-6 8h7l-4 6',
  arrow: 'M4 16h23M19 8l8 8-8 8',
  check: 'm5 16 7 7L27 7',
  close: 'M7 7l18 18M25 7 7 25',
};
export function Glyph({ name, className = '' }: { name: string; className?: string }) {
  return <svg className={`vy-glyph ${className}`} viewBox="0 0 34 34" aria-hidden="true"><path d={glyphs[name] ?? glyphs.book} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export function SeraPortrait() {
  return <svg className="av-portrait vy-sera" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r="50" fill="#d9e5d0"/><path d="M8 100q2-37 42-36 40-1 42 36" fill="#476966"/>
    <path d="M40 57h20v20l-10 12-10-12z" fill="#bd8a64"/><path d="M24 50q-7-40 25-42 37 0 28 42l-10 20H30z" fill="#526268"/>
    <ellipse cx="50" cy="41" rx="23" ry="30" fill="#d2a07a"/><path d="M27 35q8-29 29-23 18 5 18 22L53 22 35 38z" fill="#546366"/>
    <path d="M36 11q16-6 24 5l-22 9-10 17q-3-22 8-31" fill="#bdc5b3"/>
    <path d="M32 37h14v10H32zM54 37h14v10H54zM46 41h8" stroke="#32555b" fill="none" strokeWidth="2"/>
    <path d="M49 45v8h5M43 59q8 4 14-1" stroke="#885b4d" strokeWidth="2" fill="none"/>
    <path d="m31 72 19 17 19-17-7 28H38z" fill="#d4b473"/><circle cx="50" cy="90" r="4" fill="#395b5b"/>
  </svg>;
}

function Island({ x, y, scale = 1, tower = false, lit = false }: { x: number; y: number; scale?: number; tower?: boolean; lit?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="m-78 0 18 33 31 11 26 44 18-34 35-22L81 0z" fill="#6b8779"/>
    <path d="m-53 13 24 31 11 30-5-41 19-14M40 12 23 50" fill="none" stroke="#93a895" strokeWidth="5"/>
    <ellipse cy="-2" rx="85" ry="19" fill="#a5bda0"/><path d="M-68-12h136" stroke="#d6d9b8" strokeWidth="5"/>
    {tower ? <><path d="M-16-4v-97h34v97" fill="#e2d0a1" stroke="#597b74" strokeWidth="3"/><path d="M-24-104 1-137l25 33z" fill="#477176"/>
      <path d="M-21-100h44v28h-44z" fill={lit ? '#f6dd87' : '#7a9990'} stroke="#456d6e" strokeWidth="4"/>
      <path d="M-14-49h30M-14-32h30" stroke="#b4ae83" strokeWidth="4"/><path d="M-5-4v-17H8V-4" fill="#47676b"/>
      {lit && <path d="m-22-96-93-22v57l93-18M24-96l93-22v57L24-79" fill="#f5dfa0" opacity=".3"/>}</>
      : <><path d="M-53-5v-44h41v44M-2-5v-63h49v63" fill="#e4d1a2" stroke="#738776" strokeWidth="2"/>
        <path d="m-61-48 27-23 29 23zM-9-68 22-96 54-68z" fill="#af7c58" stroke="#567a75" strokeWidth="3"/>
        <path d="M-42-33h8v10h-8zM10-44h10v13H10zM28-44h10v13H28z" fill={lit ? '#fff0b3' : '#768e83'}/></>}
  </g>;
}

export function Landscape({ scene, state }: { scene: Scene; state: VoyageState }) {
  const skyId = useId().replace(/:/g, ''), accepted = state.records.some(r => r.scene === 'release' && r.sealed);
  const seraWithCrew = state.records.some(r => r.scene === 'relief' && r.sealed);
  const retired = state.records.some(r => r.scene === 'retirement' && r.sealed);
  const finalRecord = state.records.find(r => r.scene === 'inheritance');
  const disposition = finalRecord?.sealed ? finalRecord.choices.legacy : null;
  const coreStatus = disposition === 'exhibit' ? 'exhibit' : disposition === 'recover' ? 'recovered' : retired ? 'holding' : 'connected';
  const shelter = state.records.some(r => r.scene === 'shelter');
  const damaged = state.index >= 8 && !state.records.some(r => r.scene === 'repair' && r.sealed);
  return <svg className={`vy-landscape vy-region-${scene.region}`} viewBox="0 0 1200 310" aria-hidden="true">
    <defs><linearGradient id={skyId} x2="0" y2="1"><stop stopColor={scene.region === 'inheritance' ? '#b3cabb' : '#86aeb0'}/><stop offset="1" stopColor="#efe4bf"/></linearGradient></defs>
    <rect width="1200" height="310" fill={`url(#${skyId})`}/>
    <circle cx="1000" cy="79" r="49" fill="#f4e4af" opacity=".8"/>
    <path d="M0 222 81 165 117 182 214 48 304 180 373 120 451 220 554 151 637 215 728 88 833 218 924 157 1034 221 1160 119 1200 162v148H0z" fill="#7b9b92" opacity=".42"/>
    <path d="m158 128 56-80 51 76-48-21zM699 131l29-43 33 51-35-9z" fill="#e4e6ce" opacity=".65"/>
    <g className="vy-cloud"><path d="M19 55h154M45 41h59M434 40h119M754 52h108M775 39h39M1030 185h137" stroke="#eff0d8" strokeWidth="9" strokeLinecap="round" opacity=".65"/></g>
    <path d="M103 225q231-135 431-38T1085 208" fill="none" stroke="#738f80" strokeWidth="3" strokeDasharray="8 9"/>
    <Island x={150} y={218} scale={.9} lit={accepted}/><Island x={523} y={222} scale={1.22} tower lit={accepted}/>
    <g data-voyage-old-core data-status={coreStatus}>{coreStatus === 'recovered'
      ? <g data-voyage-recovered-core transform="translate(322 244)"><rect x="-34" y="-9" width="30" height="20" rx="3" fill="#6f8e82" stroke="#405e59" strokeWidth="3"/><rect x="7" y="-4" width="27" height="15" rx="3" fill="#c29a61" stroke="#775c39" strokeWidth="3"/><circle cx="4" cy="-22" r="9" fill="none" stroke="#607d73" strokeWidth="5"/><path d="M-25-16l15-12 9 10M18-13l10-10" fill="none" stroke="#59766e" strokeWidth="4"/></g>
      : <><Island x={322} y={243} scale={.48} tower lit={!retired}/>{coreStatus === 'exhibit' && <g data-voyage-core-exhibit transform="translate(322 276)"><rect x="-24" y="-6" width="48" height="12" rx="3" fill="#d9c08b" stroke="#6c715f" strokeWidth="2"/><path d="M-15 0h30" stroke="#6c715f" strokeWidth="2"/></g>}</>}
    </g>
    <Island x={901} y={204} scale={.87} lit={accepted}/>
    {seraWithCrew && <g data-voyage-sera-ashore transform="translate(846 202)"><path d="M-7 0v-20h14V0" fill="#658882"/><circle cy="-27" r="8" fill="#d3a77c"/><path d="M-9-29q3-15 15-5l3 10-9-5" fill="#c7d0bd"/></g>}
    {shelter && <g data-voyage-shelter><Island x={1084} y={256} scale={.52} lit={state.records.some(r => r.scene === 'winter' && r.sealed)}/></g>}
    {scene.region === 'stormglass' && <g stroke="#a68b60" strokeWidth="4" fill="none"><path d="M478 231V62h90v169M478 104h90M478 151h90M478 196h90M478 62l90 89M478 151l90 80"/></g>}
    {scene.region === 'field' && [116, 868].map(x => <g key={x} transform={`translate(${x} 167)`}><path d="M0 45V0" stroke="#647962" strokeWidth="4"/><path d="M1 0h28L18 12l10 12H1z" fill="#b88758"/></g>)}
    {damaged && <g data-voyage-failed-joint transform="translate(415 185)"><circle r="16" fill="#f4ddb2" stroke="#a36d49" strokeWidth="3"/><path d="m-6-6 12 12M6-6-6 6" stroke="#994f3c" strokeWidth="4"/></g>}
    {scene.region === 'inheritance' && [120, 172, 875, 931].map(x => <g key={x} transform={`translate(${x} 191)`}><path d="M0 23V0" stroke="#6e8262" strokeWidth="3"/><ellipse cy="-3" rx="11" ry="17" fill="#7b9e78"/></g>)}
    <g transform="translate(712 248)"><path d="m-71 0 145-6-24 26H-47z" fill="#33595f"/><path d="M-32-5v-30h61v29" fill="#d6bb85" stroke="#4c6d6a" strokeWidth="3"/>
      <path d="M-39-37h75M-23-25h13M7-25h13" stroke="#597d78" strokeWidth="5"/>
      <path d="M-52-5v-52" stroke="#5a7165" strokeWidth="4"/><path d="m-52-56 26 5-26 12" fill="#b87952"/>
    </g>
    <path d="M0 296q97-14 190 0t210 0 217 0 207 0 197 0 179 0v14H0z" fill="#dbe3c8" opacity=".55"/>
  </svg>;
}

export function RouteDrawing({ route }: { route: string }) {
  const split = ['diverse', 'east'].includes(route);
  const northRelay = ['lookouts', 'north'].includes(route);
  const people = route === 'posts';
  const label = route === 'diverse' ? 'EAST + WEST' : northRelay ? 'NORTH V2' : route === 'single' ? 'WEST ONLY' : route === 'east' ? 'EAST DETOUR' : route === 'posts' ? 'LOCAL POSTS' : route === 'stop' ? 'NO COVER' : '';
  return <svg className="vy-route-drawing" viewBox="0 0 260 108" aria-hidden="true">
    {label && <text x="130" y="13" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1" fill="currentColor">{label}</text>}
    {!northRelay && <path d="M20 72q50-60 107-27t112 23" fill="none" stroke="#9cae97" strokeWidth="4" strokeDasharray={split || people ? undefined : '9 7'}/>}
    {split && <path d="M20 72q106 42 219-4" fill="none" stroke="#427872" strokeWidth="5"/>}
    {northRelay && <><path d="M20 72q52-69 108-43t111 39" fill="none" stroke="#427872" strokeWidth="5"/>{[[39, 61], [98, 37], [164, 41], [222, 61]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}><circle r="13" fill="#f4e7be" stroke="#5c8377" strokeWidth="3"/><path d="M-5 4V-4h10V4M-7-4 0-11 7-4" fill="#649087" stroke="#456c65" strokeWidth="2"/><circle cx="12" cy="-11" r="4" fill="#bc905e"/></g>)}</>}
    {people && [39, 104, 169, 222].map(x => <g key={x} transform={`translate(${x} 54)`}><circle r="7" fill="#bc905e"/><path d="M-8 22V10q8-8 16 0v12" stroke="#446d68" strokeWidth="5" fill="none"/><path d="M14 24V-7l17 6-17 5" stroke="#896533" strokeWidth="3" fill="#d3b36f"/></g>)}
    {!people && !northRelay && [25, 127, 236].map((x, i) => <g key={x} transform={`translate(${x} ${i === 1 ? 35 : 67})`}><circle r="16" fill="#f4e7be" stroke="#5c8377" strokeWidth="3"/><path d="M-6 5V-5h12V5M-9-5 0-13 9-5" fill="#649087" stroke="#456c65" strokeWidth="2"/></g>)}
    {!split && !people && !northRelay && <g stroke="#a26448" strokeWidth="4"><path d="M69 27l15 15M84 27 69 42"/></g>}
  </svg>;
}
