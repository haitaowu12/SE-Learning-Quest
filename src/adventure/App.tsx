import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { canFinish, canLeaveWorkshop, canRepair, dispatch, freshSave, objective, parseChapterSave, replay, saveKey } from './model.ts';
import type { Action, Chapter, ChapterSave, Claim, Clue, Device, Meaning, Place } from './model.ts';
import { equipment, evidence, people, places } from './story.ts';
import type { Person } from './story.ts';
import { Icon, Portrait, SceneArt } from './Art.tsx';
import { prepareCrossing } from './crossing.ts';
import { recallInTab, rememberInTab } from './tab-memory.ts';
import './adventure.css';

type Speech = { person: Person; title: string; text: string };
const intro: Speech = { person: 'pip', title: 'Where did Sera go?', text: '“She left in a hurry. That lamp and her voice crystal might tell us why.” Click an object to investigate.' };
const hotspots: Record<Place, { clue: Clue; name: string; x: number; y: number; icon: string }[]> = {
  workshop: [{ clue: 'lamp', name: 'Inspect lamp', x: 29, y: 56, icon: 'lamp' }, { clue: 'crystal', name: 'Play crystal', x: 57, y: 66, icon: 'crystal' }, { clue: 'ledger', name: 'Read ledger', x: 77, y: 78, icon: 'book' }],
  quay: [{ clue: 'receiver', name: 'Inspect receiver', x: 15, y: 53, icon: 'bell' }, { clue: 'crew', name: 'Observe crew', x: 40, y: 63, icon: 'eye' }, { clue: 'mara', name: 'Talk to Mara', x: 60, y: 76, icon: 'talk' }],
  bench: [],
};
function download(raw: string, name: string): void {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function load(): { save: ChapterSave; raw: string | null; notice: string; blocked: boolean } {
  let raw: string | null = null;
  const remembered = recallInTab<ChapterSave>(saveKey(location.pathname));
  try {
    raw = localStorage.getItem(saveKey(location.pathname));
    if (remembered) return remembered.raw === raw ? remembered : { ...remembered, blocked: true, notice: 'Another tab changed this chapter while you were away. Export this tab or load the stored chapter before saving again.' };
    return { save: raw !== null ? parseChapterSave(raw) : freshSave(), raw, notice: '', blocked: false };
  }
  catch (error) { return { save: remembered?.save ?? freshSave(), raw: remembered?.raw ?? raw, notice: raw === null ? 'Storage is unavailable. You can play here and export your journey before reloading or closing this tab.' : `Your saved chapter is preserved but could not be read. ${error instanceof Error ? error.message : ''} Open Save & settings to recover it.`, blocked: true }; }
}

export default function AdventureApp() {
  const [initial] = useState(load);
  const [save, setSave] = useState(initial.save);
  const [notice, setNotice] = useState(initial.notice);
  const raw = useRef(initial.raw);
  const blocked = useRef(initial.blocked);
  const key = useRef(saveKey(location.pathname));
  const [speech, setSpeech] = useState<Speech>(() => {
    const restored = replay(initial.save);
    return restored.place === 'workshop' ? intro : { person: 'mara', title: restored.complete ? 'Welcome back, keeper' : 'Your journey is waiting', text: objective(restored) };
  });
  const [modal, setModal] = useState<'journal' | 'settings' | null>(null);
  const [pending, setPending] = useState<ChapterSave | null>(null);
  const [resetting, setResetting] = useState(false);
  const [selected, setSelected] = useState<Clue | null>(null);
  const [running, setRunning] = useState(false);
  const speechRef = useRef<HTMLHeadingElement>(null);
  const stageRef = useRef<HTMLHeadingElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const state = replay(save);
  const chapter = places[state.place];
  const progress = state.complete ? 3 : canRepair(state) ? 2 : canLeaveWorkshop(state) ? 1 : 0;
  const isReduced = () => save.settings.lessMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => { rememberInTab(key.current, { save, raw: raw.current, blocked: blocked.current, notice }); }, [save, notice]);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && (event.key === key.current || event.key === null) && event.newValue !== raw.current) {
        blocked.current = true;
        setNotice('Another tab changed this chapter. Saving is paused. Export this tab or load the stored chapter in Save & settings.');
      }
    };
    window.addEventListener('storage', listener);
    return () => { window.removeEventListener('storage', listener); if (timer.current) clearTimeout(timer.current); };
  }, []);

  function update(next: ChapterSave, replace = false): void {
    setSave(next);
    try {
      if (replace) { raw.current = localStorage.getItem(key.current); blocked.current = false; }
      if (blocked.current) return;
      if (localStorage.getItem(key.current) !== raw.current) {
        blocked.current = true; setNotice('Another tab changed this chapter. Export this tab or load the stored chapter in Save & settings.'); return;
      }
      const text = JSON.stringify(next); localStorage.setItem(key.current, text); raw.current = text; setNotice('');
    } catch { blocked.current = true; setNotice('This journey is in memory. Export it before closing the tab; browser storage could not save it.'); }
  }
  function say(next: Speech, focus = true): void {
    setSpeech(next);
    if (focus) requestAnimationFrame(() => speechRef.current?.focus({ preventScroll: false }));
  }
  function act(action: Action): boolean {
    try { update(dispatch(save, action)); return true; }
    catch (error) { say({ person: 'pip', title: 'Take another look', text: error instanceof Error ? error.message : 'That action is not available here.' }); return false; }
  }
  function inspect(clue: Clue): void { if (act({ type: 'inspect', clue })) { const found = evidence[clue]; say({ person: found.person, title: found.title, text: found.text }); } }
  function travel(place: Place): void {
    if (!act({ type: 'travel', place })) return;
    setSelected(null);
    say(place === 'quay' ? { person: 'mara', title: 'You came from Sera’s?', text: '“Then come look at our warning station. My crew were still loading when the storm hit.”' } : place === 'bench' ? { person: 'mara', title: 'Help us hold the ferry', text: '“The crew must notice the warning, stop loading and hold departures. Pick a tool, agree its meaning, and let us try it.”' } : intro, false);
    requestAnimationFrame(() => stageRef.current?.focus());
  }
  function animate(): void {
    if (timer.current) clearTimeout(timer.current);
    if (isReduced()) { setRunning(false); return; }
    setRunning(true); timer.current = setTimeout(() => setRunning(false), 950);
  }
  function test(): void {
    if (!act({ type: state.place === 'quay' ? 'observe' : 'test' })) return;
    animate(); setSelected(null);
    if (state.place === 'quay') say({ person: 'mara', title: 'The lamp lit. The crew kept loading.', text: '“The receiver lit and the bell rang. The crew kept loading. What do you notice about their working conditions?”' });
    else if (state.device === 'bell') say({ person: 'mara', title: 'The lamp lit. The crew kept loading.', text: '“They did not notice the bell beside the running winch. Their hearing protection is still on. We need another way to reach them.”' });
    else if (state.meaning !== 'hold') say({ person: 'mara', title: 'They noticed. They did not hold the ferry.', text: '“We have to agree what the signal means. I need them to stop loading and hold departures, not wait for another instruction.”' });
    else say({ person: 'mara', title: 'They stopped loading. The ferry is held.', text: state.device === 'beacon' ? '“They saw the lantern and held the ferry. We need this clear sightline on each watch. Let’s record what we saw.”' : '“The spare lookout reached the crew and they held the ferry. Someone must cover that duty on every watch. Let’s record what we saw.”' });
  }
  function equip(device: Device): void {
    if (act({ type: 'equip', device })) { setSelected(null); say({ person: 'pip', title: equipment[device].name, text: `${equipment[device].detail} Rehearse this setup with Mara’s crew.` }, false); }
  }
  function brief(meaning: Meaning): void {
    if (!act({ type: 'brief', meaning })) return;
    setSelected(null);
    say({ person: 'mara', title: meaning === 'hold' ? 'We have agreed the action' : 'A different instruction', text: meaning === 'hold' ? '“When the warning comes: stop loading, hold departures, and confirm back to me. Now let’s rehearse.”' : '“Awaiting instructions does not tell them to stop loading. Watch whether this meets the action I need.”' }, false);
  }
  function pin(claim: Claim): void {
    if (!selected) { say({ person: 'pip', title: 'Choose a record first', text: 'Select the Tower log or Quay rehearsal card below the scene. Then place it beside the claim it supports.' }); return; }
    if (act({ type: 'pin', claim, clue: selected })) { setSelected(null); say({ person: 'pip', title: 'A record with a clear purpose', text: claim === 'sent' ? 'The tower log records transmission. It does not show how people responded.' : 'The quay rehearsal records what this crew did with this setup. Other quays and storm conditions remain untested.' }, false); }
  }
  function importFile(file?: File): void {
    if (!file) return;
    if (file.size > 250_000) { setNotice('This file exceeds the 250 KB limit.'); return; }
    file.text().then(text => setPending(parseChapterSave(text))).catch(error => setNotice(error instanceof Error ? error.message : 'The save could not be read.'));
  }

  return <div className={`adventure ${save.settings.lessMotion ? 'av-less-motion' : ''} ${save.settings.largeText ? 'av-large-text' : ''}`}>
    <a className="av-skip" href="#adventure" onClick={e => { e.preventDefault(); stageRef.current?.focus(); }}>Skip to the scene</a>
    <header className="av-header"><a className="av-brand" href="#adventure"><Icon name="star"/><span>ASTERFALL<small>THE LAST RELAY</small></span></a><span className="av-preview">Illustrated RPG · Chapter one</span><nav aria-label="Journey tools"><button aria-label="Journal" onClick={() => setModal('journal')}><Icon name="book"/><span>Journal</span></button><button aria-label="Save & settings" onClick={() => setModal('settings')}><Icon name="settings"/><span>Save & settings</span></button><a href="#classic">Classic <span aria-hidden="true">↗</span></a></nav></header>
    {notice && <div className="av-notice" role="alert"><span>{notice}</span><button onClick={() => setModal('settings')}>Save & recovery</button></div>}
    <main className="av-main">
      <div className="av-title-row"><div><p className="av-kicker">THE MISSING KEEPER</p><h1 ref={stageRef} tabIndex={-1}>{chapter.name}</h1><p className="av-intro">{chapter.intro}</p></div><div className="av-party" aria-label="Your party"><Portrait person="iona"/><Portrait person="pip"/>{state.clues.includes('mara') && <Portrait person="mara"/>}<span><strong>Iona & {state.clues.includes('mara') ? 'crew' : 'Pip'}</strong>{progress} / 3 story steps</span></div></div>
      <section className="av-objective" aria-label="Current objective"><Icon name={state.complete ? 'check' : 'star'}/><div><span>{state.complete ? 'CHAPTER COMPLETE' : 'YOUR NEXT MOVE'}</span><p>{objective(state)}</p></div><div className="av-step-dots" aria-label={`${progress} of 3 story steps complete`}>{[1, 2, 3].map(n => <span key={n} className={progress >= n ? 'done' : ''}>{progress >= n ? '✓' : n}</span>)}</div></section>
      <div className="av-play-layout"><div className="av-play-column">
        <section className="av-scene" aria-label={`${chapter.name} interactive scene`}>
          <div className="av-scene-canvas"><SceneArt state={state} running={running}/><span className="av-location-plaque">{chapter.chapter}</span>
            {state.place === 'bench' && <div className="av-installed"><Icon name={equipment[state.device].icon}/><span>{equipment[state.device].name}<small>{state.meaning ? state.meaning === 'hold' ? 'Signal: hold departures' : 'Signal: await instructions' : 'Signal meaning: not agreed'}</small></span></div>}
          </div>
          <div className="av-hotspots">{hotspots[state.place].map(h => <button key={h.clue} data-clue={h.clue} className={`av-hotspot ${state.clues.includes(h.clue) ? 'seen' : ''}`} style={{ '--x': `${h.x}%`, '--y': `${h.y}%` } as CSSProperties} onClick={() => inspect(h.clue)}><span className="av-hotspot-icon"><Icon name={h.icon}/>{state.clues.includes(h.clue) && <i aria-hidden="true">✓</i>}</span><span>{h.name}</span></button>)}</div>
          <div className="av-scene-footer"><span>{state.place === 'bench' ? 'A rehearsal with Mara’s crew · clear sight · winch running' : 'Click a marked object. Your discoveries go into the satchel.'}</span>{state.place !== 'workshop' && !state.complete && <button onClick={() => travel(state.place === 'bench' ? 'quay' : 'workshop')}>← {state.place === 'bench' ? 'Back to the quay' : 'Lantern house'}</button>}</div>
        </section>
        {state.place === 'quay' && <div className="av-scene-actions"><button className="av-button av-primary" onClick={test} disabled={running}><Icon name="bell"/>{state.observed ? 'Try the old bell again' : 'Try the old bell'}</button><span>{state.observed ? 'Receiver: lit · Crew: kept loading' : 'Watch what the crew do when the warning arrives.'}</span></div>}
        {state.place === 'bench' && state.trial && <section className="av-results" aria-label="Rehearsal observations"><h2>What happened at the quay</h2><div className="av-result-chain">{[{ title: 'Message received', ok: true, icon: 'lamp' }, { title: 'Crew noticed', ok: state.trial.noticed, icon: 'eye' }, { title: 'Ferry held', ok: state.trial.acted, icon: 'hand' }].map(r => <div key={r.title} className={r.ok ? 'passed' : 'missed'}><Icon name={r.icon}/><strong>{r.title}</strong><span>{r.ok ? '✓ Observed' : '— Not observed'}</span></div>)}</div><p>This setup, this crew, this rehearsal. Other quays and storm conditions are still untested.</p></section>}
        {state.place === 'bench' && state.trial?.acted && !state.complete && <section className="av-evidence-board" aria-label="Finish the ledger"><h2>Leave two records in the ledger</h2><p>Select a card, then place it beside what it shows.</p><div className="av-evidence-cards">{(['lamp', 'trial'] as Clue[]).map(id => <button key={id} data-evidence={id} aria-pressed={selected === id} onClick={() => setSelected(id)}><Icon name={evidence[id].icon}/><span><strong>{evidence[id].title}</strong><small>{evidence[id].source}</small></span></button>)}</div><div className="av-claims">{(['sent', 'acted'] as Claim[]).map(claim => <button key={claim} data-claim-slot={claim} onClick={() => pin(claim)}><span>{claim === 'sent' ? 'The tower sent the message' : 'This crew could hold the ferry'}</span><strong>{state.pins[claim] ? `✓ ${evidence[state.pins[claim]!].title}` : '＋ Place selected record'}</strong></button>)}</div></section>}
        <section className="av-satchel" aria-label="Your evidence satchel"><h2><Icon name="book"/>In your satchel <span>{state.clues.length}</span></h2>{state.clues.length ? <div>{state.clues.map(id => <button key={id} onClick={() => { const e = evidence[id]; say({ person: e.person, title: e.title, text: id === 'trial' && state.trial ? `${state.trial.acted ? 'The crew held the ferry.' : 'The crew did not hold the ferry.'} ${e.text}` : e.text }); }}><Icon name={evidence[id].icon}/><span>{evidence[id].title}</span></button>)}</div> : <p>Your first discovery will appear here.</p>}</section>
      </div><aside className="av-story-column">
        {state.place === 'bench' && !state.complete && <SceneTools state={state} running={running} onEquip={equip} onBrief={brief} onTest={test}/>}
        <section className="av-conversation" aria-label="Companion dialogue"><div className="av-speaker"><Portrait person={speech.person}/><div><strong>{people[speech.person].name}</strong><span>{people[speech.person].role}</span></div></div><h2 tabIndex={-1} ref={speechRef}>{speech.title}</h2><p>{speech.text}</p>{speech.person === 'sera' && <small className="av-source-note">A preserved recording. Sera is still missing.</small>}</section>
        <section className="av-story-action" aria-label="Continue the story">
          {state.complete ? <><Icon name="flag"/><p className="av-kicker">MARA JOINS YOUR CREW</p><h2>A token for the next crossing</h2><p>“Sera took the early ferry to the Brass Quarter. I’ll take you there. This time, we know who is watching.”</p><p className="av-ended">You have completed the opening chapter. Your record travels with you.</p><a className="av-button av-primary" data-continue-council href="#adventure/council" onClick={() => prepareCrossing(save)}>Take Mara’s ferry <Icon name="arrow"/></a><button className="av-text-button" onClick={() => setModal('journal')}>Open your chapter journal</button><a className="av-text-button" href="#classic">Explore the full Classic story ↗</a></>
            : state.place === 'workshop' ? <><p className="av-kicker">FOLLOW SERA’S TRAIL</p><h2>Mara is at Lower Quay</h2><p>{canLeaveWorkshop(state) ? 'The lamp records a warning. Sera’s message points to the people at its far end.' : 'Inspect the lamp and voice crystal. The ledger is an optional discovery.'}</p><button className="av-button av-primary" disabled={!canLeaveWorkshop(state)} onClick={() => travel('quay')}>Go to Lower Quay <Icon name="arrow"/></button></>
              : state.place === 'quay' ? <><p className="av-kicker">A FERRY STILL WAITING</p><h2>Help Mara’s crew</h2><ul className="av-checklist"><li>{state.clues.includes('mara') ? '✓' : '○'} Talk to Mara</li><li>{state.observed ? '✓' : '○'} Try the old bell</li><li>{state.clues.includes('crew') ? '✓' : '○'} Observe the crew</li></ul><button className="av-button av-primary" disabled={!canRepair(state)} onClick={() => travel('bench')}>Visit the warning station <Icon name="arrow"/></button></>
                : <><p className="av-kicker">ONE QUAY. A REAL WATCH.</p><h2>Leave a usable plan</h2><p>{state.trial?.acted ? 'Keep the tower result and crew result separate. Mara will accept the watch after you finish the ledger.' : 'Choose a tool. Agree an action. See what the crew actually do.'}</p><button data-finish className="av-button av-primary" disabled={!canFinish(state) || running} onClick={() => { if (act({ type: 'finish' })) { say({ person: 'mara', title: 'I’ll keep the next watch', text: state.device === 'beacon' ? '“I accept this watch log. The crew will use the lantern signal we rehearsed and check its condition and sightline before work. Sera headed for the Brass Quarter.”' : '“I accept this watch log. I’ll keep the local lookout on the duty we rehearsed, with relief at shift change. Sera headed for the Brass Quarter.”' }); } }}>Hand over to Mara <Icon name="arrow"/></button></>}
        </section>
        {!state.complete && <button className="av-hint-button" onClick={() => say({ person: 'pip', title: 'One thing at a time', text: state.place === 'workshop' ? 'The marked lamp and crystal tell different parts of the story. Click each, then follow Sera’s message to Mara.' : state.place === 'quay' ? 'Mara has the account; the bell demonstrates the problem; the crew show the conditions. Look at how they work.' : !state.trial?.acted ? 'Choose a cue that fits the conditions you observed. Then give it one clear action. Getting attention and knowing what to do are separate steps.' : 'What did each observer actually see? The tower and the crew supply different parts of the record.' })}><Portrait person="pip"/><span>Ask Pip for a nudge</span></button>}
        <p className="av-quiet-note">No timers. No lost lives. Discover, try, and reconsider.</p>
      </aside></div>
    </main>
    {modal && <Modal title={modal === 'journal' ? 'Your chapter journal' : 'Save & settings'} onClose={() => { setModal(null); setPending(null); setResetting(false); }}>
      {modal === 'journal' ? <><p>Your own discoveries and observations. This is one illustrated chapter, adapted from the opening of Classic.</p>{state.clues.map(id => <article className="av-journal-entry" key={id}><Icon name={evidence[id].icon}/><div><h3>{evidence[id].title}</h3><small>{evidence[id].source}</small><p>{id === 'trial' && state.trial ? `${state.trial.acted ? 'Crew held the ferry.' : 'Crew did not hold the ferry.'} ` : ''}{evidence[id].text}</p></div></article>)}{!state.clues.length && <p>Inspect a marked object to start your record.</p>}<details><summary>The systems ideas beneath the story</summary><p>A transmitter result and an outcome for people are different observations. Investigating both helps define the service’s boundary. Watching and consulting users reveals reception and interpretation needs. A rehearsal supplies evidence for the configuration and conditions it actually exercised.</p><p>This chapter does not verify the full Classic 90-second, all-quay storm requirement or certify engineering competence.</p></details></>
        : <><p>{blocked.current ? 'Saving is paused. Export this tab to preserve its progress.' : 'Your chapter saves on this device. Classic uses a separate save.'}</p><label className="av-setting"><input type="checkbox" checked={save.settings.lessMotion} onChange={e => update({ ...save, settings: { ...save.settings, lessMotion: e.target.checked } })}/> Reduce motion</label><label className="av-setting"><input type="checkbox" checked={save.settings.largeText} onChange={e => update({ ...save, settings: { ...save.settings, largeText: e.target.checked } })}/> Larger text</label><div className="av-save-actions"><button className="av-button" onClick={() => download(JSON.stringify(save, null, 2), 'asterfall-illustrated-chapter.json')}>Export chapter</button><label className="av-import-label">Import chapter<input aria-label="Import chapter" type="file" accept="application/json,.json" onChange={e => { importFile(e.target.files?.[0]); e.target.value = ''; }}/></label><button className="av-button" onClick={() => { try { const text = localStorage.getItem(key.current); const stored = text === null ? freshSave() : parseChapterSave(text); setPending(stored); } catch (e) { setNotice(e instanceof Error ? e.message : 'The saved chapter could not be read.'); } }}>Load stored chapter</button>{raw.current !== null && <button className="av-button" onClick={() => download(raw.current!, 'asterfall-illustrated-original.json')}>Export original stored copy</button>}</div>{pending && <section className="av-confirm" aria-label="Replace chapter confirmation"><h3>Replace this chapter?</h3><p>The imported or stored copy will replace this tab’s progress. Export first to keep both.</p><button className="av-button av-primary" onClick={() => { update(pending, true); setPending(null); setModal(null); setSelected(null); say(intro, false); }}>Replace chapter</button><button className="av-button" onClick={() => setPending(null)}>Cancel replacement</button></section>}{resetting ? <section className="av-confirm" aria-label="Restart confirmation"><h3>Start this chapter again?</h3><p>Only this illustrated chapter is replaced. Classic and other games are untouched.</p><button className="av-button" onClick={() => { update({ ...freshSave(), settings: save.settings }, true); setResetting(false); setModal(null); setSelected(null); say(intro, false); }}>Confirm new chapter</button><button className="av-button" onClick={() => setResetting(false)}>Keep playing</button></section> : <button className="av-text-button" onClick={() => setResetting(true)}>Start chapter again</button>}</>}
    </Modal>}
  </div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="av-modal" ref={ref} aria-labelledby="av-modal-title" onCancel={e => { e.preventDefault(); onClose(); }}><header><h2 id="av-modal-title">{title}</h2><button autoFocus onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></header>{children}</dialog>;
}

