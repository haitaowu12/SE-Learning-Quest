import type { CouncilState, Guest, PromiseSlot, PromiseToken, Seat } from './types.ts';

const GUESTS: Guest[] = ['mara', 'tavi', 'night', 'neri'];
const SEATS: Seat[] = ['left', 'middle', 'right'];
const PROMISE_SLOTS: PromiseSlot[] = ['who', 'what', 'when', 'conditions'];

const guestColor: Record<Guest | 'orren', string> = {
  mara: '#426d72',
  tavi: '#a7653f',
  night: '#3c4652',
  neri: '#6f7282',
  orren: '#755645',
};

const promiseColor: Record<PromiseToken, string> = {
  inhabited: '#6b9278',
  registered: '#a17d50',
  perceivable: '#6597a0',
  lamp: '#d4a955',
  ninety: '#7d7197',
  twentyTwo: '#a76a58',
  'west40-link-out': '#536d84',
  calm: '#829c87',
};

function Lantern({ x, y, lit = true, scale = 1 }: { x: number; y: number; lit?: boolean; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    {lit && <circle r="68" fill="#f4c867" opacity=".14"/>}
    <path d="M-19-28q0-38 38 0" fill="none" stroke="#806749" strokeWidth="5"/>
    <path d="m-25-28-7 64h64l-7-64z" fill="#b98a4d" stroke="#5e5144" strokeWidth="4"/>
    <path d="m-16-19-6 43h44l-6-43z" fill={lit ? '#f4d27b' : '#66736d'}/>
    <path d="M-24-28h48M-31 36h62M-17-20v44M17-20v44" fill="none" stroke="#655744" strokeWidth="5"/>
    <path d="m0 22-8-8L0-9l8 23z" fill={lit ? '#fff0b5' : '#83938b'}/>
  </g>;
}

function GuestMarks({ guest }: { guest: Guest | 'orren' }) {
  if (guest === 'mara') {
    return <>
      <path d="M28 34q15-19 50-12l11 15H27z" fill="#274e5b"/>
      <path d="M24 36h71q-14 10-43 6z" fill="#193742"/>
      <circle cx="61" cy="29" r="3.5" fill="#d8b66f"/>
    </>;
  }
  if (guest === 'tavi') {
    return <>
      <path d="M31 36q7-24 29-23 24 0 30 26L76 30 61 25 47 31z" fill="#3c302a"/>
      <path d="M30 87 45 77l15 14 15-14 16 10-7 31H36z" fill="#8a5938"/>
      <path d="m83 86 8-12M87 92l10-5" stroke="#d6b273" strokeWidth="4" strokeLinecap="round"/>
    </>;
  }
  if (guest === 'night') {
    return <>
      <path d="M18 45Q22 10 60 9t43 39L88 38Q72 18 56 21 35 23 30 47z" fill="#252c34"/>
      <path d="M21 44q-8 36 11 48l11-20-11-28zM100 45q6 33-11 48L77 72l12-28z" fill="#2f3740"/>
      <path d="M25 91q35-18 70 0l18 29H8z" fill="#333c48"/>
    </>;
  }
  if (guest === 'neri') {
    return <>
      <path d="M29 42Q32 14 61 14q28 0 32 31L79 32 58 25 40 35z" fill="#a8a7a1"/>
      <path d="M24 88q37-17 73 0l12 32H12z" fill="#575e75"/>
      <path d="M84 84q8-9 15-2l-8 12" fill="none" stroke="#d9cfb0" strokeWidth="3"/>
      <path d="m91 81 8-9" stroke="#272c38" strokeWidth="4" strokeLinecap="round"/>
    </>;
  }
  return <>
    <path d="M31 39Q34 12 62 13q27 0 31 30L79 30 60 24 42 33z" fill="#47362f"/>
    <path d="M23 89q38-19 75 0l12 31H10z" fill="#6d4d3e"/>
    <path d="M39 52h14M68 52h14M53 52h15" stroke="#5e4f43" strokeWidth="2.8" fill="none"/>
    <circle cx="46" cy="52" r="8" fill="none" stroke="#5e4f43" strokeWidth="2.8"/>
    <circle cx="75" cy="52" r="8" fill="none" stroke="#5e4f43" strokeWidth="2.8"/>
  </>;
}

export function GuestPortrait({ guest }: { guest: Guest | 'orren' }) {
  const skin = guest === 'mara' ? '#b77c54' : guest === 'night' ? '#c89572' : '#ddb08a';
  return <svg className={`av-portrait av-portrait-${guest}`} viewBox="0 0 120 120" aria-hidden="true">
    <circle cx="60" cy="60" r="59" fill={guest === 'night' ? '#252f3a' : guest === 'neri' ? '#55596b' : guest === 'tavi' ? '#704d3c' : guest === 'mara' ? '#315d64' : '#5f4b42'}/>
    <path d="M5 120q2-35 33-45h45q31 10 33 45" fill={guestColor[guest]}/>
    <path d="M48 73h24v18H48z" fill={skin}/>
    <path d="M33 44q1-27 27-27 27 0 28 29-1 38-28 43-26-5-27-45z" fill={skin}/>
    <GuestMarks guest={guest}/>
    <path d="M43 53h8M68 53h8" stroke="#42362f" strokeWidth="3" strokeLinecap="round"/>
    <path d="m59 55-4 12h7M51 75q10 5 19-1" fill="none" stroke="#8c5b45" strokeWidth="2" strokeLinecap="round"/>
    {guest === 'tavi' && <path d="M44 89 58 102 76 88l8 32H36z" fill="#c59452"/>}
    {guest === 'mara' && <path d="m37 87 22 17 22-18 11 34H27z" fill="#d2a455"/>}
    {guest === 'neri' && <path d="M43 89h34l-6 31H49z" fill="#d8d1bc" opacity=".9"/>}
  </svg>;
}

function GuestFigure({ guest, x, y, scale = 1, seated = false }: { guest: Guest | 'orren'; x: number; y: number; scale?: number; seated?: boolean }) {
  const skin = guest === 'mara' ? '#b77c54' : guest === 'night' ? '#c89572' : '#ddb08a';
  const coat = guestColor[guest];
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy={seated ? 78 : 96} rx="31" ry="8" fill="#25383c" opacity=".22"/>
    {!seated && <path d="m-16 51-8 43h15L0 59l9 35h15l-8-43z" fill="#34454d"/>}
    {seated && <path d="M-24 48q24-13 48 0l4 35h-56z" fill="#35464f"/>}
    <path d="M-24 11q23-15 48 0l8 45h-64z" fill={coat}/>
    <path d={seated ? 'M-20 23-29 52M20 23 29 52' : 'M-20 23-34 49M20 23 34 49'} fill="none" stroke={coat} strokeWidth="11" strokeLinecap="round"/>
    <rect x="-5" y="-1" width="11" height="14" fill={skin}/>
    <ellipse cy="-15" rx="15" ry="20" fill={skin}/>
    {guest === 'mara' && <><path d="M-17-21q12-17 34-6l7 11h-43z" fill="#274e5b"/><path d="M-20-16h46q-11 7-29 5z" fill="#193742"/><circle cx="2" cy="-23" r="2.8" fill="#d8b66f"/></>}
    {guest === 'tavi' && <><path d="M-17-17q4-24 18-22 17 0 19 23L8-24-4-29-13-22z" fill="#3b302a"/><path d="M-19 35h38l-4 25h-30z" fill="#c18a50"/><path d="m22 32 12-16M26 39l14-4" stroke="#d6b273" strokeWidth="4" strokeLinecap="round"/></>}
    {guest === 'night' && <><path d="M-21-16Q-18-43 0-44q20 0 23 29L15-23Q6-36-4-33q-11 1-16 18z" fill="#252c34"/><path d="M-31 6Q0-15 31 6L22 23-22 23z" fill="#2d343d"/></>}
    {guest === 'neri' && <><path d="M-16-18Q-13-39 1-39q17 0 19 23L8-26-3-30-13-23z" fill="#a8a7a1"/><path d="m28 19 10-15" stroke="#2e3440" strokeWidth="4" strokeLinecap="round"/><path d="M-13 43h26" stroke="#d5cfb9" strokeWidth="5"/></>}
    {guest === 'orren' && <><path d="M-16-18Q-14-39 2-39q17 0 19 23L8-26-4-30-13-23z" fill="#48372f"/><circle cx="-7" cy="-14" r="6" fill="none" stroke="#5b4c40" strokeWidth="2"/><circle cx="9" cy="-14" r="6" fill="none" stroke="#5b4c40" strokeWidth="2"/><path d="M-1-14h4" stroke="#5b4c40" strokeWidth="2"/></>}
  </g>;
}

function SmallFerry({ relief }: { relief: boolean }) {
  return <g transform="translate(137 493)">
    <ellipse cx="108" cy="99" rx="141" ry="19" fill="#2d6670" opacity=".32"/>
    <path d="m-15 36 252-8-28 61q-39 32-178 8z" fill="#315c63" stroke="#23484f" strokeWidth="4"/>
    <path d="M34 29v-73h104l27 70z" fill="#e1d2aa"/>
    <path d="M25-45h120l15-12H27z" fill="#9e654f"/>
    <path d="M50-28h29v31H50zM93-28h29v31H93z" fill="#4b6d6c"/>
    <path d="M83-57v-40" stroke="#5e6459" strokeWidth="5"/>
    <path d="m85-96 55 10-55 11" fill={relief ? '#c37b4f' : '#dec28b'}/>
    {relief && <path d="m143-86 28 7-28 7z" fill="#6e8f72"/>}
    {[29, 91, 158].map(x => <circle key={x} cx={x} cy="67" r="8" fill="#274850" stroke="#96865e" strokeWidth="4"/>)}
  </g>;
}

function RegistrationBoard({ note, readback, hearing }: Pick<CouncilState, 'note' | 'readback' | 'hearing'>) {
  return <g transform="translate(682 219)">
    <path d="M-18-20h267v222H-18z" fill="#684f3d" stroke="#cfb579" strokeWidth="8"/>
    <path d="M0 0h231v182H0z" fill="#d8c79b"/>
    <path d="M22 29h73M22 52h112M22 75h86M22 121h70M22 144h107" stroke="#8c775a" strokeWidth="5" strokeLinecap="round"/>
    <g transform="translate(158 32) rotate(3)">
      <path d="M0 0h52v70H0z" fill="#eee0b9" stroke="#ab8a5e" strokeWidth="3"/>
      <path d="M11 17h30M11 29h25M11 42h31M11 54h18" stroke="#9b8060" strokeWidth="3"/>
      <circle cx="44" cy="63" r="8" fill="#a25643" opacity=".8"/>
    </g>
    {note && <g transform="translate(134 108) rotate(-5)"><path d="M0 0h71v51H0z" fill="#f0e2bd" stroke="#b19062" strokeWidth="3"/><path d="m0 0 36 26L71 0" fill="none" stroke="#b19062" strokeWidth="3"/></g>}
    {readback && <g transform="translate(201 150)" fill="none" stroke="#6c7c80" strokeWidth="3"><circle r="12"/><circle cx="8" r="12"/></g>}
    {hearing && <path d="M4 167q51-19 102 0t102 0" fill="none" stroke="#8a6e53" strokeWidth="4" strokeDasharray="7 8"/>}
  </g>;
}

function Landing({ state }: { state: CouncilState }) {
  return <>
    <defs>
      <linearGradient id="council-landing-sky" x2="0" y2="1"><stop stopColor="#9ebfc2"/><stop offset="1" stopColor="#ead9ac"/></linearGradient>
      <linearGradient id="council-landing-water" x2="0" y2="1"><stop stopColor="#78a09b"/><stop offset="1" stopColor="#315d66"/></linearGradient>
      <linearGradient id="council-brass" x2="1" y2="1"><stop stopColor="#d4b169"/><stop offset="1" stopColor="#916d38"/></linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#council-landing-sky)"/>
    <circle cx="1030" cy="96" r="47" fill="#f4dc96" opacity=".7"/>
    <path d="M0 226 118 151 196 205 300 119 394 211 515 146 615 224 742 156 865 222 1006 141 1120 205 1200 168v128H0z" fill="#698d8a"/>
    <path d="m299 119-42 65 42-19 27 17 9-12zM742 156l-42 56 41-16 25 15zM1006 141l-44 63 44-20 25 15z" fill="#d6dfc9"/>
    <rect y="282" width="1200" height="418" fill="url(#council-landing-water)"/>
    <g fill="none" stroke="#c4ddc4" strokeWidth="3" opacity=".35">{Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${(i * 137) % 1070} ${323 + i * 22}q43 10 86 0t95 0`}/>)}</g>
    <path d="M0 512 515 474 668 535 1200 511v189H0z" fill="#a89269"/>
    <path d="M0 547 1200 520M0 613l1200-27M108 513 84 700M330 495l8 205M541 487l45 213M842 524l-13 176M1077 518l-42 182" stroke="#8a7659" strokeWidth="4"/>
    <path d="M535 175h665v360H535z" fill="#6d6756"/>
    <path d="M558 195h620v320H558z" fill="#d1c294" stroke="#8f7b58" strokeWidth="9"/>
    <path d="M589 214h558v52H589z" fill="url(#council-brass)"/>
    <path d="M610 515V296h85v219M1042 515V296h84v219M945 515V316h65v199" fill="#8d8166"/>
    <path d="M615 500V310h75v190M1047 500V310h74v190" fill="#47696a"/>
    <path d="M571 278h588M725 278v237M1019 278v237" stroke="#aa9368" strokeWidth="10"/>
    <g transform="translate(864 384)"><path d="M-82 131V-37Q0-137 82-37v168" fill="#4c6662" stroke="#997a4e" strokeWidth="9"/><path d="M0-100v224M-78 2H78" stroke="#c2a869" strokeWidth="7"/><circle cy="-53" r="22" fill="#a97743" stroke="#d6bd7a" strokeWidth="6"/><path d="M-10-54 0-67l10 13-10 15z" fill="#e6d18e"/></g>
    <g transform="translate(596 340)"><rect x="-23" y="-73" width="46" height="72" fill="#4d625e"/><path d="M-35-78h70l-11-19h-48z" fill="#9b7444"/><circle cy="-37" r="11" fill="#dfc377"/></g>
    <RegistrationBoard note={state.note} readback={state.readback} hearing={state.hearing}/>
    <SmallFerry relief={state.relief}/>
    <g transform="translate(426 461)"><path d="M-56 64V-3h112v67" fill="none" stroke="#6e604a" strokeWidth="9"/><path d="M-66-3H66" stroke="#be9e61" strokeWidth="11"/><path d="M-24 3h48l10 44h-68z" fill="#be9a55"/><circle cy="44" r="7" fill="#e0c979"/></g>
    <GuestFigure guest="mara" x={336} y={538} scale={.86}/>
    <GuestFigure guest="orren" x={1005} y={510} scale={.92}/>
    <g transform="translate(1132 424)"><path d="M0 98V0" stroke="#69573f" strokeWidth="7"/><path d="M4 4q-45 8-67-4v52q29 11 67 0z" fill={state.relief ? '#6f8f72' : '#9d7652'} stroke="#c3aa72" strokeWidth="3"/></g>
    <g fill="#9d8051" opacity=".7">{[[565, 170], [624, 154], [702, 180], [1120, 167]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7"/>)}</g>
  </>;
}

function Chair({ x, occupied }: { x: number; occupied: boolean }) {
  return <g transform={`translate(${x} 454)`}>
    <path d="M-42 20V-49q0-13 13-13h58q13 0 13 13v69" fill={occupied ? '#896a4b' : '#78634f'} stroke="#b89a69" strokeWidth="6"/>
    <path d="M-49 19h98v27h-98zM-35 46l-7 70M35 46l7 70" fill="#624f3f" stroke="#aa8a5e" strokeWidth="5"/>
    <path d="M-29-43h58" stroke="#d0b16f" strokeWidth="5" opacity={occupied ? .9 : .45}/>
  </g>;
}

function HearingRoom({ state }: { state: CouncilState }) {
  const physicallyPresent = (guest: Guest) => guest !== 'night' || state.relief;
  const seated = new Set(Object.values(state.seats).filter((guest): guest is Guest => guest !== undefined && physicallyPresent(guest)));
  const waiting = GUESTS.filter(guest => physicallyPresent(guest) && !seated.has(guest));
  const seatX: Record<Seat, number> = { left: 400, middle: 600, right: 800 };
  return <>
    <defs>
      <linearGradient id="council-room-wall" x2="0" y2="1"><stop stopColor="#43565a"/><stop offset="1" stopColor="#283d41"/></linearGradient>
      <linearGradient id="council-room-floor" x2="0" y2="1"><stop stopColor="#8b7355"/><stop offset="1" stopColor="#594d40"/></linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#council-room-wall)"/>
    <path d="M0 0h1200v74H0z" fill="#665542"/>
    <path d="M0 547h1200v153H0z" fill="url(#council-room-floor)"/>
    {[0, 208, 426, 655, 888, 1200].map((x, i) => <path key={x} d={`M${x} 548 ${x + (i - 2) * 57} 700`} stroke="#887359" strokeWidth="3"/>)}
    <path d="M0 615h1200M0 671h1200" stroke="#756149" strokeWidth="3"/>
    <g transform="translate(600 104)"><path d="M-286 100V-2q0-33 33-33h506q33 0 33 33v102" fill="#52676a" stroke="#aa8b58" strokeWidth="8"/><path d="M-264 79V6h528v73" fill="#283f42"/><path d="M-200 25h400M-133-25v104M133-25v104" stroke="#8f754e" strokeWidth="6"/><circle cy="22" r="26" fill="#a87a40" stroke="#d0b06c" strokeWidth="6"/><path d="m0 4 8 16 18 3-13 13 3 18-16-8-16 8 3-18-13-13 18-3z" fill="#e3c985"/></g>
    <g transform="translate(600 230)"><path d="M-150 85h300l48 94h-396z" fill="#8a6a49" stroke="#c2a36d" strokeWidth="8"/><path d="M-198 179h396v38h-396z" fill="#634d3b"/><path d="M-161 217l-18 93M161 217l18 93" stroke="#654f3d" strokeWidth="10"/></g>
    <g transform="translate(600 168)"><path d="M-50 42V-42q0-13 13-13h74q13 0 13 13v84" fill="#745944" stroke="#c0a06b" strokeWidth="7"/><path d="M-58 41h116v29H-58z" fill="#644a39"/></g>
    <GuestFigure guest="orren" x={600} y={185} scale={.86} seated/>
    <g transform="translate(600 335)"><path d="M-78 0h156l17 42H-91z" fill="#d7c495" stroke="#b18c5d" strokeWidth="4"/><path d="M-57 13h58M-53 26h83M17 13h39" stroke="#8c7357" strokeWidth="3"/>{state.hearing && <circle cx="66" cy="29" r="9" fill="#a55d49" opacity=".8"/>}</g>
    {SEATS.map(seat => {
      const guest = state.seats[seat];
      return <Chair key={seat} x={seatX[seat]} occupied={guest !== undefined && physicallyPresent(guest)}/>;
    })}
    {SEATS.map(seat => {
      const guest = state.seats[seat];
      return guest && physicallyPresent(guest) ? <GuestFigure key={`guest-${seat}`} guest={guest} x={seatX[seat]} y={421} scale={.84} seated/> : null;
    })}
    <g transform="translate(104 341)"><path d="M-18 205V12h183v193" fill="#33494d" stroke="#80694e" strokeWidth="7"/><path d="M0 32h145M0 95h145M0 158h145" stroke="#7a6850" strokeWidth="5"/>
      {waiting.map((guest, index) => <GuestFigure key={guest} guest={guest} x={32 + (index % 2) * 78} y={80 + Math.floor(index / 2) * 104} scale={.6}/>)}</g>
    <g transform="translate(979 375)"><path d="M0 128V0" stroke="#7c6648" strokeWidth="8"/><path d="M4 5q65 17 129-1v59q-62 20-129 0z" fill={state.relief ? '#6f8f72' : '#7d6751'} stroke="#c3a66b" strokeWidth="4"/>{state.relief && <path d="m34 31 13 13 27-29" fill="none" stroke="#e6deb8" strokeWidth="5" strokeLinecap="round"/>}</g>
    {state.note && <g transform="translate(915 485) rotate(5)"><path d="M0 0h92v64H0z" fill="#efe0b9" stroke="#b08d5e" strokeWidth="4"/><path d="m0 0 46 34L92 0" fill="none" stroke="#b08d5e" strokeWidth="3"/><circle cx="77" cy="49" r="9" fill="#a65a46"/></g>}
    {state.readback && <g transform="translate(877 244)" fill="none" stroke="#cab477" strokeWidth="5"><circle r="19"/><circle cx="13" r="19"/><path d="M-32 0h-24M44 0h24"/></g>}
    {state.hearing?.route === 'written' && <g transform="translate(727 339) rotate(4)"><path d="M0 0h61v42H0z" fill="#e8d7ad" stroke="#a98a60" strokeWidth="3"/><path d="M10 13h38M10 24h30" stroke="#8d7658" strokeWidth="3"/><circle cx="48" cy="34" r="6" fill="#955343"/></g>}
    <Lantern x={258} y={236} scale={.72}/>
    <Lantern x={942} y={236} scale={.72}/>
  </>;
}

function PromiseGlyph({ token }: { token: PromiseToken }) {
  const color = promiseColor[token];
  if (token === 'inhabited' || token === 'registered') return <><path d="M-17 12V-5L0-19 17-5v17z" fill={color}/><path d="M-6 12V2H6v10" fill="#eadbb3"/></>;
  if (token === 'perceivable' || token === 'lamp') return <><path d="M-20 0q20-21 40 0-20 21-40 0z" fill="none" stroke={color} strokeWidth="5"/><circle r="7" fill={color}/></>;
  if (token === 'ninety' || token === 'twentyTwo') return <><circle r="19" fill="none" stroke={color} strokeWidth="5"/><path d="M0-11V1l9 6" stroke={color} strokeWidth="5" strokeLinecap="round"/></>;
  return <><path d="M-22 9q9-29 22-12 11-23 23 0 16 0 15 15H-23q-13-3 1-3z" fill={color}/><path d="m-8 17-7 12M7 16 1 29M21 16l-4 12" stroke="#d4e0d2" strokeWidth="4" strokeLinecap="round"/></>;
}

function Atelier({ state }: { state: CouncilState }) {
  return <>
    <defs>
      <linearGradient id="council-atelier-wall" x2="1" y2="1"><stop stopColor="#4c524b"/><stop offset="1" stopColor="#293f42"/></linearGradient>
      <linearGradient id="council-atelier-wood" x2="0" y2="1"><stop stopColor="#b0875b"/><stop offset="1" stopColor="#6d553e"/></linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#council-atelier-wall)"/>
    <path d="M0 0h1200v58H0z" fill="#66523e"/>
    <path d="M0 536h1200v164H0z" fill="#4f473c"/>
    {[0, 186, 402, 628, 870, 1200].map((x, i) => <path key={x} d={`M${x} 536 ${x + (i - 2) * 43} 700`} stroke="#816a4c" strokeWidth="3"/>)}
    <g transform="translate(74 102)">
      <path d="M0 0h327v245H0z" fill="#294a51" stroke="#9a815d" strokeWidth="10"/>
      <path d="M163 0v245M0 121h327" stroke="#ad9468" strokeWidth="8"/>
      <path d="M0 172q72-61 124-20 68-80 126 0 49-39 77 2v91H0z" fill="#547674"/>
      <path d="M0 205q63-38 114-11 74-54 130 2 44-33 83-4v53H0z" fill="#739082"/>
      <rect y="214" width="327" height="31" fill="#426b70"/>
      <g fill="#d7c696">{[[54, 198], [119, 204], [215, 191], [281, 205]].map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 11} ${y}h22v16h-22zM${x - 15} ${y}l15-11 15 11`} />)}</g>
    </g>
    <g transform="translate(976 95)"><rect width="165" height="340" fill="#4b453b" stroke="#876f50" strokeWidth="8"/>{[88, 181, 274].map(y => <path key={y} d={`M0 ${y}h165`} stroke="#a5895f" strokeWidth="7"/>)}{[18, 48, 83, 116, 141].map((x, i) => <rect key={x} x={x} y={44 + (i % 3) * 91} width="18" height={36 + (i % 2) * 20} rx="2" fill={['#8c6d50', '#416e72', '#b28c50', '#7f5348', '#5b6873'][i]}/>)}</g>
    <path d="M176 455h826l123 139H83z" fill="url(#council-atelier-wood)" stroke="#c3a16d" strokeWidth="8"/>
    <path d="M83 594h1042v42H83zM136 636v64M1074 636v64" fill="#634d39"/>
    <path d="M264 459 220 592M450 457l-14 136M649 457l17 136M850 457l52 136M1002 458l81 135" stroke="#8b6d4d" strokeWidth="3"/>
    <Lantern x={225} y={414} scale={1.05}/>
    <g transform="translate(584 391)">
      <ellipse cy="112" rx="109" ry="17" fill="#244146" opacity=".35"/>
      <path d="M-83 79h166l34 41h-234z" fill="#7a684f" stroke="#b29566" strokeWidth="6"/>
      <path d="M-65 73V9h130v64" fill="#526f6d" stroke="#c1a46e" strokeWidth="7"/>
      <circle cy="9" r="42" fill="#355c5d" stroke="#d1b56f" strokeWidth="6"/>
      <circle cy="9" r="25" fill="#789a96" opacity=".9"/>
      <path d="M-14 10 0-6l14 16-14 17z" fill="#e2d19b"/>
      <path d="M-55-17h-38M55-17h38M-55 36h-38M55 36h38" stroke="#baa16c" strokeWidth="7" strokeLinecap="round"/>
    </g>
    <g transform="translate(810 468) rotate(2)">
      <path d="M0 0h222l28 104H-12z" fill="#e0ce9f" stroke="#b39769" strokeWidth="5"/>
      <path d="M18 18q45 5 92 0t103 0M19 70q53-6 104 0t105 0M24 87q38 4 74 0" fill="none" stroke="#b09972" strokeWidth="3"/>
      {PROMISE_SLOTS.map((slot, index) => {
        const token = state.promise[slot];
        return token ? <g key={slot} transform={`translate(${37 + index * 52} 43) scale(.62)`}><PromiseGlyph token={token}/></g> : null;
      })}
      {state.complete && <path d="M95 101q18-18 36 0" fill="none" stroke="#9a5a48" strokeWidth="7" strokeLinecap="round"/>}
    </g>
    <g transform="translate(351 487)">
      <path d="m0 45 92 7 42 55-100-8-58-25z" fill="#c6b386" stroke="#e1cb99" strokeWidth="4"/>
      <path d="m28 60 16 30M60 63l24 28M-2 65l21 6" stroke="#8f8062" strokeWidth="3"/>
      <path d="M103 48 130 9M112 55l37-9" stroke="#555c55" strokeWidth="6" strokeLinecap="round"/>
      <circle cx="131" cy="8" r="9" fill="#ae8150"/>
    </g>
    {state.review && <g transform="translate(735 452)"><circle r="31" fill="#d8c79d" fillOpacity=".9" stroke="#706450" strokeWidth="6"/><circle r="18" fill="#6e9191" fillOpacity=".28" stroke="#706450" strokeWidth="4"/><path d="m22 22 34 35" stroke="#706450" strokeWidth="8" strokeLinecap="round"/>{Array.from({ length: Math.min(state.review.gaps.length, 4) }, (_, index) => <path key={index} d={`M${-47 + index * 15} -34v-15h11v15`} fill="#b69a62"/>)}</g>}
    {state.evidenceStatus === 'planned' && <g transform="translate(106 411)"><path d="M0 0h91v83H0z" fill="#3f5e5d" stroke="#b49a69" strokeWidth="6" strokeDasharray="8 6"/><circle cx="45" cy="39" r="20" fill="none" stroke="#d9c786" strokeWidth="4"/><path d="m45 19 6 20-6 20-6-20zM25 39h40" fill="none" stroke="#d9c786" strokeWidth="3"/><path d="M18 80v19M73 80v19" stroke="#826c4f" strokeWidth="6"/></g>}
    {state.note && <g transform="translate(907 410) rotate(-7)"><path d="M0 0h65v47H0z" fill="#efe0b9" stroke="#ac8c5f" strokeWidth="3"/><path d="m0 0 32 24L65 0" fill="none" stroke="#ac8c5f" strokeWidth="2"/></g>}
    <GuestFigure guest="tavi" x={1110} y={466} scale={.78}/>
    <g fill="#dbc17c" opacity=".43">{Array.from({ length: 15 }, (_, i) => <circle key={i} cx={442 + (i * 53) % 432} cy={76 + (i * 67) % 271} r={i % 3 + 1}/>)}</g>
  </>;
}

export function CouncilArt({ state }: { state: CouncilState }) {
  return <svg className="av-scene-art av-council-art" viewBox="0 0 1200 700" aria-hidden="true">
    {state.scene === 'landing' ? <Landing state={state}/>
      : state.scene === 'hearing' ? <HearingRoom state={state}/>
        : <Atelier state={state}/>}
    <rect width="1200" height="700" fill="none" stroke="#eddeb3" strokeWidth="3" opacity=".24"/>
  </svg>;
}
