import { scenes } from './content.ts';
import { replay as replayOpening } from '../model.ts';
import { replayCouncil } from '../council/model.ts';
import { replayArchive } from '../archive/model.ts';
import type { VoyageSave, VoyageState } from './types.ts';
import { Glyph } from './Art.tsx';

export function JourneyJournal({ save, state }: { save: VoyageSave; state: VoyageState }) {
  const archive = replayArchive(save.arrival), council = replayCouncil(save.arrival.arrival);
  const opening = replayOpening(save.arrival.arrival.arrival);
  return <div className="vy-journal">
    <p>The journal records your choices and their evidence. Recording a scene commits its outcome for this journey. Start a new continuation to explore a different route.</p>
    <details><summary>Chapters one to three · The trail to Stormglass</summary>
      <h3>The Missing Keeper</h3><p>Mara accepted the {opening.device === 'beacon' ? 'lantern with a clear sightline' : 'local-lookout arrangement with relief cover'}. The opening’s action history is retained.</p>
      <h3>The Missing Address</h3><p>{council.hearing?.route === 'written' ? 'Neri carried the signed night-watch account; the keeper confirmed the sketch.' : 'The relieved night keeper attended the hearing.'} The hearing set a 90-second all-quay storm target, with field evidence still to be collected.</p>
      {council.relief && <p>The relief handover delayed the ferry.</p>}{council.note && <p>The signed night-watch account remains in the source record.</p>}
      <h3>The Green Tally</h3><p>You {archive.route === 'amend' ? 'amended list B' : 'rebuilt the proposed list from the survey'} to include LQ07, CS02, EL03 and NW09. R-17 recorded three listed receivers; it did not establish local perception. The packet reached Stormglass as a proposal.</p>
      <p>The complete original histories of all three chapters are embedded in every continuation export.</p>
    </details>
    {state.records.map(record => {
      const scene = scenes.find(item => item.id === record.scene)!;
      const tiles = scene.sockets.flatMap(socket => socket.options);
      return <details key={record.scene} className="vy-journal-record">
        <summary><Glyph name={record.sealed ? 'seal' : 'tool'}/><span>Chapter {scene.chapter} · {scene.title}<small>{record.sealed ? scene.artifact : 'Current board · not recorded'}</small></span></summary>
        {record.sealed && <p className="vy-record-result">{scene.result}</p>}
        {scene.sockets.map(socket => <p key={socket.id}><strong>{socket.label}:</strong> {tiles.find(tile => tile.id === record.choices[socket.id])?.label ?? 'Not selected'}</p>)}
        {record.order.length > 0 && <ol>{record.order.map(id => <li key={id}>{scene.sequence?.find(tile => tile.id === id)?.label}</li>)}</ol>}
        {Object.entries(record.allocations).map(([role, value]) => <p key={role}><strong>{role}:</strong> {value} tokens each cycle</p>)}
        {record.runs.map(run => <article className="vy-journal-trial" key={run.caseId}><h4>{scene.cases?.find(item => item.id === run.caseId)?.label} · {run.passed ? 'expected response observed' : 'unmet condition'}</h4><p>{run.note}</p>{run.observations.map(row => <p key={row.site}><strong>{row.site}:</strong> {row.seconds === null ? 'No accepted packet time' : `${row.seconds} s`}; {row.action}.</p>)}</article>)}
        {record.review && <p><strong>Review:</strong> {record.review.gaps.length ? record.review.gaps.join(' ') : 'Current scene conditions met.'}</p>}
        <h4>What this step teaches</h4><p>{scene.lesson}</p><p className="vy-caption">{scene.topics.join(' · ')}</p>
        {scene.sources.map(source => <article key={source.title}><h4>{source.title}</h4><p>{source.text}</p></article>)}
      </details>;
    })}
    <p className="vy-caption">The settings and traces are authored fictional exercises. This journey is an introduction to systems thinking, not a professional qualification or a complete treatment of the referenced lifecycle disciplines.</p>
  </div>;
}