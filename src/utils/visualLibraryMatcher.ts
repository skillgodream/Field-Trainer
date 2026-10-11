export interface VisualAsset {
  id: string;
  file: string;
  tags: string[];
  category: string;
  source_generated: boolean;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'for', 'with', 'on', 'at', 
  'in', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'this', 'that', 
  'these', 'those', 'you', 'your', 'yours', 'from', 'it', 'its', 'about', 'above', 
  'after', 'again', 'against', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 
  'other', 'some', 'such', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 
  'should', 'now', 'do', 'does', 'did', 'doing', 'how', 'what', 'why', 'where', 'when'
]);

/**
 * Micro-stemmer to normalize various word forms into base forms.
 */
export function stem(word: string): string {
  const w = word.toLowerCase().trim();
  
  if (w.startsWith('housekeep')) return 'housekeep';
  if (w.startsWith('sanit')) return 'sanit';
  if (w.startsWith('clean')) return 'clean';
  if (w.startsWith('saf')) return 'safe';
  if (w.startsWith('scan')) return 'scan';
  if (w.startsWith('pack')) return 'pack';
  if (w.startsWith('pick')) return 'pick';
  if (w.startsWith('verify')) return 'verify';
  if (w.startsWith('verifi')) return 'verify';
  if (w.startsWith('prepar')) return 'prepare';
  if (w.startsWith('prepa')) return 'prepare';
  if (w.startsWith('dilut')) return 'dilute';
  if (w.startsWith('applic')) return 'apply';
  if (w.startsWith('appl')) return 'apply';
  if (w.startsWith('bottl')) return 'bottle';
  if (w.startsWith('glov')) return 'glove';
  if (w.startsWith('loan')) return 'loan';
  if (w.startsWith('interest')) return 'interest';
  if (w.startsWith('remind')) return 'reminder';

  if (w.endsWith('ing')) return w.slice(0, -3);
  if (w.endsWith('ed')) return w.slice(0, -2);
  if (w.endsWith('er')) return w.slice(0, -2);
  if (w.endsWith('es')) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);

  return w;
}

/**
 * Tokenizes text, filters out stop words, and applies stemming to each word.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, ' ')
    .split(/[\s-_]+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
    .map(stem);
}

// Lightweight pilot 25 assets array defined inline
const pilot25Assets: VisualAsset[] = [
  { id: 'pilot_kyc_verification', file: 'NFBC_SOP_Visual_Library_FINAL/pilot_25/kyc_verification.webp', tags: ['kyc', 'verification', 'identity', 'document'], category: 'pilot_25', source_generated: true },
  { id: 'pilot_loan_disbursement', file: 'NFBC_SOP_Visual_Library_FINAL/pilot_25/loan_disbursement.webp', tags: ['loan', 'disbursement', 'cash', 'transfer'], category: 'pilot_25', source_generated: true },
  { id: 'pilot_collection_visit', file: 'NFBC_SOP_Visual_Library_FINAL/pilot_25/collection_visit.webp', tags: ['collection', 'visit', 'field', 'recovery'], category: 'pilot_25', source_generated: true },
  { id: 'pilot_branch_audit', file: 'NFBC_SOP_Visual_Library_FINAL/pilot_25/branch_audit.webp', tags: ['branch', 'audit', 'compliance', 'review'], category: 'pilot_25', source_generated: true },
  { id: 'pilot_customer_onboarding', file: 'NFBC_SOP_Visual_Library_FINAL/pilot_25/customer_onboarding.webp', tags: ['customer', 'onboarding', 'signup', 'form'], category: 'pilot_25', source_generated: true }
];

// Additional high-fidelity NFBC sector photo directories assets
const additionalNfbcAssets: VisualAsset[] = [
  {
    id: 'nfbc_tool_digital_signature',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_digital_signature.webp',
    tags: ['digital', 'signature', 'e-sign', 'esign', 'online', 'sign', 'tool', 'device', 'tablet'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_face_match_ai',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_face_match_ai.webp',
    tags: ['face', 'match', 'ai', 'facematch', 'biometric', 'photo', 'verification', 'tool', 'device'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_los_interface',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_los_interface.webp',
    tags: ['los', 'loan', 'origination', 'system', 'interface', 'software', 'portal', 'dashboard', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_pos_terminal',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_pos_terminal.webp',
    tags: ['pos', 'terminal', 'point', 'sale', 'machine', 'card', 'payment', 'swipe', 'device', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_lms_dashboard',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_lms_dashboard.webp',
    tags: ['lms', 'loan', 'management', 'system', 'dashboard', 'portal', 'software', 'screen', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_verify_kyc_document',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_kyc_document.webp',
    tags: ['verify', 'kyc', 'document', 'identity', 'id', 'card', 'aadhaar', 'pan', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_bank_statement',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_bank_statement.webp',
    tags: ['verify', 'bank', 'statement', 'passbook', 'income', 'salary', 'document', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_fraud_detection',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/fraud_detection.webp',
    tags: ['fraud', 'detection', 'fake', 'risk', 'forgery', 'alert', 'check', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_branch_security',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/branch_security.webp',
    tags: ['branch', 'security', 'guard', 'safety', 'vault', 'lock', 'office'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_loan_emi_reminder',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_emi_reminder.webp',
    tags: ['loan', 'emi', 'reminder', 'repayment', 'payment', 'call', 'sms', 'alert'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_person_loan_officer',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_loan_officer.webp',
    tags: ['loan', 'officer', 'branch', 'manager', 'underwriter', 'person'],
    category: 'people_roles',
    source_generated: true
  }
];

// Combine all sources safely without JSON dependencies
const allAssets: VisualAsset[] = [
  ...pilot25Assets,
  ...additionalNfbcAssets
];

/**
 * Finds the absolute best real-photo visual asset matching a given step's textual context.
 */
