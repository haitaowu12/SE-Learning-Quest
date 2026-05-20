import { useEffect, useMemo, useState } from 'react';
import episodeCatalogData from '../data/episodes.json' with { type: 'json' };
import coffeeLabCourseData from '../data/coffee-lab-course.json' with { type: 'json' };
import { coffeeLabJourney } from '../data/coffee-lab-journey.ts';
import { assetUrl } from '../data/assetManifest.ts';
import { examManifests } from '../data/exams.ts';
import { veeModel } from '../data/veeModel.ts';
import { CoffeeLabProgressManager } from '../game/CoffeeLabProgressManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { LearnerProgressManager } from '../game/LearnerProgressManager.ts';
import { LevelManager } from '../game/LevelManager.ts';
import { METRIC_KEYS } from '../game/metricUtils.ts';
import { validateContent } from '../utils/contentValidation.ts';
import type { CSSProperties } from 'react';
import type {
  CampaignChapter,
  CampaignState,
  ChapterResult,
  ChapterRating,
  CoffeeLabCourse,
  CoffeeLabProgressState,
  CoffeeLabUnit,
  DecisionOption,
  EpisodeCatalog,
  ExamManifest,
  ExamResult,
  MetricDelta,
  MetricKey,
  MissionState,
  SubgameSpec,
} from '../types/index.ts';

type View =
  | { name: 'episodes' }
  | { name: 'coffee' }
  | { name: 'rail-title' }
  | { name: 'rail-map' }
  | { name: 'mission'; chapterId: string }
  | { name: 'debrief'; chapterId: string }
  | { name: 'exam'; examId: string };

type PracticeStatus = 'idle' | 'ready' | 'saved';
type CheatSheetTab = 'terms' | 'concepts' | 'references' | 'deliverables' | 'processes';
type ProjectTone = 'baseline' | 'excellent' | 'stable' | 'fragile' | 'risk';

const catalog = episodeCatalogData as EpisodeCatalog;
const course = coffeeLabCourseData as CoffeeLabCourse;
const levelManager = LevelManager.getInstance();
const gameManager = GameManager.getInstance();
const AUTHOR_URL = 'https://haitaowu12.github.io/tony-wu-home/';
type ChapterEntry = ReturnType<typeof gameManager.getAvailableChapters>[number];

const metricLabels: Record<MetricKey, string> = {
  system_quality: 'System quality',
  stakeholder_trust: 'Stakeholder trust',
  risk_exposure: 'Risk exposure',
  delivery_confidence: 'Delivery confidence',
  team_capacity: 'Team capacity',
};

const unitAssetKey: Record<string, string> = {
  frame: 'assets/coffee-lab/frame.webp',
  define: 'assets/coffee-lab/define.webp',
  architect: 'assets/coffee-lab/architect.webp',
  implement: 'assets/coffee-lab/implement.webp',
  integrate: 'assets/coffee-lab/integrate.webp',
  prove: 'assets/coffee-lab/prove.webp',
  operate: 'assets/coffee-lab/operate.webp',
  retire: 'assets/coffee-lab/retire.webp',
};

const veeNodeByChapterId = new Map(veeModel.map((node) => [node.chapterId, node]));
const cheatSheetTabs: Array<{ id: CheatSheetTab; label: string }> = [
  { id: 'terms', label: 'Terms' },
  { id: 'concepts', label: 'Concepts' },
  { id: 'references', label: 'References' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'processes', label: 'Processes' },
];

function formatReferenceUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}${parsed.hash}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function formatDelta(key: MetricKey, value: number | undefined): string {
  if (!value) return 'No change';
  if (key === 'risk_exposure') return value < 0 ? 'Risk reduced' : 'Risk increased';
  return value > 0 ? 'Improves' : 'Weakens';
}

function deltaTone(key: MetricKey, value: number | undefined): 'good' | 'bad' | 'neutral' {
  if (!value) return 'neutral';
  if (key === 'risk_exposure') return value < 0 ? 'good' : 'bad';
  return value > 0 ? 'good' : 'bad';
}

function optionTone(option: DecisionOption): 'good' | 'bad' | 'mixed' {
  const score = METRIC_KEYS.reduce((total, key) => {
    const value = option.consequence.metrics[key] ?? 0;
    const tone = deltaTone(key, value);
    if (tone === 'good') return total + Math.abs(value || 1);
    if (tone === 'bad') return total - Math.abs(value || 1);
    return total;
  }, 0);
  if (score >= 7) return 'good';
  if (score <= -7) return 'bad';
  return 'mixed';
}

function summarizeTradeoff(option: DecisionOption): string {
  const positives = METRIC_KEYS
    .filter((key) => deltaTone(key, option.consequence.metrics[key]) === 'good')
    .map((key) => metricLabels[key]);
  const risks = METRIC_KEYS
    .filter((key) => deltaTone(key, option.consequence.metrics[key]) === 'bad')
    .map((key) => key === 'risk_exposure' ? 'risk exposure' : metricLabels[key]);
  const protects = positives.length > 0 ? positives.slice(0, 2).join(', ') : 'decision clarity';
  const watch = risks.length > 0 ? risks.slice(0, 2).join(', ') : 'follow-through';
  return `Protects ${protects}. Watch ${watch}.`;
}

function uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ratingClass(rating: ChapterRating | undefined | null): string {
  if (!rating) return '';
  return `rating-${rating.toLowerCase().replace(/\s+/g, '-')}`;
}

