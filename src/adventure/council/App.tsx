import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, Portrait } from '../Art.tsx';
import { consumeCrossing } from '../crossing.ts';
import { recallInTab, rememberInTab } from '../tab-memory.ts';
import { replay as replayOpening } from '../model.ts';
import { CouncilArt, GuestPortrait } from './Art.tsx';
import { canEnterHearing, canFinishCouncil, councilObjective, councilSaveKey, dispatchCouncil, freshCouncilSave, hearingReady, MAX_COUNCIL_BYTES, parseCouncilSave, promiseReady, replayCouncil, seats, slotTokens, slots } from './model.ts';
import { loadCouncil, parseCrossingImport, writeCouncil } from './persistence.ts';
import type { StoragePort } from './persistence.ts';
import { discoveries, guests, scenes, slotLabels, tokens } from './story.ts';
import type { CouncilAction, CouncilSave, CouncilScene, CouncilState, Discovery, Guest, Seat } from './types.ts';
import '../adventure.css';
import './council.css';

type Speech = { who: Guest | 'orren' | 'pip'; title: string; text: string };
const openingSpeech: Speech = { who: 'mara', title: 'My home is not on their list', text: '“Sera came here before she disappeared. Look at that register. My ferry has a berth, but apparently my neighbours have no address.”' };
const unavailable: StoragePort = { getItem() { throw new Error('Storage denied'); }, setItem() { throw new Error('Storage denied'); } };
function browserStorage(): StoragePort { try { return window.localStorage; } catch { return unavailable; } }
function download(text: string, name: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CouncilApp() {
  const storage = useRef(browserStorage());
  const [initial] = useState(() => loadCouncil(storage.current, location.pathname, consumeCrossing(), recallInTab<CouncilSave | null>(councilSaveKey(location.pathname))));
  const [save, setSave] = useState<CouncilSave | null>(initial.save);
  const [notice, setNotice] = useState(initial.notice);
  const raw = useRef(initial.raw);
  const blocked = useRef(initial.blocked);
  const [speech, setSpeech] = useState<Speech>(() => initial.save ? { who: 'mara', title: 'Our next crossing', text: councilObjective(replayCouncil(initial.save)) } : openingSpeech);
  const [selected, setSelected] = useState<Guest | null>(null);
  const [modal, setModal] = useState<'journal' | 'settings' | null>(null);
  const [pending, setPending] = useState<CouncilSave | null>(null);
  const [resetting, setResetting] = useState(false);
  const stageRef = useRef<HTMLHeadingElement>(null);
  const speechRef = useRef<HTMLHeadingElement>(null);
  const state = save ? replayCouncil(save) : null;
  const arrival = save ? replayOpening(save.arrival) : null;

  useEffect(() => { rememberInTab(councilSaveKey(location.pathname), { save, raw: raw.current, blocked: blocked.current, notice }); }, [save, notice]);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === storage.current && (event.key === councilSaveKey(location.pathname) || event.key === null) && event.newValue !== raw.current) {
        blocked.current = true;
        setNotice('Another tab changed this crossing. Saving is paused. Export this tab or load the stored crossing.');
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);

  function update(next: CouncilSave, replace = false): void {
    setSave(next);
    if (replace) {
      try { raw.current = storage.current.getItem(councilSaveKey(location.pathname)); blocked.current = false; }
      catch { blocked.current = true; setNotice('This crossing is in memory. Export it before closing the tab.'); }
    }
    if (blocked.current) return;
    const result = writeCouncil(storage.current, location.pathname, next, raw.current);
    if (result.ok) { raw.current = result.raw; setNotice(''); }
    else { blocked.current = true; setNotice(result.notice); }
  }
  function say(value: Speech, focus = true): void {
    setSpeech(value);
    if (focus) requestAnimationFrame(() => speechRef.current?.focus());
  }
  function act(action: CouncilAction): CouncilState | null {
    if (!save) return null;
    try { const next = dispatchCouncil(save, action); update(next); return replayCouncil(next); }
    catch (error) { say({ who: 'pip', title: 'Keep that question open', text: error instanceof Error ? error.message : 'That action is not available here.' }); return null; }
  }
  function inspect(discovery: Discovery, select = false): void {
    if (!act({ type: 'inspect', discovery })) return;
    const item = discoveries[discovery];
    say({ who: item.speaker, title: item.title, text: item.text }, !select);
    if (select) {
      setSelected(discovery as Guest);
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-seat="left"]')?.focus({ preventScroll: true }));
    }
  }
  function travel(scene: CouncilScene): void {
    if (!act({ type: 'travel', scene })) return;
    setSelected(null);
    say(scene === 'landing' ? openingSpeech : scene === 'hearing'
      ? { who: 'orren', title: 'Ask before offering a chair', text: '“I can change the brief. Bring the day work, the night conditions and the maker together. Ask each person what they know.”' }
      : { who: 'tavi', title: 'Watch the demonstration first', text: '“The central lantern is quick. Look at its test card before we decide what this little demonstration can tell us about the islands.”' }, false);
    requestAnimationFrame(() => stageRef.current?.focus());
  }
  function placeGuest(seat: Seat): void {
    if (!selected) { say({ who: 'pip', title: 'Choose a person first', text: 'Ask one of the people below the scene for their account, then choose a chair. A seated person can move; an occupied chair sends its previous guest back to the waiting area.' }); return; }
    if (act({ type: 'seat', seat, guest: selected })) { setSelected(null); say({ who: selected, title: 'A place at the table', text: discoveries[selected].text }, false); }
  }
  function hear(): void {
    setSelected(null);
    const result = act({ type: 'hear' });
    if (!result?.hearing) return;
    say(result.hearing.gaps.length ? { who: 'orren', title: 'One account is still missing', text: result.hearing.gaps[0] }
      : { who: 'orren', title: result.hearing.route === 'written' ? 'Check the keeper’s meaning' : 'Two watches, different conditions', text: result.hearing.route === 'written'
        ? '“Neri has read the signed account. Send our night-post sketch back to the keeper. Let them check our understanding before Tavi uses it.”'
        : '“The relief has taken the post; its keeper is here. We have heard both watches. The repair must address the people beyond the central demonstration.”' });
  }
  function readback(): void {
    setSelected(null);
    if (act({ type: 'readback' })) say({ who: 'night', title: 'The keeper confirms the account', text: '“Yes: the shutters hide the quay lantern. Your sketch records that condition. We still need to test the proposed warning here.” This confirms the account, not the future design.' });
  }
  function review(): void {
    const result = act({ type: 'review' });
    if (!result?.review) return;
    say({ who: 'tavi', title: result.review.gaps.length ? 'The parchment leaves something out' : 'A target we can plan to test', text: result.review.gaps.length ? result.review.gaps[0] : '“That matches the hearing. Now keep the field evidence empty until those trials happen. My 22-second demonstration cannot fill it for us.”' });
  }
  function importFile(file?: File): void {
    if (!file) return;
    if (file.size > MAX_COUNCIL_BYTES) { setNotice('This file exceeds the 400 KB limit.'); return; }
    file.text().then(text => { const imported = parseCrossingImport(text); setPending(imported); setNotice(''); }).catch(error => setNotice(error instanceof Error ? error.message : 'The save could not be read.'));
  }
  function replacePending(): void {
    if (!pending) return;
    update(pending, true); setPending(null); setModal(null); setSelected(null);
    say({ who: 'mara', title: 'The crossing is restored', text: councilObjective(replayCouncil(pending)) }, false);
    requestAnimationFrame(() => stageRef.current?.focus());
  }

  return <div className={`adventure council ${save?.settings.lessMotion ? 'av-less-motion' : ''} ${save?.settings.largeText ? 'av-large-text' : ''}`}>
    <a className="av-skip" href="#adventure/council" onClick={event => { event.preventDefault(); stageRef.current?.focus(); }}>Skip to the scene</a>
    <header className="av-header">
      <a className="av-brand" href="#adventure"><Icon name="star"/><span>ASTERFALL<small>THE LAST RELAY</small></span></a>
      <span className="av-preview">Illustrated RPG · Chapter two</span>
      <nav aria-label="Journey tools"><button aria-label="Crossing journal" disabled={!save} onClick={() => setModal('journal')}><Icon name="book"/><span>Journal</span></button><button aria-label="Save & settings" onClick={() => setModal('settings')}><Icon name="settings"/><span>Save & settings</span></button><a href="#adventure">Chapter one</a><a href="#classic">Classic ↗</a></nav>
    </header>
    {notice && <div className="av-notice" role="alert"><span>{notice}</span><button onClick={() => setModal('settings')}>Save & recovery</button></div>}
    <main className="av-main">
      {!save || !state ? <section className="cq-arrival-gate"><Portrait person="mara"/><p className="av-kicker">THE NEXT CROSSING</p><h1 tabIndex={-1} ref={stageRef}>Mara’s ferry is waiting</h1><p>Finish the opening’s watch handover to follow Sera to the Brass Quarter. A completed opening save also brings you here.</p><a className="av-button av-primary" href="#adventure">Return to the opening <Icon name="arrow"/></a><button className="av-button" onClick={() => setModal('settings')}>Import a saved journey</button></section> : <>
        <div className="av-title-row"><div><p className="av-kicker">CHAPTER TWO · THE MISSING ADDRESS</p><h1 tabIndex={-1} ref={stageRef}>{scenes[state.scene].title}</h1><p className="av-intro">{scenes[state.scene].subtitle}</p></div><div className="av-party" aria-label="Your party"><Portrait person="iona"/><Portrait person="pip"/><GuestPortrait guest="mara"/><span><strong>Iona, Pip & Mara</strong>{state.complete ? 2 : 1} / 2 chapters recorded</span></div></div>
        <section className="av-objective" aria-label="Current objective"><Icon name={state.complete ? 'check' : 'star'}/><div><span>{state.complete ? 'CHAPTER RECORDED' : 'YOUR NEXT MOVE'}</span><p>{councilObjective(state)}</p></div></section>
        <div className="av-play-layout cq-layout"><div className="av-play-column">
          <section className="av-scene" aria-label={`${scenes[state.scene].title} interactive scene`}>
            <div className="av-scene-canvas"><CouncilArt state={state}/><span className="av-location-plaque">{state.scene === 'landing' ? '01 · An address left out' : state.scene === 'hearing' ? '02 · The people behind the record' : '03 · A promise to carry forward'}</span>
              {state.scene === 'hearing' && <span className="cq-orren-label">Orren · convening the hearing</span>}
            </div>
            {state.scene === 'landing' && <div className="av-hotspots cq-landing-hotspots">{([{ discovery: 'roll', label: 'Inspect register', x: 72.3, y: 41, icon: 'book' }, { discovery: 'orren', label: 'Talk to Orren', x: 84, y: 76, icon: 'talk' }] as const).map(h => <button className={`av-hotspot ${state.discoveries.includes(h.discovery) ? 'seen' : ''}`} key={h.discovery} data-discovery={h.discovery} style={{ '--x': `${h.x}%`, '--y': `${h.y}%` } as CSSProperties} onClick={() => inspect(h.discovery)}><span className="av-hotspot-icon"><Icon name={h.icon}/>{state.discoveries.includes(h.discovery) && <i aria-hidden="true">✓</i>}</span><span>{h.label}</span></button>)}</div>}
            {state.scene === 'hearing' && <div className="cq-seats" aria-label="Three guest chairs">{seats.map((seat, index) => {
              const invited = state.seats[seat];
              const awaitingRelief = invited === 'night' && !state.relief;
              return <button key={seat} className={`cq-seat ${invited && !awaitingRelief ? 'occupied' : ''}`} data-seat={seat} aria-label={`${seat} chair${invited ? `: ${guests[invited].name}${awaitingRelief ? ', reserved, awaiting relief' : ', seated'}` : ': empty'}${selected ? `; seat ${guests[selected].name}` : ''}`} style={{ '--seat-x': `${(400 + index * 200) / 12}%` } as CSSProperties} onClick={() => placeGuest(seat)} disabled={state.complete}><Icon name={awaitingRelief ? 'clock' : invited ? 'check' : 'crew'}/><span>{invited ? guests[invited].name : `Chair ${index + 1}`}{awaitingRelief && <small>Awaiting relief</small>}</span></button>;
            })}</div>}
            {state.scene === 'atelier' && !state.complete && <div className="av-hotspots"><button className={`av-hotspot ${state.discoveries.includes('demo') ? 'seen' : ''}`} data-discovery="demo" style={{ '--x': '49%', '--y': '55%' } as CSSProperties} onClick={() => inspect('demo')}><span className="av-hotspot-icon"><Icon name="clock"/></span><span>Inspect demonstration</span></button></div>}
            <div className="av-scene-footer"><span>{state.scene === 'hearing' ? 'Choose a person below, then a chair. Any chair order works.' : state.scene === 'atelier' ? 'One central demonstration · calm workshop · 22 seconds' : 'The same quay can appear differently in a register and a resident’s account.'}</span>{state.scene !== 'landing' && !state.complete && <button onClick={() => travel(state.scene === 'atelier' ? 'hearing' : 'landing')}>← {state.scene === 'atelier' ? 'Hearing' : 'Landing'}</button>}</div>
          </section>

          {state.scene === 'hearing' && <section className="cq-guests" aria-label="People and accounts for the hearing"><h2>Ask, then offer a chair</h2><p className="cq-selection" role="status">{selected ? `${guests[selected].name} selected. Choose a chair above.` : 'Each person knows a different part of the story. The night keeper remains at the post until relieved.'}</p><div className="cq-guest-grid">{(Object.keys(guests) as Guest[]).map(guest => <button key={guest} data-guest={guest} aria-pressed={selected === guest} onClick={() => inspect(guest, true)}><GuestPortrait guest={guest}/><strong>{guests[guest].name}</strong><span>{guests[guest].short}</span><small>{guest === 'night' && !state.relief ? Object.values(state.seats).includes(guest) ? 'Invited · awaiting relief' : 'On duty · ask or invite' : Object.values(state.seats).includes(guest) ? 'Seated · ask or move' : state.discoveries.includes(guest) ? 'Ask again · choose chair' : 'Ask for their account'}</small></button>)}</div><div className="cq-remove-row">{seats.map(seat => state.seats[seat] && <button className="av-text-button" key={seat} data-unseat={seat} onClick={() => act({ type: 'unseat', seat })}>Clear {guests[state.seats[seat]!].name}’s chair</button>)}</div></section>}
          {hearingReady(state) && <NeedCards/>}
          {state.scene === 'atelier' && state.discoveries.includes('demo') && !state.complete && <PromiseWorkbench state={state} onAction={act} onReview={review}/>}
          {state.hearing && state.hearing.gaps.length > 0 && state.scene === 'hearing' && <section className="cq-open-questions" aria-label="Accounts still needed"><h2>Still unheard</h2>{state.hearing.gaps.map(gap => <p key={gap}>{gap}</p>)}</section>}
          {state.complete && <section className="cq-finished-record" aria-label="The signed crossing record"><Icon name="book"/><div><h2>The address is back in the plan</h2><p>{state.hearing?.route === 'written' ? 'Neri carried the keeper’s signed account; the keeper confirmed the returned sketch.' : 'The night keeper joined the hearing in person.'}</p><HearingCosts state={state}/><p>The target is agreed for planning. The all-quay storm tests have not happened. Other unrepresented people and disputed addresses still need follow-up.</p><span className="cq-stamp">FIELD EVIDENCE · PLANNED</span></div></section>}
        </div>

        <aside className="av-story-column">
          {state.scene === 'hearing' && <section className="cq-hearing-controls"><p className="av-kicker">KEEP THE WATCH COVERED</p><h2>Three chairs beside Orren</h2><p>A relief keeper is available. Waiting for the handover delays the ferry. A signed account avoids that absence, but needs a return message.</p><div className="cq-duty-actions"><button className="av-button" data-relief disabled={!state.discoveries.includes('night') || state.relief} onClick={() => { if (act({ type: 'relief' })) say({ who: 'night', title: 'Relief has taken the post', text: '“We waited for the relief handover. I can attend without leaving the post empty. Your return ferry departs later.”' }, false); }}><Icon name="crew"/>{state.relief ? 'Relief on duty' : 'Wait for relief handover'}</button><button className="av-button" data-collect-note disabled={!state.discoveries.includes('night') || !state.discoveries.includes('neri') || state.note} onClick={() => { if (act({ type: 'collect-note' })) say({ who: 'neri', title: 'The keeper’s own words', text: '“Signed by the night keeper: shutters hide the quay lantern. I will read this account, then carry our sketch back so the keeper can correct it.”' }, false); }}><Icon name="book"/>{state.note ? 'Signed note collected' : 'Collect signed night account'}</button></div><button className="av-button av-primary" data-hear onClick={hear}>Hear the table <Icon name="talk"/></button>{state.hearing?.route === 'written' && state.hearing.gaps.length === 0 && !state.readback && <button className="av-button cq-readback" data-readback onClick={readback}>Return the sketch to the keeper <Icon name="arrow"/></button>}</section>}
          <section className="av-conversation" aria-label="Companion dialogue"><div className="av-speaker">{speech.who === 'pip' ? <Portrait person="pip"/> : <GuestPortrait guest={speech.who}/>}<div><strong>{speech.who === 'pip' ? 'Pip' : speech.who === 'orren' ? 'Orren' : guests[speech.who].name}</strong><span>{speech.who === 'pip' ? 'Your clockwork companion' : speech.who === 'orren' ? 'Council convenor' : guests[speech.who].role}</span></div></div><h2 ref={speechRef} tabIndex={-1}>{speech.title}</h2><p>{speech.text}</p></section>
          <section className="av-story-action" aria-label="Continue the story">
            {state.complete ? <><Icon name="flag"/><p className="av-kicker">SERA LEFT A REQUEST</p><h2>The dispatch archive</h2><p>Neri opens Sera’s request: “Bring the old recipient list to Stormglass. The green tally counts only the names we kept.”</p><p>Orren gives you a reading seal. Tavi stays to plan the field trials. Mara sets the next crossing in her log.</p><button className="av-button av-primary" onClick={() => setModal('journal')}>Read your two-chapter journal</button><p className="av-ended">Both illustrated chapters are recorded. Classic contains the longer campaign.</p><a className="av-text-button" href="#classic">Explore Classic ↗</a></>
              : state.scene === 'landing' ? <><p className="av-kicker">A QUESTION FOR THE COUNCIL</p><h2>Who is absent?</h2><p>Inspect Sera’s marked register and ask Orren what the hearing needs.</p><button className="av-button av-primary" disabled={!canEnterHearing(state)} onClick={() => travel('hearing')}>Enter the hearing <Icon name="arrow"/></button><small className="cq-carry-forward">Your opening: {arrival?.device === 'beacon' ? 'lantern and clear-sightline watch' : 'local lookout with relief duty'} recorded at Lower Quay.</small></>
              : state.scene === 'hearing' ? <><p className="av-kicker">DAY AND NIGHT</p><h2>Take the accounts to the maker</h2><p>{hearingReady(state) ? 'Mara’s day use and the confirmed night conditions will travel with the target.' : 'Hear the table. Keep missing voices and any unconfirmed written account visible.'}</p><button className="av-button av-primary" disabled={!hearingReady(state)} onClick={() => travel('atelier')}>Visit Tavi’s atelier <Icon name="arrow"/></button></>
                : <><p className="av-kicker">TARGET ≠ TEST RESULT</p><h2>Carry the unanswered tests forward</h2><p>A completed parchment can define a target. It cannot manufacture the field observations still needed.</p><button className="av-button av-primary" data-sign-target disabled={!canFinishCouncil(state)} onClick={() => { if (act({ type: 'finish' })) say({ who: 'tavi', title: 'A promise, with work still to do', text: '“I’ll plan the field trials against this target. Keep the old demonstration in its own record. Sera’s request is waiting with Neri.”' }); }}>Sign the target & collect Sera’s request <Icon name="arrow"/></button></>}
          </section>
          {!state.complete && <button className="av-hint-button" onClick={() => say({ who: 'pip', title: 'A question to try', text: state.scene === 'landing' ? 'Compare the register with Mara’s account of her home. What does Orren need to hear before a repair is planned?' : state.scene === 'hearing' ? 'Who knows the day work? Who knows the night conditions? Who must build the repair? An account can travel without its author, but its meaning still needs checking.' : 'Match each part of the parchment to the hearing’s need cards. Keep the demonstrated time and the agreed target in separate records.' })}><Portrait person="pip"/><span>Ask Pip for a nudge</span></button>}
        </aside></div>
      </>}
    </main>

    {modal && <CouncilDialog title={modal === 'journal' ? 'Your crossing journal' : 'Save & settings'} onClose={() => { setModal(null); setPending(null); setResetting(false); }}>
      {notice && <p className="cq-dialog-notice" role="alert">{notice}</p>}
      {modal === 'journal' && save && state ? <CouncilJournal save={save} state={state}/> : <>
        <p>{blocked.current ? 'Saving is paused. Export this tab before closing it.' : 'This crossing has its own save and includes a copy of your recorded opening. Your opening and Classic saves stay separate.'}</p>
        {save && <><label className="av-setting"><input type="checkbox" checked={save.settings.lessMotion} onChange={e => update({ ...save, settings: { ...save.settings, lessMotion: e.target.checked } })}/> Reduce motion</label><label className="av-setting"><input type="checkbox" checked={save.settings.largeText} onChange={e => update({ ...save, settings: { ...save.settings, largeText: e.target.checked } })}/> Larger text</label></>}
        <div className="av-save-actions">{save && <button className="av-button" onClick={() => download(JSON.stringify(save, null, 2), 'asterfall-brass-quarter.json')}>Export crossing</button>}<label className="av-import-label">Import journey<input aria-label="Import journey" type="file" accept="application/json,.json" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }}/></label><button className="av-button" onClick={() => { try { const stored = storage.current.getItem(councilSaveKey(location.pathname)); if (stored === null) throw new Error('No stored crossing was found.'); setPending(parseCouncilSave(stored)); } catch (error) { setNotice(error instanceof Error ? error.message : 'The save could not be read.'); } }}>Load stored crossing</button>{raw.current !== null && <button className="av-button" onClick={() => download(raw.current!, 'asterfall-brass-quarter-original.json')}>Export original stored copy</button>}</div>
        <p className="cq-import-help">Accepts a Brass Quarter save or a completed chapter-one export. Importing an opening starts this crossing; it does not change the opening’s own save.</p>
        {pending && <section className="av-confirm" aria-label="Replace crossing confirmation"><h3>Replace this crossing?</h3><p>Export first to keep both histories. The new copy contains its own opening record.</p><button className="av-button av-primary" onClick={replacePending}>Replace crossing</button><button className="av-button" onClick={() => setPending(null)}>Cancel replacement</button></section>}
        {save && (resetting ? <section className="av-confirm" aria-label="Restart crossing confirmation"><h3>Start the Brass Quarter again?</h3><p>Its hearing and target will be reset. Your recorded opening and Classic remain untouched.</p><button className="av-button" onClick={() => { const next = freshCouncilSave(save.arrival); next.settings = { ...save.settings }; update(next, true); setResetting(false); setModal(null); setSelected(null); say(openingSpeech, false); }}>Confirm new crossing</button><button className="av-button" onClick={() => setResetting(false)}>Keep playing</button></section> : <button className="av-text-button" onClick={() => setResetting(true)}>Start this crossing again</button>)}
      </>}
    </CouncilDialog>}
  </div>;
}

