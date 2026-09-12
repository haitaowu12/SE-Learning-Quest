import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { quests, questById } from './campaign.ts';
import { concepts, processes, references } from './curriculum.ts';
import { beginQuest, canComplete, choose, completeQuest, derive, ending, flagsBefore, newSave, nextDecision, puzzlePassed, retryQuest, skills, storyDecisions, submitPuzzle, tradeTotals, train } from './engine.ts';
import { loadSave, MAX_SAVE_BYTES, parseSave, saveKey, writeSave } from './persistence.ts';
import type { LoadedSave, StoragePort } from './persistence.ts';
import { acts, badgeNames, cast, origins, skillNames } from './world.ts';
import type { Choice, Derived, Puzzle, Quest, Save, Skill } from './types.ts';
import './rpg.css';

type View = 'map' | 'quest' | 'journal' | 'keeper' | 'settings' | 'ending';
type Confirmation = { title: string; text: string; action: string; run: () => void };
const unavailableStorage: StoragePort = {
  getItem() { throw new Error('Storage unavailable'); },
  setItem() { throw new Error('Storage unavailable'); },
  removeItem() { throw new Error('Storage unavailable'); },
};
function browserStorage(): StoragePort { try { return window.localStorage; } catch { return unavailableStorage; } }
function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function focusHeading(): void {
  requestAnimationFrame(() => {
    const heading = document.querySelector<HTMLElement>('.rpg [data-scene-heading]');
    heading?.focus({ preventScroll: true });
    document.querySelector('.rpg')?.scrollTo({ top: 0, behavior: 'instant' });
  });
}

