import { useState } from 'react';
import { Glyph, RouteDrawing } from './Art.tsx';
import { dutyRoles } from './content-helpers.ts';
import type { RecordState, Scene, Socket, TrialRun, VoyageAction } from './types.ts';

export interface BoardProps { scene: Scene; record: RecordState; onAction: (action: VoyageAction) => void }

function ChoiceSockets({ scene, record, onAction }: BoardProps) {
  return <div className="vy-choice-sockets">{scene.sockets.map(socket => <fieldset className="vy-choice-group" key={socket.id}>
    <legend>{socket.label}</legend><p className="vy-caption">{socket.detail}</p>
    <div className={`vy-options vy-options-${socket.options.length}`}>{socket.options.map(tile => {
      const chosen = record.choices[socket.id] === tile.id;
      const route = scene.kind === 'network' && socket.id === 'route';
      return <button type="button" className={`vy-option ${route ? 'vy-route-option' : ''}`} key={tile.id} data-voyage-choice={`${socket.id}:${tile.id}`} aria-pressed={chosen} onClick={() => onAction({ type: 'choose', socket: socket.id, tile: tile.id })}>
        {route ? <RouteDrawing route={tile.id}/> : <span className="vy-tile-emblem"><Glyph name={tile.symbol}/></span>}
        <span className="vy-tile-copy"><strong>{tile.label}</strong><span>{tile.detail}</span></span>
        <span className="vy-selection-mark" aria-hidden="true">{chosen ? '✓' : '○'}</span>
      </button>;
    })}</div>
  </fieldset>)}</div>;
}

function ConnectorBoard({ scene, record, onAction }: BoardProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const tiles = scene.sockets.flatMap(socket => socket.options);
  function choose(tile: string): void {
    setSelected(tile);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-voyage-socket]')?.focus({ preventScroll: true }));
  }
  function place(socket: Socket): void {
    if (!selected) return;
    onAction({ type: 'choose', socket: socket.id, tile: selected });
    setSelected(null);
  }
  return <div className="vy-connect-board">
    <div className="vy-tray" aria-label="Available connector tiles"><h3><Glyph name="tool"/>Parts tray</h3>
      <div className="vy-connect-tiles">{tiles.map(tile => <button className="vy-connector-tile" key={tile.id} data-voyage-tile={tile.id} aria-pressed={selected === tile.id} onClick={() => choose(tile.id)}>
        <Glyph name={tile.symbol}/><strong>{tile.label}</strong><span>{tile.detail}</span><span className="vy-plug-teeth" aria-hidden="true"/>
      </button>)}</div>
    </div>
    <p className="vy-placement-status" role="status">{selected ? `${tiles.find(tile => tile.id === selected)?.label} selected. Choose a socket below.` : 'Select a tile, then a socket. You can replace any connection before recording it.'}</p>
    <div className="vy-socket-bank" aria-label="Interface sockets">{scene.sockets.map((socket, index) => {
      const fitted = tiles.find(tile => tile.id === record.choices[socket.id]);
      return <button className={`vy-socket ${fitted ? 'vy-fitted' : ''}`} key={socket.id} data-voyage-socket={socket.id} onClick={() => place(socket)} aria-label={`${socket.label}: ${fitted?.label ?? 'empty'}${selected ? '; place selected tile' : '; select a tile first'}`}>
        <span className="vy-socket-number">{String(index + 1).padStart(2, '0')}</span><strong>{socket.label}</strong><small>{socket.detail}</small>
        <span className="vy-socket-fit"><Glyph name={fitted?.symbol ?? 'link'}/><span>{fitted?.label ?? 'Place a tile'}</span></span>
      </button>;
    })}</div>
  </div>;
}