function NeedCards() {
  return <section className="cq-needs" aria-label="Needs heard at the table"><h2>What the hearing asks the repair to serve</h2><div>{[{ icon: 'crew', title: 'Every inhabited quay', text: 'The register must not erase lived addresses.' }, { icon: 'eye', title: 'A warning people can perceive', text: 'Day work and shuttered night posts.' }, { icon: 'clock', title: 'Within 90 seconds', text: 'Authenticated order → local warning.' }, { icon: 'flag', title: '40-knot west squall', text: 'With one inter-island link unavailable.' }].map(card => <article key={card.title}><Icon name={card.icon}/><strong>{card.title}</strong><span>{card.text}</span></article>)}</div><p>This is a target for the case, not proof of achieved coverage. Other people and disputed addresses still need follow-up.</p></section>;
}

function PromiseWorkbench({ state, onAction, onReview }: { state: CouncilState; onAction: (action: CouncilAction) => CouncilState | null; onReview: () => void }) {
  return <section className="cq-parchment" aria-label="Build the warning promise">
    <p className="av-kicker">TAVI’S PARCHMENT</p><h2>Build the warning promise</h2>
    <p>Choose one tile in each part. Use the hearing’s need cards above.</p>
    <div className="cq-promise-slots">{slots.map(slot => <fieldset key={slot}>
      <legend>{slotLabels[slot].label}</legend><p>{slotLabels[slot].question}</p>
      <div>{slotTokens[slot].map(token => <button key={token} data-promise-token={token} aria-pressed={state.promise[slot] === token} onClick={() => onAction({ type: 'place', slot, token })}>
        <Icon name={tokens[token].icon}/><strong>{tokens[token].label}</strong><span>{tokens[token].detail}</span>
      </button>)}</div>
    </fieldset>)}</div>
    <button className="av-button av-primary" data-review-promise onClick={onReview}>Review the parchment with Tavi <Icon name="eye"/></button>
    {state.review && <div className="cq-review" role="status"><h3>{state.review.gaps.length ? 'Questions the target must answer' : 'Target ready for field-test planning'}</h3>{state.review.gaps.length ? state.review.gaps.map(gap => <p key={gap}>{gap}</p>) : <p>It matches the hearing. The central demonstration remains evidence for its own calm setup only.</p>}</div>}
    {promiseReady(state) && <div className="cq-evidence-stamps">
      <h3>What belongs on the field-evidence page?</h3><div>
        <button className="av-button" data-evidence-status="proven" onClick={() => onAction({ type: 'label', status: 'proven' })}><Icon name="check"/>Field promise proven</button>
        <button className="av-button" data-evidence-status="planned" aria-pressed={state.evidenceStatus === 'planned'} onClick={() => onAction({ type: 'label', status: 'planned' })}><Icon name="clock"/>Field tests planned</button>
      </div>{state.evidenceStatus && <p className="cq-stamp" role="status">FIELD EVIDENCE · PLANNED, NOT YET OBSERVED</p>}
    </div>}
  </section>;
}

