import type { Chapter, Place } from './model.ts';
import type { Person } from './story.ts';

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <svg viewBox="0 0 48 48" className={`av-icon ${className}`} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    {name === 'lamp' ? <><path d="M17 11h14l5 28H12zM16 11l8-8 8 8M18 42h12M24 19v10"/><path d="M21 29q-5 7 3 7t3-7l-3-7z" fill="currentColor" stroke="none"/></>
      : name === 'crystal' ? <><path d="m24 4 12 12-4 21-8 7-8-7-4-21zM24 4l-4 16 4 24 4-24zM12 16l8 4 8 0 8-4"/></>
      : name === 'book' ? <><path d="M5 9q10-4 19 2 9-6 19-2v30q-10-4-19 2-9-6-19-2zM24 11v30M10 17h8M30 17h8M10 24h8M30 24h8"/></>
      : name === 'bell' ? <><path d="M12 32h24l-4-8v-8a8 8 0 0 0-16 0v8zM21 36q3 7 6 0M24 5V2M6 16l-3-3M42 16l3-3"/></>
      : name === 'crew' ? <><circle cx="24" cy="13" r="7"/><path d="M12 40v-8q0-11 12-11t12 11v8M5 40v-7q0-5 5-7M43 40v-7q0-5-5-7"/></>
      : name === 'ferry' ? <><path d="m4 29 6 11h27l7-11zM14 29V17h17v12M19 17V8h9v9M10 44q5-5 10 0t10 0 10 0"/></>
      : name === 'flag' ? <><path d="M12 44V5M12 7q8-5 14 0t12 0v19q-6 5-12 0t-14 0"/><path d="m20 15 4 4 8-9"/></>
      : name === 'eye' ? <><path d="M3 24q21-25 42 0-21 25-42 0z"/><circle cx="24" cy="24" r="7"/></>
      : name === 'talk' ? <path d="M7 6h34v26H21L9 43V32H7zM15 15h18M15 22h12"/>
      : name === 'hand' ? <path d="M13 23V10q0-5 4-2v14-17q4-4 6 0v16-18q4-3 6 1v17-14q4-3 6 2v19q9-13 11-5L33 43H18L5 27q-2-6 3-5l5 5"/>
      : name === 'clock' ? <><circle cx="24" cy="24" r="19"/><path d="M24 12v13l9 5"/></>
      : name === 'arrow' ? <path d="M5 24h36M28 10l14 14-14 14"/>
      : name === 'check' ? <path d="m8 24 11 12L41 9"/>
      : name === 'close' ? <path d="m11 11 26 26M37 11 11 37"/>
      : name === 'settings' ? <><circle cx="24" cy="24" r="9"/><path d="m20 4 8 0 2 8 7 0 5 7-5 6 1 8-7 5-7-3-7 3-7-5 1-8-5-6 5-7h7z"/></>
      : <path d="m24 3 5 15 16 6-16 5-5 16-5-16L3 24l16-6z"/>}
  </svg>;
}

export function Portrait({ person }: { person: Person }) {
  const robot = person === 'pip';
  const skin = person === 'mara' ? '#b97b50' : '#e4b18a';
  return <svg className={`av-portrait av-portrait-${person}`} viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="59" fill={robot ? '#214847' : person === 'mara' ? '#315a64' : '#453f68'}/>
    <path d="M4 120q0-37 31-44h50q31 7 31 44" fill={robot ? '#af8653' : person === 'mara' ? '#39665f' : '#425a89'}/>
    {robot ? <><path d="M38 26V18h44v8" stroke="#ebd6a1" strokeWidth="5"/><path d="M60 17V5" stroke="#b39860" strokeWidth="3"/><circle cx="60" cy="5" r="4" fill="#ecb852"/><rect x="22" y="28" width="76" height="54" rx="17" fill="#d8be85"/><rect x="29" y="37" width="62" height="35" rx="11" fill="#183433"/><ellipse cx="44" cy="52" rx="6" ry="9" fill="#9ee9db"/><ellipse cx="75" cy="52" rx="6" ry="9" fill="#9ee9db"/><path d="M49 65q11 7 22-1" stroke="#9ee9db" fill="none" strokeWidth="2"/><circle cx="60" cy="98" r="11" fill="#314c49"/><path d="m60 88 3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#d7bd82"/></>
      : <><path d="M28 74Q8 28 43 19q48-23 56 39l-7 35-25-14z" fill={person === 'sera' ? '#baaa98' : '#322d38'}/><path d="M48 72h24v19H48z" fill={skin}/><path d="M32 44q27 0 47-18 16 19 6 40-10 26-28 21-22-5-25-43" fill={skin}/><path d="M30 51Q42 28 72 21L87 37Q82 13 58 18T30 51" fill={person === 'sera' ? '#d9ccae' : '#483334'}/><path d="M40 52h8M67 50h8" stroke="#3c302b" strokeWidth="3" strokeLinecap="round"/><path d="m59 53-4 12h6M50 73q12 6 18-2" stroke="#925b43" strokeWidth="2" fill="none"/>{person === 'mara' && <><path d="M26 32q14-21 53-13l10 17H29z" fill="#285566"/><path d="M23 34h74q-12 12-45 5z" fill="#193948"/><circle cx="62" cy="28" r="4" fill="#dcb97a"/></>}<path d="m41 83 18 15 20-15 12 13-27 24H50L29 98z" fill={person === 'mara' ? '#d5a558' : '#b45f42'}/><path d="M75 94 91 120" stroke="#c9b780" strokeWidth="6"/></>}
  </svg>;
}

