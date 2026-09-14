import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon, Portrait } from '../Art.tsx';
import { replay as replayOpening } from '../model.ts';
import { recallInTab, rememberInTab } from '../tab-memory.ts';
import { GuestPortrait } from '../council/Art.tsx';
import { councilSaveKey, replayCouncil } from '../council/model.ts';
import type { CouncilSave } from '../council/types.ts';
import type { StoragePort } from '../council/persistence.ts';
import { ArchiveArt, QuayPicture } from './Art.tsx';
import { archiveObjective, archiveSaveKey, canEnterTable, canFinishArchive, dispatchArchive, evidenceReady, freshArchiveSave, MAX_ARCHIVE_BYTES, parseArchiveSave, proposalReady, replayArchive } from './model.ts';
import { consumeArchiveArrival, loadArchive, parseArchiveImport, writeArchive } from './persistence.ts';
import { addressLabel, claims, claimSlots, findings, hints, quays, quayIds, records, scenes } from './story.ts';
import type { ArchiveAction, ArchiveSave, ArchiveScene, ArchiveState, ClaimSlot, Finding, RecordId } from './types.ts';
import '../adventure.css';
import './archive.css';

type Speech = { who: 'neri' | 'pip'; title: string; text: string };
const introduction: Speech = { who: 'neri', title: 'A list can make a home disappear', text: '“Orren’s seal lets us read the originals. Sera tied her request to the older list. Let’s find out what changed before we carry anything to Stormglass.”' };
const unavailable: StoragePort = { getItem() { throw new Error('Storage denied'); }, setItem() { throw new Error('Storage denied'); } };
function browserStorage(): StoragePort { try { return window.localStorage; } catch { return unavailable; } }
function download(raw: string, name: string): void {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ArchiveApp() {
  const storage = useRef(browserStorage());
  const [initial] = useState(() => {
    const rememberedCouncil = recallInTab<CouncilSave | null>(councilSaveKey(location.pathname))?.save;
    const arrival = consumeArchiveArrival() ?? (rememberedCouncil && replayCouncil(rememberedCouncil).complete ? rememberedCouncil : null);
    return loadArchive(storage.current, location.pathname, arrival, recallInTab<ArchiveSave | null>(archiveSaveKey(location.pathname)));
  });
  const [save, setSave] = useState(initial.save);
  const [notice, setNotice] = useState(initial.notice);
  const raw = useRef(initial.raw);
  const blocked = useRef(initial.blocked);
  const [speech, setSpeech] = useState<Speech>(() => initial.save ? { ...introduction, text: archiveObjective(replayArchive(initial.save)) } : introduction);
  const [shown, setShown] = useState<RecordId | null>(null);
  const [selected, setSelected] = useState<RecordId | null>(null);
  const [populationView, setPopulationView] = useState(false);
  const [modal, setModal] = useState<'journal' | 'settings' | null>(null);
  const [pending, setPending] = useState<ArchiveSave | null>(null);
  const [resetting, setResetting] = useState(false);
  const importNonce = useRef(0);
  const stageRef = useRef<HTMLHeadingElement>(null);
  const speechRef = useRef<HTMLHeadingElement>(null);
  const state = save ? replayArchive(save) : null;
  const visibleSource = state?.scene === 'dispatch' ? 'survey' : shown;

  useEffect(() => { rememberInTab(archiveSaveKey(location.pathname), { save, raw: raw.current, blocked: blocked.current, notice }); }, [save, notice]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === storage.current && (event.key === archiveSaveKey(location.pathname) || event.key === null) && event.newValue !== raw.current) {
        blocked.current = true;
        setNotice('Another tab changed this archive. Saving is paused. Export this tab or load the stored investigation.');
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);

  function update(next: ArchiveSave, replace = false): void {
    setSave(next);
    if (replace) {
      try { raw.current = storage.current.getItem(archiveSaveKey(location.pathname)); blocked.current = false; }
      catch { blocked.current = true; setNotice('The archive is in memory. Export it before closing the tab.'); }
    }
    if (blocked.current) return;
    const result = writeArchive(storage.current, location.pathname, next, raw.current);
    if (result.ok) { raw.current = result.raw; setNotice(''); }
    else { blocked.current = true; setNotice(result.notice); }
  }
  function say(value: Speech, focus = true): void {
    setSpeech(value);
    if (focus) requestAnimationFrame(() => speechRef.current?.focus());
  }
  function act(action: ArchiveAction): ArchiveState | null {
    if (!save) return null;
    try { const next = dispatchArchive(save, action); update(next); return replayArchive(next); }
    catch (error) { say({ who: 'pip', title: 'Check what the record supports', text: error instanceof Error ? error.message : 'That action is not available in this scene.' }); return null; }
  }
  function inspect(record: RecordId): void {
    if (!act({ type: 'inspect', record })) return;
    setShown(record);
    say({ who: 'neri', title: records[record].title, text: records[record].text });
  }
  function selectRecord(record: RecordId): void {
    setShown(record); setSelected(record);
    say({ who: 'neri', title: records[record].title, text: records[record].text }, false);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-archive-slot="population"]')?.focus({ preventScroll: true }));
  }
  function pin(slot: ClaimSlot): void {
    if (!selected) { say({ who: 'pip', title: 'Choose a source record', text: 'Choose one of the collected records, then place it beside the question that it can answer.' }); return; }
    if (act({ type: 'pin', slot, record: selected })) setSelected(null);
  }
  function travel(scene: ArchiveScene): void {
    if (!act({ type: 'travel', scene })) return;
    setSelected(null); setShown(scene === 'table' ? 'roll' : scene === 'dispatch' ? 'survey' : null);
    say({ who: 'neri', title: scenes[scene].title, text: hints[scene] }, false);
    requestAnimationFrame(() => stageRef.current?.focus());
  }
  function review(kind: 'review-evidence' | 'review-proposal'): void {
    const next = act({ type: kind });
    const result = kind === 'review-evidence' ? next?.evidence : next?.review;
    if (!result) return;
    say({ who: 'neri', title: result.gaps.length ? 'One question is still open' : kind === 'review-evidence' ? 'The count has a boundary' : 'A proposal with its sources attached', text: result.gaps[0] ?? (kind === 'review-evidence'
      ? '“Three listed receivers acknowledged. Four quays are inhabited here. Lower Quay fell outside the list before anyone counted the green marks. Receipt still does not tell us what people perceived.”'
      : '“This proposal includes each surveyed quay at its current address. Keep the superseded list as history, and leave authorization and service checks open.”') });
  }
  async function importFile(file?: File): Promise<void> {
    if (!file) return;
    const nonce = ++importNonce.current;
    setPending(null); setResetting(false);
    if (file.size > MAX_ARCHIVE_BYTES) { setNotice('This file exceeds the 600 KB limit.'); return; }
    try {
      const candidate = parseArchiveImport(await file.text());
      if (nonce === importNonce.current) { setPending(candidate); setNotice(''); }
    } catch (error) {
      if (nonce === importNonce.current) setNotice(error instanceof Error ? error.message : 'The archive save could not be read.');
    }
  }
  function closeDialog(): void { importNonce.current++; setModal(null); setPending(null); setResetting(false); }
  function replacePending(): void {
    if (!pending) return;
    update(pending, true); closeDialog(); setSelected(null); setShown(null);
    say({ who: 'neri', title: 'The investigation is restored', text: archiveObjective(replayArchive(pending)) }, false);
    requestAnimationFrame(() => stageRef.current?.focus());
  }

  return <div className={`adventure archive ${save?.settings.lessMotion ? 'av-less-motion' : ''} ${save?.settings.largeText ? 'av-large-text' : ''}`}>
    <a className="av-skip" href="#adventure/archive" onClick={event => { event.preventDefault(); stageRef.current?.focus(); }}>Skip to the scene</a>
    <header className="av-header">
      <a className="av-brand" href="#adventure"><Icon name="star"/><span>ASTERFALL<small>THE LAST RELAY</small></span></a>
      <span className="av-preview">Illustrated RPG · Chapter three</span>
      <nav aria-label="Journey tools">
        <button aria-label="Archive journal" disabled={!save} onClick={() => setModal('journal')}><Icon name="book"/><span>Journal</span></button>
        <button aria-label="Save & settings" onClick={() => setModal('settings')}><Icon name="settings"/><span>Save & settings</span></button>
        <a href="#adventure/council">Brass Quarter</a><a href="#adventure">Chapter one</a><a href="#classic">Classic ↗</a>
      </nav>
    </header>
    {notice && <div className="av-notice" role="alert"><span>{notice}</span><button onClick={() => setModal('settings')}>Save & recovery</button></div>}
    <main className="av-main">
      {!save || !state ? <section className="ar-arrival">
        <GuestPortrait guest="neri"/><p className="av-kicker">THE NEXT CLUE</p>
        <h1 ref={stageRef} tabIndex={-1}>Neri needs the reading seal</h1>
        <p>Complete the Brass Quarter hearing and target to collect Sera’s request. A completed Brass Quarter export can also continue here.</p>
        <a className="av-button av-primary" href="#adventure/council">Return to the Brass Quarter <Icon name="arrow"/></a>
        <button className="av-button" onClick={() => setModal('settings')}>Import a saved journey</button>
      </section> : <>
        <div className="av-title-row">
          <div><p className="av-kicker">CHAPTER THREE · THE GREEN TALLY</p><h1 ref={stageRef} tabIndex={-1}>{scenes[state.scene].title}</h1><p className="av-intro">{scenes[state.scene].subtitle}</p></div>
          <div className="av-party" aria-label="Your party"><Portrait person="iona"/><Portrait person="pip"/><GuestPortrait guest="neri"/><span><strong>Iona, Pip & Neri</strong>{state.complete ? 3 : 2} chapters recorded</span></div>
        </div>
        <section className="av-objective" aria-label="Current objective"><Icon name={state.complete ? 'check' : 'star'}/><div><span>{state.complete ? 'CHAPTER RECORDED' : 'YOUR NEXT MOVE'}</span><p>{archiveObjective(state)}</p></div></section>
        <div className="av-play-layout">
          <div className="av-play-column">
            <section className="av-scene" aria-label={`${scenes[state.scene].title} illustrated scene`}>
              <div className="av-scene-canvas"><ArchiveArt state={state} populationView={populationView}/><span className="av-location-plaque">{state.scene === 'stacks' ? '01 · The originals' : state.scene === 'table' ? '02 · The missing name' : '03 · The proposed correction'}</span></div>
              <div className="av-scene-footer"><span>{state.scene === 'table' ? 'Change the view below. The records stay the same.' : state.scene === 'dispatch' ? 'A proposed list · authorization and service checks pending' : 'Orren’s seal opens the records. Sera’s ribbon marks the older list.'}</span>
                {state.scene !== 'stacks' && !state.complete && <button onClick={() => travel(state.scene === 'dispatch' ? 'table' : 'stacks')}>← {state.scene === 'dispatch' ? 'Comparison table' : 'Archive stacks'}</button>}
              </div>
            </section>
            {state.scene === 'stacks' && <section className="ar-sources" aria-label="Archive objects">
              <h2>Open the records</h2><p>Look inside a folio to hear Neri’s account and add its source to your journal.</p>
              <div className="ar-source-grid">{(['request', 'roll', 'survey', 'change'] as const).map(id => <button key={id} className="ar-record" data-archive-record={id} onClick={() => inspect(id)}><Icon name={records[id].icon}/><strong>{records[id].title}</strong><small>{records[id].source}</small><span className="ar-read">{state.discoveries.includes(id) ? 'Read · open again' : 'Open folio'}</span></button>)}</div>
            </section>}
            {visibleSource && <section className="ar-current-source" aria-label="Open source record"><h3>{records[visibleSource].title}</h3><small>{records[visibleSource].source}</small><p>{records[visibleSource].text}</p></section>}
            {state.scene === 'table' && <>
              <section className="ar-comparison" aria-label="Compare the dispatch district">
                <h2>Who is missing from the count?</h2>
                {state.discoveries.includes('tally') ? <div className="ar-tally"><b>3 / 3</b><div><strong>Listed receivers acknowledged R-17</strong><p>The current survey identifies four inhabited quays in this district.</p></div></div>
                  : <button className="av-button av-primary" data-archive-record="tally" onClick={() => inspect('tally')}><Icon name="check"/>Open the green tally</button>}
                <fieldset className="ar-view"><legend>Compare two views of the same district</legend><div><button aria-pressed={!populationView} onClick={() => setPopulationView(false)}>List B’s recipients</button><button aria-pressed={populationView} onClick={() => setPopulationView(true)}>Survey’s inhabitants</button></div></fieldset>
                <p>Choose the inhabited quay omitted from list B.</p>
                <div className="ar-quays">{quayIds.map(quay => <button key={quay} className="ar-quay" data-archive-quay={quay} aria-pressed={state.focus === quay} onClick={() => act({ type: 'focus', quay })}>
                  <QuayPicture quay={quay} included={populationView || quays[quay].issued !== 'omitted'}/><strong>{quays[quay].name}</strong><span>{populationView ? `Inhabited · ${quays[quay].current}` : quays[quay].issued === 'omitted' ? 'Absent from list B' : `Listed · ${quays[quay].issued}`}</span><small>{populationView ? quays[quay].people : state.focus === quay ? 'Selected for investigation' : 'Select this quay'}</small>
                </button>)}</div>
              </section>
              <section className="ar-evidence" aria-label="Evidence pockets">
                <h2>Give each question its source</h2><p>Choose a collected record, then a pocket. Records remain available after placement.</p>
                <div className="ar-source-grid">{state.discoveries.map(id => <button className={`ar-record ${selected === id ? 'selected' : ''}`} key={id} data-archive-source={id} aria-pressed={selected === id} onClick={() => selectRecord(id)}><Icon name={records[id].icon}/><strong>{records[id].title}</strong><small>{records[id].source}</small></button>)}</div>
                <p className="ar-selection" role="status">{selected ? `${records[selected].title} selected. Choose a pocket.` : 'Choose a record to place, or open another source above.'}</p>
                <div className="ar-pockets">{claimSlots.map(slot => <button key={slot} className={`ar-pocket ${state.pins[slot] ? 'filled' : ''}`} data-archive-slot={slot} onClick={() => pin(slot)} aria-label={`${claims[slot].title}: ${state.pins[slot] ? records[state.pins[slot]!].title : 'empty pocket'}${selected ? `; place ${records[selected].title}` : ''}`}><strong>{claims[slot].title}</strong><small>{claims[slot].question}</small><span>{state.pins[slot] ? records[state.pins[slot]!].title : 'Place a source here'}</span></button>)}</div>
                <button className="av-button av-primary" data-review-archive-evidence onClick={() => review('review-evidence')}>Compare the records with Neri <Icon name="eye"/></button>
                {state.evidence && <ReviewPanel title={state.evidence.gaps.length ? 'The evidence needs another look' : 'The count has a boundary'} gaps={state.evidence.gaps} success="Three listed receivers acknowledged. Lower Quay is inhabited and omitted. Local warning and crew action were not observed in this log."/>}
              </section>
            </>}
            {state.scene === 'dispatch' && !state.complete && <ProposalWorkbench state={state} onAction={act} onReview={() => review('review-proposal')}/>}
            {state.complete && <section className="ar-final-packet" aria-label="Recorded archive packet"><h2>The packet you sealed</h2><p><strong>{state.route === 'amend' ? 'Amendment to issued list B' : 'Replacement rebuilt from the current survey'}</strong></p><p>{quayIds.map(quay => `${quays[quay].name} ${state.proposal[quay]}`).join(' · ')}</p><p>Three listed receivers acknowledged R-17; Lower Quay was omitted. Perceived local warning and crew response remain unobserved.</p><p>PROPOSAL · Authorization, service checks and Tavi’s field trials remain pending.</p></section>}
          </div>
          <aside className="ar-sidebar">
            <section className="av-conversation" aria-label="Companion dialogue"><div className="av-speaker">{speech.who === 'pip' ? <Portrait person="pip"/> : <GuestPortrait guest="neri"/>}<div><strong>{speech.who === 'pip' ? 'Pip' : 'Neri'}</strong><span>{speech.who === 'pip' ? 'Your clockwork companion' : 'Council archivist'}</span></div></div><h2 ref={speechRef} tabIndex={-1}>{speech.title}</h2><p>{speech.text}</p></section>
            <section className="av-story-action" aria-label="Continue the story">
              {state.complete ? <><Icon name="flag"/><p className="av-kicker">SERA’S REQUEST HAS ITS EVIDENCE</p><h2>Toward Stormglass</h2><p>Neri seals the superseded list beside your proposed correction. Mara records Stormglass as the next destination. The records still do not establish where Sera is.</p><button className="av-button av-primary" onClick={() => setModal('journal')}>Read your three-chapter journal</button><p className="av-ended">Three illustrated chapters are recorded. The Stormglass journey is the next story lead; it is not playable yet.</p><a className="av-text-button" href="#classic">Explore Classic ↗</a></>
                : state.scene === 'stacks' ? <><p className="av-kicker">A REQUEST TIED WITH RIBBON</p><h2>Bring the records together</h2><p>The older list explains the removal. The current survey tells us who is here now.</p><button className="av-button av-primary" disabled={!canEnterTable(state)} onClick={() => travel('table')}>Take the records to the table <Icon name="arrow"/></button></>
                  : state.scene === 'table' ? <><p className="av-kicker">SUCCESS FOR WHOM?</p><h2>Carry the omitted address forward</h2><p>Explain the count using its actual sources before proposing a correction.</p><button className="av-button av-primary" disabled={!evidenceReady(state)} onClick={() => travel('dispatch')}>Prepare the Stormglass packet <Icon name="arrow"/></button></>
                    : <><p className="av-kicker">A PROPOSAL, WITH ITS LIMITS</p><h2>Seal the records for the crossing</h2><p>The revised list needs an authorized change decision and checks in service. Keep Tavi’s broader field target open.</p><button className="av-button av-primary" data-finish-archive disabled={!canFinishArchive(state)} onClick={() => { if (act({ type: 'finish' })) say({ who: 'neri', title: 'The old count no longer hides the question', text: '“Take both lists and the source records. At Stormglass, ask who is included, what was observed and who must authorize the next change.”' }); }}>Seal the packet for Stormglass <Icon name="arrow"/></button></>}
            </section>
            {!state.complete && <button className="av-hint-button" onClick={() => say({ who: 'pip', title: 'A question to try', text: hints[state.scene] })}><Portrait person="pip"/><span>Ask Pip for a nudge</span></button>}
          </aside>
        </div>
      </>}
    </main>
    {modal && <ArchiveDialog title={modal === 'journal' ? 'Your archive journal' : 'Save & settings'} onClose={closeDialog}>
      {notice && <p className="ar-dialog-notice" role="alert">{notice}</p>}
      {modal === 'journal' && save && state ? <ArchiveJournal save={save} state={state}/> : <>
        <p>{blocked.current ? 'Saving is paused. Export this tab before closing it.' : 'This archive save includes the recorded opening and Brass Quarter histories. Each chapter keeps its separate stored copy.'}</p>
        {save && <><label className="av-setting"><input type="checkbox" checked={save.settings.lessMotion} onChange={event => update({ ...save, settings: { ...save.settings, lessMotion: event.target.checked } })}/> Reduce motion</label><label className="av-setting"><input type="checkbox" checked={save.settings.largeText} onChange={event => update({ ...save, settings: { ...save.settings, largeText: event.target.checked } })}/> Larger text</label></>}
        <div className="av-save-actions">
          {save && <button className="av-button" onClick={() => download(JSON.stringify(save, null, 2), 'asterfall-dispatch-archive.json')}>Export archive</button>}
          <label className="av-import-label">Import journey<input aria-label="Import journey" type="file" accept="application/json,.json" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }}/></label>
          <button className="av-button" onClick={() => { importNonce.current++; setResetting(false); setPending(null); try { const stored = storage.current.getItem(archiveSaveKey(location.pathname)); if (stored === null) throw new Error('No stored archive was found.'); setPending(parseArchiveSave(stored)); setNotice(''); } catch (error) { setNotice(error instanceof Error ? error.message : 'The archive could not be read.'); } }}>Load stored archive</button>
          {raw.current !== null && <button className="av-button" onClick={() => download(raw.current!, 'asterfall-dispatch-archive-original.json')}>Export original stored copy</button>}
        </div>
        <p>Accepts a completed Brass Quarter export or an archive save. An unfinished earlier chapter cannot be skipped by importing it.</p>
        {pending && <section className="av-confirm" aria-label="Replace archive confirmation"><h3>Replace this investigation?</h3><p>Export first to keep both histories. The candidate contains its own earlier chapter records.</p><button className="av-button av-primary" onClick={replacePending}>Replace archive</button><button className="av-button" onClick={() => setPending(null)}>Cancel replacement</button></section>}
        {save && (resetting ? <section className="av-confirm" aria-label="Restart archive confirmation"><h3>Start the archive investigation again?</h3><p>The evidence arrangement and proposed list will reset. The embedded opening and Brass Quarter histories remain.</p><button className="av-button" onClick={() => { const next = freshArchiveSave(save.arrival); next.settings = { ...save.settings }; update(next, true); closeDialog(); setSelected(null); setShown(null); setPopulationView(false); say(introduction, false); requestAnimationFrame(() => stageRef.current?.focus()); }}>Confirm new archive</button><button className="av-button" onClick={() => setResetting(false)}>Keep playing</button></section>
          : <button className="av-text-button" onClick={() => { importNonce.current++; setPending(null); setResetting(true); }}>Start this investigation again</button>)}
      </>}
    </ArchiveDialog>}
  </div>;
}

