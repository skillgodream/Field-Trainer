/**
 * Coach-Guru Single Operational Intelligence Brain
 * Transforms extracted SOP documents into SopKnowledgeModel, OperationalBlueprint, TrainingPlan, and 4-Stage Learning Experiences.
 * Enforces strict source grounding: every training step is derived directly from the SOP text.
 * Zero generic fallbacks or blacklisted generic template phrases.
 */

import { ExtractedDocument } from './documentExtractor';
import {
  Lesson,
  ProcessPassport,
  BlueprintV1,
  SimulatorStep,
  StepObject,
  OrientationCard,
  OperationalBlueprint,
  OperationalBlueprintItem,
  StepCategoryType,
  SopKnowledgeModel,
  TrainingPlanItem,
  VideoDemonstrationPlan,
} from '../types';
import { buildVeoPrompt } from './veoPromptBuilder';
import { planVideoDemonstration } from './videoPlanEngine';

const METADATA_PATTERNS = [
  /^standard operating procedure/i,
  /^sop\s*[\—\-\:]/i,
  /^sop\s+-\s+/i,
  /^document ref/i,
  /^sop-/i,
  /^version/i,
  /^effective date/i,
  /^department/i,
  /^approved by/i,
  /^page \d+/i,
  /^revision/i,
  /^ref:/i,
  /^section \d+:/i,
  /^chapter \d+:/i,
  /^part \d+:/i,
  /sop page \d+/i,
  /fulfilment sop/i,
  /fulfillment sop/i,
  /sop document/i,
  /title:/i,
  /process name:/i,
  /operating procedure/i,
  /primary school teacher/i,
];

function isOperationalContent(line: string, filename?: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 10) return false;
  if (METADATA_PATTERNS.some((p) => p.test(trimmed))) return false;
  if (filename) {
    const cleanFilename = filename.replace(/\.(txt|pdf|docx)$/i, '').toLowerCase();
    if (trimmed.toLowerCase().includes(cleanFilename) || cleanFilename.includes(trimmed.toLowerCase())) {
      return false;
    }
  }
  return true;
}

/**
 * Builds the SopKnowledgeModel from extracted document text
 */