function MountainHarbour({ place }: { place: Place }) {
  return <>
    <rect width="1200" height="700" fill={`url(#av-sky-${place})`}/>
    <circle cx="870" cy="118" r="52" fill="#ffe1a0" opacity=".75"/>
    <g fill="#f5f1d6" opacity=".7" className="av-clouds"><path d="M100 114q-20-26 10-31 5-31 37-15 23-13 39 9 40-3 40 22 18 15-10 23z"/><path d="M900 79q-20-30 14-34 9-35 37-19 23-8 37 19 43-3 39 26 12 10-1 15z"/></g>
    <path d="M0 260 96 161 157 212 266 91 352 204 447 144 516 257 650 148 740 241 903 160 1049 234 1154 133 1200 164v200H0z" fill="#6b9494"/>
    <path d="m266 91-48 83 46-25 29 25 8-14zM96 161l-39 68 39-28 21 12zM650 148l-43 68 43-26 25 20zM1154 133l-54 82 54-36 29 29z" fill="#d6e4d5"/>
    <path d="M0 286Q86 218 197 267t154-15 231 48 220-49 243 8 155-29v120H0z" fill="#507b6e"/>
    <rect y="320" width="1200" height="380" fill={`url(#av-water-${place})`}/>
    <g stroke="#b7d7be" strokeWidth="3" opacity=".4" fill="none">{Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${(i * 113) % 1150} ${360 + i * 17}q37 9 74 0t85 0`}/>)}</g>
    <g>{[25, 98, 170, 910, 990, 1070, 1150].map((x, i) => <g key={x} transform={`translate(${x} ${250 + i % 2 * 25})`}><rect width="66" height="85" rx="2" fill={i % 2 ? '#d9c29b' : '#e1d4ad'}/><path d="M-8 0 31-32 75 0z" fill={i % 2 ? '#a1634b' : '#596e67'}/><path d="M10 21h11v17H10zM40 21h11v17H40zM27 57h15v28H27z" fill="#476866"/><path d="M1 50h63" stroke="#b1a282" strokeWidth="3"/></g>)}</g>
    <g transform="translate(720 273)"><path d="m0 39 74-7-13 22H14z" fill="#304f58"/><path d="M31 32V-54L65 18H31" fill="#f2ddb2" stroke="#7c7756" strokeWidth="2"/></g>
  </>;
}
function PersonFigure({ x, y, color = '#b36542', earmuffs = false, raised = false }: { x: number; y: number; color?: string; earmuffs?: boolean; raised?: boolean }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cy="83" rx="30" ry="8" fill="#283e3e" opacity=".25"/>
    <path d="m-14 48-4 32h14l6-29 7 29h14l-8-33z" fill="#354a55"/>
    <path d="M-21 11q21-13 42 0l8 38h-56z" fill={color}/>
    <path d={raised ? 'M-19 19-36-11l7-10M20 20l23-32' : 'M-19 21-34 45M20 20l15 27'} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"/>
    <rect x="-5" y="-3" width="11" height="14" fill="#bd8b62"/>
    <ellipse cy="-13" rx="15" ry="20" fill="#dbab7f"/>
    <path d="M-18-14q-3-26 19-24 17-2 18 22l-16-8z" fill="#405055"/>
    {earmuffs && <g fill="#d7ad55" stroke="#514d3e" strokeWidth="3"><path d="M-18-8v-12q17-25 37 0v12" fill="none"/><rect x="-23" y="-17" width="9" height="15" rx="3"/><rect x="14" y="-17" width="9" height="15" rx="3"/></g>}
  </g>;
}
function Lantern({ x, y, lit = true, scale = 1, green = false }: { x: number; y: number; lit?: boolean; scale?: number; green?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-21-31q0-44 42 0" stroke="#a78b55" strokeWidth="5" fill="none"/>{lit && <circle r="85" fill={green ? '#90e8ac' : '#ffcf6a'} opacity=".12" className="av-lantern-glow"/>}<path d="m-27-31-9 73h72l-9-73z" fill="#c59d5c"/><path d="m-20-22-7 53h54l-7-53z" fill={lit ? green ? '#8ad899' : '#ffda88' : '#47645d'}/><path d="M-29-32h58M-37 43h74M-24-25v56M23-25v56" stroke="#605848" strokeWidth="7"/><path d="m0 30-10-9L0-9l11 30z" fill={lit ? green ? '#d7ffcc' : '#fff2c2' : '#748979'}/></g>;
}
function Ferry({ held, complete }: { held: boolean; complete: boolean }) {
  return <g className={complete ? 'av-ferry-leaving' : ''} transform="translate(740 402)">
    <ellipse cx="85" cy="186" rx="239" ry="29" fill="#2b6870" opacity=".38"/>
    <path d="m-166 55 423-15-47 114q-47 54-302 10z" fill="#315b61" stroke="#234950" strokeWidth="5"/>
    <path d="m-164 58 420-15-11 34-393 20z" fill="#d2ac6e"/>
    <path d="m-128 105 353-16-13 28-325 12z" fill="#406e70"/>
    <path d="M-34 40V-98h150l35 138z" fill="#e8d6aa"/>
    <path d="M-42-96h166l19-18H-46z" fill="#9f634b"/>
    <path d="M-16-76h40v52h-40zM48-76h42v52H48zM93-9h27v49H93z" fill="#496c6b"/>
    <path d="M21-116v-56" stroke="#58615a" strokeWidth="7"/>
    <path d="m23-172 76 14-76 16" fill={held ? '#bd653e' : '#e6c990'}/>
    {[-92, -4, 91, 170].map(x => <circle key={x} cx={x} cy="111" r="12" fill="#26484f" stroke="#9d9166" strokeWidth="5"/>)}
    <path d="m-135 48 21-51h70" fill="none" stroke="#7d7d61" strokeWidth="4"/>
  </g>;
}
export function SceneArt({ state, running }: { state: Chapter; running: boolean }) {
  const p = state.place;
  const held = !!state.trial?.acted;
  return <svg className={`av-scene-art ${running ? 'av-is-running' : ''}`} viewBox="0 0 1200 700" aria-hidden="true">
    <defs>
      <linearGradient id={`av-sky-${p}`} x2="0" y2="1"><stop stopColor="#a9c5c0"/><stop offset="1" stopColor="#eddfb4"/></linearGradient>
      <linearGradient id={`av-water-${p}`} x2="0" y2="1"><stop stopColor="#719f98"/><stop offset="1" stopColor="#315f66"/></linearGradient>
      <linearGradient id="av-wall" x2="1" y2="1"><stop stopColor="#4b5148"/><stop offset="1" stopColor="#243e40"/></linearGradient>
      <linearGradient id="av-wood" x2="0" y2="1"><stop stopColor="#b2895c"/><stop offset="1" stopColor="#725c46"/></linearGradient>
    </defs>
    <MountainHarbour place={p}/>
    {p === 'workshop' ? <>
      <path fill="url(#av-wall)" fillRule="evenodd" d="M0 0H1200V700H0z M90 335V150Q230-35 376 150v185z"/>
      <path d="M74 349V148Q230-63 391 148v201H74M231 34v305M80 222h300" fill="none" stroke="#b49d72" strokeWidth="18"/>
      <path d="M0 552H1200V700H0" fill="#554d41"/>
      {[0, 180, 410, 690, 970, 1200].map((x, i) => <path key={x} d={`M${x} 552 ${x + (i - 2) * 40} 700`} stroke="#8a7352" strokeWidth="3"/>)}
      <path d="M0 0H1200L1135 55H64z" fill="#745e44"/>
      <path d="M40 0v550M1170 0v550M414 0v550" stroke="#6b5e49" strokeWidth="27"/>
      <g transform="translate(963 151)"><rect width="161" height="322" fill="#554b3c" stroke="#867052" strokeWidth="9"/>{[87, 182, 275].map((y, i) => <g key={y}><path d={`M0 ${y}h161`} stroke="#ac9369" strokeWidth="9"/>{[16, 42, 70, 100, 126].map((x, j) => <rect key={x} x={x} y={y - 58 - j % 2 * 17} width="20" height={53 + j % 2 * 17} rx="2" fill={['#8d7054', '#3e7777', '#b8975a', '#895347'][(i + j) % 4]}/>)}</g>)}</g>
      <path d="M467 163h288v189H467z" fill="#cfbd8c" stroke="#997e53" strokeWidth="9"/>
      <path d="M485 286q40-89 111-54t85-41M510 188l12 36M598 322l7-50M695 281l22 32" fill="none" stroke="#7d977b" strokeWidth="5"/>
      <g fill="#d1a45f">{[[513, 278], [577, 231], [643, 249], [701, 194]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="7"/>)}</g>
      <path d="M231 458h765l139 137H153z" fill="url(#av-wood)" stroke="#c3a16b" strokeWidth="8"/>
      <path d="M153 595h982v44H153zM201 639v61M1082 639v61" fill="#634f39"/>
      <path d="M300 468 265 589M470 468l-8 121M645 468l22 121M821 468l52 121M991 468l71 121" stroke="#8e714e" strokeWidth="3"/>
      <Lantern x={350} y={400} scale={1.3} green/>
      <path d="m670 394 35 47-17 76-39-47z" fill="#82c6c4" stroke="#d0e7d2" strokeWidth="4"/>
      <path d="m670 394 3 77 15 46M649 470l24 1 32-30" fill="none" stroke="#e0f2d9" strokeWidth="3"/>
      <ellipse cx="678" cy="520" rx="61" ry="12" fill="#193c3d" opacity=".4"/>
      <path d="m837 463 90 9 61 74-100-10-80-31z" fill="#cbbb90" stroke="#e6d1a1" strokeWidth="5"/>
      <path d="m881 481 13 45M917 489l31 35M841 485l29 8M853 495l26 7" stroke="#8d8062" strokeWidth="3"/>
      <g transform="translate(123 449)"><rect x="-44" y="40" width="88" height="66" rx="20" fill="#bc9a60"/><rect x="-40" y="-8" width="80" height="57" rx="18" fill="#dec48b"/><rect x="-32" y="4" width="64" height="29" rx="9" fill="#234546"/><ellipse cx="-15" cy="18" rx="6" ry="8" fill="#a3e5d6"/><ellipse cx="15" cy="18" rx="6" ry="8" fill="#a3e5d6"/><path d="M0-8v-21M-45 63l-25 9M45 61l25-14" stroke="#b69b69" strokeWidth="7" strokeLinecap="round"/><circle cy="-30" r="6" fill="#e5bc65"/><circle cy="75" r="13" fill="#3b5650"/><circle cx="-25" cy="115" r="13" fill="#314647"/><circle cx="25" cy="115" r="13" fill="#314647"/></g>
      <g fill="#d9bc7b" opacity=".45">{Array.from({ length: 18 }, (_, i) => <circle key={i} cx={490 + i * 37 % 350} cy={56 + i * 71 % 290} r={i % 3 + 1}/>)}</g>
    </> : p === 'quay' ? <>
      <path d="M0 408h602l59 292H0z" fill="#bba47a"/>
      <path d="m0 476 604-25M0 541l620-34M0 617l639-47M126 410l-52 290M292 410l19 290M471 410l91 290" stroke="#9a8a66" strokeWidth="4"/>
      <path d="M0 390h598v24H0z" fill="#dccca1"/>
      <Ferry held={held} complete={state.complete}/>
      <path d="m483 546 214-65 22 28-208 91z" fill="#987447" stroke="#d0b47f" strokeWidth="5"/>
      <g transform="translate(174 280)"><path d="M-61 136V-18h129v154M-72-19H81" fill="none" stroke="#736852" strokeWidth="15"/><path d="M-17 5h42l11 57h-65z" fill="#d9bb71"/><path d="M-7 7q7-31 21 0M-37 65h80" stroke="#7b6c46" strokeWidth="6" fill="none"/><circle cx="2" cy="117" r="12" fill="#9bd194" stroke="#e6d9a2" strokeWidth="4"/>{running && <g className="av-sound-waves" stroke="#ecc66d" strokeWidth="6" fill="none"><path d="M-58 13q-25 22 0 46M68 13q25 22 0 46"/><path d="M-85 4q-35 33 0 67M95 4q35 33 0 67"/></g>}</g>
      <g transform="translate(375 430)"><rect x="-52" y="-12" width="114" height="53" rx="5" fill="#596967"/><circle cx="-25" cy="-15" r="32" fill="#778c7b" stroke="#485c58" strokeWidth="7"/><circle cx="-25" cy="-15" r="12" fill="#c2b681"/><path d="M-25-46v62M-55-15H5" stroke="#485c58" strokeWidth="5"/><path d="M49 0 84-65" stroke="#76847a" strokeWidth="8"/></g>
      <g className={running ? 'av-working' : ''}><PersonFigure x={472} y={405} earmuffs/><PersonFigure x={398} y={326} color="#627871" earmuffs/></g>
      <PersonFigure x={706} y={477} color="#36717a" raised={held}/>
      <g transform="translate(70 600)"><rect width="85" height="77" fill="#94724b" stroke="#c3a473" strokeWidth="5"/><path d="M0 0l85 77M85 0 0 77" stroke="#c3a473" strokeWidth="5"/></g>
      <path d="M860 666V582M1151 650v-88M846 592l320-14" stroke="#9c8b62" strokeWidth="9"/>
    </> : <>
      <Ferry held={held} complete={state.complete}/>
      <path d="M0 555 671 514 1200 660v40H0z" fill="#9a8967"/>
      <path d="M92 368h550l140 235H0z" fill="url(#av-wood)" stroke="#c3a576" strokeWidth="8"/>
      <path d="M0 603h784v40H0z" fill="#61513e"/>
      <g transform="translate(194 283)"><rect x="-72" y="-90" width="144" height="189" rx="10" fill="#426d68" stroke="#c1ad79" strokeWidth="7"/><circle cy="-38" r="26" fill={running || state.trial ? '#bde0a0' : '#678d79'} stroke="#dbc394" strokeWidth="5"/><path d="M-43 10h86M-43 28h86M-43 46h86" stroke="#213f3e" strokeWidth="8"/><path d="m-26 90-5 61M26 90l5 61" stroke="#dcc293" strokeWidth="8"/></g>
      {state.device === 'beacon' ? <Lantern x={448} y={358} scale={1.65} lit={running || !!state.trial}/>
        : state.device === 'bell' ? <g transform="translate(437 356)"><path d="M-62 67V-87H68V67M-79-87H84" fill="none" stroke="#6f6246" strokeWidth="15"/><path d="M-19-62h44l18 89h-79z" fill="#ceb06a"/><path d="M-48 31h102" stroke="#e2cb89" strokeWidth="10"/>{running && <path d="M-79-49q-27 36 0 60M85-49q27 36 0 60" stroke="#f6d786" strokeWidth="5" fill="none" className="av-sound-waves"/>}</g>
          : <PersonFigure x={453} y={344} color="#c19350" raised={!!state.trial?.noticed || running}/>}
      <PersonFigure x={841} y={452} color="#bd7851" earmuffs raised={held}/>
      <PersonFigure x={934} y={428} color="#597568" earmuffs raised={held}/>
      <PersonFigure x={1096} y={473} color="#2e6e77" raised={held}/>
      <g transform="translate(526 493)"><path d="M0 0h102l28 58H-13z" fill="#e1ce9a"/><path d="M13 15h67M17 29h58M23 42h40" stroke="#9f8b60" strokeWidth="3"/></g>
      {running && <g className="av-message-sparks" fill="#ffe5a6"><circle cx="285" cy="245" r="8"/><circle cx="338" cy="274" r="6"/><circle cx="394" cy="307" r="5"/></g>}
      {held && <g transform="translate(872 316)"><circle r="31" fill="#e4e8bd"/><path d="m-16 0 11 11 23-25" fill="none" stroke="#376b57" strokeWidth="6" strokeLinecap="round"/></g>}
    </>}
    <rect width="1200" height="700" fill="none" stroke="#eddeb3" strokeWidth="3" opacity=".25"/>
  </svg>;
}