export function findBestVisualMatch(
  stepText: string,
  contextText: string = ''
): { asset: VisualAsset | null; score: number; url: string | null } {
  const stepTokens = tokenize(stepText);
  const contextTokens = tokenize(contextText);
  const allTokens = [...stepTokens, ...contextTokens];
  const isBankingSop = allTokens.some(t => [
    'loan', 'kyc', 'emi', 'disburse', 'verification', 'cash', 'account', 'security', 'aml', 'pan', 'borrower', 'bank'
  ].includes(t));

  if (allTokens.length === 0) {
    const fallback = allAssets[0];
    return {
      asset: fallback,
      score: 0,
      url: `/Guruji_Real_Photo_Visual_Library_500/${fallback.file}`
    };
  }

  let bestAsset: VisualAsset | null = null;
  let highestScore = -1;

  for (const asset of allAssets) {
    let score = 0;
    const assetTags = asset.tags.map(stem);

    for (const tag of assetTags) {
      if (stepTokens.includes(tag)) {
        score += 15;
      } else if (contextTokens.includes(tag)) {
        score += 8;
      }
    }

    for (const tag of assetTags) {
      for (const token of allTokens) {
        if (token !== tag && (token.includes(tag) || tag.includes(token))) {
          score += 4;
        }
      }
    }

    const filenameNoExt = asset.file.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    const filenameTokens = tokenize(filenameNoExt);
    for (const fToken of filenameTokens) {
      if (stepTokens.includes(fToken)) {
        score += 10;
      } else if (contextTokens.includes(fToken)) {
        score += 5;
      }
    }

    if (isBankingSop && (
      asset.category === 'pilot_25' || 
      asset.category === 'tools_tech' || 
      asset.category === 'verification_risk' || 
      asset.category === 'branch_customer_security' || 
      asset.category === 'loan_operations' || 
      asset.category === 'people_roles'
    )) {
      score += 12;
    }

    if (score > highestScore) {
      highestScore = score;
      bestAsset = asset;
    }
  }

  if (!bestAsset || highestScore <= 0) {
    const fallback = allAssets[0];
    return {
      asset: fallback,
      score: 0,
      url: `/Guruji_Real_Photo_Visual_Library_500/${fallback.file}`
    };
  }

  return {
    asset: bestAsset,
    score: highestScore,
    url: `/Guruji_Real_Photo_Visual_Library_500/${bestAsset.file}`
  };
}