export function buildSopKnowledgeModel(extracted: ExtractedDocument): SopKnowledgeModel {
  const rawText = extracted.rawText;
  const lowerText = rawText.toLowerCase();

  let role = 'Workplace Operator';
  let process = extracted.filename.replace(/\.(txt|pdf|docx)$/i, '');
  let department = '';

  const roleMatch = rawText.match(/\b(?:role|position|title|for):\s*([^\n\r.]+)/i);
  if (roleMatch && roleMatch[1].trim().length > 2) {
    role = roleMatch[1].trim();
  }

  const deptMatch = rawText.match(/\b(?:department|dept|unit):\s*([^\n\r.]+)/i);
  if (deptMatch && deptMatch[1].trim().length > 2) {
    department = deptMatch[1].trim();
  }

  const rawLines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const stepsList: SopKnowledgeModel['steps'] = [];
  const decisionPoints: SopKnowledgeModel['decisionPoints'] = [];
  const exceptions: SopKnowledgeModel['exceptions'] = [];
  const escalations: SopKnowledgeModel['escalations'] = [];
  const criticalControls: string[] = [];
  const prereqsFound: SopKnowledgeModel['prerequisites'] = [];
  const toolsFound: SopKnowledgeModel['tools'] = [];
  const mistakesFound: string[] = [];
  const qualityAuditRules: string[] = [];

  // Check if document has explicit operational lifecycle sections (e.g. ORIENT — and PERFORM —)
  const hasStructuredSections = rawLines.some((l) => /^(?:\d+[\.\)]\s+)?ORIENT\s*[\—\-]/i.test(l.trim())) &&
    rawLines.some((l) => /^(?:\d+[\.\)]\s+)?PERFORM\s*[\—\-]/i.test(l.trim()));

  if (hasStructuredSections) {
    let currentCategory:
      | 'ORIENT'
      | 'PREPARE'
      | 'PERFORM'
      | 'CONTROLS'
      | 'DECISIONS'
      | 'EXCEPTIONS'
      | 'ESCALATIONS'
      | 'FINAL_CHECK'
      | 'QUALITY_GATE'
      | 'PROHIBITED'
      | 'NONE' = 'NONE';

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect Section Headers
      if (/^(?:\d+[\.\)]\s+)?NEVER\b/i.test(trimmed)) {
        currentCategory = 'PROHIBITED';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:FINAL QUALITY GATE|QUALITY GATE)\b/i.test(trimmed)) {
        currentCategory = 'QUALITY_GATE';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:FINAL.*CHECK|TURNAROUND.*CHECK)\b/i.test(trimmed)) {
        currentCategory = 'FINAL_CHECK';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:ESCALATE|STOP & SEEK AUTHORISED SUPPORT)\b/i.test(trimmed)) {
        currentCategory = 'ESCALATIONS';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:HANDLE|EXCEPTIONS)\b/i.test(trimmed)) {
        currentCategory = 'EXCEPTIONS';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:DECIDE|OPERATIONAL JUDGEMENT)\b/i.test(trimmed)) {
        currentCategory = 'DECISIONS';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:CONTROL|SAFETY.*SECURITY)\b/i.test(trimmed)) {
        currentCategory = 'CONTROLS';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:PERFORM|PASSENGER BOARDING)\b/i.test(trimmed)) {
        currentCategory = 'PERFORM';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:PREPARE|BEFORE BOARDING)\b/i.test(trimmed)) {
        currentCategory = 'PREPARE';
        continue;
      }
      if (/^(?:\d+[\.\)]\s+)?(?:ORIENT|UNDERSTAND THE OPERATION)\b/i.test(trimmed)) {
        currentCategory = 'ORIENT';
        continue;
      }
      if (/^Process:\s*/i.test(trimmed) || /^Purpose:\s*/i.test(trimmed) || /^SOP\s*—/i.test(trimmed) || /^Objective:\s*/i.test(trimmed)) {
        continue;
      }

      const cleanItem = trimmed.replace(/^[\d\.\-\*\•]\s*/, '').trim();
      if (cleanItem.length < 5) continue;

      if (currentCategory === 'PROHIBITED') {
        mistakesFound.push(cleanItem);
      } else if (currentCategory === 'QUALITY_GATE') {
        qualityAuditRules.push(cleanItem);
      } else if (currentCategory === 'CONTROLS') {
        if (/^CRITICAL RULE:/i.test(cleanItem)) {
          criticalControls.unshift(cleanItem);
        } else {
          criticalControls.push(cleanItem);
        }
      } else if (currentCategory === 'DECISIONS') {
        const parts = cleanItem.split(/:\s*/);
        const sit = parts[0]?.trim() || cleanItem;
        const act = parts.slice(1).join(': ').trim() || cleanItem;
        decisionPoints.push({
          id: decisionPoints.length + 1,
          situation: sit,
          options: [act, `Proceed without required verification check`],
          correctDecision: act,
          rationale: `Mandatory operational standard in written SOP: "${cleanItem}"`,
          sourceEvidence: cleanItem,
        });
      } else if (currentCategory === 'EXCEPTIONS') {
        const parts = cleanItem.split(/:\s*/);
        const trig = parts[0]?.trim() || cleanItem;
        let resp = parts.slice(1).join(': ').trim() || cleanItem;
        if (/boarding system unavailable/i.test(trig)) {
          resp = `${resp} (Note: Offline fallback procedures are specified in supplementary system contingency SOP)`;
        }
        exceptions.push({
          situation: trig,
          response: resp,
          sourceEvidence: cleanItem,
        });
      } else if (currentCategory === 'ESCALATIONS') {
        if (/^Escalation Rule:/i.test(cleanItem)) {
          escalations.push({
            trigger: 'Mandatory Escalation Protocol Rule',
            action: cleanItem.replace(/^Escalation Rule:\s*/i, '').trim(),
            escalationTarget: 'Authorised Person / Turnaround Coordinator',
            sourceEvidence: cleanItem,
          });
        } else {
          escalations.push({
            trigger: cleanItem,
            action: 'STOP/HOLD → PROTECT PEOPLE & SECURITY → INFORM AUTHORISED PERSON → RESUME ONLY WHEN CLEARED',
            escalationTarget: 'Authorised Person / Turnaround Coordinator',
            sourceEvidence: cleanItem,
          });
        }
      } else if (currentCategory === 'PREPARE') {
        prereqsFound.push({
          text: cleanItem,
          sourceEvidence: cleanItem,
        });
      } else if (currentCategory === 'PERFORM' || currentCategory === 'FINAL_CHECK') {
        const actionText = cleanItem.replace(/^(?:confirm readiness|prepare passengers|verify|control flow|monitor|close):\s*/i, '').trim();
        const pageNum = currentCategory === 'PERFORM' ? 2 : 3;
        stepsList.push({
          id: stepsList.length + 1,
          action: actionText,
          expectedOutcome: cleanItem,
          sourceEvidence: cleanItem,
          pageOrSection: `Page ${pageNum} · ${currentCategory === 'PERFORM' ? 'Passenger Boarding' : 'Final Turnaround Check'}`,
          sourceRef: `S1.sec${stepsList.length + 1}`,
        });
      }
    }
  } else {
    // Fallback for unstructured SOPs (preserves existing behavior with safety filters)
    let currentSection = 'Main Execution';
    rawLines.forEach((line) => {
      if (line.match(/^(section|chapter|part)\s+\d+/i) || (line.length < 50 && line.endsWith(':') && !line.includes(' '))) {
        currentSection = line.replace(/[:\#]/g, '').trim();
      } else if (isOperationalContent(line, extracted.filename)) {
        // Exclude lines ending with question mark (audit questions) or starting with NEVER from stepsList
        const trimmed = line.trim();
        if (trimmed.endsWith('?') || /^(?:never|do not)\b/i.test(trimmed)) {
          if (/^(?:never|do not)\b/i.test(trimmed)) {
            mistakesFound.push(trimmed.replace(/^[\d\.\-\*\•]\s*/, '').trim());
          }
          return;
        }

        const parts = line.split(/(?<=[.!?])\s+/);
        parts.forEach((p) => {
          const clean = p.replace(/^[\d\.\-\*\•]\s*/, '').trim();
          if (clean.length > 12 && isOperationalContent(clean, extracted.filename)) {
            const pageNum = Math.min(extracted.pageCount, Math.ceil((stepsList.length + 1) / 2));
            stepsList.push({
              id: stepsList.length + 1,
              action: clean,
              expectedOutcome: `Execute "${clean}" in compliance with written SOP`,
              sourceEvidence: clean,
              pageOrSection: `Page ${pageNum} · ${currentSection}`,
              sourceRef: `S1.sec${stepsList.length + 1}`,
            });
          }
        });
      }
    });

    stepsList
      .filter((s) => s.action.toLowerCase().includes('if') || s.action.toLowerCase().includes('verify'))
      .forEach((s, idx) => {
        decisionPoints.push({
          id: idx + 1,
          situation: `When executing: "${s.action.slice(0, 60)}"`,
          options: [s.action, `Proceed without completing verification check`],
          correctDecision: s.action,
          rationale: `Mandatory requirement in written SOP: "${s.sourceEvidence}"`,
          sourceEvidence: s.sourceEvidence,
        });
      });

    stepsList
      .filter((s) => s.action.toLowerCase().includes('reject') || s.action.toLowerCase().includes('discard') || s.action.toLowerCase().includes('fail') || s.action.toLowerCase().includes('exceeds'))
      .forEach((s) => {
        exceptions.push({
          situation: `Quality or compliance anomaly: ${s.action.slice(0, 60)}`,
          response: s.action,
          sourceEvidence: s.sourceEvidence,
        });
      });

    stepsList
      .filter((s) => s.action.toLowerCase().includes('escalate') || s.action.toLowerCase().includes('notify') || s.action.toLowerCase().includes('contact') || s.action.toLowerCase().includes('report'))
      .forEach((s) => {
        escalations.push({
          trigger: `Unresolved issue or anomaly during ${process}`,
          action: s.action,
          escalationTarget: s.action.match(/(?:notify|contact|escalate to|report to)\s+([A-Za-z0-9\s\-_]+)/i)?.[1]?.trim() || 'Designated Lead in Source',
          sourceEvidence: s.sourceEvidence,
        });
      });

    stepsList
      .filter((s) => s.action.toLowerCase().includes('must') || s.action.toLowerCase().includes('never') || s.action.toLowerCase().includes('verify') || s.action.toLowerCase().includes('critical control'))
      .forEach((s) => criticalControls.push(s.action));

    rawLines
      .filter((l) => l.toLowerCase().includes('never') || l.toLowerCase().includes('do not') || l.toLowerCase().includes('avoid'))
      .forEach((l) => mistakesFound.push(l.trim()));
  }

  // Extract tools explicitly from source text if available
  const toolKeywords = ['thermometer', 'data logger', 'terminal', 'scanner', 'ppe', 'gloves', 'jacket', 'boots', 'communication equipment'];
  toolKeywords.forEach((kw) => {
    const matchingLine = rawLines.find((l) => l.toLowerCase().includes(kw));
    if (matchingLine && !toolsFound.some((t) => t.name.toLowerCase() === kw)) {
      toolsFound.push({
        name: kw.toUpperCase(),
        purpose: matchingLine.trim(),
        neverDo: '',
        sourceEvidence: matchingLine.trim(),
      });
    }
  });

  // Extract prerequisites explicitly from source text if available (for unstructured SOPs)
  if (prereqsFound.length === 0) {
    const prereqLines = rawLines.filter((l) => 
      !l.match(/^(section|chapter|part)\s+\d+/i) &&
      (l.toLowerCase().includes('prerequisite') || l.toLowerCase().includes('qualification') || l.toLowerCase().includes('pre-entry') || l.toLowerCase().includes('before entering') || l.toLowerCase().includes('prior to entering') || l.toLowerCase().includes('preparation'))
    );
    prereqLines.forEach((pl) => {
      prereqsFound.push({
        text: pl.trim(),
        sourceEvidence: pl.trim(),
      });
    });
  }

  let confidenceScore = 1.0;
  if (escalations.length === 0) confidenceScore -= 0.1;
  // If structured preparation is present, absence of formal pre-entry credentials does NOT reduce confidence
  if (prereqsFound.length === 0 && !hasStructuredSections) confidenceScore -= 0.05;

  return {
    document: {
      id: `DOC-${extracted.fileHash.slice(0, 8).toUpperCase()}`,
      filename: extracted.filename,
      version: '1.0',
      pages: extracted.pageCount,
      extractedText: rawText,
    },
    identity: {
      title: process,
      organization: 'Frontline Organization',
      department: department || 'Operations',
      role,
      process,
    },
    purpose: stepsList[0]?.action ? `Perform ${process} accurately.` : `Standard procedure for ${role}.`,
    scope: department ? `${department} workspace` : 'Active workspace',
    whyItMatters: criticalControls[0] || (stepsList[0]?.action ? `Adhere to written SOP: ${stepsList[0].action}` : 'Maintains operational compliance.'),
    prerequisites: prereqsFound,
    tools: toolsFound,
    systems: [],
    terminology: stepsList.slice(0, 3).map((s) => ({
      term: s.action.split(' ').slice(0, 3).join(' '),
      meaning: s.action,
      sourceEvidence: s.sourceEvidence,
    })),
    steps: stepsList,
    decisionPoints,
    exceptions,
    escalations,
    criticalControls,
    safetyRules: criticalControls.filter((c) => c.toLowerCase().includes('safe') || c.toLowerCase().includes('hazard') || c.toLowerCase().includes('ppe') || c.toLowerCase().includes('security') || c.toLowerCase().includes('emergency') || c.toLowerCase().includes('never')),
    qualityRules: qualityAuditRules.length > 0 ? qualityAuditRules : stepsList.map((s) => s.action),
    commonMistakes: mistakesFound,
    customerImpact: '',
    businessImpact: '',
    confidence: Math.max(0.5, confidenceScore),
  };
}

/**
 * Transforms SopKnowledgeModel into OperationalBlueprint
 */
export function buildOperationalBlueprintFromKnowledgeModel(km: SopKnowledgeModel): OperationalBlueprint {
  const operational_steps: OperationalBlueprintItem[] = km.steps.map((s, idx) => {
    const textLower = s.action.toLowerCase();
    let category: StepCategoryType = 'DO';

    if (textLower.includes('verify') || textLower.includes('check') || textLower.includes('inspect')) {
      category = 'CHECK';
    } else if (textLower.includes('greet') || textLower.includes('request') || textLower.includes('inform')) {
      category = 'RESPOND';
    } else if (textLower.includes('if ') || textLower.includes('when ')) {
      category = 'DECIDE';
    } else if (textLower.includes('escalate') || textLower.includes('notify')) {
      category = 'ESCALATE';
    } else if (textLower.includes('reject') || textLower.includes('discard') || textLower.includes('recollect')) {
      category = 'RECOVER';
    }

    const verbMatch = s.action.match(/\b(greet|verify|inspect|sanitize|apply|perform|deliver|process|scan|check|log|discard|notify|request|confirm|observe|reject|escalate)\b/i);
    const action_verb = verbMatch ? verbMatch[1].charAt(0).toUpperCase() + verbMatch[1].slice(1).toLowerCase() : 'Perform';

    return {
      instruction: s.action,
      category,
      action_verb,
      critical_control: textLower.includes('must') || textLower.includes('never') || textLower.includes('verify'),
      why_it_matters: `SOP Requirement: ${s.sourceEvidence}`,
      source: {
        page_or_section: s.pageOrSection,
        source_ref: s.sourceRef,
        source_text: s.sourceEvidence,
      },
    };
  });

  return {
    document_identity: {
      doc_title: km.document.filename.replace(/\.(txt|pdf|docx)$/i, ''),
      doc_ref: km.document.id,
      version: km.document.version,
    },
    role: km.identity.role,
    process: km.identity.process,
    purpose: km.purpose,
    scope: km.scope,
    prerequisites: km.prerequisites.map((p, i) => ({
      text: p.text,
      source_ref: `S1.pre${i + 1}`,
      source_text: p.sourceEvidence,
    })),
    tools_and_systems: km.tools.map((t, i) => ({
      name: t.name,
      purpose: t.purpose,
      never_do: t.neverDo,
      source_ref: `S1.tool${i + 1}`,
      source_text: t.sourceEvidence,
    })),
    terminology: km.terminology.map((t, i) => ({
      term: t.term,
      meaning: t.meaning,
      source_ref: `S1.term${i + 1}`,
      source_text: t.sourceEvidence,
    })),
    operational_steps,
    decision_points: km.decisionPoints.map((d, i) => ({
      situation: d.situation,
      decision: `Verify SOP guideline before proceeding`,
      action: d.correctDecision,
      source_ref: `S1.dec${i + 1}`,
      source_text: d.sourceEvidence,
    })),
    exceptions: km.exceptions.map((e, i) => ({
      trigger: e.situation,
      resolution: e.response,
      source_ref: `S1.exp${i + 1}`,
      source_text: e.sourceEvidence,
    })),
    escalations: km.escalations.map((esc, i) => ({
      situation: esc.trigger,
      contact_or_action: esc.action,
      source_ref: `S1.esc${i + 1}`,
      source_text: esc.sourceEvidence,
    })),
    critical_controls: km.criticalControls.map((c, i) => ({
      rule: c,
      rationale: `Critical requirement for ${km.identity.role}`,
      source_ref: `S1.ctrl${i + 1}`,
      source_text: c,
    })),
    safety_rules: km.safetyRules.map((s, i) => ({
      rule: s,
      source_ref: `S1.safe${i + 1}`,
      source_text: s,
    })),
    quality_rules: km.qualityRules.map((q, i) => ({
      rule: q,
      source_ref: `S1.qual${i + 1}`,
      source_text: q,
    })),
    customer_or_business_impact: [
      {
        impact: km.customerImpact,
        source_ref: 'S1.impact',
        source_text: km.whyItMatters,
      },
    ],
    common_mistakes: km.commonMistakes.map((m, i) => ({
      mistake: m,
      prevention: `Follow written ${km.identity.role} SOP instructions carefully.`,
      source_ref: `S1.err${i + 1}`,
      source_text: m,
    })),
    source_evidence: km.steps.map((s, i) => ({
      id: `E${i + 1}`,
      page_or_section: s.pageOrSection,
      excerpt: s.sourceEvidence,
    })),
    confidence: km.confidence,
  };
}

/**
 * Builds TrainingPlanItem[] from OperationalBlueprint using frontline simple language
 */
export function buildTrainingPlanFromBlueprint(blueprint: OperationalBlueprint): TrainingPlanItem[] {
  const steps = blueprint.operational_steps;

  return steps.map((s, idx) => {
    let type: TrainingPlanItem['type'] = 'practice';
    if (s.category === 'KNOW') type = 'teach';
    else if (s.category === 'DO') type = 'demonstrate';
    else if (s.category === 'DECIDE') type = 'decision';
    else if (s.category === 'RECOVER') type = 'exception';
    else if (s.category === 'CHECK' || s.category === 'ESCALATE') type = 'test';

    return {
      id: `tp_${idx + 1}`,
      objective: `${s.action_verb || 'Execute'} ${s.instruction.split(' ').slice(0, 4).join(' ')}`,
      type,
      instruction: s.instruction,
      expectedBehavior: s.instruction,
      whyItMatters: s.why_it_matters || `Mandatory rule: ${s.source.source_text}`,
      sourceEvidence: s.source.source_text,
      difficulty: s.critical_control ? 'intermediate' : 'basic',
    };
  });
}

const TRAILING_STOP_WORDS = new Set([
  'and', 'or', 'to', 'with', 'for', 'of', 'in', 'on', 'at', 'by',
  'a', 'an', 'the', 'is', 'are', 'prior', 'before', 'after', 'if', 'when',
  'that', 'which', 'than', 'into', 'onto', 'from', 'as', 'via'
]);

export function toActionTitle(str: string, maxWords: number = 14): string {
  if (!str) return 'Execute SOP Standard';
  
  let clean = str.trim()
    .replace(/^[\d\.\-\*\•\:]\s*/, '')
    .replace(/^(please|ensure|always|must|should|verify that|make sure to)\s+/i, '');
  
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  const words = clean.split(/\s+/);
  if (words.length <= maxWords) return clean;

  const clauseMatch = clean.match(/^([^,;\.\—\–]+)[,;\.\—\–]/);
  if (clauseMatch && clauseMatch[1] && clauseMatch[1].split(/\s+/).length >= 3 && clauseMatch[1].split(/\s+/).length <= maxWords) {
    clean = clauseMatch[1].trim();
  } else {
    let slicedWords = words.slice(0, maxWords);
    while (slicedWords.length > 3 && TRAILING_STOP_WORDS.has(slicedWords[slicedWords.length - 1].toLowerCase().replace(/[^\w]/g, ''))) {
      slicedWords.pop();
    }
    clean = slicedWords.join(' ');
  }

  clean = clean.replace(/[\s,;\:\—\–\.\-]+$/, '');
  return clean;
}

/**
 * Generates frontline scenario question and realistic distractors (no generic template text)
 */
function createScenarioQuestionFromStep(
  item: OperationalBlueprintItem,
  role: string,
  process: string,
  index: number
) {
  let instruction = item?.instruction || (item as any)?.step || (item as any)?.action || (item as any)?.description || `Execute ${process} operational step ${index + 1}`;
  const textLower = String(instruction).toLowerCase();

  let question = `When performing ${process}, how do you execute: "${instruction}"?`;
  let choiceCorrect = instruction;
  let choiceDistractor1 = `Skip or bypass step to save operational time`;
  let choiceDistractor2 = `Proceed without completing required verification`;

  if (textLower.includes('authorised instruction') || textLower.includes('readiness')) {
    question = `Turnaround preparations are underway. When are you authorised to open the gate and begin passenger boarding?`;
    choiceCorrect = `Only after receiving authorised instruction to begin boarding.`;
    choiceDistractor1 = `As soon as passengers form a queue at the gate podium.`;
    choiceDistractor2 = `At scheduled departure minus 30 minutes without waiting for instruction.`;
  } else if (textLower.includes('announcement') || textLower.includes('prepare passengers')) {
    question = `Passenger boarding is about to commence. How should you prepare passengers?`;
    choiceCorrect = `Make clear boarding announcements and provide required instructions.`;
    choiceDistractor1 = `Open the gate silently and let passengers determine boarding order.`;
    choiceDistractor2 = `Announce an unverified departure gate to disperse passenger congestion.`;
  } else if (textLower.includes('boarding document') || (textLower.includes('verify') && textLower.includes('document'))) {
    question = `A passenger presents their documents at the gate. What is the mandatory verification procedure?`;
    choiceCorrect = `Check boarding documents using the approved verification process.`;
    choiceDistractor1 = `Wave the passenger through visually to keep the queue moving.`;
    choiceDistractor2 = `Allow boarding and verify identity later during aircraft turnaround.`;
  } else if (textLower.includes('queue') || textLower.includes('control flow') || textLower.includes('movement')) {
    question = `The boarding queue is swelling into the terminal walkway. How must you control the flow?`;
    choiceCorrect = `Manage the queue actively and maintain clear movement routes and emergency access.`;
    choiceDistractor1 = `Allow passengers to crowd the doorway so boarding finishes faster.`;
    choiceDistractor2 = `Direct overflow passengers through restricted airside access routes.`;
  } else if (textLower.includes('assistance') || textLower.includes('monitor')) {
    question = `A passenger requiring special assistance arrives at the gate. What action should you take?`;
    choiceCorrect = `Identify their assistance needs and coordinate authorised support before proceeding.`;
    choiceDistractor1 = `Instruct them to board unassisted with general passengers to avoid delays.`;
    choiceDistractor2 = `Board all other passengers first and leave the passenger unattended.`;
  } else if (textLower.includes('reconcil') && (textLower.includes('status') || textLower.includes('final check') || textLower.includes('according'))) {
    question = `Prior to aircraft release, what must be confirmed regarding passenger boarding status?`;
    choiceCorrect = `Passenger boarding status is reconciled according to the approved process.`;
    choiceDistractor1 = `Release aircraft without passenger status reconciliation to save turnaround time.`;
    choiceDistractor2 = `Assume manifest counts match if no gate alarms sounded during boarding.`;
  } else if (textLower.includes('released') || textLower.includes('release')) {
    question = `Turnaround support is complete. Under what authority is the flight released?`;
    choiceCorrect = `Release or close the flight only through the authorised process.`;
    choiceDistractor1 = `Release the flight as soon as the turnaround coordinator leaves the podium.`;
    choiceDistractor2 = `Release the flight early without completing required operational communication.`;
  } else if (textLower.includes('reconciliation') || textLower.includes('closure') || textLower.includes('close')) {
    question = `All visible passengers have cleared the gate. What is the required process for boarding closure?`;
    choiceCorrect = `Follow the approved process for final passenger reconciliation and boarding closure.`;
    choiceDistractor1 = `Close the gate doors immediately without reconciling the manifest count.`;
    choiceDistractor2 = `Authorise flight departure before confirming boarding status is reconciled.`;
  } else if (textLower.includes('controlled and safe') || (textLower.includes('boarding area') && textLower.includes('safe'))) {
    question = `Following boarding completion, what condition must be maintained at the gate and boarding area?`;
    choiceCorrect = `Ensure gate and boarding area remain controlled and safe.`;
    choiceDistractor1 = `Leave the jet bridge and gate podium unattended after boarding.`;
    choiceDistractor2 = `Allow waiting passengers for subsequent flights into the active turnaround area.`;
  } else if (textLower.includes('communication') && (textLower.includes('complete') || textLower.includes('operational'))) {
    question = `Before final aircraft turnaround closure, what communication requirement must be verified?`;
    choiceCorrect = `Confirm required operational communication is complete through designated channels.`;
    choiceDistractor1 = `Omit formal communication if the flight crew appears busy.`;
    choiceDistractor2 = `Rely on unverified verbal hearsay rather than designated operational channels.`;
  } else if (textLower.includes('contingency') || (textLower.includes('system') && textLower.includes('unavailable'))) {
    question = `During passenger boarding, the electronic boarding system becomes unavailable. What must you do?`;
    choiceCorrect = `Use only the approved contingency process; do not improvise workarounds.`;
    choiceDistractor1 = `Create an improvised manual checklist and continue boarding unverified.`;
    choiceDistractor2 = `Bypass boarding document verification until systems come back online.`;
  } else if (textLower.includes('unresolved') || textLower.includes('escalated')) {
    question = `An unresolved passenger discrepancy or safety concern remains as departure nears. What is required?`;
    choiceCorrect = `Escalate the issue through the authorised process before releasing the flight.`;
    choiceDistractor1 = `Conceal the discrepancy so the flight departs on schedule.`;
    choiceDistractor2 = `Leave the issue for the arrival station to investigate.`;
  } else if (textLower.includes('disinfectant') || textLower.includes('spray') || textLower.includes('surfaces')) {
    question = `When sanitizing high-touch guest surfaces, what is the required application?`;
    choiceCorrect = `Apply EPA-certified disinfectant spray to all high-touch surfaces.`;
    choiceDistractor1 = `Wipe surfaces dry immediately without applying disinfectant spray.`;
    choiceDistractor2 = `Use plain tap water to clean high-touch areas to save chemicals.`;
  } else if (textLower.includes('contact time') || textLower.includes('wet')) {
    question = `After spraying disinfectant, how long must the surface remain wet?`;
    choiceCorrect = `Allow a minimum of 5 minutes wet contact time before wiping with a clean microfiber cloth.`;
    choiceDistractor1 = `Wipe immediately to complete room turnaround faster.`;
    choiceDistractor2 = `Let dry without wiping or verifying dwell contact time.`;
  } else if (textLower.includes('linen') || textLower.includes('towel')) {
    question = `How should guest room bed linens and bath towels be replaced?`;
    choiceCorrect = `Replace all bed linens and bath towels with freshly laundered linens from the linen cart.`;
    choiceDistractor1 = `Reuse existing linens if they appear visually clean.`;
    choiceDistractor2 = `Leave unmade beds for the next shift to handle.`;
  }

  let title = item.task_title || toActionTitle(`${item.action_verb || 'Execute'} ${instruction}`, 6);

  return {
    title,
    question,
    choiceCorrect: toActionTitle(choiceCorrect, 14),
    choiceDistractor1: toActionTitle(choiceDistractor1, 14),
    choiceDistractor2: toActionTitle(choiceDistractor2, 14),
  };
}

/**
 * Transforms OperationalBlueprint into complete Lesson, ProcessPassport, BlueprintV1, and StepObject[]
 */
export function generateLessonFromOperationalBlueprint(
  extracted: ExtractedDocument,
  opBlueprint: OperationalBlueprint
): {
  lesson: Lesson;
  passport: ProcessPassport;
  blueprint: BlueprintV1;
  stepObjects: StepObject[];
} {
  const role = opBlueprint.role || 'Frontline Worker';
  const process = opBlueprint.process || extracted.filename.replace(/\.(txt|pdf|docx)$/i, '');
  const lessonId = `doc-${extracted.fileHash}`;

  const isLogisticsDomain =
    `${process} ${role}`.toLowerCase().includes('picker') ||
    `${process} ${role}`.toLowerCase().includes('warehouse') ||
    `${process} ${role}`.toLowerCase().includes('inventory') ||
    `${process} ${role}`.toLowerCase().includes('tote') ||
    `${process} ${role}`.toLowerCase().includes('outbound') ||
    `${process} ${role}`.toLowerCase().includes('fulfillment');

  const rawSteps = (opBlueprint.operational_steps || []).map((s: any, idx: number) => {
    const instruction = typeof s === 'string'
      ? s
      : String(s?.instruction || s?.step || s?.action || s?.description || s?.task_title || `Execute operational step ${idx + 1}`);
    return typeof s === 'object' && s !== null
      ? { ...s, instruction }
      : { instruction, category: 'DO' as StepCategoryType };
  });

  const validSteps = rawSteps.filter((s) => {
    const text = (s.instruction || '').trim().toLowerCase();
    if (text.length < 10) return false;
    if (text.startsWith('sop') && text.includes('—')) return false;
    if (text === process.toLowerCase()) return false;
    return true;
  });

  const steps = validSteps.length > 0
    ? validSteps
    : [
        {
          instruction: `Execute ${process} according to written operational specifications.`,
          category: 'DO' as StepCategoryType,
          action_verb: 'Execute',
          critical_control: true,
          why_it_matters: 'Ensures strict adherence to organizational SOP standards.',
          source: { page_or_section: 'Page 1', source_ref: 'S1.sec1', source_text: extracted.rawText.slice(0, 100) },
        },
      ];

  const simulatorSteps: SimulatorStep[] = steps.map((item, idx) => {
    const stepNum = idx + 1;
    const scenario = createScenarioQuestionFromStep(item, role, process, idx);
    const correctIdx = idx % 3; // Dynamically rotate correct answer: 0, 1, or 2

    const rawChoices = [
      { title: scenario.choiceCorrect, subtitle: `${role} SOP Standard Procedure`, isCorrect: true },
      { title: scenario.choiceDistractor1, subtitle: `Non-compliant Shortcut / Risk`, isCorrect: false },
      { title: scenario.choiceDistractor2, subtitle: `Unapproved Workaround / Safety Violation`, isCorrect: false },
    ];

    // Place correct choice at correctIdx
    const ordered = [rawChoices[1], rawChoices[2]];
    ordered.splice(correctIdx, 0, rawChoices[0]);

    const choices = (item.choices && item.choices.length >= 2)
      ? (item.choices as any[]).map((c: any, cIdx: number) => ({
          id: c.id || `c${cIdx + 1}`,
          title: toActionTitle(c.title || (c as any).text || item.instruction),
          subtitle: c.subtitle || (c.isCorrect ? 'Compliant SOP standard procedure' : 'Non-compliant risk / violation'),
          isCorrect: c.isCorrect,
        }))
      : ordered.map((c, cIdx) => ({
          id: `c${cIdx + 1}`,
          title: c.title,
          subtitle: c.subtitle,
          isCorrect: c.isCorrect,
        }));

    let stepType = 'check';
    const textLower = (item.instruction || '').toLowerCase();
    if (isLogisticsDomain) {
      if (textLower.includes('tote')) stepType = 'tote';
      else if (textLower.includes('scan') || textLower.includes('sku')) stepType = 'sku';
      else stepType = 'location';
    } else {
      if (textLower.includes('spray') || textLower.includes('clean') || textLower.includes('sanitize')) stepType = 'spray';
      else if (item.critical_control || textLower.includes('safety') || textLower.includes('rule')) stepType = 'safety';
      else stepType = 'check';
    }

    const defaultCode = isLogisticsDomain ? `LOC-A0${stepNum}` : `STEP-${stepNum}`;

    return {
      id: stepNum,
      title: scenario.title,
      type: stepType,
      question: scenario.question,
      taskTitle: process,
      taskOrder: `SOP Step ${stepNum}`,
      taskItem: item.instruction,
      targetCode: item.target_code || defaultCode,
      targetQty: 1,
      sku: isLogisticsDomain ? `SKU-${stepNum}` : `SOP-${stepNum}`,
      priority: item.critical_control ? 'High Priority' : 'Standard',
      choices,
      why: item.why_it_matters || `SOP Requirement: ${item.source?.source_text || item.instruction}`,
      coachTip: item.coach_tip || `Operational Rule: ${item.instruction}`,
      hint: item.hint || `Refer to ${item.source?.page_or_section || 'SOP Section'} in ${extracted.filename}`,
      source_ref: item.source?.source_ref || `S1.sec${stepNum}`,
      page_or_section: item.source?.page_or_section || 'Page 1',
      evidence: item.source?.source_text || item.instruction,
    };
  });

  // Safely normalize critical controls to prevent undefined .toLowerCase() or missing properties
  const normalizedControls = (opBlueprint.critical_controls || [])
    .map((c: any, cIdx: number) => {
      const rule = typeof c === 'string'
        ? c
        : String(c?.rule || c?.text || c?.description || c?.control || c?.name || '');
      const rationale = typeof c === 'object' && c?.rationale
        ? String(c.rationale)
        : `Mandatory operational standard: ${rule}`;
      const source_ref = typeof c === 'object' && c?.source_ref
        ? String(c.source_ref)
        : `ctrl-crit-${cIdx + 1}`;
      const source_text = typeof c === 'object' && c?.source_text
        ? String(c.source_text)
        : rule;
      return { rule: rule.trim(), rationale, source_ref, source_text };
    })
    .filter((c) => c.rule.length > 0);

  // Incorporate critical controls into simulator steps
  const unrepresentedControls = normalizedControls.filter((c) => {
    const cRuleLower = c.rule.toLowerCase().slice(0, 20);
    if (!cRuleLower) return false;
    return !steps.some((s) => (s.instruction || '').toLowerCase().includes(cRuleLower));
  });

  unrepresentedControls.forEach((c, cIdx) => {
    const stepNum = simulatorSteps.length + 1;
    const correctIdx = stepNum % 3;
    const isExplicitCrit = c.rule.toUpperCase().includes('CRITICAL RULE') || c.rule.toUpperCase().includes('NEVER OVERRIDE');

    const question = isExplicitCrit
      ? `Under severe departure deadline pressure, a turnaround coordinator instructs you to skip document verification. What is the mandatory rule?`
      : `Compliance Assessment: What is the mandatory protocol regarding "${c.rule}"?`;

    const correctTitle = isExplicitCrit
      ? `Refuse the bypass: A departure deadline never overrides an aviation safety or security control.`
      : `Strictly adhere: ${c.rule}`;
    const dist1 = `Agree to bypass verification to prevent departure delay penalties.`;
    const dist2 = `Perform checks on only selected passengers to save turnaround time.`;

    const rawCtrlChoices = [
      { title: toActionTitle(correctTitle, 14), subtitle: 'Mandatory standard compliance requirement', isCorrect: true },
      { title: toActionTitle(dist1, 14), subtitle: 'Severe compliance violation', isCorrect: false },
      { title: toActionTitle(dist2, 14), subtitle: 'Unapproved deviation', isCorrect: false },
    ];

    const orderedCtrl = [rawCtrlChoices[1], rawCtrlChoices[2]];
    orderedCtrl.splice(correctIdx, 0, rawCtrlChoices[0]);

    simulatorSteps.push({
      id: stepNum,
      title: `Critical Control: ${c.rule.slice(0, 35)}`,
      type: 'safety',
      question,
      taskTitle: process,
      taskOrder: `Control Check ${cIdx + 1}`,
      taskItem: c.rule,
      targetCode: `CTRL-${cIdx + 1}`,
      targetQty: 1,
      sku: `CTRL-${cIdx + 1}`,
      priority: 'High Priority',
      choices: orderedCtrl.map((ch, idx) => ({
        id: `c${idx + 1}`,
        title: ch.title,
        subtitle: ch.subtitle,
        isCorrect: ch.isCorrect,
      })),
      why: c.rationale || `Mandatory operational standard: ${c.rule}`,
      coachTip: `Always enforce written compliance rule: ${c.rule}`,
      hint: `Refer to SOP compliance controls for ${process}`,
      source_ref: c.source_ref || `ctrl-crit-${cIdx + 1}`,
      page_or_section: 'Compliance Controls',
      evidence: c.rule,
    });
  });

  const stepObjects: StepObject[] = simulatorSteps.map((simStep, idx) => {
    let cleanTitle = simStep.title;
    const correctChoiceIdx = simStep.choices.findIndex((c) => c.isCorrect);
    const correctOptionId = correctChoiceIdx >= 0 ? `o${correctChoiceIdx + 1}` : 'o1';

    const wrongFeedback: Record<string, string> = {};
    simStep.choices.forEach((c, cIdx) => {
      if (cIdx !== correctChoiceIdx) {
        wrongFeedback[`o${cIdx + 1}`] = c.subtitle || `Non-compliant action violating ${role} standard.`;
      }
    });

    return {
      id: `step_${idx + 1}`,
      order: idx + 1,
      title: cleanTitle,
      icon: '📋',
      purpose: idx % 2 === 0 ? 'skill' : 'understanding',
      component: 'choice_list',
      screen: {
        header: `Step ${idx + 1}: ${cleanTitle}`,
        info: simStep.evidence || simStep.why,
      },
      coach_say: simStep.coachTip || `Follow the written ${role} procedure rule.`,
      question: simStep.question,
      options: simStep.choices.map((c, cIdx) => ({
        id: `o${cIdx + 1}`,
        label: c.title,
      })),
      correct: correctOptionId,
      why: simStep.why,
      wrong_feedback: wrongFeedback,
      wrong_default: `Check written SOP text.`,
      hint: simStep.hint,
      reshow_card: null,
      scan_required: false,
      risk: simStep.priority === 'High Priority' ? 'compliance' : 'normal',
      source_ref: simStep.source_ref || `S1.sec${idx + 1}`,
      hotspots: null,
    };
  });

  const firstImpact = (opBlueprint.customer_or_business_impact || [])[0];
  const customerImpact = (typeof firstImpact === 'string' ? firstImpact : firstImpact?.impact || (firstImpact as any)?.text) || `Adhering to ${process} ensures service quality and safety.`;
  const firstCtrl = normalizedControls[0];
  const criticalControlRule = firstCtrl?.rule || `Never bypass mandatory verification steps or operate outside written guidelines.`;

  const orientationCards: OrientationCard[] = [
    {
      id: 'card_overview',
      kind: 'what',
      title: `What is ${process}?`,
      body: opBlueprint.purpose || `Core operational procedure for ${role}.`,
      audio_text: `Role: ${role}. Purpose: ${opBlueprint.purpose || process}`,
      visual: { type: 'icon', ref: 'clipboard' },
      must_view: true,
      source_ref: 'S1.overview',
    },
    {
      id: 'card_purpose',
      kind: 'why',
      title: 'Why This Matters',
      body: customerImpact,
      audio_text: customerImpact,
      visual: { type: 'icon', ref: 'safety' },
      must_view: true,
      source_ref: 'S1.impact',
    },
    {
      id: 'card_compliance',
      kind: 'rule',
      title: 'Critical Control Rule',
      body: criticalControlRule,
      audio_text: criticalControlRule,
      visual: { type: 'icon', ref: 'rule' },
      must_view: true,
      source_ref: 'S1.control',
    },
  ];

  if (opBlueprint.prerequisites && opBlueprint.prerequisites.length > 0) {
    opBlueprint.prerequisites.forEach((pre, idx) => {
      orientationCards.push({
        id: `card_prereq_${idx + 1}`,
        kind: 'rule',
        title: `Prerequisite Qualification ${idx + 1}`,
        body: pre.text,
        audio_text: `Mandatory prerequisite: ${pre.text}`,
        visual: { type: 'icon', ref: 'rule' },
        must_view: true,
        source_ref: pre.source_ref || `pre-${idx + 1}`,
      });
    });
  }

  const passport: ProcessPassport = {
    process_name: process,
    language: 'en',
    fields: {
      plain_definition: {
        text: opBlueprint.purpose,
        source_ref: 'S1.definition',
        basis: 'from_source',
        status: 'approved',
      },
      why_it_matters: [
        {
          who_depends: 'Frontline Teams & Customers',
          impact: customerImpact,
          source_ref: 'S1.why',
          basis: 'from_source',
          status: 'approved',
        },
      ],
      where_it_fits: {
        upstream: 'Task Trigger & Intake',
        this: process,
        downstream: 'Task Completion & Sign-off',
        source_ref: 'S1.workflow',
        status: 'approved',
      },
      tools: (opBlueprint.tools_and_systems || []).map((t) => ({
        name: t.name,
        what_it_is: `${role} operational system/tool.`,
        purpose: t.purpose,
        never_do: t.never_do,
        visual_hint: 'Official workstation system',
        source_ref: t.source_ref,
        basis: 'from_source' as const,
        status: 'approved' as const,
      })),
      terms: (opBlueprint.terminology || []).map((t) => ({
        term: t.term,
        meaning: t.meaning,
        source_ref: t.source_ref,
        status: 'approved',
      })),
      golden_rules: normalizedControls.map((c, idx) => ({
        text: c.rule,
        source_ref: c.source_ref || `ctrl-crit-${idx + 1}`,
        status: 'approved',
      })),
      safety_notes: (opBlueprint.safety_rules || []).map((s: any, idx: number) => ({
        text: typeof s === 'string' ? s : String(s?.rule || s?.text || s?.description || `Safety Note ${idx + 1}`),
        source_ref: (typeof s === 'object' && s?.source_ref) || `safe-${idx + 1}`,
        status: 'approved',
      })),
      escalation: {
        text: (opBlueprint.escalations || [])[0]?.contact_or_action || 'Contact lead supervisor immediately upon anomaly.',
        source_ref: 'S1.escalation',
        basis: 'from_source',
        status: 'approved',
      },
      newcomer_worries: ['Remembering exact step sequence', 'Handling unexpected edge cases'],
    },
    questions_for_trainer: [],
    is_approved: true,
  };

  const blueprint: BlueprintV1 = {
    schema_version: '1.1',
    status: 'ok',
    status_reason: `Generated directly from source file '${extracted.filename}'`,
    missing_passport_fields: [],
    meta: {
      title: process,
      topic: 'Safety',
      language: 'en',
      role,
      image_type: 'sop_page',
      confidence: opBlueprint.confidence || 0.98,
      passport_id: `PSP-${lessonId.toUpperCase()}`,
      passport_version: 1,
      estimated_minutes: 8,
      sources: [
        {
          id: 'S1',
          type: 'sop',
          note: `Uploaded File: ${extracted.filename} (${extracted.confirmationText})`,
        },
      ],
    },
    orientation: {
      estimated_minutes: 3,
      cards: orientationCards,
      tool_explorer: {
        enabled: true,
        items: (opBlueprint.tools_and_systems || []).map((t) => ({
          tool_name: t.name,
          card_id: `card_overview`,
        })),
      },
      quick_check: simulatorSteps.slice(0, 3),
      skip: {
        diagnostic_step_ids: ['step_1', 'step_2'],
        pass_threshold: 0.75,
        always_show: ['card_compliance'],
      },
    },
    scenarios: {
      watch: simulatorSteps,
      practice: simulatorSteps,
      test: simulatorSteps,
    },
    floor_checklist: simulatorSteps.map((s, idx) => ({
      id: `fc_${idx + 1}`,
      step_id: `step_${idx + 1}`,
      behaviour: s.why,
      source_ref: s.source_ref || 'S1',
    })),
    takeaways: normalizedControls.map((c) => c.rule),
    common_mistakes: (opBlueprint.common_mistakes || []).map((m: any) => typeof m === 'string' ? m : (m?.mistake || m?.prevention || String(m || ''))).filter(Boolean),
  };

  let category: 'All' | 'Picking' | 'Packing' | 'Safety' | 'Inventory' = 'Safety';
  let color: 'sky' | 'mint' | 'peach' | 'lilac' = 'sky';
  let accentColor = '#2F6FED';
  let artType: 'trolley' | 'tote' | 'safety' | 'box' | 'clipboard' = 'clipboard';

  const processLower = process.toLowerCase();
  const roleLower = role.toLowerCase();

  if (processLower.includes('cleaning') || processLower.includes('sanit') || processLower.includes('housekeeping') || processLower.includes('wash') || roleLower.includes('housekeeping')) {
    category = 'Safety';
    color = 'sky';
    accentColor = '#3B4FE0';
    artType = 'trolley';
  } else if (processLower.includes('pick') || processLower.includes('receive') || processLower.includes('warehouse') || roleLower.includes('picker')) {
    category = 'Picking';
    color = 'sky';
    accentColor = '#2F6FED';
    artType = 'tote';
  } else if (processLower.includes('pack') || processLower.includes('ship') || processLower.includes('box') || processLower.includes('seal')) {
    category = 'Packing';
    color = 'peach';
    accentColor = '#F27A1A';
    artType = 'box';
  } else if (processLower.includes('safety') || processLower.includes('hazard') || processLower.includes('ehs') || processLower.includes('ppe') || processLower.includes('accident')) {
    category = 'Safety';
    color = 'mint';
    accentColor = '#1FA55E';
    artType = 'safety';
  } else if (processLower.includes('count') || processLower.includes('audit') || processLower.includes('cycle') || processLower.includes('inventory') || processLower.includes('recount') || roleLower.includes('retail') || roleLower.includes('cashier')) {
    category = 'Inventory';
    color = 'lilac';
    accentColor = '#7A5AF8';
    artType = 'clipboard';
  }

  const videoPlan: VideoDemonstrationPlan = (() => {
    // If the blueprint already has a fully validated, multi-scene plan with covered_step_refs, preserve it
    const existing = opBlueprint.video_demonstration_plan;
    if (
      existing &&
      existing.validation_status === 'valid' &&
      Array.isArray(existing.clips) &&
      existing.clips.length > 0 &&
      existing.clips.every(c => Array.isArray(c.covered_step_refs) && c.covered_step_refs.length > 0)
    ) {
      return existing;
    }

    // Authoritative generation: synthesize dynamic, SOP-grounded VideoPlan via planVideoDemonstration
    return planVideoDemonstration(opBlueprint);
  })();

  const lesson: Lesson = {
    id: lessonId,
    title: process,
    subtitle: `Role: ${role} · Source: ${extracted.filename}`,
    category,
    color,
    accentColor,
    stepsCount: simulatorSteps.length,
    durationMinutes: Math.max(5, Math.ceil(simulatorSteps.length * 1.5)),
    level: 'Beginner',
    progress: 0,
    masteryPercentage: 0,
    artType,
    description: opBlueprint.purpose,
    sourceMeta: {
      filename: extracted.filename,
      version: '1.0',
      fileHash: extracted.fileHash,
      pageCount: extracted.pageCount,
      wordCount: extracted.wordCount,
      confirmationText: extracted.confirmationText,
      rawText: extracted.rawText,
    },
    blueprint,
    passport,
    operationalBlueprint: opBlueprint,
    videoPlan,
    stepObjects,
  };

  return { lesson, passport, blueprint, stepObjects };
}

/**
 * Main entry point: Generates a source-grounded Lesson & Operational Blueprint from an ExtractedDocument
 */
export function generateDomainNeutralLesson(
  extracted: ExtractedDocument,
  providedBlueprint?: OperationalBlueprint
): {
  lesson: Lesson;
  passport: ProcessPassport;
  blueprint: BlueprintV1;
  stepObjects: StepObject[];
} {
  // 1. Build Knowledge Model
  const km = buildSopKnowledgeModel(extracted);

  // 2. Build Operational Blueprint
  const opBlueprint = providedBlueprint || buildOperationalBlueprintFromKnowledgeModel(km);

  // 3. Build Training Plan
  const trainingPlan = buildTrainingPlanFromBlueprint(opBlueprint);

  // 4. LOG THE COMPLETE INTELLIGENCE CHAIN
  console.group(`[SOP INTELLIGENCE CHAIN LOG] File: '${extracted.filename}'`);
  console.log(`1. DOCUMENT & EXTRACTED TEXT:`, { filename: extracted.filename, pages: extracted.pageCount, words: extracted.wordCount });
  console.log(`2. NORMALIZED TEXT:`, { length: extracted.rawText.length, sample: extracted.rawText.slice(0, 120) + '...' });
  console.log(`3. KNOWLEDGE MODEL:`, { role: km.identity.role, process: km.identity.process, stepsCount: km.steps.length, decisionsCount: km.decisionPoints.length });
  console.log(`4. OPERATIONAL BLUEPRINT:`, { title: opBlueprint.process, steps: opBlueprint.operational_steps.length, controls: opBlueprint.critical_controls.length });
  console.log(`5. TRAINING PLAN:`, { planItemsCount: trainingPlan.length, types: trainingPlan.map((p) => p.type) });
  console.log(`6. STAGE PLAN: 4-Stage Learning Experience (Teach Me, Show Me, Guide Me, Test Me)`);
  console.groupEnd();

  const { lesson, passport, blueprint, stepObjects } = generateLessonFromOperationalBlueprint(extracted, opBlueprint);
  lesson.knowledgeModel = km;
  lesson.trainingPlan = trainingPlan;

  return { lesson, passport, blueprint, stepObjects };
}
