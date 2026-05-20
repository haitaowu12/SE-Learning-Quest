# SE Learning Quest

SE Learning Quest is a public systems engineering learning platform. It teaches practical SE thinking through interactive, scenario-based episodes instead of abstract process lectures.

Built by [Tony Wu](https://haitaowu12.github.io/tony-wu-home/) - systems engineering tools, assurance workflows, and learning simulations.

Play the current GitHub Pages build: [SE Learning Quest](https://haitaowu12.github.io/SE-Learning-Quest/)

## Learning Journey

The platform is organized as a progression:

- **EP1 teaches the lifecycle grammar.** Learners build one evidence thread through a simple coffee-service project: signal, need, requirement, architecture, interface control, RAMS, implementation, integration, proof, operations feedback, retirement, and gate recommendation.
- **EP2 tests judgment under pressure.** Learners apply the same habits in a rail modernization campaign where decisions compound across stakeholders, interfaces, metrics, risk, assurance, sequencing, and operations readiness.

The intent is not to memorize process names. The learner should finish with practical instincts for turning ambiguity into evidence-backed decisions before defects become rework, delay, safety exposure, and loss of stakeholder trust.

## Episodes

### EP1: Coffee Service Systems Lab

A beginner-first guided artifact lab for learners with little or no systems engineering background. The learner improves an office coffee service across a complete lifecycle by building a small portfolio of artifacts:

- Frame the problem, system boundary, measures, and stakeholders.
- Define stakeholder needs and testable system requirements.
- Architect interfaces, RAMS assumptions, and trade evidence.
- Implement controlled elements against the approved baseline.
- Integrate the service through interface activation, defect handling, retest, and rollback.
- Prove readiness through verification, transition, validation, and assurance evidence quality.
- Operate and maintain the service using RAMS and support signals.
- Retire the old service and decide a final gate recommendation with residual risk.

EP1 uses the ISO/IEC/IEEE 15288 technical processes as recurring evidence threads across one lifecycle case. It now runs through eight learning chapters: `Frame -> Define -> Architect -> Implement -> Integrate -> Prove -> Operate -> Retire`. Each chapter has a different activity mode so learners sort, rewrite, allocate, inspect, sequence, audit, triage, and recommend instead of repeating the same pattern.

### EP2: Harbour Line Modernization

The rail modernization campaign is the applied second episode for learners ready for a higher-context infrastructure scenario. EP2 focuses on lifecycle decisions in a transit program, including stakeholder alignment, interface ownership, assurance evidence, integration sequencing, validation, and operations readiness.

## Standards Approach

The app uses original beginner-facing explanations and public learn-more links. Local handbook and standards notes may be used during content validation, but the public app does not reproduce proprietary handbook or standards text.

Public references used by the learner experience:

- [SEBoK](https://sebokwiki.org/) for accessible systems engineering topic introductions.
- [INCOSE Systems Engineering Handbook](https://www.incose.org/resources-publications/technical-publications/se-handbook/) for practitioner handbook context.
- [ISO/IEC/IEEE 15288:2023](https://www.iso.org/standard/81702.html) for system life cycle process alignment.

## Stack

- Phaser 4
- TypeScript
- Vite
- DOM overlays for learner interface panels
- JSON course, campaign, and episode manifests
- Local browser storage for per-episode progress
- GitHub Pages deployment from the static build

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Run tests:

```bash
npm run test
```

Build the static site:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The Vite base path is `/SE-Learning-Quest/` to match GitHub Pages project hosting.

## Project Structure

```text
src/
  data/
    episodes.json          Episode selector manifest
    coffee-lab-course.json EP1 Coffee Service Systems Lab course content
    coffee-lab-journey.ts  EP1 worked examples, case evidence, rubrics, and checks
    campaign.json          EP2 Harbour Line Modernization
  game/                    Lab progress, save, level, scoring, and campaign state logic
  scenes/                  Episode selector, Coffee Lab, campaign, and DOM learner surfaces
  styles/                  Shared UI styling
  types/                   Shared TypeScript contracts
public/
  assets/coffee-lab/       EP1 visual atlas crops for lesson and episode imagery
  motion/                  Static SVG motion posters and reduced-motion fallbacks
hyperframes/
  DESIGN.md                Motion identity for companion explainer assets
  *.html                   HyperFrames source compositions for companion motion
tests/
  *.test.ts                Campaign, save, and content checks
```

## Public Release Checklist

- EP1 and EP2 progress are stored separately.
- Learner data contains no answer keys, facilitator controls, download promises, or local vault paths.
- EP1 includes references and glossary-style reinforcement without copying standards text.
- Motion assets include static SVG fallbacks and respect reduced-motion preferences.
- Tests and build pass before deployment.

## License

MIT
