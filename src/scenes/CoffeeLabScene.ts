import * as Phaser from 'phaser';
import coffeeLabCourseData from '../data/coffee-lab-course.json' with { type: 'json' };
import { coffeeLabJourney } from '../data/coffee-lab-journey.ts';
import { AudioManager } from '../components/AudioManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { CoffeeLabProgressManager } from '../game/CoffeeLabProgressManager.ts';
import type { CoffeeLabCourse, CoffeeLabProgressState, CoffeeLabTerm, CoffeeLabUnit } from '../types/index.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';
import { STANDARDS_REFS } from '../utils/standardsRefs.ts';

const course = coffeeLabCourseData as CoffeeLabCourse;

const standardsPublicLinks = {
  iso15288: 'https://www.iso.org/standard/81702.html',
  incose: 'https://www.incose.org/resource/incose-systems-engineering-handbook-a-guide-for-system-life-cycle-processes-and-activities-5th-edition/',
  en50126: 'https://standards.iteh.ai/catalog/standards/clc/e5456892-eb2c-437e-8c4b-91c08007f0b4/en-50126-1-2017',
} as const;

const standardsMap: Record<string, Array<{ label: string; plain: string; url: string }>> = {
  frame: [
    { label: `${STANDARDS_REFS.iso15288.technical_processes}: mission framing`, plain: 'Begin with the problem, boundary, stakeholders, measures, and assumptions.', url: standardsPublicLinks.iso15288 },
    { label: 'INCOSE SE Handbook 5th ed.: systems concepts and lifecycle overview', plain: 'Use the system-of-interest and boundary before choosing a solution.', url: standardsPublicLinks.incose },
  ],
  define: [
    { label: STANDARDS_REFS.iso15288.stakeholder_requirements, plain: 'Translate stakeholder intent into needs with context.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.iso15288.system_requirements, plain: 'Turn needs into verifiable requirements and proof intent.', url: standardsPublicLinks.iso15288 },
    { label: `${STANDARDS_REFS.incose.stakeholder_requirements} / ${STANDARDS_REFS.incose.requirements_analysis}`, plain: 'Keep traceability understandable, not just administrative.', url: standardsPublicLinks.incose },
  ],
  architect: [
    { label: `${STANDARDS_REFS.iso15288.architecture} + ${STANDARDS_REFS.iso15288.design}`, plain: 'Allocate functions, define interfaces, and make the solution buildable.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.iso15288.system_analysis, plain: 'Compare options using criteria, assumptions, and sensitivity.', url: standardsPublicLinks.iso15288 },
    { label: `${STANDARDS_REFS.en50126.risk_analysis} / ${STANDARDS_REFS.en50126.risk_acceptance}`, plain: 'For RAMS, show hazard, control, proof, owner, acceptance, and residual risk.', url: standardsPublicLinks.en50126 },
  ],
  implement: [
    { label: STANDARDS_REFS.iso15288.implementation, plain: 'Confirm each delivered element matches the approved baseline.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.incose.configuration_management, plain: 'Control versions of hardware, labels, instructions, support routes, and supplier commitments.', url: standardsPublicLinks.incose },
  ],
  integrate: [
    { label: STANDARDS_REFS.iso15288.integration, plain: 'Combine elements through controlled interfaces and retest fixes.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.en50126.verification_validation, plain: 'Use interface evidence and regression checks before acceptance pressure.', url: standardsPublicLinks.en50126 },
  ],
  prove: [
    { label: `${STANDARDS_REFS.iso15288.verification} + ${STANDARDS_REFS.iso15288.validation} + ${STANDARDS_REFS.iso15288.transition}`, plain: 'Separate requirement proof, fit-for-use proof, and move-into-use readiness.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.incose.quality_assurance, plain: 'Assurance means confidence in evidence quality, not extra paperwork.', url: standardsPublicLinks.incose },
    { label: STANDARDS_REFS.en50126.verification_validation, plain: 'For RAMS-related claims, evidence must support the safety and service confidence claim.', url: standardsPublicLinks.en50126 },
  ],
  operate: [
    { label: `${STANDARDS_REFS.iso15288.operation} + ${STANDARDS_REFS.iso15288.maintenance}`, plain: 'Use live measures, incidents, maintenance actions, and controlled change after launch.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.incose.measurement, plain: 'Signals need thresholds, owners, actions, and recheck dates.', url: standardsPublicLinks.incose },
    { label: STANDARDS_REFS.en50126.lifecycle_activities, plain: 'RAMS confidence continues through operation and maintenance.', url: standardsPublicLinks.en50126 },
  ],
  retire: [
    { label: STANDARDS_REFS.iso15288.disposal, plain: 'Retirement includes physical, data, supplier, support, safety, and record closure.', url: standardsPublicLinks.iso15288 },
    { label: STANDARDS_REFS.incose.decision_management, plain: 'Gate recommendations need evidence, conditions, owners, dates, and residual risk.', url: standardsPublicLinks.incose },
    { label: STANDARDS_REFS.en50126.lifecycle_activities, plain: 'RAMS lifecycle thinking includes decommissioning and feed-forward learning.', url: standardsPublicLinks.en50126 },
  ],
};

const lessonVisuals: Record<string, {
  image: string;
  fallback: string;
  title: string;
  alt: string;
  insight: string;
  chips: string[];
}> = {
  frame: {
    image: 'assets/coffee-lab/frame.webp',
    fallback: 'assets/coffee-lab/frame.png',
    title: 'Start with service, not equipment',
    alt: 'Office team studying a worn coffee service as a lifecycle problem.',
    insight: 'The first move is to make the system-of-interest visible: people, workflow, machine, supplies, space, support, and measures.',
    chips: ['Boundary', 'Stakeholders', 'Mission pain'],
  },
  define: {
    image: 'assets/coffee-lab/define.webp',
    fallback: 'assets/coffee-lab/define.png',
    title: 'Turn voices into proof-ready requirements',
    alt: 'Stakeholder notes flowing into structured requirement cards.',
    insight: 'Raw comments become useful when they preserve intent, define conditions, and name how evidence will prove the claim.',
    chips: ['Needs', 'Requirements', 'Trace'],
  },
  architect: {
    image: 'assets/coffee-lab/choose.webp',
    fallback: 'assets/coffee-lab/choose.png',
    title: 'Choose with criteria before locking design',
    alt: 'Coffee service options compared through decision criteria and risk markers.',
    insight: 'A trade study keeps the choice tied to wait time, maintainability, cost, risk, and user fit instead of feature preference.',
    chips: ['Trade study', 'Architecture', 'RAMS'],
  },
  implement: {
    image: 'assets/coffee-lab/realize.webp',
    fallback: 'assets/coffee-lab/realize.png',
    title: 'Realize the configured system',
    alt: 'Exploded coffee system with utilities, supply, waste, support app, and ownership connectors.',
    insight: 'Implementation is not just buying hardware. Each delivered element needs configuration, acceptance, ownership, and defect handling.',
    chips: ['Baseline', 'Configuration', 'Nonconformance'],
  },
  integrate: {
    image: 'assets/coffee-lab/realize.webp',
    fallback: 'assets/coffee-lab/realize.png',
    title: 'Interfaces carry the real integration risk',
    alt: 'Coffee service elements connected through water, power, supply, waste, support, and ownership interfaces.',
    insight: 'Integration proves handoffs. A machine can pass alone and still fail when connected to people, utilities, support, and space.',
    chips: ['Interfaces', 'Sequence', 'Retest'],
  },
  prove: {
    image: 'assets/coffee-lab/prove.webp',
    fallback: 'assets/coffee-lab/prove.png',
    title: 'Separate technical proof from user proof',
    alt: 'Technician testing the coffee service while employees validate it in real morning use.',
    insight: 'Verification asks whether requirements are met. Validation asks whether the service solves the office problem in real use.',
    chips: ['Verification', 'Validation', 'Transition'],
  },
  operate: {
    image: 'assets/coffee-lab/decide.webp',
    fallback: 'assets/coffee-lab/decide.png',
    title: 'Operations turns evidence into decisions',
    alt: 'Lifecycle evidence board with risks, measures, artifacts, and a gate decision.',
    insight: 'After launch, measures, incidents, maintenance, and user feedback update the evidence thread and trigger controlled changes.',
    chips: ['Measures', 'Maintenance', 'Change'],
  },
  retire: {
    image: 'assets/coffee-lab/decide.webp',
    fallback: 'assets/coffee-lab/decide.png',
    title: 'Close the lifecycle deliberately',
    alt: 'Review board showing artifact evidence, risks, lifecycle map, and gate decision indicators.',
    insight: 'Disposal and final decisions still need evidence: what closes, who owns conditions, what risk remains, and what future projects should learn.',
    chips: ['Disposal', 'Gate', 'Learning'],
  },
};

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function list(items: string[], className = ''): string {
  return `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function termList(items: string[], terms: CoffeeLabTerm[], className = ''): string {
  return `<ul class="${className}">${items.map((item) => `<li>${annotateTerms(item, terms, 3)}</li>`).join('')}</ul>`;
}

function findUnit(unitId: string): CoffeeLabUnit {
  return course.units.find((unit) => unit.id === unitId) ?? course.units[0];
}

function nextUnit(unit: CoffeeLabUnit): CoffeeLabUnit | null {
  return course.units.find((candidate) => candidate.order === unit.order + 1) ?? null;
}

function previousUnit(unit: CoffeeLabUnit): CoffeeLabUnit | null {
  return course.units.find((candidate) => candidate.order === unit.order - 1) ?? null;
}

function activeClass(condition: boolean, className: string): string {
  return condition ? className : '';
}

let termAnnotationState: { usedTerms: Set<string>; limit: number } | null = null;

const veeNodePoints = [
  { x: 34, y: 30, phase: 'Need' },
  { x: 56, y: 72, phase: 'Req' },
  { x: 82, y: 114, phase: 'Design' },
  { x: 112, y: 154, phase: 'Build' },
  { x: 142, y: 154, phase: 'Join' },
  { x: 172, y: 114, phase: 'Prove' },
  { x: 198, y: 72, phase: 'Use' },
  { x: 220, y: 30, phase: 'Retire' },
] as const;

function renderVeeLifecycle(unit: CoffeeLabUnit, progress: CoffeeLabProgressState, completion: number, previousOrder: number): string {
  const currentPoint = veeNodePoints[Math.max(0, Math.min(unit.order - 1, veeNodePoints.length - 1))];
  const previousPoint = veeNodePoints[Math.max(0, Math.min(previousOrder - 1, veeNodePoints.length - 1))];
  return `
    <section class="lab-progress-summary vee-lifecycle-card" aria-label="Systems Vee lifecycle position">
      <div class="vee-card-top">
        <span>Systems Vee</span>
        <strong>${unit.order}/${course.units.length} ${escapeHtml(unit.cluster)}</strong>
      </div>
      <svg class="lab-vee-svg" viewBox="0 0 254 186" role="img" aria-label="Current lesson position on the Systems Vee">
        <path class="lab-vee-path" d="M34 30 L56 72 L82 114 L112 154 L142 154 L172 114 L198 72 L220 30" />
        <path class="lab-vee-cross" d="M82 114 C104 84 150 84 172 114" />
        ${course.units.map((candidate, index) => {
          const point = veeNodePoints[index];
          return `
            <g class="lab-vee-node ${activeClass(candidate.id === unit.id, 'current')} ${activeClass(progress.completedUnitIds.includes(candidate.id), 'complete')}">
              <circle cx="${point.x}" cy="${point.y}" r="8" />
              <text x="${point.x}" y="${point.y - 13}" text-anchor="middle">${candidate.order}</text>
              <text x="${point.x}" y="${point.y + 25}" text-anchor="middle">${escapeHtml(point.phase)}</text>
            </g>
          `;
        }).join('')}
        <circle class="lab-vee-marker" cx="${currentPoint.x}" cy="${currentPoint.y}" r="12">
          <animate attributeName="cx" from="${previousPoint.x}" to="${currentPoint.x}" dur="0.42s" fill="freeze" />
          <animate attributeName="cy" from="${previousPoint.y}" to="${currentPoint.y}" dur="0.42s" fill="freeze" />
        </circle>
      </svg>
      <div class="vee-progress-row">
        <span>${progress.completedUnitIds.length}/${course.units.length} artifacts</span>
        <div class="lab-progress-meter"><i style="width:${completion}%"></i></div>
      </div>
      <small>Evidence: ${escapeHtml(unit.practice.artifact)}</small>
    </section>
  `;
}

function termInfoButton(term: CoffeeLabTerm): string {
  return `
    <button class="term-dot js-term-popover"
      type="button"
      title="Define ${escapeHtml(term.term)}"
      aria-label="Define ${escapeHtml(term.term)}"
      data-term="${escapeHtml(term.term)}"
      data-plain="${escapeHtml(term.plain)}"
      data-example="${escapeHtml(term.example)}">
      <span aria-hidden="true">i</span>
    </button>
  `;
}

function annotateTerms(value: string, terms: CoffeeLabTerm[], maxTerms = 3): string {
  if (terms.length === 0 || maxTerms <= 0) return escapeHtml(value);
  const termByLower = new Map(terms.map((term) => [term.term.toLowerCase(), term]));
  const pattern = terms
    .map((term) => escapeRegExp(term.term))
    .sort((a, b) => b.length - a.length)
    .join('|');
  const matcher = new RegExp(`(^|[^A-Za-z0-9-])(${pattern})(?=$|[^A-Za-z0-9-])`, 'gi');
  const usedTerms = new Set<string>();
  let output = '';
  let lastIndex = 0;
  let count = 0;

  for (const match of value.matchAll(matcher)) {
    const prefix = match[1] ?? '';
    const matchedTerm = match[2] ?? '';
    const term = termByLower.get(matchedTerm.toLowerCase());
    const matchIndex = match.index ?? 0;
    const termStart = matchIndex + prefix.length;
    const termEnd = termStart + matchedTerm.length;
    const normalizedTerm = term?.term.toLowerCase() ?? '';
    if (
      !term
      || usedTerms.has(normalizedTerm)
      || termAnnotationState?.usedTerms.has(normalizedTerm)
      || (termAnnotationState && termAnnotationState.usedTerms.size >= termAnnotationState.limit)
      || count >= maxTerms
    ) continue;

    output += escapeHtml(value.slice(lastIndex, termStart));
    output += `<span class="term-inline">${escapeHtml(value.slice(termStart, termEnd))}${termInfoButton(term)}</span>`;
    lastIndex = termEnd;
    usedTerms.add(normalizedTerm);
    termAnnotationState?.usedTerms.add(normalizedTerm);
    count += 1;
  }

  output += escapeHtml(value.slice(lastIndex));
  return output;
}

function lifecycleRoute(unit: CoffeeLabUnit, progress: CoffeeLabProgressState): string {
  return `
    <div class="coffee-lifecycle-route" aria-label="Coffee lab lifecycle route">
      ${course.units.map((candidate) => `
        <button class="route-station ${activeClass(candidate.id === unit.id, 'current')} ${activeClass(progress.completedUnitIds.includes(candidate.id), 'complete')} js-unit" data-unit-id="${candidate.id}">
          <span>${candidate.order}</span>
          <strong>${escapeHtml(candidate.cluster)}</strong>
        </button>
      `).join('')}
    </div>
  `;
}

function renderBoundaryDiagram(): string {
  return `
    <div class="coffee-diagram boundary-board">
      <svg viewBox="0 0 760 420" role="img" aria-label="Coffee service boundary diagram">
        <rect class="office-floor" x="28" y="34" width="704" height="342" rx="26" />
        <rect class="system-boundary" x="190" y="78" width="350" height="246" rx="22" />
        <text class="diagram-title" x="365" y="112" text-anchor="middle">System-of-interest</text>
        <g class="coffee-machine" transform="translate(296 152)">
          <rect x="0" y="0" width="132" height="104" rx="16" />
          <rect x="34" y="20" width="64" height="32" rx="8" />
          <path d="M38 72h56l-8 34H46z" />
        </g>
        <g class="diagram-chip" transform="translate(222 132)"><rect width="104" height="44" rx="12" /><text x="52" y="27" text-anchor="middle">Supplies</text></g>
        <g class="diagram-chip" transform="translate(422 132)"><rect width="94" height="44" rx="12" /><text x="47" y="27" text-anchor="middle">Cleaning</text></g>
        <g class="diagram-chip" transform="translate(222 266)"><rect width="116" height="44" rx="12" /><text x="58" y="27" text-anchor="middle">Support log</text></g>
        <g class="diagram-chip" transform="translate(410 266)"><rect width="100" height="44" rx="12" /><text x="50" y="27" text-anchor="middle">Queue area</text></g>
        <g class="external-actor" transform="translate(62 92)"><circle cx="38" cy="38" r="36" /><text x="38" y="43" text-anchor="middle">Users</text></g>
        <g class="external-actor" transform="translate(612 92)"><circle cx="38" cy="38" r="36" /><text x="38" y="43" text-anchor="middle">Vendor</text></g>
        <g class="external-actor" transform="translate(60 278)"><circle cx="38" cy="38" r="36" /><text x="38" y="43" text-anchor="middle">Finance</text></g>
        <g class="external-actor" transform="translate(612 278)"><circle cx="38" cy="38" r="36" /><text x="38" y="38" text-anchor="middle">Facilities</text><text x="38" y="54" text-anchor="middle">Utilities</text></g>
        <path class="interface-line" d="M138 128h52" />
        <path class="interface-line" d="M540 130h72" />
        <path class="interface-line" d="M136 316h74" />
        <path class="interface-line" d="M540 316h74" />
      </svg>
      <div class="diagram-callouts">
        <button class="diagram-hotspot js-hotspot" data-detail="Interfaces become visible when the boundary shows what the project controls and what it must coordinate.">Boundary exposes interfaces</button>
        <button class="diagram-hotspot js-hotspot" data-detail="Machine-only scope would miss queue flow, supplies, cleaning, support, waste, and users.">Machine-only scope hides service work</button>
        <button class="diagram-hotspot js-hotspot" data-detail="Peak wait and stockout complaints prove service value better than a product specification alone.">Measures belong to the pain</button>
      </div>
      <p class="diagram-insight">Select a callout to reveal the decision risk.</p>
    </div>
  `;
}

function renderTraceDiagram(): string {
  const rows = [
    ['Employee comment', 'Morning queue is too long', 'Fast peak service', 'Avg wait <= 3 min', 'Timed pilot'],
    ['Facilities note', 'Cleaning is inconsistent', 'Maintainable service', 'Daily cleaning checklist visible', 'Inspection'],
    ['Finance concern', 'Costs may drift', 'Cost control', 'Monthly supply cost reported', 'Analysis'],
  ];
  return `
    <div class="coffee-diagram trace-board">
      <div class="trace-columns">
        ${['Input', 'Raw signal', 'Need', 'Requirement', 'Proof'].map((header) => `<strong>${header}</strong>`).join('')}
      </div>
      ${rows.map((row) => `<div class="trace-row">${row.map((cell) => `<span>${escapeHtml(cell)}</span>`).join('')}</div>`).join('')}
      <div class="trace-thread" aria-hidden="true"></div>
      <p class="visual-insight">The trace graphic shows how one raw comment becomes a need, a requirement, and proof intent.</p>
    </div>
  `;
}

function renderArchitectureDiagram(): string {
  return `
    <div class="coffee-diagram architecture-board">
      <div class="option-column preferred">
        <h4>Architecture option A</h4>
        <svg viewBox="0 0 240 190">
          <rect class="arch-node" x="34" y="22" width="76" height="58" rx="14" />
          <rect class="arch-node" x="130" y="22" width="76" height="58" rx="14" />
          <rect class="arch-node" x="82" y="112" width="76" height="58" rx="14" />
          <path class="arch-link" d="M72 80v32M168 80l-48 32" />
          <text x="72" y="54" text-anchor="middle">Brew</text>
          <text x="168" y="54" text-anchor="middle">Queue</text>
          <text x="120" y="144" text-anchor="middle">Restock</text>
        </svg>
        <p>Two stations with shared restock and clear queue flow.</p>
      </div>
      <div class="trade-table">
        <h4>Trade study checks</h4>
        <button class="trade-row js-visual-node active" data-detail="Wait time links back to the stakeholder need. It is not just a product speed claim."><span>Wait time</span><meter min="0" max="100" value="82"></meter></button>
        <button class="trade-row js-visual-node" data-detail="Cleaning effort changes maintainability and facility workload. It can make a fast option weak in operation."><span>Cleaning effort</span><meter min="0" max="100" value="68"></meter></button>
        <button class="trade-row js-visual-node" data-detail="Cost control belongs in the trade because supply and support cost can drift after launch."><span>Cost control</span><meter min="0" max="100" value="61"></meter></button>
        <button class="trade-row js-visual-node" data-detail="Rollout risk captures uncertainty in interfaces, training, support, and proof."><span>Rollout risk</span><meter min="0" max="100" value="56"></meter></button>
      </div>
      <p class="visual-insight">Select a trade criterion to see why it affects the architecture decision.</p>
    </div>
  `;
}

function renderRamsDiagram(): string {
  return `
    <div class="coffee-diagram rams-board">
      <div class="function-map">
        ${['Brew', 'Queue', 'Restock', 'Clean', 'Report fault', 'Dispose waste'].map((item) => `
          <button class="js-visual-node" data-detail="${item} is a function. Allocate it to equipment, people, information, or supplier support before choosing hardware.">${item}</button>
        `).join('')}
      </div>
      <div class="interface-ledger">
        <h4>Interface control ledger</h4>
        ${[
          ['Provider', 'Facilities'],
          ['Consumer', 'Coffee service'],
          ['Exchange', 'Clean counter space'],
          ['Acceptance', 'Daily inspection recorded'],
          ['Escalation', 'Support log by 2 p.m.'],
        ].map(([label, value]) => `<button class="js-visual-node" data-detail="${label} makes the handoff controllable: ${value}."><strong>${label}</strong><span>${value}</span></button>`).join('')}
      </div>
      <div class="rams-ring" aria-label="RAMS considerations">
        ${[
          ['Reliability', 'Fault rate', 'Reliability asks how often service faults occur and what evidence proves improvement.'],
          ['Availability', 'Stockouts', 'Availability asks whether users can actually get service when needed.'],
          ['Maintainability', 'Repair time', 'Maintainability asks how quickly service can be restored without disrupting the office.'],
          ['Safety', 'Leak / burn', 'Safety needs a hazard, control, proof, owner, acceptance, and residual risk.'],
        ].map(([label, detail, insight], index) => `
          <button class="rams-card js-visual-node" style="--i:${index}" data-detail="${insight}">
            <strong>${label}</strong>
            <span>${detail}</span>
          </button>
        `).join('')}
      </div>
      <p class="visual-insight">Select a function, interface field, or RAMS card to inspect the decision risk.</p>
    </div>
  `;
}

function renderImplementationDiagram(): string {
  return `
    <div class="coffee-diagram implementation-board">
      <div class="baseline-stack">
        ${[
          ['Machine model', 'Accepted'],
          ['Settings guide', 'Review'],
          ['QR support route', 'Defect'],
          ['Cleaning kit', 'Accepted'],
          ['Restock form', 'Accepted'],
        ].map(([item, status]) => `
          <button class="baseline-item ${status.toLowerCase()} js-visual-node" data-detail="${item}: ${status}. Decide whether this item can enter integration, needs review, or must be blocked.">
            <strong>${item}</strong>
            <span>${status}</span>
          </button>
        `).join('')}
      </div>
      <button class="nonconformance-card js-visual-node" data-detail="A nonconformance needs owner, fix path, acceptance decision, and impact check before integration.">
        <span>Nonconformance</span>
        <strong>Old support email appears on quick-start label.</strong>
        <p>Block from integration until vendor fixes label and QR route is retested.</p>
      </button>
      <p class="visual-insight">Select an implementation item to decide whether it is ready, needs review, or blocks integration.</p>
    </div>
  `;
}

function renderIntegrationDiagram(): string {
  return `
    <div class="coffee-diagram integration-board">
      ${['Machine', 'Counter', 'Supplies', 'Instructions', 'Cleaning', 'Support'].map((item, index) => `
        <button class="integration-node js-visual-node" style="--i:${index}" data-detail="${item} may pass alone but still fail when connected through a human, physical, information, or supplier interface.">
          <strong>${item}</strong>
          <span>${index < 3 ? 'Element ready' : 'Owner needed'}</span>
        </button>
      `).join('')}
      <div class="integration-sequence">
        <button class="js-visual-node" data-detail="Element acceptance checks that the pieces are ready before they are connected.">Accept elements</button>
        <button class="js-visual-node" data-detail="Interface activation proves the handoffs, not just the standalone equipment.">Connect interfaces</button>
        <button class="js-visual-node" data-detail="The pilot exposes end-to-end behavior in a controlled setting.">Run pilot</button>
        <button class="js-visual-node" data-detail="Defects need owner, fix, retest, regression check, and rollback condition.">Log defects</button>
      </div>
      <button class="defect-ribbon js-visual-node" data-detail="The retest closes the defect. The regression check proves the fix did not break another interface.">
        <strong>Defect -> fix -> retest -> regression check</strong>
        <p>Support QR routes to wrong owner. Retest ticket ID before launch.</p>
      </button>
      <p class="visual-insight">Select an integration element or sequence step to inspect the handoff risk.</p>
    </div>
  `;
}

function renderProofDiagram(): string {
  return `
    <div class="coffee-diagram proof-board">
      <section>
        <h4>Verification</h4>
        <p>Requirement proof</p>
        <button class="js-visual-node" data-detail="Verification asks whether the specified requirement was met under the stated condition.">Timed wait test</button>
        <button class="js-visual-node" data-detail="Availability evidence must identify the service configuration and measurement window.">Uptime log</button>
        <button class="js-visual-node" data-detail="Inspection evidence needs criterion, date, result, and defect disposition.">Cleaning inspection</button>
      </section>
      <section class="transition-lane">
        <h4>Transition</h4>
        <p>Move into use</p>
        <button class="js-visual-node" data-detail="Transition checks that people, support, environment, and rollback are ready for use.">Training note</button>
        <button class="js-visual-node" data-detail="Support owner evidence prevents launch from depending on informal help.">Support owner</button>
        <button class="js-visual-node" data-detail="Rollback evidence explains when to return to the old service or safe state.">Rollback plan</button>
      </section>
      <section>
        <h4>Validation</h4>
        <p>Fit for intended use</p>
        <button class="js-visual-node" data-detail="Validation asks whether the service solves the real stakeholder problem.">User pilot</button>
        <button class="js-visual-node" data-detail="Meeting impact checks the original mission pain, not only technical behavior.">Meeting impact</button>
        <button class="js-visual-node" data-detail="Facilities workload checks whether the operating context can sustain the solution.">Facilities workload</button>
      </section>
      <p class="visual-insight">Select a proof lane item to see which claim it supports.</p>
    </div>
  `;
}

function renderOperateDiagram(): string {
  return `
    <div class="coffee-diagram operate-board">
      <svg viewBox="0 0 720 360" role="img" aria-label="Operations feedback loop">
        <path class="loop-path" d="M140 180 C140 70 292 52 360 112 C430 52 580 70 580 180 C580 292 430 310 360 248 C292 310 140 292 140 180" />
        ${[
          ['Measure', 106, 162],
          ['Detect threshold', 250, 74],
          ['Assign owner', 448, 74],
          ['Act', 572, 162],
          ['Recheck', 448, 258],
          ['Update baseline', 226, 258],
        ].map(([label, x, y]) => `<g class="loop-node" transform="translate(${x} ${y})"><rect width="128" height="46" rx="14" /><text x="64" y="29" text-anchor="middle">${label}</text></g>`).join('')}
      </svg>
      <div class="signal-strip">
        <button class="js-visual-node" data-detail="Wait time is a live measure. If it crosses threshold, update owner action and recheck date.">Wait time</button>
        <button class="js-visual-node" data-detail="Complaints can reveal a validation issue even when requirements passed.">Complaints</button>
        <button class="js-visual-node" data-detail="Stockouts are an availability signal and may trigger a controlled change.">Stockouts</button>
        <button class="js-visual-node" data-detail="A cleaning miss may be a maintainability, procedure, or staffing issue.">Cleaning miss</button>
        <button class="js-visual-node" data-detail="Cost drift can force a change impact check across need, requirement, interface, and proof evidence.">Cost drift</button>
      </div>
      <p class="visual-insight">Select an operating signal to see how live evidence can change earlier artifacts.</p>
    </div>
  `;
}

function renderGateDiagram(): string {
  return `
    <div class="coffee-diagram gate-board">
      <div class="gate-track">
        ${['Need', 'Requirement', 'Design', 'Verification', 'Validation', 'Transition', 'Operation', 'Disposal'].map((item) => `
          <span>${item}</span>
        `).join('')}
      </div>
      <div class="gate-decision">
        <button class="js-visual-node" data-detail="Pass only when evidence supports the claim and remaining risk is accepted.">Pass</button>
        <button class="selected js-visual-node" data-detail="Conditional pass needs named conditions, owners, dates, and monitoring.">Conditional Pass</button>
        <button class="js-visual-node" data-detail="Hold is correct when missing evidence changes decision confidence.">Hold</button>
      </div>
      <p>Gate opens only when evidence gaps have owners, dates, and residual risk.</p>
      <p class="visual-insight">Select a gate decision to inspect what evidence it requires.</p>
    </div>
  `;
}

function renderRetirementDiagram(): string {
  return `
    <div class="coffee-diagram retirement-board">
      <div class="retirement-flow">
        ${[
          ['Asset', 'Remove old machine'],
          ['Supplier', 'Close standing order'],
          ['Records', 'Archive support data'],
          ['Waste', 'Recycle parts and dispose expired supplies'],
          ['Check', 'Verify old path is closed'],
        ].map(([label, detail]) => `
          <button class="retirement-step js-visual-node" data-detail="${label}: ${detail}. Closure needs evidence that the old path is actually retired.">
            <strong>${label}</strong>
            <span>${detail}</span>
          </button>
        `).join('')}
      </div>
      <button class="gate-memo js-visual-node" data-detail="A conditional pass is a decision with controlled follow-up, not vague optimism.">
        <span>Gate memo</span>
        <strong>Conditional pass</strong>
        <p>Proceed with owned cleaner condition, vendor response monitoring, and decommissioning closeout.</p>
      </button>
      <p class="visual-insight">Select a retirement action to see why decommissioning belongs in the evidence pack.</p>
    </div>
  `;
}

function renderDiagram(unit: CoffeeLabUnit): string {
  switch (unit.diagram) {
    case 'boundary':
      return renderBoundaryDiagram();
    case 'trace':
    case 'requirements':
      return renderTraceDiagram();
    case 'architecture':
    case 'analysis':
      return renderArchitectureDiagram();
    case 'rams':
      return renderRamsDiagram();
    case 'implementation':
      return renderImplementationDiagram();
    case 'integration':
      return renderIntegrationDiagram();
    case 'proof':
      return renderProofDiagram();
    case 'operate':
      return renderOperateDiagram();
    case 'gate':
      return renderGateDiagram();
    case 'retirement':
      return renderRetirementDiagram();
    case 'lifecycle':
      return renderBoundaryDiagram();
  }
}

function renderEvidenceItems(unit: CoffeeLabUnit): string {
  const journey = coffeeLabJourney[unit.id];
  return journey.starterEvidence.map((item) => `
    <article class="case-file-item">
      <strong>${annotateTerms(item.label, unit.terms, 1)}</strong>
      <p>${annotateTerms(item.detail, unit.terms, 2)}</p>
    </article>
  `).join('');
}

function renderWorkedExample(unit: CoffeeLabUnit): string {
  const example = coffeeLabJourney[unit.id].workedExample;
  return `
    <section class="lesson-card worked-example-card">
      <div class="lesson-card-heading">
        <span>Worked example</span>
        <h3>${escapeHtml(example.title)}</h3>
      </div>
      <div class="example-compare">
        <div class="example-panel weak">
          <strong>Weak</strong>
          <p>${annotateTerms(example.weak, unit.terms, 2)}</p>
        </div>
        <div class="example-panel strong">
          <strong>Stronger</strong>
          <p>${annotateTerms(example.strong, unit.terms, 3)}</p>
        </div>
      </div>
      <p class="reasoning-note">${annotateTerms(example.reasoning, unit.terms, 3)}</p>
    </section>
  `;
}

function renderArtifactTemplate(unit: CoffeeLabUnit): string {
  const template = coffeeLabJourney[unit.id].artifactTemplate;
  return `
    <section class="lesson-card artifact-template-card">
      <div class="lesson-card-heading">
        <span>Your artifact</span>
        <h3>${escapeHtml(template.title)}</h3>
      </div>
      <div class="artifact-template-grid">
        ${template.fields.map((field) => `
          <div>
            <strong>${annotateTerms(field.label, unit.terms, 1)}</strong>
            <p>${annotateTerms(field.example, unit.terms, 3)}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderActivityLens(unit: CoffeeLabUnit): string {
  return `
    <section class="activity-lens">
      <span>${escapeHtml(unit.practice.activityType)}</span>
      <p>${annotateTerms(unit.practice.why, unit.terms, 3)}</p>
    </section>
  `;
}

function renderLessonVisual(unit: CoffeeLabUnit): string {
  const visual = lessonVisuals[unit.id] ?? lessonVisuals.frame;
  const baseUrl = import.meta.env.BASE_URL;
  return `
    <section class="lesson-visual-panel">
      <picture class="lesson-visual-media">
        <source srcset="${baseUrl}${visual.image}" type="image/webp" />
        <img src="${baseUrl}${visual.fallback}" alt="${escapeHtml(visual.alt)}" loading="eager" />
      </picture>
      <div class="lesson-visual-copy">
        <span class="lab-label">Visual model</span>
        <h3>${escapeHtml(visual.title)}</h3>
        <p>${annotateTerms(visual.insight, unit.terms, 3)}</p>
        <div class="visual-chip-row">
          ${visual.chips.map((chip) => `<span>${escapeHtml(chip)}</span>`).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderTermPopover(): string {
  return `
    <aside class="inline-term-popover js-term-dialog" role="dialog" aria-live="polite" hidden>
      <button class="term-close js-term-close" type="button" aria-label="Close definition">x</button>
      <strong class="term-popover-title"></strong>
      <p class="term-popover-body"></p>
      <span class="term-popover-example"></span>
    </aside>
  `;
}

function renderStandardsMap(unit: CoffeeLabUnit): string {
  const anchors = standardsMap[unit.id] ?? [];
  return `
    <div class="standards-map">
      ${anchors.map((anchor) => `
        <a class="standard-anchor" href="${anchor.url}" target="_blank" rel="noreferrer">
          <strong>${escapeHtml(anchor.label)}</strong>
          <span>${escapeHtml(anchor.plain)}</span>
        </a>
      `).join('')}
      ${unit.references.map((reference) => `
        <a class="reference-link" href="${reference.url}" target="_blank" rel="noreferrer">
          ${escapeHtml(reference.label)}
          <span>${escapeHtml(reference.note)}</span>
        </a>
      `).join('')}
    </div>
  `;
}

function renderEvidencePreview(unit: CoffeeLabUnit, progress: CoffeeLabProgressState, savedArtifact: string): string {
  const completed = progress.completedUnitIds.includes(unit.id);
  const nextMissing = course.units.find((candidate) => !progress.completedUnitIds.includes(candidate.id));
  return `
    <div class="evidence-preview">
      <div>
        <span>${completed ? 'Saved' : 'Open'}</span>
        <strong>${escapeHtml(unit.practice.artifact)}</strong>
      </div>
      <p>${savedArtifact ? escapeHtml(savedArtifact) : 'No evidence note saved for this lesson yet.'}</p>
      ${nextMissing ? `<small>Next missing evidence: ${escapeHtml(nextMissing.practice.artifact)}</small>` : '<small>Evidence pack complete. Ready for final review.</small>'}
    </div>
  `;
}

function renderArtifactCapture(unit: CoffeeLabUnit, savedNote: string, completed: boolean): string {
  return `
    <section class="lesson-card artifact-capture-card">
      <div class="lesson-card-heading">
        <span>Artifact note</span>
        <h3>${escapeHtml(unit.practice.artifact)}</h3>
        <p>Write the evidence entry you would add to the lifecycle pack.</p>
      </div>
      <textarea class="artifact-note js-artifact-note" rows="4" placeholder="Example: ${escapeHtml(unit.practice.checklist[0] ?? 'State the artifact evidence.')}">${escapeHtml(savedNote)}</textarea>
      <p class="artifact-save-note">${completed ? 'Artifact already saved. You can revise and save again.' : 'Complete the task checklist, answer the misconception check, and write at least one evidence sentence.'}</p>
    </section>
  `;
}

function renderMicroCheck(unit: CoffeeLabUnit): string {
  const check = coffeeLabJourney[unit.id].microCheck;
  return `
    <section class="lesson-card micro-check-card" data-feedback="${escapeHtml(check.feedback)}">
      <div class="lesson-card-heading">
        <span>Misconception check</span>
        <h3>${annotateTerms(check.question, unit.terms, 2)}</h3>
      </div>
      <div class="micro-check-options">
        ${check.options.map((option, index) => `
          <button class="micro-check-option js-check-option" data-correct="${index === check.correctIndex}">
            <span>${index + 1}</span>${escapeHtml(option)}
          </button>
        `).join('')}
      </div>
      <p class="micro-check-feedback" hidden></p>
    </section>
  `;
}

export class CoffeeLabScene extends Phaser.Scene {
  private audioManager!: AudioManager | null;
  private ui!: UiLayer;
  private progress!: CoffeeLabProgressState;
  private lastRenderedUnitOrder = 1;

  constructor() {
    super({ key: 'CoffeeLabScene' });
  }

  create(): void {
    this.audioManager = AudioManager.fromRegistry(this);
    this.audioManager?.playBGM('bgm-ambient');
    ProceduralBG.drawTitleBG(this, this.scale.width, this.scale.height);

    this.progress = CoffeeLabProgressManager.load(course);
    this.ui = new UiLayer('coffee-lab');
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ui.destroy());
    TransitionManager.fadeIn(this, 250);
  }

  private render(): void {
    const unit = findUnit(this.progress.currentUnitId);
    const journey = coffeeLabJourney[unit.id];
    const completed = this.progress.completedUnitIds.includes(unit.id);
    const previous = previousUnit(unit);
    const next = nextUnit(unit);
    const completion = Math.round((this.progress.completedUnitIds.length / course.units.length) * 100);
    const finalUnit = !next;
    const savedArtifact = this.progress.artifactNotes[unit.id] ?? '';
    termAnnotationState = { usedTerms: new Set(), limit: 5 };

    this.ui.render(`
      <div class="coffee-lab-shell" data-lab-unit="${unit.id}">
        <header class="coffee-lab-header">
          <div>
            <button class="text-link js-episodes">SE Learning Quest</button>
            <h1>${escapeHtml(course.title)}</h1>
            <p>${escapeHtml(course.overview)}</p>
          </div>
          ${renderVeeLifecycle(unit, this.progress, completion, this.lastRenderedUnitOrder)}
        </header>
        ${lifecycleRoute(unit, this.progress)}
        <main class="coffee-workbench">
          <section class="lab-canvas lesson-stage">
            <div class="unit-heading">
              <span>Lesson ${unit.order} of ${course.units.length} / ${escapeHtml(unit.cluster)}</span>
              <h2>${escapeHtml(unit.title)}</h2>
              <p>${annotateTerms(journey.learnerOutcome, unit.terms, 2)}</p>
            </div>
            ${renderLessonVisual(unit)}
            <section class="case-file-band">
              <div class="lesson-card-heading">
                <span>Case file</span>
                <h3>${annotateTerms(journey.storyBeat, unit.terms, 2)}</h3>
              </div>
              <div class="case-file-grid">
                ${renderEvidenceItems(unit)}
              </div>
            </section>
            ${renderActivityLens(unit)}
            <section class="lesson-focus-grid">
              <div class="concept-brief">
                <span class="lab-label">Plain-English concept</span>
                <p>${annotateTerms(journey.conceptPlain, unit.terms, 3)}</p>
                <strong>Common trap</strong>
                <p>${annotateTerms(journey.commonTrap, unit.terms, 3)}</p>
              </div>
              <div class="concept-brief">
                <span class="lab-label">Process covered</span>
                <p>${unit.processes.map((process) => escapeHtml(process)).join(' + ')}</p>
                <strong>Evidence added</strong>
                <p>${annotateTerms(journey.evidenceDelta, unit.terms, 2)}</p>
              </div>
            </section>
            ${renderDiagram(unit)}
            ${renderWorkedExample(unit)}
            ${renderArtifactTemplate(unit)}
            ${renderMicroCheck(unit)}
            ${renderArtifactCapture(unit, savedArtifact, completed)}
            <section class="practice-panel lesson-card">
              <div class="lesson-card-heading">
                <span>Task checklist</span>
                <h3>${escapeHtml(unit.practice.title)}</h3>
                <p>${annotateTerms(unit.practice.prompt, unit.terms, 2)}</p>
              </div>
              <div class="practice-steps">
                ${unit.practice.steps.map((step, index) => `
                  <button class="practice-step js-practice-step" data-step="${index}">
                    <span>${index + 1}</span>${escapeHtml(step)}
                  </button>
                `).join('')}
              </div>
              <div class="artifact-check">
                <strong>Rubric before saving artifact</strong>
                ${termList(journey.rubric, unit.terms)}
              </div>
              <div class="bridge-note">
                <strong>Next connection</strong>
                <p>${annotateTerms(journey.nextBridge, unit.terms, 2)}</p>
              </div>
              <div class="lab-actions">
                ${previous ? `<button class="button button-secondary js-unit" data-unit-id="${previous.id}">Previous</button>` : ''}
                <button class="button button-primary js-complete" data-completed="${completed}" ${completed ? '' : 'disabled'}>${completed ? 'Artifact Saved' : 'Save Artifact To Evidence Thread'}</button>
                ${next ? `<button class="button button-secondary js-unit" data-unit-id="${next.id}">Next Lesson</button>` : '<button class="button button-secondary js-episodes">Back To Episodes</button>'}
                ${finalUnit ? '<button class="button button-primary js-ep2">Apply In EP2</button>' : ''}
              </div>
            </section>
          </section>
          <aside class="coach-panel lesson-toolkit">
            <span class="lab-label">Lesson toolkit</span>
            <h3>${escapeHtml(unit.plainQuestion)}</h3>
            <div class="toolkit-progress">
              <strong>${unit.order}/${course.units.length}</strong>
              <span>${escapeHtml(unit.cluster)} evidence</span>
            </div>
            <div class="coach-block">
              <strong>Current evidence</strong>
              ${renderEvidencePreview(unit, this.progress, savedArtifact)}
            </div>
            <div class="coach-block">
              <strong>Key moves</strong>
              ${termList(unit.keyActivities, unit.terms)}
            </div>
            <div class="coach-block">
              <strong>Watch for</strong>
              ${termList(unit.keyConsiderations, unit.terms)}
            </div>
            <div class="coach-block">
              <strong>Supporting practices</strong>
              ${list(unit.supportingPractices)}
            </div>
            <div class="coach-block">
              <strong>Standards map</strong>
              ${renderStandardsMap(unit)}
            </div>
          </aside>
        </main>
        ${renderTermPopover()}
      </div>
    `);

    termAnnotationState = null;
    this.lastRenderedUnitOrder = unit.order;
    this.bindEvents();
    this.updateCompletionReadiness();
    window.requestAnimationFrame(() => {
      this.ui.getElement<HTMLElement>('.route-station.current')?.scrollIntoView({
        block: 'nearest',
        inline: 'center',
        behavior: 'smooth',
      });
    });
  }

  private bindEvents(): void {
    this.ui.on('click', '.js-unit', (target) => {
      const unitId = target.dataset.unitId;
      if (!unitId) return;
      this.audioManager?.playSFX('sfx-click');
      this.progress = CoffeeLabProgressManager.visit(course, unitId);
      this.render();
    });

    this.ui.on('click', '.js-practice-step', (target) => {
      target.classList.toggle('selected');
      const stage = this.ui.getElement<HTMLElement>('.lesson-stage');
      if (stage) stage.dataset.activePracticeStep = target.dataset.step ?? '';
      this.audioManager?.playSFX('sfx-click');
      this.updateCompletionReadiness();
    });

    this.ui.on('click', '.js-check-option', (target) => {
      const check = target.closest('.micro-check-card');
      if (!(check instanceof HTMLElement)) return;
      check.querySelectorAll('.micro-check-option').forEach((option) => {
        option.classList.remove('selected', 'correct', 'incorrect');
      });
      const correct = target.dataset.correct === 'true';
      target.classList.add('selected', correct ? 'correct' : 'incorrect');
      const feedback = check.querySelector('.micro-check-feedback');
      if (feedback instanceof HTMLElement) {
        feedback.hidden = false;
        feedback.textContent = correct
          ? check.dataset.feedback ?? ''
          : `Not quite. ${check.dataset.feedback ?? ''}`;
      }
      this.audioManager?.playSFX(correct ? 'sfx-success' : 'sfx-click');
      this.updateCompletionReadiness();
    });

    this.ui.on('input', '.js-artifact-note', () => {
      this.updateCompletionReadiness();
    });

    this.ui.on('click', '.js-hotspot', (target) => {
      const insight = target.closest('.coffee-diagram')?.querySelector('.diagram-insight');
      if (insight instanceof HTMLElement) {
        insight.textContent = target.dataset.detail ?? '';
      }
      this.audioManager?.playSFX('sfx-click');
    });

    this.ui.on('click', '.js-visual-node', (target) => {
      const diagram = target.closest('.coffee-diagram');
      const insight = diagram?.querySelector('.visual-insight');
      if (diagram instanceof HTMLElement) {
        diagram.querySelectorAll('.js-visual-node').forEach((node) => node.classList.remove('active'));
      }
      target.classList.add('active');
      if (insight instanceof HTMLElement) {
        insight.textContent = target.dataset.detail ?? '';
      }
      this.audioManager?.playSFX('sfx-click');
    });

    this.ui.on('click', '.js-term-popover', (target) => {
      const dialog = this.ui.getElement<HTMLElement>('.js-term-dialog');
      if (!dialog) return;
      this.ui.getElement<HTMLElement>('.coffee-lab-shell')?.querySelectorAll('.js-term-popover').forEach((term) => term.classList.remove('active'));
      target.classList.add('active');
      const title = dialog.querySelector('.term-popover-title');
      const body = dialog.querySelector('.term-popover-body');
      const example = dialog.querySelector('.term-popover-example');
      if (title instanceof HTMLElement) title.textContent = target.dataset.term ?? '';
      if (body instanceof HTMLElement) body.textContent = target.dataset.plain ?? '';
      if (example instanceof HTMLElement) example.textContent = target.dataset.example ?? '';
      dialog.hidden = false;
      const rect = target.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 24);
      const left = Math.min(window.innerWidth - width - 12, Math.max(12, rect.left - 10));
      const below = rect.bottom + 10;
      const top = below > window.innerHeight - 190 ? Math.max(12, rect.top - 190) : below;
      dialog.style.width = `${width}px`;
      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
      this.audioManager?.playSFX('sfx-click');
    });

    this.ui.on('click', '.js-term-close', () => {
      const dialog = this.ui.getElement<HTMLElement>('.js-term-dialog');
      if (dialog) dialog.hidden = true;
      this.ui.getElement<HTMLElement>('.coffee-lab-shell')?.querySelectorAll('.js-term-popover').forEach((term) => term.classList.remove('active'));
      this.audioManager?.playSFX('sfx-click');
    });

    this.ui.on('click', '.js-complete', () => {
      if (!this.isCurrentUnitReady()) {
        const note = this.ui.getElement<HTMLElement>('.artifact-save-note');
        if (note) note.textContent = 'Finish every checklist item, choose the correct check answer, and write an artifact note before saving.';
        this.audioManager?.playSFX('sfx-click');
        return;
      }
      const artifactNote = this.ui.getElement<HTMLTextAreaElement>('.js-artifact-note')?.value ?? '';
      this.audioManager?.playSFX('sfx-success');
      this.progress = CoffeeLabProgressManager.complete(course, this.progress.currentUnitId, artifactNote);
      this.render();
    });

    this.ui.on('click', '.js-episodes', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => this.scene.start('EpisodeSelectScene'));
    });

    this.ui.on('click', '.js-ep2', () => {
      this.audioManager?.playSFX('sfx-success');
      GameManager.getInstance().selectEpisode('ep2-rail-quest');
      TransitionManager.fadeOut(this, 250, () => this.scene.start('TitleScene'));
    });
  }

  private isCurrentUnitReady(): boolean {
    const stage = this.ui.getElement<HTMLElement>('.lesson-stage');
    if (!stage) return false;
    const steps = Array.from(stage.querySelectorAll('.js-practice-step'));
    const selectedSteps = steps.filter((step) => step.classList.contains('selected'));
    const correctCheck = stage.querySelector('.js-check-option.correct.selected');
    const artifactNote = stage.querySelector<HTMLTextAreaElement>('.js-artifact-note')?.value.trim() ?? '';
    return steps.length > 0 && selectedSteps.length === steps.length && Boolean(correctCheck) && artifactNote.length >= 24;
  }

  private updateCompletionReadiness(): void {
    const saveButton = this.ui.getElement<HTMLButtonElement>('.js-complete');
    if (!saveButton) return;
    if (saveButton.dataset.completed === 'true') {
      saveButton.disabled = false;
      return;
    }
    const ready = this.isCurrentUnitReady();
    saveButton.disabled = !ready;
    const note = this.ui.getElement<HTMLElement>('.artifact-save-note');
    if (note) {
      note.textContent = ready
        ? 'Artifact ready to save into the evidence thread.'
        : 'Complete every checklist item, answer the check correctly, and write at least one evidence sentence.';
    }
  }
}