function cleanOutcomeLabel(value: string | undefined): string {
  if (!value) return 'Evidence captured';
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function latestCompletedEntry(entries: ChapterEntry[]): ChapterEntry | undefined {
  return entries.filter((entry) => entry.result).at(-1);
}

function nextOpenEntry(entries: ChapterEntry[]): ChapterEntry | undefined {
  return entries.find((entry) => entry.unlocked && !entry.completed) ?? entries.find((entry) => entry.active);
}

function describeProjectStatus(state: CampaignState, entries: ChapterEntry[]): { label: string; tone: ProjectTone; summary: string } {
  const completed = entries.filter((entry) => entry.result);
  const ratings = completed.map((entry) => entry.result?.rating);
  const hasAtRisk = ratings.includes('At Risk');
  const hasFragile = ratings.includes('Fragile');
  const allStrong = completed.length > 0 && ratings.every((rating) => rating === 'Excellent' || rating === 'Stable');
  const positiveAverage = (state.metrics.system_quality + state.metrics.stakeholder_trust + state.metrics.delivery_confidence + state.metrics.team_capacity) / 4;

  if (completed.length === 0) {
    return {
      label: 'Baseline posture',
      tone: 'baseline',
      summary: 'No chapter outcomes are recorded yet. Start with framing, then watch the project posture change after each mission.',
    };
  }

  if (hasAtRisk || state.metrics.risk_exposure >= 78 || positiveAverage < 50) {
    return {
      label: 'Project at risk',
      tone: 'risk',
      summary: 'Recent outcomes or metrics show that risk is outrunning project confidence. The next chapter needs active control, not just forward motion.',
    };
  }

  if (hasFragile || state.metrics.risk_exposure >= 64 || positiveAverage < 65) {
    return {
      label: 'Under watch',
      tone: 'fragile',
      summary: 'Progress is continuing, but the accumulated chapter outcomes leave visible readiness or stakeholder tension to manage.',
    };
  }

  if (allStrong && state.metrics.risk_exposure <= 52 && positiveAverage >= 76) {
    return {
      label: 'Healthy progress',
      tone: 'excellent',
      summary: 'Completed chapters are building useful evidence and the program metrics show improving readiness.',
    };
  }

  return {
    label: 'Stable progress',
    tone: 'stable',
    summary: 'Chapter outcomes are mostly controlled. Keep connecting each new decision to traceable evidence before the next lifecycle step.',
  };
}

function findCoffeeUnit(progress: CoffeeLabProgressState): CoffeeLabUnit {
  return course.units.find((unit) => unit.id === progress.currentUnitId) ?? course.units[0];
}

function nextCoffeeUnit(unit: CoffeeLabUnit): CoffeeLabUnit | undefined {
  return course.units.find((candidate) => candidate.order === unit.order + 1);
}

function previousCoffeeUnit(unit: CoffeeLabUnit): CoffeeLabUnit | undefined {
  return course.units.find((candidate) => candidate.order === unit.order - 1);
}

function useRefresh(): [number, () => void] {
  const [version, setVersion] = useState(0);
  return [version, () => setVersion((value) => value + 1)];
}

function ResponsiveImage({ path, fallback, alt }: { path: string; fallback?: string; alt: string }) {
  return (
    <picture>
      <source srcSet={assetUrl(path)} type="image/webp" />
      <img src={assetUrl(fallback ?? path.replace(/\.webp$/, '.png'))} alt={alt} />
    </picture>
  );
}

function AuthorLink({ variant = 'compact' }: { variant?: 'compact' | 'footer' }) {
  return (
    <a
      className={cx('author-link', variant === 'footer' && 'author-link--footer')}
      href={AUTHOR_URL}
      aria-label="Know the author: Tony Wu, systems engineer and builder of this project"
    >
      {variant === 'footer' ? 'Built by Tony Wu' : 'TW · About'}
    </a>
  );
}

export function GameOverlay() {
  const [view, setView] = useState<View>({ name: 'episodes' });
  const [, refresh] = useRefresh();
  const validationIssues = useMemo(() => validateContent(), []);
  const routeKey = view.name === 'mission' || view.name === 'debrief'
    ? `${view.name}:${view.chapterId}`
    : view.name === 'exam'
      ? `${view.name}:${view.examId}`
      : view.name;

  useEffect(() => {
    if (validationIssues.length > 0) {
      console.warn('SE Learning Quest content validation issues', validationIssues);
    }
    LearnerProgressManager.migrate(course, gameManager.getState());
  }, [validationIssues]);

  useEffect(() => {
    requestAnimationFrame(() => {
      document.getElementById('ui-root')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.querySelector('.quest-scroll')?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }, [routeKey]);

  const navigate = (next: View) => {
    const activeEpisodeId = next.name === 'coffee' || next.name === 'episodes'
      ? 'ep1-coffee-lab'
      : next.name === 'exam'
        ? examManifests.find((exam) => exam.id === next.examId)?.episodeId ?? gameManager.getState().episodeId
        : 'ep2-rail-quest';
    LearnerProgressManager.touchActiveEpisode(course, gameManager.getState(), activeEpisodeId);
    setView(next);
    refresh();
  };

  return (
    <div className="quest-app" data-view={view.name}>
      {validationIssues.length > 0 && (
        <div className="validation-ribbon">
          Content validation found {validationIssues.length} issue{validationIssues.length === 1 ? '' : 's'}.
        </div>
      )}
      {view.name === 'episodes' && <EpisodeSelectScreen navigate={navigate} />}
      {view.name === 'coffee' && <CoffeeLabScreen navigate={navigate} />}
      {view.name === 'rail-title' && <RailTitleScreen navigate={navigate} />}
      {view.name === 'rail-map' && <RailMapScreen navigate={navigate} />}
      {view.name === 'mission' && <MissionScreen chapterId={view.chapterId} navigate={navigate} />}
      {view.name === 'debrief' && <DebriefScreen chapterId={view.chapterId} navigate={navigate} />}
      {view.name === 'exam' && <ExamScreen examId={view.examId} navigate={navigate} />}
    </div>
  );
}

function EpisodeSelectScreen({ navigate }: { navigate: (view: View) => void }) {
  const ep1Progress = CoffeeLabProgressManager.load(course);
  const ep2State = gameManager.getState();
  const ep1Exam = examManifests.find((exam) => exam.episodeId === 'ep1-coffee-lab');
  const ep2Exam = examManifests.find((exam) => exam.episodeId === 'ep2-rail-quest');

  return (
    <main className="quest-scroll">
      <section className="platform-stage">
        <div className="platform-copy">
          <h1>{catalog.platformTitle}</h1>
          <p>{catalog.platformSubtitle}</p>
          <div className="quest-actions">
            <button className="quest-button primary" onClick={() => navigate({ name: 'coffee' })}>Start Coffee Lab</button>
            <AuthorLink />
            <button className="quest-button secondary" onClick={() => navigate({ name: 'rail-title' })}>Enter Rail Quest</button>
          </div>
        </div>
        <div className="platform-art">
          <ResponsiveImage path="assets/learning-quest/platform-hero.webp" alt="Systems engineering quest path across coffee and rail scenarios" />
        </div>
      </section>

      <section className="path-grid" aria-label="Learning episodes">
        {catalog.episodes.map((episode) => {
          const isCoffee = episode.id === 'ep1-coffee-lab';
          const progressText = isCoffee
            ? `${ep1Progress.completedUnitIds.length}/${course.units.length} artifacts`
            : `${ep2State.completedChapterIds.length}/${levelManager.getManifest('ep2-rail-quest').chapters.length} chapters`;
          const pct = isCoffee
            ? (ep1Progress.completedUnitIds.length / course.units.length) * 100
            : (ep2State.completedChapterIds.length / levelManager.getManifest('ep2-rail-quest').chapters.length) * 100;
          return (
            <article className="episode-panel" key={episode.id}>
              <ResponsiveImage path={episode.heroImage} alt="" />
              <div className="episode-panel-copy">
                <span className="quest-kicker">{episode.code} / {episode.difficulty}</span>
                <h2>{episode.title}</h2>
                <p>{episode.subtitle}</p>
                <div className="progress-track" aria-label={`${episode.title} progress`}>
                  <span style={{ width: `${pct}%` }} />
                </div>
                <strong>{progressText}</strong>
                <p>{episode.bestFor}</p>
                <details>
                  <summary>What you will practice</summary>
                  <ul>
                    {episode.outcomes.slice(0, 4).map((outcome) => <li key={outcome}>{outcome}</li>)}
                  </ul>
                </details>
                <div className="quest-actions">
                  <button className="quest-button primary" onClick={() => navigate(isCoffee ? { name: 'coffee' } : { name: 'rail-title' })}>{episode.routeLabel}</button>
                  {isCoffee && ep1Exam && <button className="quest-button ghost" onClick={() => navigate({ name: 'exam', examId: ep1Exam.id })}>EP1 Self-check</button>}
                  {!isCoffee && ep2Exam && <button className="quest-button ghost" onClick={() => navigate({ name: 'exam', examId: ep2Exam.id })}>EP2 Self-check</button>}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function CoffeeLabScreen({ navigate }: { navigate: (view: View) => void }) {
  const [progress, setProgress] = useState(() => CoffeeLabProgressManager.load(course));
  const [practiceStatus, setPracticeStatus] = useState<PracticeStatus>('idle');
  const [microCorrect, setMicroCorrect] = useState(false);
  const [artifactNote, setArtifactNote] = useState(progress.artifactNotes[progress.currentUnitId] ?? '');
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const unit = findCoffeeUnit(progress);
  const journey = coffeeLabJourney[unit.id];
  const complete = progress.completedUnitIds.includes(unit.id);
  const completion = Math.round((progress.completedUnitIds.length / course.units.length) * 100);
  const previous = previousCoffeeUnit(unit);
  const next = nextCoffeeUnit(unit);
  const ready = complete || (practiceStatus === 'ready' && microCorrect && artifactNote.trim().length >= 24);

  useEffect(() => {
    setPracticeStatus(progress.completedUnitIds.includes(progress.currentUnitId) ? 'saved' : 'idle');
    setMicroCorrect(false);
    setArtifactNote(progress.artifactNotes[progress.currentUnitId] ?? '');
  }, [progress]);

  const visit = (unitId: string) => setProgress(CoffeeLabProgressManager.visit(course, unitId));
  const save = () => {
    if (!ready) return;
    const nextProgress = CoffeeLabProgressManager.complete(course, unit.id, artifactNote);
    setProgress(nextProgress);
    setPracticeStatus('saved');
  };

  return (
    <main className="quest-scroll coffee-screen">
      <header className="lab-command">
        <div className="lab-nav-actions">
          <span className="quest-kicker">SE Learning Quest</span>
          <button className="quest-button secondary compact" onClick={() => navigate({ name: 'episodes' })}>Main Page</button>
        </div>
        <div>
          <h1>{course.title}</h1>
          <p>{course.overview}</p>
        </div>
        <div className="lab-progress-actions">
          <ProgressDial label={`${progress.completedUnitIds.length}/${course.units.length}`} value={completion} caption="Evidence pack" />
          <button className="quest-button ghost compact" onClick={() => setCheatSheetOpen(true)}>Glossary & Cheat Sheet</button>
        </div>
      </header>

      <nav className="station-strip" aria-label="Coffee Lab lifecycle">
        {course.units.map((candidate) => (
          <button
            key={candidate.id}
            className={cx('station-button', candidate.id === unit.id && 'current', progress.completedUnitIds.includes(candidate.id) && 'complete')}
            onClick={() => visit(candidate.id)}
          >
            <span>{candidate.order}</span>
            {candidate.cluster}
          </button>
        ))}
      </nav>

      <section className="lesson-shell">
        <section className="lesson-primer">
          <div className="lesson-story">
            <span className="quest-kicker">Lesson {unit.order} of {course.units.length} / {unit.cluster}</span>
            <h2>{unit.title}</h2>
            <p className="story-beat">{journey.storyBeat}</p>
            <div className="concept-callout">
              <strong>Systems engineering idea</strong>
              <p>{journey.conceptPlain}</p>
            </div>
            <div className="trap-callout">
              <strong>Common trap</strong>
              <p>{journey.commonTrap}</p>
            </div>
          </div>
          <div className="lesson-visual">
            <ResponsiveImage path={unitAssetKey[unit.id] ?? unitAssetKey.frame} alt={`${unit.cluster} visual model`} />
          </div>
        </section>

        <section className="evidence-strip" aria-label="Case evidence">
          {journey.starterEvidence.map((item) => (
            <article key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="lesson-application">
          <section className="action-deck">
            <div className="action-header">
              <span className="quest-kicker">Apply the idea</span>
              <h2>{unit.practice.title}</h2>
              <p>{unit.practice.prompt}</p>
            </div>
            <PracticeActivityPanel unit={unit} onReadyChange={(done) => setPracticeStatus(done ? 'ready' : 'idle')} />
            <MicroCheck unit={unit} correct={microCorrect} onCorrect={setMicroCorrect} />
            <ArtifactTemplatePanel unit={unit} />
            <label className="artifact-capture">
              <span>{unit.practice.artifact}</span>
              <textarea value={artifactNote} onChange={(event) => setArtifactNote(event.target.value)} placeholder={unit.practice.checklist[0]} />
            </label>
            {(complete || practiceStatus === 'saved') && (
              <section className="bridge-panel">
                <span className="quest-kicker">Evidence added</span>
                <h3>{journey.evidenceDelta}</h3>
                <p>{journey.nextBridge}</p>
              </section>
            )}
            <div className="sticky-action-bar">
              <span>{complete ? 'Artifact saved' : ready ? 'Ready to save' : 'Read the case, complete the check, and write the evidence note'}</span>
              <div className="quest-actions">
                {previous && <button className="quest-button secondary" onClick={() => visit(previous.id)}>Previous</button>}
                <button className="quest-button primary" disabled={!ready} onClick={save}>{complete ? 'Saved' : 'Save Artifact'}</button>
                {next ? <button className="quest-button secondary" onClick={() => visit(next.id)}>Next Lesson</button> : <button className="quest-button secondary" onClick={() => navigate({ name: 'rail-title' })}>Apply In EP2</button>}
              </div>
            </div>
          </section>

          <aside className="coach-panel">
            <section>
              <span className="quest-kicker">Worked example</span>
              <h3>{journey.workedExample.title}</h3>
              <div className="compare-grid">
                <div><strong>Weak</strong><p>{journey.workedExample.weak}</p></div>
                <div><strong>Stronger</strong><p>{journey.workedExample.strong}</p></div>
              </div>
              <p>{journey.workedExample.reasoning}</p>
            </section>
            <section>
              <span className="quest-kicker">Success check</span>
              <ul>{journey.rubric.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          </aside>
        </section>
      </section>
      {cheatSheetOpen && <CoffeeCheatSheet currentUnit={unit} onClose={() => setCheatSheetOpen(false)} />}
    </main>
  );
}

function PracticeActivityPanel({ unit, onReadyChange }: { unit: CoffeeLabUnit; onReadyChange: (ready: boolean) => void }) {
  if (unit.practice.activityType === 'sort') return <SortPractice onReadyChange={onReadyChange} />;
  if (unit.practice.activityType === 'rewrite') return <RewritePractice onReadyChange={onReadyChange} />;
  if (unit.practice.activityType === 'allocate') return <AllocatePractice onReadyChange={onReadyChange} />;
  if (unit.practice.activityType === 'inspect') return <InspectPractice onReadyChange={onReadyChange} />;
  if (unit.practice.activityType === 'sequence') return <SequencePractice onReadyChange={onReadyChange} />;
  if (unit.practice.activityType === 'audit') return <AuditPractice onReadyChange={onReadyChange} />;
  if (unit.practice.activityType === 'triage') return <TriagePractice onReadyChange={onReadyChange} />;
  return <RecommendPractice onReadyChange={onReadyChange} />;
}

function ArtifactTemplatePanel({ unit }: { unit: CoffeeLabUnit }) {
  const template = coffeeLabJourney[unit.id].artifactTemplate;
  return (
    <section className="artifact-template">
      <span className="quest-kicker">Build the artifact</span>
      <h3>{template.title}</h3>
      <div className="template-field-grid">
        {template.fields.map((field) => (
          <article key={field.label}>
            <strong>{field.label}</strong>
            <p>{field.example}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SortPractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const items = ['Coffee machine', 'Employees', 'Finance approval', 'Cleaning routine', 'Peak wait time', 'Vendor support', 'Morning demand stays stable'];
  const categories = ['System element', 'External actor', 'Measure', 'Assumption'];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => onReadyChange(items.every((item) => answers[item])), [answers, onReadyChange]);
  return (
    <div className="practice-grid">
      {items.map((item) => (
        <label key={item} className="practice-card">
          <span>{item}</span>
          <select value={answers[item] ?? ''} onChange={(event) => setAnswers({ ...answers, [item]: event.target.value })}>
            <option value="">Classify</option>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function RewritePractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const [need, setNeed] = useState('');
  const [requirement, setRequirement] = useState('');
  const [proof, setProof] = useState('');
  useEffect(() => onReadyChange([need, requirement, proof].every((value) => value.trim().length >= 18)), [need, requirement, proof, onReadyChange]);
  return (
    <div className="practice-stack">
      <input value={need} onChange={(event) => setNeed(event.target.value)} placeholder="Need: employees need..." />
      <input value={requirement} onChange={(event) => setRequirement(event.target.value)} placeholder="Requirement: average wait shall..." />
      <input value={proof} onChange={(event) => setProof(event.target.value)} placeholder="Proof: timed pilot will..." />
    </div>
  );
}

function AllocatePractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const functions = ['Brew', 'Restock', 'Clean', 'Fault response'];
  const owners = ['Machine', 'Office admin', 'Facilities', 'Vendor'];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => onReadyChange(functions.every((item) => answers[item])), [answers, onReadyChange]);
  return (
    <div className="practice-grid">
      {functions.map((item) => (
        <label key={item} className="practice-card">
          <span>{item}</span>
          <select value={answers[item] ?? ''} onChange={(event) => setAnswers({ ...answers, [item]: event.target.value })}>
            <option value="">Allocate owner</option>
            {owners.map((owner) => <option key={owner}>{owner}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function InspectPractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const items = ['Machine model matches baseline', 'QR support route uses old email', 'Cleaning kit delivered', 'Restock form approved'];
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => onReadyChange(selected.includes('QR support route uses old email')), [selected, onReadyChange]);
  return (
    <div className="practice-grid">
      {items.map((item) => (
        <button key={item} className={cx('practice-card', selected.includes(item) && 'selected')} onClick={() => setSelected(selected.includes(item) ? selected.filter((value) => value !== item) : selected.concat(item))}>
          <span>{item}</span>
          <small>{selected.includes(item) ? 'Flagged for disposition' : 'Inspect readiness'}</small>
        </button>
      ))}
    </div>
  );
}

function SequencePractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const [steps, setSteps] = useState(['Run pilot/readiness check', 'Accept elements', 'Log defects and retest', 'Connect interfaces']);
  const correct = ['Accept elements', 'Connect interfaces', 'Log defects and retest', 'Run pilot/readiness check'];
  useEffect(() => onReadyChange(steps.every((step, index) => step === correct[index])), [steps, onReadyChange]);
  const move = (index: number, direction: number) => {
    const next = steps.slice();
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setSteps(next);
  };
  return (
    <div className="practice-stack">
      {steps.map((step, index) => (
        <div className="sequence-row" key={step}>
          <strong>{index + 1}. {step}</strong>
          <div>
            <button disabled={index === 0} onClick={() => move(index, -1)}>Up</button>
            <button disabled={index === steps.length - 1} onClick={() => move(index, 1)}>Down</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditPractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const items = ['Timed wait test', 'Employees confirm meeting fit', 'Training note and rollback owner', 'Signed evidence pack with source, configuration, and defect disposition'];
  const lanes = ['Verification', 'Validation', 'Transition', 'Assurance / evidence quality'];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => onReadyChange(items.every((item) => answers[item])), [answers, onReadyChange]);
  return (
    <div className="practice-grid">
      {items.map((item) => (
        <label key={item} className="practice-card">
          <span>{item}</span>
          <select value={answers[item] ?? ''} onChange={(event) => setAnswers({ ...answers, [item]: event.target.value })}>
            <option value="">Evidence lane</option>
            {lanes.map((lane) => <option key={lane}>{lane}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function TriagePractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const signals = ['Stockouts exceed threshold', 'Leak below station B', 'Complaint trend improves'];
  const responses = ['Owner action', 'Safe isolation', 'Monitor'];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => onReadyChange(signals.every((item) => answers[item])), [answers, onReadyChange]);
  return (
    <div className="practice-grid">
      {signals.map((item) => (
        <label key={item} className="practice-card">
          <span>{item}</span>
          <select value={answers[item] ?? ''} onChange={(event) => setAnswers({ ...answers, [item]: event.target.value })}>
            <option value="">Response</option>
            {responses.map((response) => <option key={response}>{response}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function RecommendPractice({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const [choice, setChoice] = useState('');
  useEffect(() => onReadyChange(choice.length > 0), [choice, onReadyChange]);
  return (
    <div className="decision-row">
      {['Pass', 'Conditional pass', 'Hold'].map((option) => (
        <button key={option} className={cx('choice-tile', choice === option && 'selected')} onClick={() => setChoice(option)}>{option}</button>
      ))}
    </div>
  );
}

function MicroCheck({ unit, correct, onCorrect }: { unit: CoffeeLabUnit; correct: boolean; onCorrect: (correct: boolean) => void }) {
  const check = coffeeLabJourney[unit.id].microCheck;
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <section className="micro-check">
      <span className="quest-kicker">Misconception check</span>
      <h3>{check.question}</h3>
      <div className="practice-stack">
        {check.options.map((option, index) => (
          <button
            key={option}
            className={cx('micro-option', selected === index && (index === check.correctIndex ? 'correct' : 'incorrect'))}
            onClick={() => {
              setSelected(index);
              onCorrect(index === check.correctIndex);
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {selected !== null && <p>{correct ? check.feedback : `Not quite. ${check.feedback}`}</p>}
    </section>
  );
}

function CoffeeCheatSheet({ currentUnit, onClose }: { currentUnit: CoffeeLabUnit; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<CheatSheetTab>('terms');
  const ep1 = catalog.episodes.find((episode) => episode.id === 'ep1-coffee-lab');
  const references = uniqueBy(
    [
      ...(ep1?.standards.map((reference) => ({
        label: reference.framework,
        url: reference.citation,
        note: reference.rationale,
      })) ?? []),
      ...course.units.flatMap((unit) => unit.references),
      {
        label: 'SEBoK: Systems Engineering Overview',
        url: 'https://sebokwiki.org/wiki/Systems_Engineering_Overview',
        note: 'Public entry point for systems engineering foundations, lifecycle context, and topic navigation.',
      },
      {
        label: 'SE Tailoring Framework: dashboard',
        url: 'https://haitaowu12.github.io/SE_Tailoring_Framework/#dashboard',
        note: 'Project tailoring reference for adapting systems engineering process depth to context, risk, and delivery needs.',
      },
    ],
    (reference) => reference.url,
  );

  return (
    <section className="cheatsheet-scrim" role="dialog" aria-modal="true" aria-labelledby="coffee-cheatsheet-title">
      <div className="cheatsheet-panel">
        <header className="cheatsheet-header">
          <div>
            <span className="quest-kicker">Learner support</span>
            <h2 id="coffee-cheatsheet-title">Glossary & Cheat Sheet</h2>
            <p>Use this as the shared reference layer for every Coffee Lab chapter.</p>
          </div>
          <button className="quest-button secondary" onClick={onClose}>Close</button>
        </header>

        <nav className="cheatsheet-tabs" role="tablist" aria-label="Cheat sheet sections">
          {cheatSheetTabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cx(activeTab === tab.id && 'active')}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="cheatsheet-body">
          {activeTab === 'terms' && (
            <section className="cheatsheet-section">
              <h3>Terms and coffee-service meaning</h3>
              <div className="term-index">
                {course.units.map((unit) => (
                  <details key={unit.id} open={unit.id === currentUnit.id}>
                    <summary>{unit.order}. {unit.cluster}: {unit.title}</summary>
                    <div className="cheatsheet-grid">
                      {unit.terms.map((term) => (
                        <article key={`${unit.id}-${term.term}`} className="cheatsheet-entry">
                          <strong>{term.term}</strong>
                          <p>{term.plain}</p>
                          <small>{term.example}</small>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'concepts' && (
            <section className="cheatsheet-section">
              <h3>Key concepts and walkthrough</h3>
              <div className="concept-thread">
                {course.units.map((unit) => (
                  <article key={unit.id} className={cx('concept-step', unit.id === currentUnit.id && 'current')}>
                    <span>{unit.order}</span>
                    <div>
                      <h4>{unit.cluster}: {unit.plainQuestion}</h4>
                      <p>{unit.concept}</p>
                      <small>{coffeeLabJourney[unit.id].learnerOutcome}</small>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'references' && (
            <section className="cheatsheet-section">
              <h3>Reference materials</h3>
              <div className="reference-list">
                {references.map((reference) => (
                  <a key={`${reference.label}-${reference.url}`} href={reference.url} target="_blank" rel="noreferrer">
                    <span className="reference-card-head">
                      <strong>{reference.label}</strong>
                      <em>Open reference</em>
                    </span>
                    <span>{reference.note}</span>
                    <small>{formatReferenceUrl(reference.url)}</small>
                  </a>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'deliverables' && (
            <section className="cheatsheet-section">
              <h3>Common deliverables and artifacts</h3>
              <div className="process-index">
                {course.units.map((unit) => (
                  <details key={unit.id} open={unit.id === currentUnit.id}>
                    <summary>{unit.order}. {unit.cluster} deliverables</summary>
                    <div className="artifact-list">
                      {unit.artifacts.map((artifact) => <span key={artifact}>{artifact}</span>)}
                    </div>
                    <div className="template-field-grid compact">
                      {coffeeLabJourney[unit.id].artifactTemplate.fields.map((field) => (
                        <article key={field.label}>
                          <strong>{field.label}</strong>
                          <p>{field.example}</p>
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'processes' && (
            <section className="cheatsheet-section">
              <h3>Processes, activities, and why they matter</h3>
              <p className="cheatsheet-note">
                Process names follow the ISO/IEC/IEEE 15288 system life cycle process terminology used as the organizing spine in the INCOSE Systems Engineering Handbook. SEBoK links provide the public learner reading for each process area.
              </p>
              <div className="process-index">
                {course.units.map((unit) => (
                  <details key={unit.id} open={unit.id === currentUnit.id}>
                    <summary>{unit.order}. {unit.lifecycleFocus}</summary>
                    <div className="process-summary">
                      <div>
                        <strong>ISO/INCOSE process alignment</strong>
                        <p>{unit.processes.join(', ')}</p>
                      </div>
                      <div>
                        <strong>Supporting practices</strong>
                        <p>{unit.supportingPractices.join(', ')}</p>
                      </div>
                      <div>
                        <strong>Why needed</strong>
                        <p>{unit.practice.why}</p>
                      </div>
                    </div>
                    <div className="process-reference-row" aria-label={`${unit.cluster} reference links`}>
                      <a href="https://www.iso.org/standard/81702.html" target="_blank" rel="noreferrer">ISO/IEC/IEEE 15288</a>
                      <a href="https://www.incose.org/resources-publications/technical-publications/se-handbook/" target="_blank" rel="noreferrer">INCOSE SE Handbook</a>
                      {unit.references.map((reference) => (
                        <a key={`${unit.id}-${reference.url}`} href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a>
                      ))}
                    </div>
                    <ul>{unit.keyActivities.map((activity) => <li key={activity}>{activity}</li>)}</ul>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function RailTitleScreen({ navigate }: { navigate: (view: View) => void }) {
  const manifest = levelManager.getManifest('ep2-rail-quest');
  const state = gameManager.getState();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <main className="quest-scroll rail-title-screen">
      <section className="rail-hero">
        <ResponsiveImage path={manifest.images?.title ?? 'assets/learning-quest/rail-title.webp'} alt="Rail control-room modernization mission" />
        <div>
          <button className="text-command light" onClick={() => navigate({ name: 'episodes' })}>SE Learning Quest</button>
          <h1>{manifest.programTitle}</h1>
          <p>{manifest.programSummary}</p>
          <div className="quest-actions">
            <button className="quest-button primary" onClick={() => navigate(state.activeMission ? { name: 'mission', chapterId: state.activeMission.chapterId } : { name: 'rail-map' })}>
              {state.activeMission ? 'Resume Mission' : state.completedChapterIds.length > 0 ? 'Open Map' : 'Start Episode'}
            </button>
            <button className="quest-button secondary" onClick={() => navigate({ name: 'episodes' })}>Choose Episode</button>
            <button className="quest-button danger" onClick={() => setConfirmReset(true)}>Reset</button>
          </div>
        </div>
      </section>
      <section className="status-board">
        <h2>Program posture</h2>
        <MetricStrip metrics={state.metrics} />
        <p>Read the situation, commit an SE action, complete a tactical exercise, then inspect consequence and readiness.</p>
      </section>
      <section className="campaign-model-strip">
        {veeModel.map((node) => (
          <article key={node.chapterId}>
            <span>{node.label}</span>
            <p>{node.learnerQuestion}</p>
          </article>
        ))}
      </section>
      {confirmReset && (
        <div className="modal-scrim" role="dialog" aria-modal="true">
          <div className="confirm-modal">
            <h2>Reset Rail Quest progress?</h2>
            <p>This clears the local EP2 campaign save. EP1 Coffee Lab progress stays separate.</p>
            <div className="quest-actions">
              <button className="quest-button secondary" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button className="quest-button danger" onClick={() => {
                gameManager.resetCampaign();
                setConfirmReset(false);
                navigate({ name: 'rail-title' });
              }}>Reset Episode</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function RailMapScreen({ navigate }: { navigate: (view: View) => void }) {
  const state = gameManager.getState();
  const manifest = levelManager.getManifest('ep2-rail-quest');
  const entries = gameManager.getAvailableChapters();
  const openChapter = (chapterId: string) => {
    const mission = gameManager.startChapter(chapterId);
    if (mission) navigate({ name: 'mission', chapterId });
  };
  return (
    <main className="quest-scroll rail-map-screen">
      <ProjectStatusPanel state={state} entries={entries} navigate={navigate} />
      <section className="rail-map-layout">
        <RailVeeMap manifestTitle={manifest.programTitle} subtitle={manifest.programSubtitle} entries={entries} onOpenChapter={openChapter} />
        <ChapterOutcomePanel entries={entries} onOpenChapter={openChapter} />
      </section>
    </main>
  );
}

function ProjectStatusPanel({
  state,
  entries,
  navigate,
}: {
  state: CampaignState;
  entries: ChapterEntry[];
  navigate: (view: View) => void;
}) {
  const status = describeProjectStatus(state, entries);
  const completedCount = entries.filter((entry) => entry.completed).length;
  const latest = latestCompletedEntry(entries);
  const next = nextOpenEntry(entries);
  const total = entries.length;
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <section className={cx('project-status-panel', status.tone)}>
      <div className="project-status-top">
        <div>
          <span className="quest-kicker">Project state</span>
          <h1>{status.label}</h1>
          <p>{status.summary}</p>
          <div className="quest-actions">
            <button className="quest-button secondary" onClick={() => navigate({ name: 'episodes' })}>Main Page</button>
            <button className="quest-button secondary" onClick={() => navigate({ name: 'rail-title' })}>Episode Intro</button>
          </div>
        </div>
        <div className="project-progress-card">
          <span>{completedCount}/{total} chapters complete</span>
          <div className="project-progress-track" aria-label="EP2 chapter progress">
            <i style={{ width: `${progressPct}%` }} />
          </div>
          <strong>{next?.chapter ? `Next: ${next.chapter.brief.title}` : 'All chapters complete'}</strong>
          <p>{latest?.result ? `Latest outcome: ${latest.result.rating}. ${latest.result.summary}` : 'Complete a chapter to record the first project outcome.'}</p>
        </div>
      </div>
      <MetricStrip metrics={state.metrics} />
    </section>
  );
}

function ChapterOutcomePanel({ entries, onOpenChapter }: { entries: ChapterEntry[]; onOpenChapter: (chapterId: string) => void }) {
  return (
    <aside className="chapter-outcomes" aria-label="Chapter outcomes">
      <div className="chapter-outcomes-header">
        <h2>Chapter outcomes</h2>
        <p>Each mission result updates the Vee and the project posture above.</p>
      </div>
      {entries.map((entry) => {
        if (!entry.chapter) return null;
        const result = entry.result;
        const statusLabel = result?.rating ?? (entry.active ? 'In progress' : entry.unlocked ? 'Ready' : 'Locked');
        const statusText = result?.summary ?? (entry.unlocked
          ? entry.chapter.brief.objective
          : 'Complete the prior lifecycle step to unlock this chapter.');
        return (
          <article key={entry.chapterId} className={cx('chapter-row', entry.unlocked && 'unlocked', entry.completed && 'complete', ratingClass(result?.rating))}>
            <span>{entry.chapter.pillar}</span>
            <h3>{entry.chapter.brief.title}</h3>
            <div className="chapter-status-line">
              <strong>{statusLabel}</strong>
              <small>{statusText}</small>
            </div>
            {result && (
              <div className="outcome-tags">
                {(result.outcomeTags.length > 0 ? result.outcomeTags : [result.rating]).slice(0, 2).map((tag) => (
                  <i key={tag}>{cleanOutcomeLabel(tag)}</i>
                ))}
              </div>
            )}
            <button className="quest-button primary" disabled={!entry.unlocked} onClick={() => onOpenChapter(entry.chapterId)}>
              {entry.completed ? 'Replay Chapter' : entry.active ? 'Resume Chapter' : 'Open Chapter'}
            </button>
          </article>
        );
      })}
    </aside>
  );
}

function RailVeeMap({
  manifestTitle,
  subtitle,
  entries,
  onOpenChapter,
}: {
  manifestTitle: string;
  subtitle: string;
  entries: ReturnType<typeof gameManager.getAvailableChapters>;
  onOpenChapter: (chapterId: string) => void;
}) {
  const entryById = new Map(entries.map((entry) => [entry.chapterId, entry]));
  return (
    <section className="rail-vee-panel" aria-label="Rail systems engineering Vee map">
      <div className="vee-copy">
        <span className="quest-kicker">Systems engineering Vee</span>
        <h1>{manifestTitle}</h1>
        <p>{subtitle}. Move down the left side to define the system, reach implementation at the Vee turning point, then climb the right side with integration, verification, transition, validation, and readiness evidence.</p>
      </div>
      <div className="vee-canvas">
        <svg className="vee-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points="10,18 25,38 40,58 50,82 60,58 75,38 90,18" />
          {veeModel.flatMap((node) => node.evidenceLinkIds.map((targetId) => {
            const target = veeNodeByChapterId.get(targetId);
            if (!target) return null;
            return <line key={`${node.chapterId}-${targetId}`} x1={node.x} y1={node.y} x2={target.x} y2={target.y} className="trace-line" />;
          }))}
        </svg>
        {veeModel.map((node) => {
          const entry = entryById.get(node.chapterId);
          if (!entry?.chapter) return null;
          const result = entry.result;
          const nodeStatus = result?.rating ?? (entry.active ? 'Current mission' : entry.unlocked ? 'Open mission' : 'Locked');
          const outcome = result?.outcomeTags[0] ? cleanOutcomeLabel(result.outcomeTags[0]) : null;
          return (
            <button
              key={node.chapterId}
              className={cx('vee-node', entry.unlocked && 'unlocked', entry.completed && 'complete', entry.active && 'active', ratingClass(result?.rating))}
              style={{ '--x': `${node.x}%`, '--y': `${node.y}%` } as CSSProperties}
              disabled={!entry.unlocked}
              onClick={() => onOpenChapter(node.chapterId)}
              aria-label={`${entry.chapter.order} ${node.label} ${nodeStatus}`}
            >
              <span>{entry.chapter.order}</span>
              <strong>{node.label}</strong>
              <small>{nodeStatus}</small>
              {outcome && <em>{outcome}</em>}
            </button>
          );
        })}
      </div>
      <div className="vee-legend">
        <span><i className="legend-dot unlocked" /> next mission</span>
        <span><i className="legend-dot complete" /> strong outcome</span>
        <span><i className="legend-dot fragile" /> watch outcome</span>
        <span><i className="legend-line" /> trace relationship</span>
      </div>
    </section>
  );
}

function MissionScreen({ chapterId, navigate }: { chapterId: string; navigate: (view: View) => void }) {
  const chapter = levelManager.getChapterById(chapterId);
  const initialMission = gameManager.getActiveMission()?.chapterId === chapterId ? gameManager.getActiveMission() : gameManager.startChapter(chapterId);
  const [mission, setMission] = useState<MissionState | null>(initialMission);
  const [drawerOpen, setDrawerOpen] = useState(false);
  if (!chapter || !mission) {
    return <EmptyState title="Mission unavailable" action="Back to map" onAction={() => navigate({ name: 'rail-map' })} />;
  }
  const decision = mission.awaitingSubgame ? null : chapter.decisions[mission.decisionIndex];
  return (
    <main className="quest-scroll mission-screen">
      <section className="mission-main">
        <header className="mission-header">
          <span className="quest-kicker">{chapter.pillar}</span>
          <h1>{chapter.brief.title}</h1>
          <p>{chapter.brief.situation}</p>
          <MetricStrip metrics={mission.metricsCurrent} />
          <div className="quest-actions">
            <button className="quest-button secondary" onClick={() => navigate({ name: 'rail-map' })}>Back to Map</button>
            <button className="quest-button secondary" onClick={() => setDrawerOpen(!drawerOpen)}>{drawerOpen ? 'Hide Field Notes' : 'Open Field Notes'}</button>
          </div>
        </header>
        <VeeContextBar chapterId={chapterId} />
        {mission.lastConsequenceSummary && <ConsequenceReveal mission={mission} />}
        {mission.awaitingSubgame || !decision ? (
          <TacticalExercise chapter={chapter} onComplete={(result) => navigate({ name: 'debrief', chapterId: result.chapterId })} />
        ) : (
          <section className="decision-stage">
            <span className="quest-kicker">{decision.label} / {mission.decisionIndex + 1} of {chapter.decisions.length}</span>
            <h2>{decision.prompt}</h2>
            <p>{decision.context}</p>
            <div className="option-grid">
              {decision.options.map((option) => (
                <article key={option.id} className={cx('option-tile', optionTone(option))}>
                  <h3>{option.title}</h3>
                  <p>{option.summary}</p>
                  <strong>{summarizeTradeoff(option)}</strong>
                  <button className="quest-button primary" onClick={() => {
                    const nextMission = gameManager.chooseDecisionOption(option.id);
                    if (nextMission) setMission({ ...nextMission });
                  }}>Commit action</button>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
      <aside className={cx('field-notes', drawerOpen && 'open')}>
        <h2>Field notes</h2>
        <strong>Stakeholders</strong>
        <ul>{chapter.brief.stakeholders.map((item) => <li key={item}>{item}</li>)}</ul>
        <strong>Unlocked notes</strong>
        <ul>{mission.unlockedNotes.length > 0 ? mission.unlockedNotes.map((item) => <li key={item}>{item}</li>) : <li>No notes unlocked yet.</li>}</ul>
        <strong>Decision log</strong>
        <ul>{mission.decisions.length > 0 ? mission.decisions.map((item) => <li key={item.decisionId}>{item.optionTitle}</li>) : <li>No committed actions yet.</li>}</ul>
      </aside>
    </main>
  );
}

function VeeContextBar({ chapterId }: { chapterId: string }) {
  const node = veeNodeByChapterId.get(chapterId);
  if (!node) return null;
  const linkedLabels = node.evidenceLinkIds
    .map((id) => veeNodeByChapterId.get(id)?.label)
    .filter(Boolean)
    .join(', ');
  return (
    <section className="vee-context-bar">
      <div>
        <span className="quest-kicker">Vee position</span>
        <h2>{node.label}</h2>
      </div>
      <p>{node.concept}</p>
      <strong>{node.learnerQuestion}</strong>
      {linkedLabels && <small>Trace relationship: {node.label} to {linkedLabels}</small>}
    </section>
  );
}

function ConsequenceReveal({ mission }: { mission: MissionState }) {
  const latest = mission.decisions[mission.decisions.length - 1];
  return (
    <section className="consequence-reveal">
      <span className="quest-kicker">Consequence revealed</span>
      <h2>{latest?.optionTitle ?? 'Program signal'}</h2>
      <p>{mission.lastConsequenceSummary}</p>
      {latest && <MetricDeltaStrip delta={latest.metricsApplied} />}
    </section>
  );
}

function TacticalExercise({ chapter, onComplete }: { chapter: CampaignChapter; onComplete: (result: ChapterResult) => void }) {
  const { subgame } = chapter;
  const [response, setResponse] = useState<string[] | Record<string, string>>(subgame.type === 'priority' || subgame.type === 'sequence' ? [] : {});
  const submit = () => {
    const result = gameManager.completeSubgame(response);
    if (result) onComplete(result);
  };
  return (
    <section className="tactical-stage">
      <span className="quest-kicker">Tactical exercise</span>
      <h2>{subgame.title}</h2>
      <p>{subgame.prompt}</p>
      <p>{subgame.instructions}</p>
      <SubgameInput subgame={subgame} response={response} setResponse={setResponse} />
      <button className="quest-button primary" onClick={submit}>Submit Exercise</button>
    </section>
  );
}

function SubgameInput({
  subgame,
  response,
  setResponse,
}: {
  subgame: SubgameSpec;
  response: string[] | Record<string, string>;
  setResponse: (response: string[] | Record<string, string>) => void;
}) {
  if (subgame.type === 'priority') {
    const selections = Array.isArray(response) ? response : [];
    return (
      <div className="practice-grid">
        {subgame.options.map((option) => (
          <label key={option.id} className="practice-card">
            <span><input type="checkbox" checked={selections.includes(option.id)} onChange={(event) => {
              setResponse(event.target.checked ? selections.concat(option.id) : selections.filter((id) => id !== option.id));
            }} /> {option.label}</span>
            <small>{option.detail}</small>
          </label>
        ))}
      </div>
    );
  }
  if (subgame.type === 'sequence') {
    const steps = Array.isArray(response) && response.length === subgame.steps.length ? response : [subgame.steps[2], subgame.steps[0], subgame.steps[3], subgame.steps[1]];
    const move = (index: number, direction: number) => {
      const next = steps.slice();
      [next[index], next[index + direction]] = [next[index + direction], next[index]];
      setResponse(next);
    };
    return (
      <div className="practice-stack">
        {steps.map((step, index) => (
          <div className="sequence-row" key={step}>
            <strong>{index + 1}. {step}</strong>
            <div><button disabled={index === 0} onClick={() => move(index, -1)}>Up</button><button disabled={index === steps.length - 1} onClick={() => move(index, 1)}>Down</button></div>
          </div>
        ))}
      </div>
    );
  }
  if (subgame.type === 'match') {
    const record = Array.isArray(response) ? {} : response;
    return (
      <div className="practice-grid">
        {subgame.leftItems.map((item) => (
          <label key={item} className="practice-card">
            <span>{item}</span>
            <select value={record[item] ?? ''} onChange={(event) => setResponse({ ...record, [item]: event.target.value })}>
              <option value="">Select {subgame.rightLabel.toLowerCase()}</option>
              {subgame.rightOptions.map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
        ))}
      </div>
    );
  }
  const record = Array.isArray(response) ? {} : response;
  return (
    <div className="practice-grid">
      {subgame.risks.map((risk) => (
        <label key={risk.id} className="practice-card">
          <span>{risk.label}</span>
          <small>{risk.detail}</small>
          <select value={record[risk.id] ?? ''} onChange={(event) => setResponse({ ...record, [risk.id]: event.target.value })}>
            <option value="">Select response</option>
            {subgame.categories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

function DebriefScreen({ chapterId, navigate }: { chapterId: string; navigate: (view: View) => void }) {
  const result = gameManager.getChapterResult(chapterId);
  const chapter = levelManager.getChapterById(chapterId);
  if (!result || !chapter) {
    return <EmptyState title="Debrief unavailable" action="Back to map" onAction={() => navigate({ name: 'rail-map' })} />;
  }
  return (
    <main className="quest-scroll debrief-screen">
      <section className="debrief-hero">
        <ResponsiveImage path={levelManager.getManifest('ep2-rail-quest').images?.debriefReadiness ?? 'assets/learning-quest/rail-debrief-readiness.webp'} alt="Rail readiness evidence board" />
        <div>
          <span className="quest-kicker">{chapter.pillar}</span>
          <h1>{result.rating}</h1>
          <h2>{result.headline}</h2>
          <p>{result.summary}</p>
        </div>
      </section>
      <section className="scorecard">
        <h2>Why this rating</h2>
        <div className="score-grid">
          <div><strong>Base posture</strong><p>Weighted from final program metrics.</p></div>
          <div><strong>Tactical effect</strong><p>{result.subgameResult?.passed ? 'Exercise strengthened readiness.' : 'Exercise exposed a readiness gap.'}</p></div>
          <div><strong>Critical concerns</strong><p>{result.criticalFlags.length} active concern{result.criticalFlags.length === 1 ? '' : 's'} carried into scoring.</p></div>
        </div>
        <MetricDeltaStrip delta={result.metricDelta} />
      </section>
      <VeeTraceDebrief chapterId={chapterId} result={result} />
      <section className="debrief-grid">
        <div className="evidence-card"><h2>Evidence thread</h2><ul>{(result.unlockedNotes.length ? result.unlockedNotes : result.outcomeTags).map((note) => <li key={note}>{note.replace(/_/g, ' ')}</li>)}</ul></div>
        <div className="evidence-card"><h2>Principle reinforced</h2><p>{result.principle}</p></div>
      </section>
      <div className="quest-actions debrief-actions">
        <button className="quest-button primary" onClick={() => navigate({ name: 'rail-map' })}>Back to Map</button>
        <button className="quest-button secondary" onClick={() => {
          const mission = gameManager.startChapter(chapterId);
          if (mission) navigate({ name: 'mission', chapterId });
        }}>Replay Chapter</button>
        <AuthorLink variant="footer" />
      </div>
    </main>
  );
}

function VeeTraceDebrief({ chapterId, result }: { chapterId: string; result: ChapterResult }) {
  const node = veeNodeByChapterId.get(chapterId);
  if (!node) return null;
  const linkedLabels = node.evidenceLinkIds
    .map((id) => veeNodeByChapterId.get(id)?.label)
    .filter(Boolean)
    .join(', ');
  return (
    <section className="vee-trace-debrief">
      <span className="quest-kicker">Vee trace updated</span>
      <h2>{node.label}: {node.learnerQuestion}</h2>
      <div className="trace-grid">
        <div><strong>Evidence gained</strong><p>{result.unlockedNotes[0] ?? result.outcomeTags[0]?.replace(/_/g, ' ') ?? 'Chapter evidence recorded.'}</p></div>
        <div><strong>Risk carried forward</strong><p>{result.criticalFlags.length > 0 ? result.criticalFlags.join(', ').replace(/_/g, ' ') : 'No critical concern carried forward.'}</p></div>
        <div><strong>Lifecycle link</strong><p>{linkedLabels ? `${node.label} evidence must stay consistent with ${linkedLabels}.` : 'This implementation point connects definition work to proof work.'}</p></div>
      </div>
    </section>
  );
}

function ExamScreen({ examId, navigate }: { examId: string; navigate: (view: View) => void }) {
  const exam = examManifests.find((entry) => entry.id === examId);
  const saved = LearnerProgressManager.load(course, gameManager.getState()).examResults[examId];
  const [responses, setResponses] = useState<Record<string, string>>(saved?.responses ?? {});
  const [submitted, setSubmitted] = useState(Boolean(saved));
  if (!exam) return <EmptyState title="Exam unavailable" action="Back to episodes" onAction={() => navigate({ name: 'episodes' })} />;
  const score = calculateExamScore(exam, responses);
  const scoreExam = () => {
    const result: ExamResult = {
      examId: exam.id,
      score,
      passed: score >= exam.passingScore,
      completedAt: new Date().toISOString(),
      responses,
    };
    LearnerProgressManager.saveExamResult(course, gameManager.getState(), result, exam.episodeId);
    setSubmitted(true);
  };
  return (
    <main className="quest-scroll exam-screen">
      <section className="exam-header">
        <span className="quest-kicker">Readiness self-check</span>
        <h1>{exam.title}</h1>
        <p>{exam.scenario}</p>
      </section>
      <section className="exam-tasks">
        {exam.tasks.map((task) => {
          const selected = responses[task.id] ?? '';
          const correct = task.correct.includes(selected);
          return (
            <article key={task.id} className={cx('exam-task', submitted && (correct ? 'correct' : 'incorrect'))}>
              <span className="quest-kicker">{task.type}</span>
              <h2>{task.prompt}</h2>
              <div className="decision-row">
                {task.options.map((option) => (
                  <button key={option} className={cx('choice-tile', selected === option && 'selected')} onClick={() => setResponses({ ...responses, [task.id]: option })}>{option}</button>
                ))}
              </div>
              {submitted && <p>{task.feedback}</p>}
            </article>
          );
        })}
      </section>
      {submitted && <div className="exam-result"><strong>{score}%</strong><span>{score >= exam.passingScore ? 'Passed' : 'Needs review'}</span></div>}
      <div className="quest-actions">
        <button className="quest-button primary" onClick={scoreExam}>Score Exam</button>
        <button className="quest-button secondary" onClick={() => navigate({ name: 'episodes' })}>Back to Episodes</button>
      </div>
    </main>
  );
}

function calculateExamScore(exam: ExamManifest, responses: Record<string, string>): number {
  const correct = exam.tasks.filter((task) => task.correct.includes(responses[task.id] ?? '')).length;
  return Math.round((correct / exam.tasks.length) * 100);
}

function MetricStrip({ metrics }: { metrics: CampaignState['metrics'] }) {
  return (
    <div className="metric-grid">
      {METRIC_KEYS.map((key) => (
        <div className="metric-tile" key={key} tabIndex={0}>
          <span>{metricLabels[key]}</span>
          <strong>{metrics[key]}</strong>
          <small>{key === 'risk_exposure' ? 'Lower is better' : 'Higher is better'}</small>
        </div>
      ))}
    </div>
  );
}

function MetricDeltaStrip({ delta }: { delta: MetricDelta }) {
  return (
    <div className="metric-grid compact">
      {METRIC_KEYS.map((key) => {
        const value = delta[key] ?? 0;
        return (
          <div className={cx('metric-tile', deltaTone(key, value))} key={key}>
            <span>{metricLabels[key]}</span>
            <strong>{value > 0 ? `+${value}` : value}</strong>
            <small>{formatDelta(key, value)}</small>
          </div>
        );
      })}
    </div>
  );
}

function ProgressDial({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className="progress-dial" style={{ '--progress': `${value}%` } as CSSProperties}>
      <strong>{label}</strong>
      <span>{caption}</span>
    </div>
  );
}

function EmptyState({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return (
    <main className="quest-scroll">
      <section className="empty-state">
        <h1>{title}</h1>
        <button className="quest-button primary" onClick={onAction}>{action}</button>
      </section>
    </main>
  );
}
