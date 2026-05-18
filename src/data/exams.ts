import type { ExamManifest } from '../types/index.ts';

export const examManifests: ExamManifest[] = [
  {
    id: 'ep1-readiness-exam',
    episodeId: 'ep1-coffee-lab',
    title: 'Coffee Lab Readiness Self-Check',
    scenario: 'A second office asks whether the coffee-service evidence pack is good enough to adapt before a Monday launch.',
    passingScore: 70,
    tasks: [
      {
        id: 'ep1-trace',
        type: 'trace',
        prompt: 'Build the evidence chain that best protects the original stakeholder need.',
        options: ['Need -> requirement -> architecture/interface/RAMS -> implementation -> integration -> verification -> validation/transition -> operation -> retirement/gate', 'Machine -> supplier quote -> launch note -> celebration', 'Budget -> equipment choice -> signage -> disposal'],
        correct: ['Need -> requirement -> architecture/interface/RAMS -> implementation -> integration -> verification -> validation/transition -> operation -> retirement/gate'],
        feedback: 'A transferable evidence chain keeps intent, design, implementation, integration, proof, operations, and gate judgment connected.',
      },
      {
        id: 'ep1-vv',
        type: 'classify',
        prompt: 'Classify the strongest validation evidence.',
        options: ['Timed wait test against the 3-minute requirement', 'Employees confirm they reach 9 a.m. meetings without the coffee queue disrupting work', 'Vendor confirms the QR support code works'],
        correct: ['Employees confirm they reach 9 a.m. meetings without the coffee queue disrupting work'],
        feedback: 'Validation answers whether the service solves the real operating problem.',
      },
      {
        id: 'ep1-gate',
        type: 'recommend',
        prompt: 'Choose the best gate recommendation when validation passes but backup cleaning coverage is still unassigned.',
        options: ['Pass with no conditions', 'Conditional pass with owner, date, monitoring, and residual-risk note', 'Hold forever because one condition exists'],
        correct: ['Conditional pass with owner, date, monitoring, and residual-risk note'],
        feedback: 'A conditional pass is acceptable only when the condition is controlled and visible.',
      },
    ],
  },
  {
    id: 'ep2-readiness-exam',
    episodeId: 'ep2-rail-quest',
    title: 'Rail Modernization Readiness Self-Check',
    scenario: 'The sponsor asks for a go/no-go recommendation after integration defects, verification evidence gaps, and operating-readiness concerns converge.',
    passingScore: 75,
    tasks: [
      {
        id: 'ep2-interface',
        type: 'classify',
        prompt: 'Pick the issue that is truly an integration/interface risk.',
        options: ['The display vendor uses a different font', 'The control-center-to-wayside interface passes a standalone message check but sends fallback-timing defects to the wrong subsystem owner', 'The status slide needs a shorter title'],
        correct: ['The control-center-to-wayside interface passes a standalone message check but sends fallback-timing defects to the wrong subsystem owner'],
        feedback: 'Interface risk lives in the handoff and ownership path, not only in standalone component behavior.',
      },
      {
        id: 'ep2-readiness',
        type: 'triage',
        prompt: 'Choose the best readiness response before passenger operations.',
        options: ['Launch and track defects later', 'Run an owned defect burn-down, verify regression checks, confirm transition owners, then decide', 'Delay without naming evidence gaps'],
        correct: ['Run an owned defect burn-down, verify regression checks, confirm transition owners, then decide'],
        feedback: 'A rail readiness decision needs evidence closure, not optimism or vague caution.',
      },
      {
        id: 'ep2-gate',
        type: 'recommend',
        prompt: 'A safety assessor accepts the hazard controls, but operations training has incomplete shift coverage. What recommendation is strongest?',
        options: ['Conditional go-live with shift-coverage owner, date, fallback, and monitoring', 'Full go-live because safety accepted the controls', 'Hold without a recovery plan'],
        correct: ['Conditional go-live with shift-coverage owner, date, fallback, and monitoring'],
        feedback: 'Operational transition conditions need owners and fallback before they can support a go-live decision.',
      },
    ],
  },
];
