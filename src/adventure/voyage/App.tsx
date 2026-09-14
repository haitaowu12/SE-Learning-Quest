import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Portrait } from '../Art.tsx';
import { GuestPortrait } from '../council/Art.tsx';
import type { StoragePort } from '../council/persistence.ts';
import { archiveSaveKey, replayArchive } from '../archive/model.ts';
import type { ArchiveSave } from '../archive/types.ts';
import { recallInTab, rememberInTab } from '../tab-memory.ts';
import { chapters, scenes } from './content.ts';
import { canSeal, currentRecord, dispatchVoyage, endingLines, freshVoyageSave, MAX_VOYAGE_BYTES, parseVoyageSave, replayVoyage, voyageObjective, voyageSaveKey } from './model.ts';
import { consumeVoyageArrival, loadVoyage, parseVoyageImport, writeVoyage } from './persistence.ts';
import { Glyph, Landscape, SeraPortrait } from './Art.tsx';
import { Workbench } from './Boards.tsx';
import { JourneyJournal } from './Journal.tsx';
import type { VoyageAction, VoyageSave, VoyageState } from './types.ts';
import '../adventure.css';
import './voyage.css';

const unavailable: StoragePort = { getItem() { throw new Error('Storage denied'); }, setItem() { throw new Error('Storage denied'); } };
function browserStorage(): StoragePort { try { return window.localStorage; } catch { return unavailable; } }
function download(raw: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const names = { tavi: 'Tavi', mara: 'Mara', neri: 'Neri', sera: 'Sera' };

export default function VoyageApp() {
  const storage = useRef(browserStorage()), key = voyageSaveKey(location.pathname);
  const [initial] = useState(() => {
    const memory = recallInTab<ArchiveSave | null>(archiveSaveKey(location.pathname))?.save;
    const arrival = consumeVoyageArrival() ?? (memory && replayArchive(memory).complete ? memory : null);
    return loadVoyage(storage.current, location.pathname, arrival, recallInTab<VoyageSave | null>(key));
  });
  const [save, setSave] = useState(initial.save), [notice, setNotice] = useState(initial.notice);
  const raw = useRef(initial.raw), blocked = useRef(initial.blocked);
  const [modal, setModal] = useState<'journal' | 'settings' | null>(null);
  const [pending, setPending] = useState<VoyageSave | null>(null), [resetting, setResetting] = useState(false);
  const [error, setError] = useState(''), [showHint, setShowHint] = useState(false), [boardEpoch, setBoardEpoch] = useState(0);
  const nonce = useRef(0), stageRef = useRef<HTMLHeadingElement>(null), reviewRef = useRef<HTMLHeadingElement>(null);
  const state = save ? replayVoyage(save) : null, scene = state ? scenes[state.index] : scenes[0];
  const record = state ? currentRecord(state) : null;
  const lastScene = state && state.index > 0 ? scenes[state.index - 1] : null;
  const seraHome = state?.records.some(item => item.scene === 'relief' && item.sealed);

  useEffect(() => { rememberInTab(key, { save, raw: raw.current, blocked: blocked.current, notice }); }, [key, save, notice]);
  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if (event.storageArea === storage.current && (event.key === key || event.key === null) && event.newValue !== raw.current) {
        blocked.current = true; setNotice('Another tab changed this journey. Saving is paused. Export this tab or load the stored journey.');
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, [key]);

  function update(next: VoyageSave, replace = false): void {
    setSave(next);
    if (replace) {
      try { raw.current = storage.current.getItem(key); blocked.current = false; }
      catch { blocked.current = true; setNotice('The journey is in memory. Export it before closing or reloading this tab.'); }
    }
    if (blocked.current) return;
    const result = writeVoyage(storage.current, location.pathname, next, raw.current);
    if (result.ok) { raw.current = result.raw; setNotice(''); }
    else { blocked.current = true; setNotice(result.notice); }
  }
  function act(action: VoyageAction): VoyageState | null {
    if (!save) return null;
    try {
      const next = dispatchVoyage(save, action); update(next); setError('');
      if (action.type === 'seal') { setShowHint(false); requestAnimationFrame(() => stageRef.current?.focus()); }
      if (action.type === 'review') requestAnimationFrame(() => reviewRef.current?.focus());
      return replayVoyage(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The action could not be recorded.'); return null; }
  }
  function closeDialog(): void { nonce.current++; setModal(null); setPending(null); setResetting(false); }
  function replaced(next: VoyageSave): void {
    update(next, true); closeDialog(); setError(''); setShowHint(false); setBoardEpoch(value => value + 1);
    requestAnimationFrame(() => stageRef.current?.focus());
  }
  async function importFile(file?: File): Promise<void> {
    if (!file) return;
    const request = ++nonce.current; setPending(null); setResetting(false);
    if (file.size > MAX_VOYAGE_BYTES) { setNotice('This journey exceeds the 1 MB limit.'); return; }
    try { const candidate = parseVoyageImport(await file.text()); if (request === nonce.current) { setPending(candidate); setNotice(''); } }
    catch (cause) { if (request === nonce.current) setNotice(cause instanceof Error ? cause.message : 'The journey could not be read.'); }
  }
  function loadStored(): void {
    nonce.current++; setPending(null); setResetting(false);
    try { const stored = storage.current.getItem(key); if (stored === null) throw new Error('No stored journey was found.'); setPending(parseVoyageSave(stored)); setNotice(''); }
    catch (cause) { setNotice(cause instanceof Error ? cause.message : 'The stored journey could not be read.'); }
  }

  return <div className={`adventure voyage ${save?.settings.largeText ? 'av-large-text' : ''} ${save?.settings.lessMotion ? 'av-less-motion' : ''}`}>
    <a className="av-skip" href="#adventure/voyage" onClick={event => { event.preventDefault(); stageRef.current?.focus(); }}>Skip to the scene</a>
    <header className="av-header"><a className="av-brand" href="#adventure"><Glyph name="star"/><span>ASTERFALL<small>THE LAST RELAY</small></span></a><span className="vy-header-label">Illustrated RPG</span>
      <nav aria-label="Journey tools"><button disabled={!save} aria-label="Journey journal" onClick={() => setModal('journal')}><Glyph name="book"/><span>Journal</span></button><button aria-label="Save & settings" onClick={() => setModal('settings')}><Glyph name="seal"/><span>Save & settings</span></button><a href="#adventure/archive">Archive</a><a href="#adventure">Chapter one</a><a href="#classic">Classic ↗</a></nav>
    </header>
    {notice && <div className="av-notice" role="alert"><span>{notice}</span><button onClick={() => setModal('settings')}>Save & recovery</button></div>}
    <main className="av-main vy-main">
      {!save || !state || !record ? <section className="vy-arrival"><Glyph name="map"/><p className="av-kicker">THE CROSSING TO STORMGLASS</p><h1 tabIndex={-1} ref={stageRef}>Bring the archive packet</h1><p>Seal your proposal in The Green Tally to continue the illustrated story. A completed archive export can also start the crossing here.</p><a className="av-button av-primary" href="#adventure/archive">Return to the archive <Glyph name="arrow"/></a><button className="av-button" onClick={() => setModal('settings')}>Import a saved journey</button></section> : <>
        <nav className="vy-chapter-track" aria-label="Continuation chapters">{chapters.map(chapter => {
          const finished = state.records.filter(item => scenes.find(s => s.id === item.scene)?.chapter === chapter.number && item.sealed).length;
          return <span key={chapter.number} className={chapter.number === scene.chapter ? 'vy-current-chapter' : ''} aria-current={chapter.number === scene.chapter ? 'step' : undefined}><b>{finished === 4 ? '✓' : chapter.number}</b><span>{chapter.title}<small>{finished} of 4 scenes recorded</small></span></span>;
        })}</nav>
        <div className="av-title-row"><div><p className="av-kicker">{state.complete ? 'SEVEN CHAPTERS RECORDED' : `CHAPTER ${scene.chapter} · ${chapters.find(chapter => chapter.number === scene.chapter)?.title.toUpperCase()}`}</p><h1 ref={stageRef} tabIndex={-1}>{state.complete ? 'The next keeper has a future' : scene.title}</h1><p className="av-intro">{state.complete ? 'Asterfall’s watch has people, evidence and a next review.' : scene.subtitle}</p></div><div className="av-party"><Portrait person="iona"/><Portrait person="pip"/>{seraHome && <SeraPortrait/>}<span><strong>{seraHome ? 'Iona, Pip & Sera' : 'Iona & Pip'}</strong>{seraHome ? 'The upper watch has relief' : state.index >= 4 ? 'Sera is at the upper post' : 'Following Sera’s trail'}</span></div></div>
        <figure className="vy-scene-frame"><Landscape scene={scene} state={state}/><figcaption><span><Glyph name={state.complete ? 'flag' : 'map'}/>{state.complete ? 'The old core is isolated. The current service remains on watch.' : scene.region === 'stormglass' ? 'Stormglass · design and controlled build' : scene.region === 'field' ? seraHome ? 'The watch is handed over' : 'Four quays · evidence before service' : scene.region === 'service' ? 'A changing shore · keep the boundary current' : 'Asterfall · the next service cycle'}</span><span>{9 + state.records.filter(item => item.sealed).length} / 25 scenes recorded</span></figcaption></figure>
        {state.complete ? <section className="vy-ending" aria-label="Completed journey"><div className="vy-ending-title"><SeraPortrait/><div><p className="av-kicker">THE NEXT KEEPER’S CHARTER</p><h2>A meal with the watch covered</h2><p>Sera sits beside Iona as the incoming keeper takes the evening watch. Your charter records what made that possible.</p></div></div><div className="vy-charter">{endingLines(state).map((line, index) => <p key={line}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{line}</p>)}</div><div className="vy-ending-actions"><button className="av-button av-primary" onClick={() => download(JSON.stringify(save, null, 2), 'asterfall-complete-journey.json')}>Export complete journey <Glyph name="book"/></button><button className="av-button" onClick={() => setModal('journal')}>Read the seven-chapter journal</button><button className="av-button" onClick={() => setModal('settings')}>Explore another future</button></div><p className="vy-caption">The field observations apply to this fictional case and the exercised conditions. Finishing the story does not establish professional proficiency.</p></section> : <>
          <section className="av-objective" aria-label="Current objective"><Glyph name={canSeal(state) ? 'check' : 'star'}/><div><span>YOUR NEXT MOVE</span><p>{voyageObjective(state)}</p></div></section>
          <div className="vy-layout">
            <aside className="vy-context"><section className="vy-companion"><div className="vy-speaker">{scene.speaker === 'sera' ? <SeraPortrait/> : <GuestPortrait guest={scene.speaker}/>}<div><strong>{names[scene.speaker]}</strong><small>{scene.speaker === 'sera' ? seraHome ? 'Back with the crew' : 'Speaking from the upper post' : scene.speaker === 'tavi' ? 'Relay maker' : scene.speaker === 'mara' ? 'Watch and ferry captain' : 'Keeper of the record'}</small></div></div><p>{scene.brief}</p></section>
              <section className="vy-sources" aria-label="Source facts for this scene"><h2><Glyph name="book"/>On the table</h2>{scene.sources.map(source => <article key={source.title}><h3>{source.title}</h3><p>{source.text}</p></article>)}</section>
              {lastScene && <details className="vy-last-record"><summary>Carried forward · {lastScene.artifact}</summary><p>{lastScene.result}</p></details>}
            </aside>
            <div className="vy-play"><Workbench key={`${scene.id}:${boardEpoch}`} scene={scene} record={record} onAction={act}/>
              <section className="vy-review" aria-label="Review and record"><div className="vy-review-actions"><button className="av-button" data-voyage-review onClick={() => act({ type: 'review' })}>Review with {names[scene.speaker]} <Glyph name="eye"/></button><button className="av-button av-primary" data-voyage-seal disabled={!canSeal(state)} onClick={() => act({ type: 'seal' })}>{state.index === scenes.length - 1 ? 'Record the final charter' : 'Record & continue'} <Glyph name="arrow"/></button></div>
                {error && <p className="vy-error" role="alert">{error}</p>}
                {record.review && <div className={`vy-review-result ${record.review.gaps.length ? 'vy-gap' : 'vy-met'}`} role="status"><h2 ref={reviewRef} tabIndex={-1}>{record.review.gaps.length ? 'A condition is still open' : 'This board is ready to record'}</h2>{record.review.gaps.length ? record.review.gaps.map(gap => <p key={gap}>{gap}</p>) : <p>The current choices and observations meet this scene’s conditions. Recording commits the step and carries its evidence forward.</p>}</div>}
              </section>
              <button className="vy-hint-button" aria-expanded={showHint} onClick={() => setShowHint(!showHint)}><Portrait person="pip"/><span>Ask Pip what to look for</span></button>
              {showHint && <section className="vy-hint" role="status"><h2>Look for the dependency</h2><p>{scene.lesson}</p><p>Compare the source facts with the tiles or observations. Review the board to see which condition is still open; revising an unrecorded choice costs no lives.</p></section>}
            </div>
          </div>
        </>}
      </>}
    </main>
    {modal && <JourneyDialog title={modal === 'journal' ? 'Your journey journal' : 'Save & settings'} onClose={closeDialog}>
      {notice && <p className="vy-dialog-notice" role="alert">{notice}</p>}
      {modal === 'journal' && save && state ? <JourneyJournal save={save} state={state}/> : <>
        <p>{blocked.current ? 'Saving is paused. Export this tab before reloading or closing it.' : 'The continuation save includes your opening, hearing and archive histories, plus every step recorded since Stormglass.'}</p>
        {save && <><label className="av-setting"><input type="checkbox" checked={save.settings.lessMotion} onChange={event => update({ ...save, settings: { ...save.settings, lessMotion: event.target.checked } })}/> Reduce motion</label><label className="av-setting"><input type="checkbox" checked={save.settings.largeText} onChange={event => update({ ...save, settings: { ...save.settings, largeText: event.target.checked } })}/> Larger text</label></>}
        <div className="av-save-actions">{save && <button className="av-button" onClick={() => download(JSON.stringify(save, null, 2), 'asterfall-last-relay.json')}>Export journey</button>}<label className="av-import-label">Import journey<input aria-label="Import journey" type="file" accept="application/json,.json" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }}/></label><button className="av-button" onClick={loadStored}>Load stored journey</button>{raw.current !== null && <button className="av-button" onClick={() => download(raw.current!, 'asterfall-last-relay-original.json')}>Export original stored copy</button>}</div>
        <p>Accepts a completed archive export or a Last Relay continuation save. Unfinished earlier chapters cannot be skipped by import.</p>
        {pending && <section className="av-confirm" aria-label="Replace journey confirmation"><h3>Replace this journey?</h3><p>Export first to keep both histories. The imported journey includes its own earlier chapter records.</p><button className="av-button av-primary" onClick={() => replaced(pending)}>Replace journey</button><button className="av-button" onClick={() => setPending(null)}>Cancel replacement</button></section>}
        {save && (resetting ? <section className="av-confirm" aria-label="Restart continuation confirmation"><h3>Start from Stormglass again?</h3><p>The four continuation chapters will reset. The embedded first three chapters remain, and each original chapter keeps its separate stored copy.</p><button className="av-button" onClick={() => { const next = freshVoyageSave(save.arrival); next.settings = { ...save.settings }; replaced(next); }}>Confirm new continuation</button><button className="av-button" onClick={() => setResetting(false)}>Keep playing</button></section> : <button className="av-text-button" onClick={() => { nonce.current++; setPending(null); setResetting(true); }}>Start another continuation</button>)}
      </>}
    </JourneyDialog>}
  </div>;
}

function JourneyDialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="av-modal vy-modal" ref={ref} aria-labelledby="vy-modal-title" onCancel={event => { event.preventDefault(); onClose(); }}><header><h2 id="vy-modal-title">{title}</h2><button autoFocus aria-label="Close dialog" onClick={onClose}><Glyph name="close"/></button></header>{children}</dialog>;
}