function SceneTools({ state, running, onEquip, onBrief, onTest }: { state: Chapter; running: boolean; onEquip: (device: Device) => void; onBrief: (meaning: Meaning) => void; onTest: () => void }) {
  return <div className="av-controls"><section className="av-equipment" aria-label="Warning tools"><p className="av-kicker">YOUR TOOLKIT</p><h2>Choose a warning</h2><div className="av-tool-grid">{(Object.keys(equipment) as Device[]).map(device => <button key={device} data-device={device} className={`av-tool ${state.device === device ? 'selected' : ''}`} aria-pressed={state.device === device} onClick={() => onEquip(device)} disabled={running}><Icon name={equipment[device].icon}/><strong>{device === 'bell' ? 'Bell' : device === 'beacon' ? 'Lantern' : 'Lookout'}</strong>{state.device === device && <span className="av-equipped">Equipped</span>}</button>)}</div><p className="av-tool-note">{equipment[state.device].detail}</p><h2 className="av-signal-heading">Agree the signal</h2><p className="av-tool-note">Mara needs loading stopped and departures held.</p><div className="av-meaning-options"><button data-meaning="hold" aria-pressed={state.meaning === 'hold'} onClick={() => onBrief('hold')} disabled={running}><Icon name="hand"/><span>Stop loading<br/><strong>Hold departures</strong></span></button><button data-meaning="wait" aria-pressed={state.meaning === 'wait'} onClick={() => onBrief('wait')} disabled={running}><Icon name="clock"/><span>Notice warning<br/><strong>Await instructions</strong></span></button></div><button data-rehearse className="av-button av-primary av-rehearse" onClick={onTest} disabled={running}><Icon name="flag"/>{running ? 'Rehearsing…' : 'Rehearse with the crew'}</button></section></div>;
}
