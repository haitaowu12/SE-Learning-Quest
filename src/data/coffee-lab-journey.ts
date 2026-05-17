export interface CoffeeLabEvidenceItem {
  label: string;
  detail: string;
}

export interface CoffeeLabWorkedExample {
  title: string;
  weak: string;
  strong: string;
  reasoning: string;
}

export interface CoffeeLabTemplateField {
  label: string;
  example: string;
}

export interface CoffeeLabMicroCheck {
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
}

export interface CoffeeLabJourneyUnit {
  storyBeat: string;
  learnerOutcome: string;
  starterEvidence: CoffeeLabEvidenceItem[];
  conceptPlain: string;
  workedExample: CoffeeLabWorkedExample;
  commonTrap: string;
  artifactTemplate: {
    title: string;
    fields: CoffeeLabTemplateField[];
  };
  rubric: string[];
  microCheck: CoffeeLabMicroCheck;
  evidenceDelta: string;
  nextBridge: string;
}

export const coffeeLabJourney: Record<string, CoffeeLabJourneyUnit> = {
  frame: {
    storyBeat: 'The office manager asks for a faster coffee machine after three missed 9 a.m. meetings, but the first draft is a concept of operations for how the morning service should actually work.',
    learnerOutcome: 'You will turn a product request into a mission frame with a boundary, system context, stakeholders, concept of operations, MOE/MOP, assumptions, and early interfaces.',
    starterEvidence: [
      { label: 'Employee quote', detail: 'The line is worst between 8:30 and 9:15. People leave for meetings without coffee.' },
      { label: 'Facilities note', detail: 'Cleaning and restock are informal. Nobody owns the counter area after lunch.' },
      { label: 'Finance constraint', detail: 'Monthly service cost should stay below the current cafe reimbursement level.' },
      { label: 'Observation', detail: 'The machine is idle at times, but cups, milk, and queue position create delays.' },
    ],
    conceptPlain: 'Systems engineering starts by naming the real system and its operating story. The system is the service that produces value, not the object someone wants to buy. A concept of operations explains normal use before design choices harden.',
    workedExample: {
      title: 'Boundary statement',
      weak: 'The system is the new coffee machine.',
      strong: 'The system-of-interest is the office coffee service: machine, supplies, queue space, instructions, cleaning routine, support log, and restock process. Employees, finance, facilities utilities, waste handling, and vendor support are external interfaces.',
      reasoning: 'The strong version exposes what can make the service succeed or fail. It also separates project control from coordination needs and gives the concept of operations a real system context.',
    },
    commonTrap: 'Buying a better machine before proving the machine is the limiting part of the service.',
    artifactTemplate: {
      title: 'Mission frame',
      fields: [
        { label: 'Problem', example: 'Peak coffee access disrupts morning work and meetings.' },
        { label: 'System-of-interest', example: 'Coffee service including equipment, supplies, queue flow, cleaning, restock, and support.' },
        { label: 'External interfaces', example: 'Employees, facilities utilities, vendor support, finance approval, waste handling.' },
        { label: 'Measures', example: 'Peak average wait <= 3 minutes; stockout complaints <= 1 per week.' },
      ],
    },
    rubric: [
      'Boundary includes service workflow, not equipment only.',
      'Stakeholders and external interfaces are visible.',
      'Concept of operations explains who uses the service, when, where, and under what constraints.',
      'Measures connect to the original pain and separate MOE/MOP.',
      'Assumptions are visible enough to be checked later.',
    ],
    microCheck: {
      question: 'Which boundary is most useful for this project?',
      options: [
        'The coffee machine only.',
        'The office coffee service plus its support workflow and external interfaces.',
        'All food and beverage service in the company.',
      ],
      correctIndex: 1,
      feedback: 'Useful boundaries include controllable service elements and expose interfaces without making scope too large.',
    },
    evidenceDelta: 'Adds bounded mission, system context, concept of operations, stakeholders, MOE/MOP, assumptions, and early interfaces.',
    nextBridge: 'Next you will convert messy stakeholder voice and the concept of operations into needs, requirements, acceptance criteria, and proof intent.',
  },
  define: {
    storyBeat: 'Stakeholders agree coffee is a problem, but each person means something different by better. The concept of operations keeps those comments tied to real use instead of abstract wishes.',
    learnerOutcome: 'You will separate raw comments, needs, constraints, assumptions, risks, solution ideas, requirements, acceptance criteria, rationale, and proof intent.',
    starterEvidence: [
      { label: 'Employee quote', detail: 'I need coffee without missing my standup.' },
      { label: 'Facilities quote', detail: 'We need cleaning to be obvious and easy to inspect.' },
      { label: 'Finance quote', detail: 'We can approve this if monthly cost is predictable.' },
      { label: 'Draft requirement', detail: 'The machine shall be fast.' },
    ],
    conceptPlain: 'Needs explain why the system matters. Requirements translate selected needs and ConOps-to-needs trace into precise conditions the system can be designed, accepted, verified, and validated against.',
    workedExample: {
      title: 'Requirement rewrite',
      weak: 'The machine shall be fast.',
      strong: 'During 8:30-9:30 a.m. on normal office days, the coffee service shall keep average user wait time at or below 3 minutes, verified by a 5-day timed pilot.',
      reasoning: 'The strong version names the condition, system behavior, threshold, requirement rationale, acceptance criteria, and verification method. It does not prematurely choose a machine model.',
    },
    commonTrap: 'Treating every stakeholder sentence as a requirement. Some sentences are needs, constraints, assumptions, risks, or solution ideas.',
    artifactTemplate: {
      title: 'Need-to-requirement trace',
      fields: [
        { label: 'Raw input', example: 'The morning line is too long.' },
        { label: 'Need', example: 'Employees need coffee access without disrupting morning work.' },
        { label: 'Requirement', example: 'Peak average wait time shall be <= 3 minutes.' },
        { label: 'Proof intent', example: 'Timed pilot during peak week.' },
      ],
    },
    rubric: [
      'Need describes stakeholder intent, not a product.',
      'Requirement is singular and measurable.',
      'Condition, threshold, and verification intent are clear.',
      'Trace explains why requirement exists and which operational scenario it protects.',
    ],
    microCheck: {
      question: 'Which statement is a requirement?',
      options: [
        'Employees want less morning disruption.',
        'During peak hour, average wait time shall be <= 3 minutes.',
        'Buy the newest high-capacity machine.',
      ],
      correctIndex: 1,
      feedback: 'A requirement states verifiable system behavior. The need explains why; the product idea may become design later.',
    },
    evidenceDelta: 'Adds traceability from stakeholder intent and concept of operations to requirement, acceptance criteria, validation criteria, and proof intent.',
    nextBridge: 'Next you will shape solution patterns while making interfaces and RAMS assumptions visible.',
  },
  architect: {
    storyBeat: 'Three solution patterns look plausible, but each creates different handoffs, hazards, maintenance approach, support needs, and lifecycle costs.',
    learnerOutcome: 'You will compare architectures using needs, interfaces, RAMS criteria, concept of maintenance, assumptions, and sensitivity instead of choosing the favorite product.',
    starterEvidence: [
      { label: 'Option A', detail: 'One premium machine near the kitchen concentrates queue and cleaning load.' },
      { label: 'Option B', detail: 'Two smaller stations split demand but double restock and support touchpoints.' },
      { label: 'Option C', detail: 'Vendor cart handles peak demand but adds supplier schedule dependency.' },
      { label: 'RAMS concern', detail: 'A leak, stockout, slow repair, or sanitation issue can erase the service benefit.' },
    ],
    conceptPlain: 'Architecture allocates functions and exposes interfaces. RAMS asks what must stay reliable, available, maintainable, and safe. The concept of maintenance explains how capability will be sustained or restored. Analysis shows why one option is stronger under stated assumptions.',
    workedExample: {
      title: 'Interface and RAMS trade reasoning',
      weak: 'Option A wins because it has the best machine.',
      strong: 'Option B is preferred because it reduces queue concentration and avoids new plumbing. Conditions: office admin owns restock threshold, facilities owns cleaning inspection, vendor MTTR is monitored, and leak hazard control is verified before launch.',
      reasoning: 'The strong version links the choice to requirements, interface ownership, RAMS assumptions, concept of maintenance, controls, and residual risk.',
    },
    commonTrap: 'Calling a product comparison an architecture decision without mapping functions, interfaces, RAMS assumptions, and lifecycle consequences.',
    artifactTemplate: {
      title: 'Architecture, interface, and RAMS board',
      fields: [
        { label: 'Function allocation', example: 'Brew: machine; restock: office admin; fault response: vendor; cleaning: facilities.' },
        { label: 'Interface row', example: 'Provider, consumer, exchange, owner, acceptance check, evidence, escalation.' },
        { label: 'RAMS row', example: 'Leak hazard: cause, consequence, control, proof, owner, accepted residual risk, and monitoring trigger.' },
        { label: 'Trade sensitivity', example: 'If vendor response exceeds 24 hours, two-station option needs stronger local fallback.' },
      ],
    },
    rubric: [
      'Functions are allocated across equipment, people, information, and supplier support.',
      'Interface row includes owner, exchange, acceptance evidence, and escalation.',
      'RAMS row includes cause, consequence, control, evidence, owner, acceptance decision, and residual risk.',
      'Preferred option names at least one sensitivity that could change the answer.',
    ],
    microCheck: {
      question: 'Which item makes an interface controlled?',
      options: [
        'Someone says facilities and vendor will coordinate as needed.',
        'Provider, consumer, owner, exchange, acceptance check, evidence, escalation, and change trigger are recorded.',
        'The interface is drawn on a diagram with no owner.',
      ],
      correctIndex: 1,
      feedback: 'Interface control requires accountable ownership, expected exchange, evidence, and a change path.',
    },
    evidenceDelta: 'Adds function allocation, interface register, RAMS mini-log, concept of maintenance sketch, and trade rationale.',
    nextBridge: 'Next you will inspect delivered elements before integration pressure hides baseline mistakes.',
  },
  implement: {
    storyBeat: 'The chosen service arrives Friday, but delivered boxes, labels, settings, and support links do not automatically equal accepted system elements.',
    learnerOutcome: 'You will inspect configuration items, supplier deviations, waivers, enabling-system readiness, and element readiness before integration starts.',
    starterEvidence: [
      { label: 'Delivery', detail: 'Two machines, starter supplies, labels, and vendor support QR code arrive Friday.' },
      { label: 'Configuration issue', detail: 'Quick-start instructions mention the old support email.' },
      { label: 'Supplier note', detail: 'Vendor substituted a newer grinder setting guide than the approved pilot package.' },
      { label: 'Entry criterion', detail: 'Integration dry run starts only after element acceptance defects are dispositioned.' },
    ],
    conceptPlain: 'Implementation is where elements are created or obtained. Readiness checks protect later integration by catching wrong versions, missing support assets, supplier assumptions, weak configuration status accounting, and enabling-system gaps early.',
    workedExample: {
      title: 'Implementation disposition',
      weak: 'The machines arrived, so implementation is complete.',
      strong: 'Machine model, settings guide, cleaning kit, QR support route, labels, restock form, spares, and support queue are checked against the implementation baseline. Old support email is logged as a nonconformance, assigned to vendor, and blocked from integration until retested.',
      reasoning: 'The strong version checks configuration, acceptance, owner, and integration impact before declaring the element ready.',
    },
    commonTrap: 'Treating procurement delivery as implementation acceptance.',
    artifactTemplate: {
      title: 'Implementation readiness record',
      fields: [
        { label: 'Configuration item', example: 'Support QR code version, cleaning checklist, machine setting, restock form.' },
        { label: 'Acceptance check', example: 'Matches approved pilot baseline and routes to correct owner.' },
        { label: 'Nonconformance', example: 'Old support email on quick-start label.' },
        { label: 'Disposition', example: 'Vendor fixes label; QR route retested before integration.' },
      ],
    },
    rubric: [
      'Configuration items include equipment, information, and support assets.',
      'Mismatch has owner and disposition.',
      'Entry-to-integration decision is explicit.',
      'Impact on interfaces, RAMS, or proof is considered.',
    ],
    microCheck: {
      question: 'What belongs in implementation readiness?',
      options: [
        'Delivered machine matches approved model and support route is current.',
        'Employees like the coffee after a month.',
        'Old machine retirement contract is closed.',
      ],
      correctIndex: 0,
      feedback: 'Implementation confirms realized elements and configuration before integration, validation, operation, or retirement.',
    },
    evidenceDelta: 'Adds controlled element readiness, implementation baseline, configuration checks, enabling-system readiness, and nonconformance disposition.',
    nextBridge: 'Next you will connect accepted elements and prove interfaces through a dry-run sequence.',
  },
  integrate: {
    storyBeat: 'The accepted elements work alone, then fail together when support tickets route to the wrong owner and queue tape blocks cleaning access.',
    learnerOutcome: 'You will build an integration plan, set entry/exit criteria, sequence interface activation, log defects, retest fixes, check regression, and preserve rollback.',
    starterEvidence: [
      { label: 'Dry-run result', detail: 'Machine powers on and dispenses correctly in isolation.' },
      { label: 'Interface defect', detail: 'Support QR creates a ticket but assigns it to the wrong vendor queue.' },
      { label: 'Regression risk', detail: 'Queue tape improves line flow but blocks the cleaning cart path.' },
      { label: 'Fallback', detail: 'Old machine remains available until critical interfaces pass retest.' },
    ],
    conceptPlain: 'Integration combines elements and tests the handoffs between them. Entry/exit criteria, interface verification, defect logging, fix verification, regression checks, and rollback are part of making the system real.',
    workedExample: {
      title: 'Defect and retest record',
      weak: 'Facilities and vendor will coordinate as needed.',
      strong: 'Support-ticket interface defect: QR routes to vendor queue B instead of coffee support queue. Owner: vendor. Fix due Thursday. Retest: create ticket, verify owner, capture ticket ID in support log. Regression: user instructions still point to same QR.',
      reasoning: 'The strong version names interface, defect, owner, fix, retest evidence, interface verification, and regression concern.',
    },
    commonTrap: 'Marking integration done when equipment is installed, even though handoffs and support paths are untested.',
    artifactTemplate: {
      title: 'Integration and retest plan',
      fields: [
        { label: 'Sequence', example: 'Power -> support QR -> restock -> queue flow -> cleaning -> waste.' },
        { label: 'Interface activation', example: 'Provider, consumer, trigger, expected exchange, evidence.' },
        { label: 'Defect record', example: 'Owner, severity, fix, retest, regression check.' },
        { label: 'Rollback', example: 'Keep old machine until support and cleaning interfaces pass.' },
      ],
    },
    rubric: [
      'Integration sequence starts with controllable checks.',
      'At least one cross-organization interface is tested.',
      'Defect has owner, fix, retest, and regression note.',
      'Rollback condition is stated.',
    ],
    microCheck: {
      question: 'Which issue is an integration problem?',
      options: [
        'The machine powers on in isolation.',
        'The support QR code works but routes issues to the wrong owner.',
        'The machine has a stainless finish.',
      ],
      correctIndex: 1,
      feedback: 'Integration problems often appear at handoffs between elements, people, information, and organizations.',
    },
    evidenceDelta: 'Adds integration plan, interface activation evidence, defect handling, retest proof, regression check, entry/exit criteria, and rollback condition.',
    nextBridge: 'Next you will audit evidence quality before making a readiness claim.',
  },
  prove: {
    storyBeat: 'The dry run shows the machine can dispense coffee quickly, but launch confidence depends on VCRM trace, evidence quality, user fit, RAMS demonstration, and transition readiness.',
    learnerOutcome: 'You will separate verification, operational validation, transition, interface, and RAMS evidence, then audit whether each lane is decision-grade.',
    starterEvidence: [
      { label: 'Verification', detail: 'Peak wait observations meet <= 3 minutes for five normal office days.' },
      { label: 'Transition gap', detail: 'Facilities has not confirmed backup cleaner coverage.' },
      { label: 'Validation', detail: 'Employees say service no longer disrupts the morning standup.' },
      { label: 'Evidence risk', detail: 'Vendor repair-time assumption has not been observed during holiday staffing.' },
    ],
    conceptPlain: 'Verification asks whether requirements are met. Validation asks whether the solution fits the real need in a representative environment. Transition asks whether people, support, concept of maintenance, and environment are ready. Assurance asks whether evidence is trustworthy.',
    workedExample: {
      title: 'Claim-to-evidence slice',
      weak: 'The pilot passed, so verification and validation are complete.',
      strong: 'Claim: service ready for launch. Evidence: 5-day wait-time observations meet requirement on approved pilot configuration; user pilot confirms meeting-disruption need; transition has one open condition for backup cleaner coverage. Disposition: conditional pass, owner facilities, due before launch.',
      reasoning: 'The strong version separates claims, VCRM evidence, configuration, representative environment, open condition, owner, and decision impact.',
    },
    commonTrap: 'Using one successful test as proof that all readiness, assurance, and stakeholder-fit questions are answered.',
    artifactTemplate: {
      title: 'Readiness evidence lanes',
      fields: [
        { label: 'Verification lane', example: 'Requirement met, interface controlled, or hazard control verified.' },
        { label: 'Validation lane', example: 'Users confirm the service solves the meeting-disruption problem.' },
        { label: 'Transition lane', example: 'Support owner, training note, environment readiness, and rollback condition.' },
        { label: 'Evidence quality', example: 'Source, date, method, configuration, result, criterion, independence.' },
        { label: 'Decision impact', example: 'Backup cleaner gap makes launch conditional, not full pass.' },
      ],
    },
    rubric: [
      'Verification, operational validation, and transition evidence are separated.',
      'Evidence includes method, source, configuration, criterion, and result.',
      'Defect, gap, or assurance concern has disposition.',
      'Decision impact is clear: pass, condition, or hold.',
    ],
    microCheck: {
      question: 'Which evidence is validation?',
      options: [
        'A timed test shows wait requirement is met.',
        'A launch checklist names support owners.',
        'Employees confirm coffee access no longer disrupts morning meetings.',
      ],
      correctIndex: 2,
      feedback: 'Validation checks fit for intended use and stakeholder need. Verification checks stated requirements.',
    },
    evidenceDelta: 'Adds VCRM, operational validation, transition plan, RAMS demonstration, and assurance evidence-quality disposition.',
    nextBridge: 'Next you will operate the service and treat live signals as part of engineering control.',
  },
  operate: {
    storyBeat: 'Two weeks after launch, wait time still passes, but stockouts, cleaning load, and a small leak show the system is alive. The concept of maintenance now becomes daily engineering work.',
    learnerOutcome: 'You will turn operating signals into RAMS, FRACAS, preventive maintenance, corrective maintenance, supportability, and controlled-change actions.',
    starterEvidence: [
      { label: 'Availability signal', detail: 'Stockout complaints rise to 4 this week.' },
      { label: 'Safety signal', detail: 'Small leak found below station B after afternoon cleaning.' },
      { label: 'Maintainability signal', detail: 'Cleaning takes 12 minutes longer than expected during peak occupancy.' },
      { label: 'Change idea', detail: 'Move larger supply bins onto the counter.' },
    ],
    conceptPlain: 'Operation delivers value in the real environment. Maintenance restores or sustains capability. RAMS signals, FRACAS, supportability checks, degraded-operation rules, and controlled change prevent small fixes from creating new lifecycle problems.',
    workedExample: {
      title: 'Operating response',
      weak: 'Buy more supplies and bigger bins.',
      strong: 'Stockout availability threshold exceeded. Office admin checks restock frequency by Friday and logs the issue in FRACAS. Station B enters degraded operation until leak area is isolated, vendor repair ticket is closed, and return-to-service check passes. Facilities checks counter-space and cleaning impact before any bin change. Recheck complaints next week.',
      reasoning: 'The strong version names signal, RAMS category, threshold, FRACAS path, degraded-operation state, owner, action, safety check, change impact, and recheck.',
    },
    commonTrap: 'Collecting metrics without thresholds, owners, safe work checks, or a decision path.',
    artifactTemplate: {
      title: 'Operations and maintenance response',
      fields: [
        { label: 'Signal', example: 'Stockout complaints > 1 per week; leak found below station B.' },
        { label: 'RAMS category', example: 'Availability, maintainability, safety, reliability, support, or user fit.' },
        { label: 'Owner action', example: 'Vendor repair, facilities safe isolation, office admin restock adjustment.' },
        { label: 'Degraded operation', example: 'Station B out of service until safe isolation and return-to-service checks pass.' },
        { label: 'Change impact', example: 'Counter space, cleaning, cost, interface, proof, training, and recheck.' },
      ],
    },
    rubric: [
      'Operating signal has threshold.',
      'RAMS or support category is named.',
      'Owner, action, degraded-operation state, safe check, and recheck are stated.',
      'Change impact covers interfaces and proof.',
    ],
    microCheck: {
      question: 'Which response shows controlled change?',
      options: [
        'Move big bins immediately because complaints increased.',
        'Assign owner, check interface/RAMS/cost/proof impacts, update baseline if approved, and recheck signal.',
        'Ignore stockouts because wait time is still acceptable.',
      ],
      correctIndex: 1,
      feedback: 'Controlled change protects the system by checking consequences before updating the baseline.',
    },
    evidenceDelta: 'Adds operating feedback, RAMS signals, FRACAS learning, concept of maintenance response, supportability check, and controlled-change evidence.',
    nextBridge: 'Next you will retire the old service and make the final evidence-backed gate recommendation.',
  },
  retire: {
    storyBeat: 'Leadership asks whether to make the new service permanent and retire the old setup, including asset disposition, records archive, data retention, and post-removal verification.',
    learnerOutcome: 'You will make an evidence-backed pass, conditional pass, or hold recommendation that includes decommissioning, residual risk acceptance, records archive, and feed-forward lessons.',
    starterEvidence: [
      { label: 'Need trace', detail: 'Morning disruption need traces to peak wait requirement and pilot observations.' },
      { label: 'Open condition', detail: 'Backup cleaner coverage still needs owner confirmation.' },
      { label: 'Residual risk', detail: 'Vendor support time during holidays is not yet observed.' },
      { label: 'Retirement item', detail: 'Old machine, standing supplier order, support record, and expired supplies need closure.' },
      { label: 'Feed-forward item', detail: 'EP2 should inherit the evidence habit: owned conditions, residual risks, and lifecycle closeout.' },
    ],
    conceptPlain: 'A lifecycle gate decision is not a mood. It is a claim supported by traceable evidence, owned gaps, residual risk acceptance, and controlled retirement of replaced system elements, data, support paths, and records.',
    workedExample: {
      title: 'Gate recommendation',
      weak: 'Pass. Everyone likes the new coffee setup.',
      strong: 'Conditional pass. Requirement evidence, interface retest, RAMS controls, user validation, and operations data are acceptable. Conditions: facilities confirms backup cleaner by May 24; office admin monitors holiday vendor response for 30 days; old machine, supplier order, support record, and expired supplies retired by May 31.',
      reasoning: 'The strong version cites lifecycle evidence, conditions, owners, due dates, residual risk acceptance, data/support closure, and decommissioning actions.',
    },
    commonTrap: 'Treating retirement as cleanup after the project instead of part of lifecycle responsibility.',
    artifactTemplate: {
      title: 'Lifecycle evidence pack',
      fields: [
        { label: 'Evidence cited', example: 'Need, requirement, architecture, interface, RAMS, implementation, integration, proof, operations.' },
        { label: 'Conditions and risk', example: 'Owner, due date, residual risk, monitoring plan.' },
        { label: 'Retirement closure', example: 'Asset removal, supplier order, support record, data, waste, post-removal check.' },
        { label: 'Decision', example: 'Pass, conditional pass, or hold.' },
        { label: 'Feed-forward', example: 'Lessons learned, monitoring trigger, or next lifecycle action.' },
      ],
    },
    rubric: [
      'Recommendation is evidence-backed.',
      'Conditions have owners and due dates.',
      'Retirement and decommissioning are controlled.',
      'Residual risks, next monitoring step, and feed-forward lesson are explicit.',
    ],
    microCheck: {
      question: 'When is conditional pass appropriate?',
      options: [
        'When evidence is strong enough to proceed but named conditions must be closed.',
        'When the team wants to avoid saying no.',
        'When no evidence has been collected yet.',
      ],
      correctIndex: 0,
      feedback: 'Conditional pass is defensible only when remaining conditions are explicit, owned, and tracked.',
    },
    evidenceDelta: 'Completes the lifecycle evidence thread, including retirement criteria, decommissioning, records archive, residual risk acceptance, and lessons learned.',
    nextBridge: 'Apply the same habits in EP2, where the rail project adds more stakeholders, interfaces, safety assurance, schedule pressure, and public consequences.',
  },
};