function ReviewPanel({ title, gaps, success }: { title: string; gaps: string[]; success: string }) {
  return <section className="ar-feedback" role="status"><h3>{title}</h3>{gaps.length ? gaps.map(gap => <p key={gap}>{gap}</p>) : <p>{success}</p>}</section>;
}
function ProposalWorkbench({ state, onAction, onReview }: { state: ArchiveState; onAction: (action: ArchiveAction) => ArchiveState | null; onReview: () => void }) {
  return <section className="ar-proposal" aria-label="Build a proposed recipient list">
    <h2>Build a proposed recipient list</h2><p>The survey above gives the current addresses. Choose a starting point. Switching routes starts that draft list again.</p>
    <div className="ar-routes"><button className="ar-route" data-archive-route="amend" aria-pressed={state.route === 'amend'} onClick={() => onAction({ type: 'choose-route', route: 'amend' })}><strong>Amend issued list B</strong><span>Retain its three current recipients, then correct the omission. Check the district against the survey.</span></button><button className="ar-route" data-archive-route="rebuild" aria-pressed={state.route === 'rebuild'} onClick={() => onAction({ type: 'choose-route', route: 'rebuild' })}><strong>Rebuild from the survey</strong><span>Start with an empty proposed list. Re-enter and check all four current addresses.</span></button></div>
    {state.route && <div className="ar-addresses">{quayIds.map(quay => <div className="ar-address-row" key={quay}><QuayPicture quay={quay} included={state.proposal[quay] === quays[quay].current}/><fieldset><legend>{quays[quay].name}</legend><p>Current survey: {quays[quay].current}{quay === 'north' ? ' · NW04 was superseded' : ''}</p><div>{quays[quay].options.map(address => <button key={address} data-archive-address={`${quay}:${address}`} aria-pressed={state.proposal[quay] === address} onClick={() => onAction({ type: 'address', quay, address })}>{addressLabel(address)}</button>)}</div></fieldset></div>)}</div>}
    <fieldset className="ar-findings"><legend>What finding travels with the proposed list?</legend>{(Object.keys(findings) as Finding[]).map(finding => <label key={finding}><input type="radio" name="archive-finding" data-archive-finding={finding} checked={state.finding === finding} onChange={() => onAction({ type: 'finding', finding })}/><span><strong>{findings[finding].title}</strong><small>{findings[finding].text}</small></span></label>)}</fieldset>
    <button className="av-button av-primary" data-review-archive-proposal onClick={onReview}>Review the packet with Neri <Icon name="eye"/></button>
    {state.review && <ReviewPanel title={state.review.gaps.length ? 'The draft needs a correction' : 'Source-backed proposal'} gaps={state.review.gaps} success="All four surveyed quays appear at their current addresses. The finding stays within the receipt log’s scope."/>}
    {proposalReady(state) && <><h3>Which seal belongs on this packet?</h3><div className="ar-stamps"><button className="av-button" data-archive-status="approved" onClick={() => onAction({ type: 'label', status: 'approved' })}><Icon name="check"/>Approved for service</button><button className="av-button" data-archive-status="proposed" aria-pressed={state.status === 'proposed'} onClick={() => onAction({ type: 'label', status: 'proposed' })}><Icon name="book"/>Proposal · authorization pending</button></div>{state.status && <p className="ar-status" role="status">PROPOSAL · AUTHORIZATION PENDING</p>}</>}
  </section>;
}
function ArchiveJournal({ save, state }: { save: ArchiveSave; state: ArchiveState }) {
  const opening = replayOpening(save.arrival.arrival);
  const council = replayCouncil(save.arrival);
  return <>
    <h3>Chapter one · The Missing Keeper</h3><p>Mara accepted the {opening.device === 'beacon' ? 'lantern arrangement with a clear sightline' : 'local-lookout arrangement with relief duty'}. That original history is retained in this packet.</p>
    <h3>Chapter two · The Missing Address</h3><p>{council.hearing?.route === 'written' ? 'Neri carried the signed night-watch account and the keeper confirmed the sketch.' : 'The relieved night keeper attended the hearing.'} The all-quay 90-second storm target remains a target, with field trials planned.</p>
    {council.relief && <p>The relief handover delayed the ferry; the incurred delay remains recorded.</p>}{council.note && <p>The signed night-watch account remains with its source in the crossing record.</p>}
    <h3>Chapter three · The Green Tally</h3>{state.discoveries.map(id => <article className="ar-journal-record" key={id}><h3>{records[id].title}</h3><small>{records[id].source}</small><p>{records[id].text}</p></article>)}
    {state.evidence && <p><strong>Evidence review:</strong> {state.evidence.gaps.length ? state.evidence.gaps.join(' ') : 'List B omitted inhabited Lower Quay before R-17’s receipts were counted. The receipt count covers listed receivers only.'}</p>}
    {state.route && <><h3>{state.route === 'amend' ? 'Amendment to list B' : 'Rebuild from the survey'}</h3><p>{state.route === 'amend' ? 'The draft starts with B’s recipients. Each entry still needs a current review before the packet can be sealed.' : 'The draft starts with an empty district list. Each entry needs checking against the current survey.'}</p>{quayIds.map(quay => <p key={quay}><strong>{quays[quay].name}:</strong> {state.proposal[quay] ? addressLabel(state.proposal[quay]!) : 'Not entered'}</p>)}</>}
    {state.finding && <p><strong>Selected finding:</strong> {findings[state.finding].title}. {state.review?.gaps.length === 0 ? 'Reviewed against the sources.' : 'Tentative; a current successful review is still required.'}</p>}
    <p><strong>Packet status:</strong> {state.complete ? 'Sealed proposal.' : state.status ? 'Proposed; not yet sealed.' : 'Investigation in progress.'} Authorization, service checks, local warning observations and the broader storm trials are not supplied by this archive exercise.</p>
    <details><summary>The systems ideas beneath the investigation</summary><p>A success count depends on what was included. Receipt evidence, population evidence and change records answer different questions. Keep a superseded record for traceability without treating it as current configuration. A reviewed proposal still needs the appropriate authority and service evidence.</p><p>This authored district has four inhabited quays. It is not a census of all Asterfall or an assessment of professional proficiency.</p></details>
  </>;
}
function ArchiveDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="av-modal" ref={ref} aria-labelledby="ar-modal-title" onCancel={event => { event.preventDefault(); onClose(); }}><header><h2 id="ar-modal-title">{title}</h2><button autoFocus onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></header>{children}</dialog>;
}