export default function RpgApp() {
  const storage = useRef(browserStorage());
  const key = useRef(saveKey(window.location.pathname));
  const [loaded] = useState<LoadedSave>(() => loadSave(storage.current, key.current));
  const [save, setSave] = useState(loaded.save);
  const raw = useRef(loaded.raw);
  const blocked = useRef(loaded.blocked);
  const [notice, setNotice] = useState(loaded.notice);
  const [status, setStatus] = useState(loaded.blocked ? 'Export to keep your progress' : loaded.raw ? 'Expedition restored' : 'Saves on this device');
  const [view, setView] = useState<View>(() => ending(loaded.save) ? 'ending' : loaded.save.activeQuestId ? 'quest' : 'map');
  const [region, setRegion] = useState(questById.get(save.activeQuestId ?? '')?.act ?? 1);
  const [feedback, setFeedback] = useState<Choice | null>(null);
  const [confirm, setConfirm] = useState<Confirmation | null>(null);
  const [journalMode, setJournalMode] = useState<'concepts' | 'artifacts'>('concepts');
  const [journalSearch, setJournalSearch] = useState('');
  const state = derive(save);
  const current = questById.get(save.activeQuestId ?? '');
  const finale = ending(save);

  useEffect(() => {
    const listener = (event: StorageEvent) => {
      if ((event.key === key.current || event.key === null) && event.newValue !== raw.current) {
        blocked.current = true;
        setNotice('Another tab changed this expedition. Export this tab’s progress or load the stored expedition in Settings. Automatic saving is paused.');
        setStatus('Saving paused · another tab changed the save');
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);

  function update(next: Save, replace = false): void {
    setSave(next);
    if (replace) {
      try { raw.current = storage.current.getItem(key.current); blocked.current = false; } catch { blocked.current = true; }
    }
    if (blocked.current) { setStatus('Progress in this tab · export to keep it'); return; }
    const result = writeSave(storage.current, key.current, next, raw.current);
    if (result.ok) { raw.current = result.raw; setStatus('Saved on this device'); setNotice(''); }
    else { blocked.current = true; setNotice(result.message); setStatus('Progress in this tab · export to keep it'); }
  }
  function act(action: () => Save): void {
    try { update(action()); } catch (error) { setNotice(error instanceof Error ? error.message : 'The action could not be completed.'); }
  }
  function navigate(next: View): void { setView(next); setFeedback(null); focusHeading(); }
  function travel(quest: Quest): void {
    try { update(beginQuest(save, quest.id)); setRegion(quest.act); navigate('quest'); } catch (error) { setNotice(String(error)); }
  }
  function claim(): void {
    try {
      const next = completeQuest(save);
      const gained = derive(next).xp - state.xp;
      update(next);
      setStatus(`Quest recorded · +${gained} XP${blocked.current ? ' · export to keep it' : ' · saved'}`);
      if (ending(next)) navigate('ending'); else focusHeading();
    } catch (error) { setNotice(String(error)); }
  }
  function importFile(file: File | undefined): void {
    if (!file) return;
    if (file.size > MAX_SAVE_BYTES) { setNotice('This file exceeds the 500 KB save limit. Your current expedition has not changed.'); return; }
    file.text().then((text) => {
      const imported = parseSave(text);
      const result = derive(imported);
      setConfirm({ title: 'Replace this expedition?', text: `Load ${imported.player.name}, level ${result.level}, with ${result.completed.length} of ${quests.length} quests recorded. Export your current expedition first to keep both histories.`, action: 'Replace expedition', run: () => {
        update(imported, true); setRegion(questById.get(imported.activeQuestId ?? '')?.act ?? 1); navigate(ending(imported) ? 'ending' : imported.activeQuestId ? 'quest' : 'map');
      } });
    }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : 'The file could not be read.'));
  }
  function newExpedition(): void {
    setConfirm({ title: 'Start a new expedition?', text: 'This replaces only the Asterfall save for this site. Export it first to keep this history. Your Coffee Lab and Rail Quest saves are separate.', action: 'Start new expedition', run: () => {
      update({ ...newSave(), settings: save.settings }, true); setRegion(1); navigate('map');
    } });
  }

  return <div tabIndex={-1} className={`rpg ${save.settings.reducedMotion ? 'reduce-motion' : ''} ${save.settings.highContrast ? 'high-contrast' : ''} ${save.settings.textScale >= 1.5 ? 'large-text' : ''}`}
    style={{ '--text-scale': save.settings.textScale } as CSSProperties}>
    <a className="rpg-skip" tabIndex={0} href="#rpg-main">Skip to the adventure</a>
    <header className="rpg-header">
      <a className="rpg-brand" href="#asterfall" onClick={() => navigate('map')} aria-label="Asterfall world map"><span aria-hidden="true">✧</span><span>ASTERFALL<small>THE LAST RELAY</small></span></a>
      <p className="rpg-header-note">An adventure in connected thinking</p>
      <a className="rpg-legacy" href="#episodes">Other episodes <span aria-hidden="true">↗</span></a>
    </header>
    {notice && <div className="rpg-notice" role="alert"><span>{notice}</span><button onClick={() => navigate('settings')}>Save & recovery</button></div>}
    {!save.onboarded && view !== 'settings' ? <Onboarding save={save} onBegin={(name, origin) => {
      update({ ...newSave(name, origin), onboarded: true, settings: save.settings }); navigate('map');
    }} onSettings={() => navigate('settings')} /> : <div className="rpg-layout">
      <aside className="rpg-sidebar">
        <div className="rpg-keeper-mini"><Portrait who="iona" /><div><strong>{save.player.name} Vale</strong><span>Level {state.level} · Relay keeper</span></div></div>
        <div className="rpg-xp"><label htmlFor="keeper-xp">{state.xp} XP <span>{400 - state.xp % 400} to next level</span></label><progress id="keeper-xp" max={400} value={state.xp % 400} /></div>
        <nav className="rpg-navigation" aria-label="Adventure">
          {([
            ['map', '⌁', 'World map'], ['quest', '✧', 'Current quest'], ['journal', '▤', 'Field journal'], ['keeper', '◇', 'Keeper & satchel'], ['settings', '⚙', 'Settings'],
          ] as [View, string, string][]).map(([page, icon, label]) => <button key={page} aria-current={view === page ? 'page' : undefined} disabled={page === 'quest' && !current} onClick={() => navigate(page)}><span aria-hidden="true">{icon}</span>{label}{page === 'keeper' && state.talentPoints > 0 && <small>{state.talentPoints}</small>}</button>)}
        </nav>
        <div className="rpg-sidebar-bottom"><span className="rpg-kicker">The expedition</span><strong>{state.completed.length} / {quests.length} quests</strong><progress aria-label="Campaign progress" max={quests.length} value={state.completed.length} /><p role="status" aria-live="polite">{status}</p></div>
      </aside>
      <main id="rpg-main" className="rpg-main" tabIndex={-1}>
        {view === 'map' && <>
          <SceneHeading eyebrow={`ACT ${region} / ${acts[region - 1].region}`} title={state.completed.length ? 'Follow the next light.' : 'Every light is a promise.'} text={acts[region - 1].subtitle} />
          <div className="rpg-map-shell"><WorldMap active={region} state={state} onSelect={setRegion} /><div className="rpg-map-caption"><span><i /> Your route through Asterfall</span><span>{state.completed.length === quests.length ? 'All six regions explored' : 'Choose a region · open a quest below'}</span></div></div>
          <div className="rpg-act-heading"><div><span className="rpg-kicker">CHAPTER {region}</span><h2>{acts[region - 1].name}</h2></div><span>{quests.filter((quest) => quest.act === region && state.completed.includes(quest.id)).length} / 4 recorded</span></div>
          <section className="rpg-quest-grid" aria-label={`Act ${region} quests`}>
            {quests.filter((quest) => quest.act === region).map((quest) => {
              const done = state.completed.includes(quest.id); const ready = state.unlocked.includes(quest.id);
              return <article key={quest.id} className={`rpg-quest-card ${done ? 'complete' : ready ? 'ready' : 'locked'}`}>
                <span className="rpg-kicker">{quest.id.replace('q', '')} / {quest.location}</span><h3>{quest.title}</h3><p>{quest.objective}</p>
                {!ready && <small>First: {quest.prerequisites.filter((id) => !state.completed.includes(id)).map((id) => questById.get(id)?.title).join(' + ')}</small>}
                <div><span className="rpg-quest-skill">{skillNames[quest.skill]}</span><button data-open-quest={quest.id} className="rpg-button" disabled={!ready} onClick={() => travel(quest)}>{done ? 'Read outcome' : save.records[quest.id] ? 'Resume quest' : ready ? 'Travel here' : 'Route locked'} <span aria-hidden="true">{done ? '✓' : '→'}</span></button></div>
              </article>;
            })}
          </section>
          {finale && <button className="rpg-button primary" onClick={() => navigate('ending')}>Return to your epilogue →</button>}
          <section className="rpg-story-note"><span aria-hidden="true">✧</span><p>“Look between the lights, Iona. That is where a system keeps its secrets.”<small>— the last line in Sera’s letter</small></p></section>
        </>}
        {view === 'quest' && current && <QuestScene key={current.id} quest={current} save={save} state={state} feedback={feedback} onChoose={(decisionId, choice) => {
          try { update(choose(save, decisionId, choice.id)); setFeedback(choice); focusHeading(); } catch (error) { setNotice(String(error)); }
        }} onContinue={() => { setFeedback(null); focusHeading(); }} onSubmit={(answer, assisted) => act(() => submitPuzzle(save, answer, assisted))} onClaim={claim} onRetry={() => {
          act(() => retryQuest(save)); setFeedback(null); focusHeading();
        }} onMap={() => navigate('map')} onNext={() => {
          const next = quests.find((quest) => state.unlocked.includes(quest.id) && !state.completed.includes(quest.id));
          if (next) travel(next); else navigate('ending');
        }} onArtifact={(questId) => { setJournalMode('artifacts'); setJournalSearch(questById.get(questId)?.title ?? ''); navigate('journal'); }} />}
        {view === 'journal' && <Journal save={save} state={state} mode={journalMode} search={journalSearch} onMode={setJournalMode} onSearch={setJournalSearch} />}
        {view === 'keeper' && <Keeper save={save} state={state} onTrain={(skill) => act(() => train(save, skill))} />}
        {view === 'settings' && <>
          <SceneHeading eyebrow="MAKE YOURSELF AT HOME" title="Your expedition, your pace." text="No timers. No lives to lose. Keep a copy of your journey and return whenever you’re ready." />
          <section className="rpg-panel rpg-settings"><h2>Reading & movement</h2><label>Text size<select value={save.settings.textScale} onChange={(event) => update({ ...save, settings: { ...save.settings, textScale: Number(event.target.value) as Save['settings']['textScale'] } })}>{[1, 1.25, 1.5, 2].map((size) => <option key={size} value={size}>{size * 100}%</option>)}</select></label>
            <label className="rpg-check"><input type="checkbox" checked={save.settings.reducedMotion} onChange={(event) => update({ ...save, settings: { ...save.settings, reducedMotion: event.target.checked } })} /> Reduce decorative movement</label>
            <label className="rpg-check"><input type="checkbox" checked={save.settings.highContrast} onChange={(event) => update({ ...save, settings: { ...save.settings, highContrast: event.target.checked } })} /> Increase contrast</label>
            <p>All choices work with Tab, Shift+Tab and Enter or Space. Bench lists use labelled move buttons. Your device’s reduced-motion preference is also respected.</p>
          </section>
          <section className="rpg-panel"><h2>Save & recovery</h2><p>Progress saves in this browser for this site. Clearing browser data removes that copy. An exported file lets you move to another device.</p><p className="rpg-save-status">{status}</p>
            <div className="rpg-actions"><button className="rpg-button primary" onClick={() => downloadText(JSON.stringify(save, null, 2), 'asterfall-expedition.json')}>Export expedition</button><label className="rpg-file-label">Import expedition<input aria-label="Import expedition" type="file" accept=".json,application/json" onChange={(event) => { importFile(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
            <div className="rpg-actions"><button className="rpg-button" onClick={() => setConfirm({ title: 'Load the stored expedition?', text: 'This replaces the progress in this tab with the browser’s saved copy. Export first to keep any unsaved decisions.', action: 'Load stored expedition', run: () => {
              const restored = loadSave(storage.current, key.current);
              if (restored.blocked) { setNotice(restored.notice); return; }
              raw.current = restored.raw; blocked.current = false; setNotice(''); setSave(restored.save); setStatus(restored.raw ? 'Expedition restored' : 'No stored expedition found'); setRegion(questById.get(restored.save.activeQuestId ?? '')?.act ?? 1); navigate(ending(restored.save) ? 'ending' : restored.save.activeQuestId ? 'quest' : 'map');
            } })}>Load stored expedition</button>
              <button className="rpg-button" disabled={raw.current === null} onClick={() => { if (raw.current !== null) downloadText(raw.current, 'asterfall-original-save.json'); }}>Export original stored copy</button></div>
            <button className="rpg-button danger" onClick={newExpedition}>Start a new expedition</button>
          </section>
          <section className="rpg-panel"><h2>About this journey</h2><p>An original learning adventure by the SE Learning Quest project. The field guide connects {processes.length} lifecycle process areas and {concepts.length - processes.length} supporting concepts to your experience.</p><p>These scenarios introduce systems engineering; they are not the complete standard, handbook, or a certification assessment. Full source texts remain with their publishers.</p><div className="rpg-reference-links">{Object.values(references).map((reference) => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.title} ↗</a>)}</div></section>
          {!save.onboarded && <button className="rpg-button primary" onClick={() => navigate('map')}>Return to the beginning</button>}
        </>}
        {view === 'ending' && finale && <>
          <SceneHeading eyebrow="THE END OF ONE JOURNEY" title={finale.title} text={finale.text} />
          <div className="rpg-ending-art" aria-hidden="true"><WorldArt lit={6} /></div>
          <section className="rpg-panel"><h2>{save.player.name}, Keeper of Tomorrow</h2><div className="rpg-final-stats"><span><strong>{quests.length}</strong>quests recorded</span><span><strong>{state.level}</strong>keeper level</span><span><strong>{state.xp}</strong>experience earned</span><span><strong>{state.concepts.length}</strong>field notes unlocked</span></div><p>Your ledger holds the choices, evidence and trade-offs behind this ending. Explore a different origin and different decisions on another expedition.</p><div className="rpg-actions"><button className="rpg-button primary" onClick={() => { setJournalMode('artifacts'); setJournalSearch(''); navigate('journal'); }}>Read your legacy</button><button className="rpg-button" onClick={() => downloadText(JSON.stringify(save, null, 2), 'asterfall-completed-expedition.json')}>Export completed journey</button><button className="rpg-button" onClick={newExpedition}>Play another expedition</button></div></section>
        </>}
      </main>
    </div>}
    <footer className="rpg-footer"><span>ASTERFALL · SE LEARNING QUEST</span><span>Build a world worth keeping.</span></footer>
    {confirm && <ConfirmDialog confirmation={confirm} onClose={() => setConfirm(null)} />}
  </div>;
}

function SceneHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return <header className="rpg-scene-heading"><span className="rpg-kicker">{eyebrow}</span><h1 data-scene-heading tabIndex={-1}>{title}</h1>{text && <p>{text}</p>}</header>;
}
function Portrait({ who }: { who: string }) {
  const person = cast[who];
  return <span className={`rpg-portrait ${who === 'pip' ? 'automaton' : ''}`} style={{ '--portrait-color': person?.color ?? '#a9cfb9' } as CSSProperties} aria-hidden="true"><span className="rpg-portrait-head" /><span className="rpg-portrait-cloak" /><i>{person?.initial ?? '✧'}</i></span>;
}

function Onboarding({ save, onBegin, onSettings }: { save: Save; onBegin: (name: string, origin: Skill) => void; onSettings: () => void }) {
  const [name, setName] = useState(save.player.name);
  const [origin, setOrigin] = useState<Skill>(save.player.origin);
  return <main id="rpg-main" className="rpg-onboarding" tabIndex={-1}>
    <div className="rpg-intro"><span className="rpg-kicker">A SYSTEMS-THINKING ROLEPLAYING ADVENTURE</span><h1 data-scene-heading tabIndex={-1}>The world is<br />coming apart.<br /><em>Find its connections.</em></h1><p>The storm bells have fallen silent. Your mentor has vanished. In your satchel: a broken compass and a letter that ends with a question.</p><p className="rpg-letter">“When every tower is working,<br />why are people still in the dark?”</p><p>You are Iona Vale, a keeper in training. Cross six island realms, gather a crew, and rebuild the last relay before Asterfall loses its way.</p>
      <div className="rpg-intro-facts"><span>24 connected quests</span><span>Choices with consequences</span><span>Saved as you play</span></div>
    </div>
    <div className="rpg-intro-world"><div className="rpg-cover-art" aria-hidden="true"><WorldArt lit={2} /><span className="rpg-cover-compass">N<br />✧</span><span className="rpg-cover-caption">THE DRIFTING WORLD OF ASTERFALL</span></div>
      <form className="rpg-create-keeper" onSubmit={(event) => { event.preventDefault(); onBegin(name.trim() || 'Iona', origin); }}><div className="rpg-form-heading"><Portrait who="iona" /><div><span className="rpg-kicker">YOUR STORY BEGINS HERE</span><h2>A keeper, not a chosen one.</h2></div></div>
        <label>Keeper’s first name<input value={name} maxLength={24} onChange={(event) => setName(event.target.value.replace(/[\u0000-\u001f]/g, ''))} placeholder="Iona" autoComplete="off" /></label>
        <label>Your background<select value={origin} onChange={(event) => setOrigin(event.target.value as Skill)}>{skills.map((skill) => <option key={skill} value={skill}>{origins[skill].title}</option>)}</select></label><p className="rpg-origin-description">{origins[origin].description}</p>
        <button className="rpg-button primary rpg-start" type="submit">Begin the journey <span aria-hidden="true">→</span></button><button className="rpg-text-button" type="button" onClick={onSettings}>Reading settings & saved expeditions</button>
        <small>Read the scene. Choose your action. Explore the consequences. You can recover from mistakes; no prior engineering knowledge is needed.</small>
      </form>
    </div>
  </main>;
}

function WorldArt({ lit = 0 }: { lit?: number }) {
  const points = [[155, 230], [370, 130], [625, 195], [185, 425], [440, 355], [665, 450]];
  return <svg viewBox="0 0 820 570" className="rpg-world-art" aria-hidden="true">
    <defs><linearGradient id="aster-sky" x2="0" y2="1"><stop stopColor="#122d32" /><stop offset="1" stopColor="#213d3d" /></linearGradient><linearGradient id="aster-rock" x2=".4" y2="1"><stop stopColor="#567b6c" /><stop offset="1" stopColor="#182f35" /></linearGradient><radialGradient id="aster-glow"><stop stopColor="#eed391" stopOpacity=".6" /><stop offset="1" stopColor="#e6c68a" stopOpacity="0" /></radialGradient></defs>
    <rect width="820" height="570" fill="url(#aster-sky)" />
    {Array.from({ length: 58 }, (_, i) => <circle key={i} cx={(i * 137 + 31) % 820} cy={(i * 83 + 29) % 570} r={i % 3 === 0 ? 1.5 : .75} fill="#bed4c6" opacity={.15 + (i % 4) * .12} />)}
    <circle cx="704" cy="84" r="35" fill="#e4d5aa" opacity=".18" /><circle cx="718" cy="73" r="30" fill="#173237" />
    <g className="rpg-clouds" fill="none" stroke="#9cbbad" strokeWidth="1" opacity=".13"><path d="M-40 306 Q130 235 310 308 T860 280M-60 327 Q130 256 310 329 T880 301M-40 90 Q170 170 360 94 T900 130M-40 520 Q130 460 360 520 T900 490" /></g>
    <path d="M155 230 Q260 65 370 130 T625 195 Q755 365 440 355 T185 425 Q405 550 665 450" fill="none" stroke="#b5a879" strokeWidth="2" strokeDasharray="4 10" opacity=".45" />
    {points.map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`} className="rpg-island">
      <ellipse cy="62" rx="90" ry="14" fill="#0c222a" opacity=".2" /><path d="M-84 -2 L-61 33 L-15 66 L28 47 L82 -3Z" fill="url(#aster-rock)" /><path d="M-65 8 L-28 36 L-15 66 L-13 20M28 8 L28 47L53 16" fill="none" stroke="#9cad85" opacity=".22" />
      <ellipse rx="84" ry="26" fill={i < lit ? '#6b8f75' : '#486f64'} /><ellipse cy="-3" rx="70" ry="19" fill={i < lit ? '#849b77' : '#5b8070'} />
      <path d="M-50 -9L-44 -39L-37 -9 M44 -5L51 -31L59 -5" fill="#214f4b" /><rect x="-22" y="-60" width="39" height="61" rx="3" fill="#8c9880" /><path d="M-31 -57 L-3 -85 L25 -57Z" fill="#3b6660" /><path d="M-17 -36 H13M-17 -24H13M-17 -12H13" stroke="#465f57" strokeWidth="2" />
      <rect x="-8" y="-53" width="11" height="18" rx="2" fill={i < lit ? '#f5d68b' : '#263f40'} />{i < lit && <circle cx="-3" cy="-44" r="48" fill="url(#aster-glow)" />}
      <path d="M-3 -85V-107L19 -99L-3 -93" fill="#c5a874" stroke="#c5a874" /><path d="M-54 4Q-6 19 51 6" fill="none" stroke="#d1c79b" strokeWidth="3" opacity=".5" />
      {i === 4 && <g fill="#a3b98c"><circle cx="-41" cy="-23" r="12" /><circle cx="39" cy="-19" r="9" /></g>}
    </g>)}
    <g transform="translate(352 451) rotate(-12)"><path d="M-26 0Q0 31 34 0Z" fill="#b69a70" /><path d="M1 -44V5M1 -41L27 -7H1Z" fill="#ded9b4" stroke="#ded9b4" /><path d="M-13 20H21" stroke="#8ba69c" opacity=".5" /></g>
  </svg>;
}
function WorldMap({ active, state, onSelect }: { active: number; state: Derived; onSelect: (id: number) => void }) {
  const positions = [[19, 40], [45, 22], [76, 34], [23, 75], [54, 62], [81, 79]];
  return <div className="rpg-world-map"><WorldArt lit={Math.max(1, Math.ceil(state.completed.length / 4))} /><nav aria-label="Island regions" className="rpg-map-regions">
    {acts.map((act, i) => {
      const open = quests.some((quest) => quest.act === act.id && state.unlocked.includes(quest.id));
      const complete = quests.filter((quest) => quest.act === act.id).every((quest) => state.completed.includes(quest.id));
      return <button className={`rpg-map-node ${active === act.id ? 'selected' : ''} ${open ? 'open' : ''}`} key={act.id} style={{ '--x': `${positions[i][0]}%`, '--y': `${positions[i][1]}%` } as CSSProperties} onClick={() => onSelect(act.id)} aria-pressed={active === act.id} aria-label={`Act ${act.id}: ${act.region}${complete ? ', complete' : open ? ', available' : ', locked quests'}`}><span aria-hidden="true">{complete ? '✓' : act.glyph}</span><strong>{act.region}</strong><small>{complete ? 'Explored' : active === act.id ? 'You are here' : open ? 'Charted route' : 'Beyond the mist'}</small></button>;
    })}
  </nav></div>;
}

function QuestScene({ quest, save, state, feedback, onChoose, onContinue, onSubmit, onClaim, onRetry, onMap, onNext, onArtifact }: {
  quest: Quest; save: Save; state: Derived; feedback: Choice | null;
  onChoose: (decisionId: string, choice: Choice) => void; onContinue: () => void;
  onSubmit: (answer: string[] | Record<string, string>, assisted?: boolean) => void;
  onClaim: () => void; onRetry: () => void; onMap: () => void; onNext: () => void; onArtifact: (questId: string) => void;
}) {
  const record = save.records[quest.id];
  const [hint, setHint] = useState(false);
  const decision = nextDecision(save, quest);
  const person = cast[quest.speaker] ?? cast.pip;
  const priorFlags = flagsBefore(save, quest);
  const echoes = quest.echoes?.filter((echo) => priorFlags[echo.when.flag] === echo.when.value) ?? [];
  const selected = storyDecisions(save, quest).flatMap((beat) => beat.options.filter((choice) => choice.id === record?.decisions[beat.id]));
  return <>
    <button className="rpg-text-button" onClick={onMap}>← Return to the world map</button>
    <SceneHeading eyebrow={`ACT ${quest.act} · QUEST ${quest.id.replace('q', '')} · ${quest.location}`} title={quest.title} text={record?.completed ? quest.conclusion : quest.brief} />
    <div className="rpg-quest-layout"><div>
      <div className="rpg-objective"><span className="rpg-kicker">{record?.completed ? 'RECORDED IN YOUR LEDGER' : 'YOUR OBJECTIVE'}</span><p>{quest.objective}</p></div>
      {echoes.map((echo, i) => <aside key={i} className="rpg-echo"><span className="rpg-kicker">AN EARLIER CHOICE RETURNS</span><p>{echo.text}</p></aside>)}
      {!record?.completed && feedback && <section className={`rpg-feedback ${feedback.quality}`} aria-label="Choice feedback"><span className="rpg-kicker">THE WORLD ANSWERS</span><div className="rpg-speaker"><Portrait who={quest.speaker} /><div><strong>{person.name}</strong><span>{person.role}</span></div></div><blockquote>{feedback.reply}</blockquote><h2>{feedback.quality === 'strong' ? 'A grounded choice' : feedback.quality === 'mixed' ? 'A choice with conditions' : 'A gap to learn from'}</h2><p>{feedback.feedback}</p><p className="rpg-tradeoff"><strong>The trade-off:</strong> {feedback.tradeoff}</p><EffectChips choice={feedback} /><div className="rpg-actions"><button className="rpg-button primary" onClick={onContinue}>{decision ? 'Continue the conversation' : quest.puzzle ? 'Open the workbench' : 'Review the outcome'} →</button><button className="rpg-button" onClick={onRetry}>Reconsider this quest</button></div></section>}
      {!record?.completed && !feedback && decision && <section className="rpg-dialogue" data-decision={decision.id}>
        <div className="rpg-speaker"><Portrait who={quest.speaker} /><div><strong>{person.name}</strong><span>{person.role}</span></div><small>{selected.length + 1} / {storyDecisions(save, quest).length}</small></div>
        <h2>{decision.prompt}</h2><p>{decision.context}</p><div className="rpg-choices">{decision.options.map((choice, i) => <button className="rpg-choice" key={choice.id} data-choice={choice.id} onClick={() => onChoose(decision.id, choice)}><span aria-hidden="true">{i + 1}</span><strong>{choice.label}</strong><i aria-hidden="true">↗</i></button>)}</div>
      </section>}
      {!record?.completed && !feedback && !decision && quest.puzzle && <PuzzleBench key={quest.id} puzzle={quest.puzzle} record={record} onSubmit={onSubmit} />}
      {!record?.completed && !feedback && canComplete(save, quest) && <section className="rpg-panel rpg-reward-preview"><span className="rpg-kicker">READY TO RECORD</span><h2>A new page in the ledger.</h2><p>{quest.conclusion}</p><p>Record your decisions, receive <strong>{quest.reward.name}</strong>, and unlock the next part of the journey.</p><div className="rpg-actions"><button data-claim={quest.id} className="rpg-button primary" onClick={onClaim}>Seal quest & claim reward →</button><button className="rpg-button" onClick={onRetry}>Reconsider this quest</button></div></section>}
      {record?.completed && <section className="rpg-panel rpg-quest-complete"><span className="rpg-complete-seal" aria-hidden="true">✧</span><span className="rpg-kicker">QUEST RECORDED</span><h2>{quest.reward.name}</h2><p>{quest.reward.description}</p><div className="rpg-reward-chips"><span>+1 {skillNames[quest.skill]}</span><span>{quest.processes.length + quest.concepts.filter((id) => !quest.processes.includes(id)).length} linked field notes</span></div><h3>{quest.artifact.title}</h3><p>{quest.artifact.body}</p><div className="rpg-actions"><button className="rpg-button primary" onClick={onNext}>{state.completed.length === quests.length ? 'Read your epilogue' : 'Follow the next light'} →</button><button className="rpg-button" onClick={() => onArtifact(quest.id)}>Inspect your artifact</button></div></section>}
      {selected.length > 0 && <details className="rpg-panel rpg-ledger-details"><summary>Decision ledger · {selected.length} recorded choices</summary>{selected.map((choice, i) => <article key={`${i}-${choice.id}`}><h3>{choice.label}</h3><p>{choice.feedback}</p><p><strong>Trade-off:</strong> {choice.tradeoff}</p></article>)}</details>}
    </div><aside className="rpg-quest-aside">
      <section className="rpg-panel"><span className="rpg-kicker">THE ISLANDS RESPOND</span><h2>Expedition state</h2><MetricBars state={state} /><small>Story indicators, not engineering probabilities. Resources change the story; they never prevent learning or recovery.</small></section>
      {quest.revisits.length > 0 && <section className="rpg-panel"><span className="rpg-kicker">BRING FORWARD</span><h2>From your satchel</h2>{quest.revisits.filter((id) => state.completed.includes(id)).map((id) => <button className="rpg-artifact-link" key={id} onClick={() => onArtifact(id)}><span aria-hidden="true">▤</span>{questById.get(id)?.artifact.title} ↗</button>)}</section>}
      <section className="rpg-panel"><span className="rpg-kicker">KEEPER’S INSTINCT</span><h2>{skillNames[quest.skill]}</h2>{state.skills[quest.skill] >= 3 ? <><button className="rpg-button" onClick={() => setHint(!hint)} aria-expanded={hint}>{hint ? 'Close field insight' : 'Consult your training'}</button>{hint && <p>{quest.hint}</p>}</> : <p>Reach 3 {skillNames[quest.skill]} through quests or training to unlock an extra field insight. Bench hints are always available.</p>}</section>
    </aside></div>
  </>;
}

function MetricBars({ state }: { state: Derived }) {
  return <div className="rpg-metrics">{(['trust', 'resilience', 'supplies'] as const).map((key) => <div key={key}><label htmlFor={`metric-${key}`}>{key}<strong>{state.metrics[key]}</strong></label><progress id={`metric-${key}`} max={100} value={state.metrics[key]} /></div>)}</div>;
}
function EffectChips({ choice }: { choice: Choice }) {
  return <div className="rpg-effect-chips">{Object.entries(choice.effects).filter(([, value]) => value !== 0).map(([key, value]) => <span key={key}>{value > 0 ? '+' : ''}{value} {key}</span>)}</div>;
}

function PuzzleBench({ puzzle, record, onSubmit }: { puzzle: Puzzle; record: Save['records'][string]; onSubmit: (answer: string[] | Record<string, string>, assisted?: boolean) => void }) {
  const [answer, setAnswer] = useState<string[] | Record<string, string>>(() => record.puzzleAnswer ?? (puzzle.kind === 'match' ? {} : puzzle.kind === 'order' ? puzzle.items.map((item) => item.id) : []));
  const [hint, setHint] = useState(false);
  const passed = puzzlePassed(puzzle, record.puzzleAnswer);
  const ids = Array.isArray(answer) ? answer : [];
  const matches = Array.isArray(answer) ? {} : answer;
  const totals = puzzle.kind === 'trade' ? tradeTotals(puzzle) : {};
  const [showTotals, setShowTotals] = useState(false);
  function move(index: number, offset: number): void {
    const next = [...ids]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; setAnswer(next);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-order-item="${ids[index]}"] button:not(:disabled)`)?.focus());
  }
  return <section className="rpg-bench" data-puzzle={puzzle.id}><span className="rpg-kicker">AT THE WORKBENCH · {puzzle.kind === 'trade' ? 'COMPARE DESIGNS' : puzzle.kind === 'match' ? 'CONNECT THE EVIDENCE' : puzzle.kind === 'order' ? 'PLAN THE SEQUENCE' : 'BUILD AN EVIDENCE SET'}</span><h2>{puzzle.title}</h2><p>{puzzle.prompt}</p>
    {passed ? <div className="rpg-bench-result success" role="status"><h3>{record.assisted ? 'Repaired with Pip’s guidance' : 'Evidence accepted'}</h3><p>{puzzle.success}</p>{record.assisted && <p>Guided work earns 20 bench XP. An independent solution earns 40. Both unlock the same journey.</p>}</div> : <>
      {puzzle.kind === 'trade' && <div className="rpg-table-wrap"><table><caption>Benefits use the scale stated in the scene. Higher is better. Weights express this expedition’s priorities.</caption><thead><tr><th>Design</th>{puzzle.criteria?.map((criterion) => <th key={criterion.id}>{criterion.label}<small>weight {criterion.weight}</small></th>)}{showTotals && <th>Weighted total</th>}</tr></thead><tbody>{puzzle.items.map((item) => <tr key={item.id}><th>{item.label}</th>{puzzle.criteria?.map((criterion) => <td key={criterion.id}>{puzzle.scores?.[item.id]?.[criterion.id]}</td>)}{showTotals && <td>{Number(totals[item.id].toFixed(2))}</td>}</tr>)}</tbody></table><button className="rpg-text-button" onClick={() => setShowTotals(!showTotals)}>{showTotals ? 'Hide calculated totals' : 'Calculate weighted totals'}</button></div>}
      {(puzzle.kind === 'select' || puzzle.kind === 'trade') && <fieldset className="rpg-bench-options"><legend>{puzzle.kind === 'select' ? 'Select the evidence you would carry forward.' : 'Choose a design for the stated priorities.'}</legend>{puzzle.items.map((item) => <label key={item.id} className={`rpg-bench-item ${ids.includes(item.id) ? 'selected' : ''}`}><input type={puzzle.kind === 'trade' ? 'radio' : 'checkbox'} name={puzzle.id} value={item.id} checked={ids.includes(item.id)} onChange={() => setAnswer(puzzle.kind === 'trade' ? [item.id] : ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} /><span><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}</span></label>)}</fieldset>}
      {puzzle.kind === 'match' && <div className="rpg-match-items">{puzzle.items.map((item) => <label key={item.id}><strong>{item.label}</strong>{item.detail && <small>{item.detail}</small>}<select data-match={item.id} value={matches[item.id] ?? ''} onChange={(event) => setAnswer({ ...matches, [item.id]: event.target.value })}><option value="">Choose a connection</option>{puzzle.categories?.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>)}</div>}
      {puzzle.kind === 'order' && <ol className="rpg-order-items">{ids.map((id, i) => <li key={id} data-order-item={id}><span>{i + 1}</span><div><strong>{puzzle.items.find((item) => item.id === id)?.label}</strong><small>{puzzle.items.find((item) => item.id === id)?.detail}</small></div><div className="rpg-order-controls"><button disabled={i === 0} aria-label={`Move ${puzzle.items.find((item) => item.id === id)?.label} earlier`} onClick={() => move(i, -1)}>↑</button><button disabled={i === ids.length - 1} aria-label={`Move ${puzzle.items.find((item) => item.id === id)?.label} later`} onClick={() => move(i, 1)}>↓</button></div></li>)}</ol>}
      {record.puzzleAnswer !== null && <div className="rpg-bench-result" role="status"><strong>Last attempt · a gap to investigate</strong><p>{puzzle.failure}</p><p>Revise the evidence below. There is no penalty for another attempt.</p></div>}
      <div className="rpg-actions"><button className="rpg-button primary" data-submit-puzzle onClick={() => onSubmit(puzzle.kind === 'match' ? Object.fromEntries(Object.entries(matches).filter(([, value]) => value)) : answer)}>Test this plan →</button><button className="rpg-button" aria-expanded={hint} onClick={() => setHint(!hint)}>{hint ? 'Close hint' : 'Ask Pip for a hint'}</button></div>
      {hint && <aside className="rpg-hint"><strong>Pip’s field note</strong><p>{puzzle.hint}</p></aside>}
      {record.attempts >= 2 && <details className="rpg-walkthrough"><summary>Work through it with Pip</summary><p>{puzzle.hint}</p><p>{puzzle.success}</p><Solution puzzle={puzzle} /><button className="rpg-button" onClick={() => onSubmit(puzzle.solution, true)}>Apply this guided repair</button></details>}
    </>}
  </section>;
}
function Solution({ puzzle }: { puzzle: Puzzle }) {
  const solution = puzzle.solution;
  return <ul>{Array.isArray(solution) ? solution.map((id, i) => <li key={id}>{puzzle.kind === 'order' ? `${i + 1}. ` : ''}{puzzle.items.find((item) => item.id === id)?.label}</li>) : Object.entries(solution).map(([id, category]) => <li key={id}>{puzzle.items.find((item) => item.id === id)?.label} → {puzzle.categories?.find((item) => item.id === category)?.label}</li>)}</ul>;
}

function Journal({ save, state, mode, search, onMode, onSearch }: { save: Save; state: Derived; mode: 'concepts' | 'artifacts'; search: string; onMode: (mode: 'concepts' | 'artifacts') => void; onSearch: (value: string) => void }) {
  const text = search.toLocaleLowerCase();
  const unlocked = concepts.filter((concept) => state.concepts.includes(concept.id));
  const filtered = unlocked.filter((concept) => `${concept.title} ${concept.explanation} ${concept.example}`.toLocaleLowerCase().includes(text));
  const records = quests.filter((quest) => state.completed.includes(quest.id) && `${quest.title} ${quest.artifact.title} ${quest.artifact.body}`.toLocaleLowerCase().includes(text));
  return <><SceneHeading eyebrow="THE KEEPER’S FIELD JOURNAL" title="What the journey taught you." text="New field notes and artifacts unlock as you record quests. Revisit your own decisions and the ideas beneath them." /><div className="rpg-journal-tools"><nav aria-label="Journal sections"><button aria-pressed={mode === 'concepts'} onClick={() => { onMode('concepts'); onSearch(''); }}>Field guide · {unlocked.length}/{concepts.length}</button><button aria-pressed={mode === 'artifacts'} onClick={() => { onMode('artifacts'); onSearch(''); }}>Evidence ledger · {state.completed.length}</button></nav><label>Search the journal<input type="search" value={search} onChange={(event) => onSearch(event.target.value)} placeholder="A concept, artifact or quest" /></label></div>
    {mode === 'concepts' ? <section className="rpg-journal-grid">{filtered.map((concept) => <article className="rpg-panel" key={concept.id}><span className="rpg-kicker">{processes.find((process) => process.id === concept.id)?.group ?? 'CONNECTED PRACTICE'}</span><h2>{concept.title}</h2><p>{concept.explanation}</p><blockquote>{concept.example}</blockquote><small>Encountered in {quests.filter((quest) => state.completed.includes(quest.id) && [...quest.processes, ...quest.concepts].includes(concept.id)).map((quest) => quest.title).join(' · ')}</small><a href={references[concept.source].url} target="_blank" rel="noreferrer">Explore the source reference ↗</a></article>)}</section> : <section className="rpg-artifact-ledger">{records.map((quest) => <article className="rpg-panel" key={quest.id}><span className="rpg-kicker">QUEST {quest.id.replace('q', '')} · {quest.title}</span><h2>{quest.artifact.title}</h2><p>{quest.artifact.body}</p><h3>Your recorded decisions</h3>{storyDecisions(save, quest).map((decision) => {
      const choice = decision.options.find((option) => option.id === save.records[quest.id]?.decisions[decision.id]);
      return choice && <div className="rpg-artifact-decision" key={decision.id}><strong>{choice.label}</strong><p>{choice.feedback}</p><small>{choice.tradeoff}</small></div>;
    })}{quest.puzzle && <details><summary>Bench evidence{save.records[quest.id].assisted ? ' · guided repair' : ''}</summary><p>{quest.puzzle.success}</p><Solution puzzle={quest.puzzle} /></details>}<p className="rpg-artifact-trace">Builds on: {quest.revisits.map((id) => questById.get(id)?.artifact.title).join(' → ') || 'The beginning of the expedition'}</p></article>)}</section>}
    {(mode === 'concepts' ? filtered.length : records.length) === 0 && <section className="rpg-panel"><h2>{search ? 'No matching field notes.' : 'Your first page is waiting.'}</h2><p>{search ? 'Try another search or switch journal sections.' : 'Record a quest to add its ideas, decisions and evidence here.'}</p></section>}
  </>;
}

function Keeper({ save, state, onTrain }: { save: Save; state: Derived; onTrain: (skill: Skill) => void }) {
  const companions = [...new Set(quests.filter((quest) => state.completed.includes(quest.id)).map((quest) => quest.speaker))];
  return <><SceneHeading eyebrow={`${origins[save.player.origin].title.toUpperCase()} · LEVEL ${state.level}`} title={`${save.player.name} Vale`} text="A keeper grows by listening, making, questioning, proving and caring for what comes next." /><section className="rpg-panel"><div className="rpg-act-heading"><h2>Your craft</h2><span>{state.talentPoints} training point{state.talentPoints === 1 ? '' : 's'} available</span></div><p>Each quest strengthens one skill. Every second level grants a training point; spend it for +2 in a skill. At 3, that skill unlocks an extra insight in related quests.</p><div className="rpg-skill-grid">{skills.map((skill) => <article key={skill}><span className="rpg-skill-value">{state.skills[skill]}</span><h3>{skillNames[skill]}</h3><p>{origins[skill].description}</p><button className="rpg-button" disabled={state.talentPoints <= 0} onClick={() => onTrain(skill)}>Train {skillNames[skill]} +2</button></article>)}</div></section>
    <section className="rpg-panel"><h2>Marks of the journey · {state.badges.length}/{badgeNames.length}</h2><div className="rpg-badge-grid">{badgeNames.map((badge) => <div key={badge} className={state.badges.includes(badge) ? 'earned' : ''}><span aria-hidden="true">{state.badges.includes(badge) ? '✧' : '◇'}</span><strong>{badge}</strong><small>{state.badges.includes(badge) ? 'Earned' : badge === 'Learned Through Repair' ? 'Recover from a mistake' : 'Continue the journey'}</small></div>)}</div></section>
    <section className="rpg-panel"><h2>Your travelling companions</h2>{companions.length ? <div className="rpg-party">{companions.map((who) => <div key={who}><Portrait who={who} /><strong>{cast[who]?.name ?? who}</strong><small>{cast[who]?.role}</small></div>)}</div> : <p>Meet your first companion at the Drifting Quays.</p>}</section>
    <section className="rpg-panel"><h2>In your satchel · {state.completed.length} keepsakes</h2>{state.completed.length ? <div className="rpg-inventory">{quests.filter((quest) => state.completed.includes(quest.id)).map((quest) => <article key={quest.id}><span aria-hidden="true">◇</span><div><h3>{quest.reward.name}</h3><p>{quest.reward.description}</p><small>From {quest.title}</small></div></article>)}</div> : <p>A broken compass. Sera’s letter. Room for everything you will learn.</p>}</section>
  </>;
}
function ConfirmDialog({ confirmation, onClose }: { confirmation: Confirmation; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="rpg-confirm" aria-labelledby="rpg-confirm-title" onCancel={(event) => { event.preventDefault(); onClose(); }}><h2 id="rpg-confirm-title">{confirmation.title}</h2><p>{confirmation.text}</p><div className="rpg-actions"><button className="rpg-button" autoFocus onClick={onClose}>Cancel</button><button className="rpg-button primary" onClick={() => { confirmation.run(); onClose(); }}>{confirmation.action}</button></div></dialog>;
}
