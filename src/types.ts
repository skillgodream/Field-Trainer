export type TabType = 'home' | 'library' | 'progress' | 'profile' | 'experiment';

export type CategoryType = 'All' | 'Picking' | 'Packing' | 'Safety' | 'Inventory';

export type ExperienceLevel = 'new' | 'some' | 'experienced';

export interface SourceMeta {
  filename: string;
  version: string;
  fileHash: string;
  pageCount: number;
  wordCount: number;
  confirmationText: string;
  rawText?: string;
}

export interface OperationalSourceRef {
  page_or_section: string;
  source_ref: string;
  source_text: string;
}

export type StepCategoryType = 'KNOW' | 'DO' | 'DECIDE' | 'RESPOND' | 'CHECK' | 'RECOVER' | 'ESCALATE';

export interface OperationalBlueprintItem {
  instruction: string;
  category: StepCategoryType;
  source: OperationalSourceRef;
  why_it_matters?: string;
  action_verb?: string;
  critical_control?: boolean;
  scenario_question?: string;
  choices?: { id: string; title: string; subtitle: string; isCorrect: boolean }[];
  coach_tip?: string;
  hint?: string;
  task_title?: string;
  target_code?: string;
}

export interface SopKnowledgeModel {
  document: {
    id: string;
    filename: string;
    version: string;
    pages: number;
    extractedText: string;
  };
  identity: {
    title: string;
    organization?: string;
    department?: string;
    role: string;
    process: string;
  };
  purpose: string;
  scope: string;
  whyItMatters: string;

  prerequisites: { text: string; sourceEvidence: string }[];
  tools: { name: string; purpose: string; neverDo: string; sourceEvidence: string }[];
  systems: { name: string; purpose: string; sourceEvidence: string }[];
  terminology: { term: string; meaning: string; sourceEvidence: string }[];

  steps: {
    id: number;
    action: string;
    expectedOutcome: string;
    sourceEvidence: string;
    pageOrSection: string;
    sourceRef: string;
  }[];

  decisionPoints: {
    id: number;
    situation: string;
    options: string[];
    correctDecision: string;
    rationale: string;
    sourceEvidence: string;
  }[];

  exceptions: {
    situation: string;
    response: string;
    sourceEvidence: string;
  }[];

  escalations: {
    trigger: string;
    action: string;
    escalationTarget: string;
    sourceEvidence: string;
  }[];

  criticalControls: string[];
  safetyRules: string[];
  qualityRules: string[];

  commonMistakes: string[];
  customerImpact: string;
  businessImpact: string;

  confidence: number;
}

