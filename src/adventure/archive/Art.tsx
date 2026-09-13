import { quayIds, quays } from './story.ts';
import type { ArchiveState, Quay } from './types.ts';

export function QuayPicture({ quay, included = true }: { quay: Quay; included?: boolean }) {
  const index = quayIds.indexOf(quay);
  return <svg viewBox="0 0 180 110" aria-hidden="true" className="ar-quay-picture">
    <path d="M0 87q30-9 60 0t60 0 60 0v23H0" fill="#8db3ac"/>
    <path d="m19 85 12-18h123l12 18z" fill="#698d7a"/>
    <path d="M36 67V34h44v33M91 67V24h46v43" fill={included ? '#e0c590' : '#b6bbae'}/>
    <path d="M29 35 58 12 87 35" fill="none" stroke="#76594b" strokeWidth="8"/>
    <path d="m84 25 31-21 29 21z" fill={['#ac7154', '#698576', '#ae894e', '#697785'][index]}/>
    <path d="M45 43h9v12h-9zM63 43h9v12h-9zM101 35h10v13h-10zM120 35h10v13h-10z" fill={included ? '#f9edbd' : '#6d8480'}/>
    <path d="M54 67V56h11v11M112 67V52h10v15" stroke="#526e65" strokeWidth="8"/>
    {quay === 'lower' && <><path d="m2 87 47-4-8 15H12z" fill="#355b61"/><path d="M19 83V65h16v18" fill="#c9b187"/></>}
    {quay === 'north' && <><path d="M140 67V12h13v55" fill="#87917d"/><path d="m134 13 13-12 12 12" fill="#395d67"/></>}
    <path d="M15 104h28m31-3h38m19 5h31" stroke="#d7e6d1" strokeWidth="3"/>
  </svg>;
}

function Paper({ x, y, angle = 0, read = false, ribbon = false }: { x: number; y: number; angle?: number; read?: boolean; ribbon?: boolean }) {
  return <g transform={`translate(${x} ${y}) rotate(${angle})`}>
    <rect width="154" height="194" rx="4" x="6" y="8" fill="#213d3d" opacity=".17"/>
    <path d="M0 0h154v194H0z" fill={read ? '#f4e3b4' : '#decca3'} stroke="#ac9364" strokeWidth="3"/>
    <path d="M19 27h89M19 47h115M19 65h99M19 83h113M19 115h90M19 133h104" stroke="#8b967b" strokeWidth="5"/>
    <circle cx="122" cy="162" r="15" fill={read ? '#426f62' : '#ab8350'}/>
    {read && <path d="m114 161 6 6 11-13" stroke="#f2e7c3" strokeWidth="3" fill="none"/>}
    {ribbon && <path d="M42 0v150l13-14 13 14V0" fill="#a05048"/>}
  </g>;
}