function SequenceBoard({ scene, record, onAction }: BoardProps) {
  function move(tile: string, direction: 'up' | 'down'): void {
    onAction({ type: 'move', tile, direction });
    requestAnimationFrame(() => {
      const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-voyage-card="${tile}"] button`));
      (buttons.find(button => button.dataset.direction === direction && !button.disabled) ?? buttons.find(button => !button.disabled))?.focus();
    });
  }
  return <div className="vy-sequence" aria-label="Work sequence">{record.order.map((id, index) => {
    const tile = scene.sequence!.find(item => item.id === id)!;
    return <article className="vy-sequence-card" data-voyage-card={id} key={id}>
      <span className="vy-sequence-number" aria-label={`Position ${index + 1}`}>{index + 1}</span><Glyph name={tile.symbol}/>
      <div><h3>{tile.label}</h3><p>{tile.detail}</p></div>
      <div className="vy-move-buttons"><button data-direction="up" disabled={index === 0} aria-label={`Move ${tile.label} earlier`} onClick={() => move(id, 'up')}>↑</button><button data-direction="down" disabled={index === record.order.length - 1} aria-label={`Move ${tile.label} later`} onClick={() => move(id, 'down')}>↓</button></div>
    </article>;
  })}</div>;
}

function Observations({ run, scene }: { run: TrialRun; scene: Scene }) {
  return <section className={`vy-observations ${run.passed ? 'vy-met' : 'vy-gap'}`} aria-label="Exercise observations" aria-live="polite">
    <header><Glyph name={run.passed ? 'check' : 'eye'}/><div><h3>{run.passed ? 'Expected response observed' : 'An expected response is missing'}</h3><p>{scene.cases?.find(item => item.id === run.caseId)?.condition}</p></div></header>
    <p className="vy-trace-note">{run.note}</p>
    <div className="vy-observation-rows">{run.observations.map(observation => <article className="vy-observation" key={observation.site}>
      <div className="vy-site-name"><Glyph name="relay"/><strong>{observation.site}</strong><span>{observation.seconds === null ? '—' : `${observation.seconds} s`}</span></div>
      <div className="vy-time-track" aria-hidden="true"><span style={{ width: `${Math.min(100, (observation.seconds ?? 0) / 90 * 100)}%` }}/><i/></div>
      <div className="vy-evidence-chips"><span>Packet: {observation.received ? 'accepted' : run.caseId === 'replay' ? 'rejected' : 'not received'}</span><span>Perception: {observation.perceived === null ? 'not observed' : observation.perceived ? 'observed' : 'not observed'}</span></div>
      <p>{observation.action}</p>
    </article>)}</div>
    <p className="vy-caption">{scene.id === 'receiver' ? 'Receiver timing is shown against the 90-second mission reference; it is not a measurement of local perception.' : 'Timing reference: 90 seconds from authenticated order to local warning.'} These traces are fictional case observations within the game.</p>
  </section>;
}

function TrialBoard(props: BoardProps) {
  const { scene, record, onAction } = props;
  const [activeCase, setActiveCase] = useState<string | null>(null);
  const active = record.runs.find(run => run.caseId === activeCase) ?? record.runs.at(-1);
  return <div className="vy-trial-board">
    <ChoiceSockets {...props}/>
    <div className="vy-exercise-deck" aria-label="Exercise controls">{scene.cases!.map(exercise => {
      const run = record.runs.find(item => item.caseId === exercise.id);
      const symbol = ['night'].includes(exercise.id) ? 'moon' : ['squall', 'winter', 'outage'].includes(exercise.id) ? 'storm' : 'sun';
      return <button className="vy-exercise" key={exercise.id} data-voyage-run={exercise.id} disabled={scene.sockets.some(socket => !record.choices[socket.id])} onClick={() => { onAction({ type: 'run', caseId: exercise.id }); setActiveCase(exercise.id); }}>
        <Glyph name={symbol}/><strong>Run {exercise.label}</strong><span>{exercise.condition}</span><small>{run ? run.passed ? '✓ Expected response observed' : '△ Review the observations' : 'No observations yet'}</small>
      </button>;
    })}</div>
    {active ? <Observations run={active} scene={scene}/> : <div className="vy-empty-trace"><Glyph name="eye"/><p>Fit a configuration, then run an exercise. The observation board will show what each quay received and what the exercise actually observed.</p></div>}
  </div>;
}

function AllocationBoard(props: BoardProps) {
  const { record, onAction } = props;
  const total = Object.values(record.allocations).reduce((sum, amount) => sum + amount, 0);
  return <div className="vy-allocation-board">
    <ChoiceSockets {...props}/>
    <section className="vy-token-budget" aria-label="Recurring duty budget"><div><h3>Six tokens each service cycle</h3><p role="status">{total > 6 ? `${total - 6} over budget — rebalance before recording` : `${6 - total} remaining in reserve`}</p></div><div className="vy-coins" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span className={index < total ? 'vy-spent' : ''} key={index}>✦</span>)}</div></section>
    <div className="vy-duty-roles">{dutyRoles.map((role, index) => <section className="vy-duty-role" key={role.id}>
      <Glyph name={['crew', 'book', 'tool', 'eye'][index]}/><div><h3>{role.label}</h3><p>{role.detail}</p><small>Minimum {role.minimum} token{role.minimum === 1 ? '' : 's'}</small></div>
      <div className="vy-stepper"><button aria-label={`Remove a token from ${role.label}`} data-voyage-allocate={`${role.id}:down`} disabled={!record.allocations[role.id]} onClick={() => onAction({ type: 'allocate', role: role.id, amount: (record.allocations[role.id] ?? 0) - 1 })}>−</button><output aria-label={`${role.label} tokens`}>{record.allocations[role.id] ?? 0}</output><button aria-label={`Add a token to ${role.label}`} data-voyage-allocate={`${role.id}:up`} disabled={record.allocations[role.id] === 6} onClick={() => onAction({ type: 'allocate', role: role.id, amount: (record.allocations[role.id] ?? 0) + 1 })}>+</button></div>
    </section>)}</div>
  </div>;
}

export function Workbench(props: BoardProps) {
  const { scene } = props;
  return <div className={`vy-workbench vy-board-${scene.kind}`}>
    <header className="vy-bench-heading"><Glyph name={scene.kind === 'trial' ? 'eye' : scene.kind === 'allocation' ? 'crew' : 'tool'}/><div><p className="av-kicker">YOUR WORKBENCH</p><h2>{scene.objective}</h2></div></header>
    {scene.kind === 'connect' ? <ConnectorBoard {...props}/> : scene.kind === 'sequence' ? <SequenceBoard {...props}/> : scene.kind === 'trial' ? <TrialBoard {...props}/> : scene.kind === 'allocation' ? <AllocationBoard {...props}/> : <ChoiceSockets {...props}/>}
  </div>;
}