export interface TrainingPlanItem {
  id: string;
  objective: string;
  type: 'teach' | 'demonstrate' | 'practice' | 'decision' | 'exception' | 'test';
  instruction: string;
  expectedBehavior: string;
  whyItMatters: string;
  sourceEvidence: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export interface OperationalBlueprint {
  document_identity: {
    doc_title: string;
    doc_ref?: string;
    version?: string;
    department?: string;
  };
  role: string;
  process: string;
  purpose: string;
  scope: string;

  prerequisites: { text: string; source_ref: string; source_text: string }[];
  tools_and_systems: { name: string; purpose: string; never_do: string; source_ref: string; source_text: string }[];
  terminology: { term: string; meaning: string; source_ref: string; source_text: string }[];

  operational_steps: OperationalBlueprintItem[];
  decision_points: { situation: string; decision: string; action: string; source_ref: string; source_text: string }[];
  exceptions: { trigger: string; resolution: string; source_ref: string; source_text: string }[];
  escalations: { situation: string; contact_or_action: string; source_ref: string; source_text: string }[];

  critical_controls: { rule: string; rationale: string; source_ref: string; source_text: string }[];
  safety_rules: { rule: string; source_ref: string; source_text: string }[];
  quality_rules: { rule: string; source_ref: string; source_text: string }[];
  customer_or_business_impact: { impact: string; source_ref: string; source_text: string }[];
  common_mistakes: { mistake: string; prevention: string; source_ref: string; source_text: string }[];

  source_evidence: { id: string; page_or_section: string; excerpt: string }[];
  confidence: number;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryType;
  color: 'sky' | 'mint' | 'peach' | 'lilac' | 'butter' | 'blush';
  accentColor: string;
  stepsCount: number;
  durationMinutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  progress: number;
  masteryPercentage: number;
  artType: 'scanner' | 'box' | 'tote' | 'safety' | 'clipboard' | 'trolley';
  description: string;
  sourceMeta?: SourceMeta;
  blueprint?: BlueprintV1;
  passport?: ProcessPassport;
  operationalBlueprint?: OperationalBlueprint;
  knowledgeModel?: SopKnowledgeModel;
  trainingPlan?: TrainingPlanItem[];
  stepObjects?: StepObject[];
}

export interface ToolItem {
  id: string;
  name: string;
  shortDesc: string;
  whatItIs: string;
  whatItsFor: string;
  neverDo: string;
  iconName: string;
  badge?: string;
}

export interface SimulatorChoice {
  id: string;
  title: string;
  subtitle?: string;
  isCorrect: boolean;
}

export interface SimulatorStep {
  id: number;
  title: string;
  type: string;
  question: string;
  taskTitle: string;
  taskOrder: string;
  taskItem: string;
  targetCode: string;
  targetQty: number;
  sku: string;
  priority: string;
  item?: string;
  location?: string;
  choices: SimulatorChoice[];
  why: string;
  coachTip: string;
  hint: string;
  source_ref?: string;
  page_or_section?: string;
  evidence?: string;
}

export interface ExperiencedCheckQuestion {
  id: number;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

export type StepRiskLevel = 'normal' | 'stock_accuracy' | 'safety' | 'compliance';
export type StepComponentType = 'choice_list' | 'code_match' | 'number_choice' | 'scene_pick' | 'photo_hotspot';

export interface StepOption {
  id: string;
  label: string; // <= 6 words
  misconception_id?: string;
}

export interface StepHotspot {
  id: string;
  bbox: [number, number, number, number];
  label?: string;
}

export interface StepObject {
  id: string;
  order: number;
  title: string; // <= 4 words
  icon: string;
  purpose: 'skill' | 'understanding';
  component: StepComponentType;
  screen: {
    header: string;
    info: string;
  };
  coach_say: string; // <= 12 words
  question: string; // <= 12 words
  options: StepOption[];
  correct: string; // option id
  why: string; // <= 12 words
  wrong_feedback: Record<string, string>; // each <= 12 words
  wrong_default: string; // <= 12 words
  hint: string; // <= 12 words
  reshow_card: string | null;
  scan_required: boolean;
  risk: StepRiskLevel;
  source_ref: string;
  hotspots: StepHotspot[] | null;
}

/* Process Passport Types (P0) */
export interface PassportField<T> {
  text: T;
  source_ref: string;
  basis: 'from_source' | 'general_knowledge' | 'trainer_input';
  status: 'draft' | 'approved';
}

export interface PassportToolItem {
  name: string;
  what_it_is: string;
  purpose: string;
  never_do: string;
  visual_hint: string;
  source_ref: string;
  basis: 'from_source' | 'general_knowledge' | 'trainer_input';
  status: 'draft' | 'approved';
}

export interface PassportTerm {
  term: string;
  meaning: string;
  source_ref: string;
  status: 'draft' | 'approved';
}

export interface PassportWhyItem {
  who_depends: string;
  impact: string;
  source_ref: string;
  basis: 'from_source' | 'general_knowledge' | 'trainer_input';
  status: 'draft' | 'approved';
}

export interface PassportRule {
  text: string;
  source_ref: string;
  status: 'draft' | 'approved';
}

export interface ProcessPassport {
  process_name: string;
  language: string;
  fields: {
    plain_definition: PassportField<string>;
    why_it_matters: PassportWhyItem[];
    where_it_fits: {
      upstream: string;
      this: string;
      downstream: string;
      source_ref: string;
      status: 'draft' | 'approved';
    };
    tools: PassportToolItem[];
    terms: PassportTerm[];
    golden_rules: PassportRule[];
    safety_notes: PassportRule[];
    escalation: PassportField<string>;
    newcomer_worries: string[];
  };
  questions_for_trainer: { field: string; question: string }[];
  is_approved: boolean;
}

/* Perceive Observation Types (P1) */
export interface PerceiveObservation {
  image_type: 'sop_page' | 'handheld_screen' | 'physical_scene' | 'label' | 'signage' | 'form' | 'other';
  quality: {
    score: number;
    flags: string[];
  };
  readable_text: { text: string; bbox: [number, number, number, number]; confidence: number }[];
  objects: { label: string; bbox: [number, number, number, number] }[];
  tool_candidates: { label: string; bbox: [number, number, number, number]; confidence: number }[];
  detected_tasks: { task: string; confidence: number }[];
  visible_hazards: string[];
  unreadable_regions: string[];
  recommended_action: 'proceed' | 'retake' | 'needs_review';
  retake_tip: string;
}

/* Blueprint Schema v1.1 Types */
export interface BlueprintMeta {
  title: string;
  topic: string;
  language: string;
  role: string;
  image_type: 'sop_page' | 'handheld_screen' | 'physical_scene' | 'label' | 'signage' | 'form' | 'other';
  confidence: number;
  passport_id: string;
  passport_version: number;
  estimated_minutes: number;
  sources: { id: string; type: 'sop' | 'policy' | 'ground_reality' | 'passport' | 'image'; note: string }[];
}

export interface OrientationCard {
  id: string;
  kind: 'what' | 'why' | 'flow' | 'tool' | 'term' | 'rule' | 'safety';
  title: string;
  body: string;
  audio_text: string;
  visual: { type: 'icon' | 'flow' | 'image_region' | 'illustration_key'; ref: string };
  tool?: { name: string; purpose: string; never_do: string };
  must_view: boolean;
  source_ref: string;
}

export interface BlueprintV1 {
  schema_version: '1.1';
  status: 'ok' | 'needs_review' | 'needs_passport' | 'unusable';
  status_reason: string;
  missing_passport_fields: string[];
  meta: BlueprintMeta;
  orientation: {
    estimated_minutes: number;
    cards: OrientationCard[];
    tool_explorer: {
      enabled: boolean;
      items: { tool_name: string; card_id: string; hotspot?: { bbox: [number, number, number, number] } }[];
    };
    quick_check: SimulatorStep[];
    skip: {
      diagnostic_step_ids: string[];
      pass_threshold: number;
      always_show: string[];
    };
  };
  scenarios: {
    watch: SimulatorStep[];
    practice: SimulatorStep[];
    test: SimulatorStep[];
  };
  floor_checklist: { id: string; step_id: string; behaviour: string; source_ref: string }[];
  takeaways: string[];
  common_mistakes: string[];
}