export function ArchiveArt({ state, populationView }: { state: ArchiveState; populationView: boolean }) {
  return <svg className="av-scene-art ar-scene-art" viewBox="0 0 1200 700" aria-hidden="true">
    <defs>
      <linearGradient id="ar-wall" x2="0" y2="1"><stop stopColor="#38585b"/><stop offset="1" stopColor="#1c393d"/></linearGradient>
      <linearGradient id="ar-sky" x2="0" y2="1"><stop stopColor="#a9c7bd"/><stop offset="1" stopColor="#ebddb3"/></linearGradient>
      <linearGradient id="ar-desk" x2="0" y2="1"><stop stopColor="#b98d5d"/><stop offset="1" stopColor="#755844"/></linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#ar-wall)"/>
    <path d="M800 370V160q140-220 280 0v210z" fill="url(#ar-sky)"/>
    <path d="m800 265 66-78 55 43 64-117 70 114 25-31v174H800z" fill="#7a9c91"/>
    <path d="m953 179 32-66 41 67-40-21z" fill="#d6dfc9"/>
    <path d="M788 380V160q150-240 304 0v220M943 39v334M799 226h285" stroke="#b4a276" strokeWidth="16" fill="none"/>
    <path d="M0 0h1200v39H0zM0 435h1200v21H0z" fill="#77644b"/>
    <path d="M0 556h1200v144H0z" fill="#655345"/>
    {[0, 180, 410, 690, 970, 1200].map((x, i) => <path key={x} d={`M${x} 556 ${x + (i - 2) * 70} 700`} stroke="#937659" strokeWidth="3"/>)}
    {state.scene === 'stacks' ? <>
      {[65, 329].map((x, shelf) => <g key={x} transform={`translate(${x} 70)`}>
        <rect width="214" height="408" rx="3" fill="#324749" stroke="#907c58" strokeWidth="12"/>
        {[88, 183, 285, 390].map((y, row) => <g key={y}>
          <path d={`M0 ${y}h214`} stroke="#c4a773" strokeWidth="10"/>
          {[16, 48, 84, 121, 158, 184].map((bx, col) => <g key={bx}>
            <rect x={bx} y={y - 61 - col % 2 * 14} width={col === 5 ? 15 : 27} height={56 + col % 2 * 14} rx="2" fill={['#977a52', '#4e817d', '#b19a68', '#a46c55'][(col + row + shelf) % 4]}/>
            <path d={`M${bx + 4} ${y - 28}h${col === 5 ? 7 : 19}`} stroke="#ddc9a0" strokeWidth="3"/>
          </g>)}
        </g>)}
      </g>)}
      <path d="M665 105v393M734 105v393M659 158h81M659 227h81M659 296h81M659 365h81M659 434h81" stroke="#bb9b66" strokeWidth="9"/>
      <ellipse cx="973" cy="550" rx="85" ry="14" fill="#233c3d" opacity=".4"/>
      <path d="m946 469-10 74h22l15-69 12 69h23l-14-75z" fill="#384d59"/>
      <path d="M927 391q47-27 90 0l15 86h-118z" fill="#638278"/>
      <path d="m930 416-40 25m119-25 38 20" stroke="#638278" strokeWidth="20" strokeLinecap="round"/>
      <ellipse cx="972" cy="363" rx="24" ry="32" fill="#c79670"/>
      <path d="M946 361q-3-46 32-40 30 3 23 37l-30-21z" fill="#a8a999"/>
      <path d="M948 358h19v11h-19zM976 358h19v11h-19zM967 362h9" stroke="#345056" strokeWidth="3" fill="none"/>
      <path d="M129 550h660l62 100H64z" fill="url(#ar-desk)" stroke="#c1a078" strokeWidth="6"/>
      <Paper x={211} y={408} angle={-8} read={state.discoveries.includes('roll')}/>
      <Paper x={482} y={410} angle={8} read={state.discoveries.includes('change')} ribbon/>
      <circle cx="711" cy="590" r="34" fill="#ab7850"/><path d="m697 589 12 11 18-25" stroke="#f0dcad" strokeWidth="5" fill="none"/>
    </> : state.scene === 'table' ? <>
      <path d="M73 406h1043l80 231H0z" fill="url(#ar-desk)" stroke="#c09e6b" strokeWidth="7"/>
      <path d="M92 87h626v340H92z" fill="#dbcfaa" stroke="#a99165" strokeWidth="12"/>
      {quayIds.map((quay, index) => {
        const included = populationView || quays[quay].issued !== 'omitted';
        return <g key={quay} transform={`translate(${110 + index % 2 * 302} ${107 + Math.floor(index / 2) * 156})`}>
          <rect width="275" height="139" rx="8" fill={state.focus === quay ? '#f8edcb' : '#c8c5a1'} stroke={state.focus === quay ? '#94532e' : '#a7aa87'} strokeWidth={state.focus === quay ? 5 : 2}/>
          <svg x="35" width="192" height="117" viewBox="0 0 180 110"><QuayPicture quay={quay} included={included}/></svg>
          <circle cx="247" cy="28" r="16" fill={included ? '#3d7867' : '#9a6348'}/>
          <path d={included ? 'm238 28 7 7 12-14' : 'M240 28h14'} stroke="#fff1d1" strokeWidth="4" fill="none"/>
        </g>;
      })}
      <Paper x={827} y={338} angle={11} read={state.discoveries.includes('tally')}/>
      {claimSlotsForArt.map((slot, index) => <g key={slot} transform={`translate(${147 + index * 232} 476)`}>
        <path d="M0 21h181v123H0z" fill={state.pins[slot] ? '#e8d5a4' : '#987958'} stroke="#d6b882" strokeWidth="4"/>
        <path d="m0 21 90 59 91-59" fill="#f1dfb9" stroke="#baa06d" strokeWidth="3"/>
        {state.pins[slot] && <circle cx="90" cy="93" r="19" fill="#426c60"/>}
      </g>)}
      <circle cx="1006" cy="533" r="58" fill="#d4e1c0" opacity=".4" stroke="#d1b877" strokeWidth="12"/>
      <path d="m1049 579 45 55" stroke="#465b50" strokeWidth="23" strokeLinecap="round"/>
    </> : <>
      <path d="M51 416h1072l77 241H0z" fill="url(#ar-desk)" stroke="#c09e6b" strokeWidth="7"/>
      <path d="M127 163h623v344H127z" fill="#e4d4a9" stroke="#ab9162" strokeWidth="7"/>
      {quayIds.map((quay, index) => <g key={quay} transform={`translate(160 ${201 + index * 71})`}>
        <path d="M0 37h545" stroke="#aaaf8a" strokeWidth="3"/>
        <rect width="31" height="28" rx="3" fill={state.proposal[quay] === quays[quay].current ? '#4c7b67' : '#aa8054'}/>
        <path d="M58 15h141M250 15h107M417 15h66" stroke="#788c72" strokeWidth="6"/>
        {state.proposal[quay] === quays[quay].current && <path d="m5 13 8 8 14-16" stroke="#fff0cb" strokeWidth="3" fill="none"/>}
      </g>)}
      <Paper x={822} y={350} angle={9} read ribbon/>
      <g transform="translate(208 508)">
        <path d="M0 0h496v146H0z" fill="#dcca9f" stroke="#b29565" strokeWidth="4"/>
        <path d={state.complete ? 'm0 0 248 103L496 0' : 'M0 0 248-94 496 0'} fill={state.complete ? '#e7d6ac' : '#f1e1b8'} stroke="#b29565" strokeWidth="4"/>
        {(state.status || state.complete) && <><circle cx="248" cy="100" r="29" fill="#ad5944"/><path d="m235 99 11 10 17-25" stroke="#f6d5aa" strokeWidth="5" fill="none"/></>}
      </g>
      <path d="M1033 493v60M997 557h74v24h-74z" stroke="#3e5555" strokeWidth="17"/>
    </>}
  </svg>;
}
const claimSlotsForArt = ['population', 'recipients', 'receipts'] as const;