function CouncilJournal({ save, state }: { save: CouncilSave; state: CouncilState }) {
  const opening = replayOpening(save.arrival);
  return <>
    <h3>Chapter one · The Missing Keeper</h3><p>Mara accepted the {opening.device === 'beacon' ? 'lantern arrangement and its clear sightline' : 'local lookout arrangement and its relief duty'}. The tower and quay records remain separate. This is the original completed crossing history.</p>
    <h3>Chapter two · The Missing Address</h3>{state.discoveries.map(id => <article key={id} className="av-journal-entry"><Icon name={id === 'demo' ? 'clock' : 'book'}/><div><h3>{discoveries[id].title}</h3><small>{discoveries[id].source}</small><p>{discoveries[id].text}</p></div></article>)}
    <HearingCosts state={state}/>
    {state.hearing && <section className="cq-journal-summary"><h3>Hearing record</h3><p>{state.hearing.gaps.length ? state.hearing.gaps.join(' ') : state.hearing.route === 'written' ? `Neri carried the signed night account. ${state.readback ? 'The keeper confirmed the sketch.' : 'The keeper has not yet confirmed the sketch.'}` : 'The night keeper attended in person.'}</p></section>}
    {state.review && <section className="cq-journal-summary"><h3>Promise record</h3><p>{state.review.gaps.length ? 'The target still has gaps.' : 'The reviewed target matches the case needs.'} Field tests remain unperformed.</p>{slots.map(slot => <p key={slot}><strong>{slotLabels[slot].label}</strong> {state.promise[slot] ? tokens[state.promise[slot]!].label : 'Not selected'}</p>)}</section>}
    <details><summary>The systems ideas beneath this crossing</summary><p>Stakeholder accounts need sources and a way to challenge the interpretation. A maker’s demonstration and a target for real use have different scopes. An agreed requirement guides later evidence; it does not create that evidence.</p><p>These are two authored introductory chapters. They do not establish full lifecycle proficiency or verify the all-quay storm requirement.</p></details>
  </>;
}

function HearingCosts({ state }: { state: CouncilState }) {
  return <div className="cq-hearing-costs">{state.relief && <p>The relief handover delayed the ferry; that cost remains in the record even if the seating later changed.</p>}{state.note && <p>The signed night-watch account was collected and remains with its source in the record.</p>}</div>;
}

function CouncilDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="av-modal" ref={ref} aria-labelledby="cq-modal-title" onCancel={event => { event.preventDefault(); onClose(); }}><header><h2 id="cq-modal-title">{title}</h2><button autoFocus onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></header>{children}</dialog>;
}
