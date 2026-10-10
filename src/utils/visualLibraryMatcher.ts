import visualLibraryData from '../Guruji_Real_Photo_Visual_Library_500/visualLibrary.json';
import pilot25Library from '../Guruji_Real_Photo_Visual_Library_500/NFBC_SOP_Visual_Library_FINAL/pilot_25/visualLibrary.json';

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
  
  // Trimming standard suffixes
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
    .replace(/[^a-z0-9\s-_]/g, ' ') // replace special chars with space
    .split(/[\s-_]+/)               // split by space, hyphen, or underscore
    .filter(word => word.length > 1 && !STOP_WORDS.has(word))
    .map(stem);
}

// Map the pilot 25 assets to the core VisualAsset format
const pilot25Assets: VisualAsset[] = (pilot25Library as any[]).map(asset => ({
  id: asset.id,
  file: `NFBC_SOP_Visual_Library_FINAL/pilot_25/${asset.file}`,
  tags: asset.tags || [],
  category: 'pilot_25',
  source_generated: true
}));

// Additional high-fidelity NFBC sector photo directories assets
const additionalNfbcAssets: VisualAsset[] = [
  // tools_tech
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
    id: 'nfbc_tool_document_dms',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_document_dms.webp',
    tags: ['document', 'dms', 'management', 'system', 'storage', 'upload', 'scan', 'software', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_automated_rule_engine',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_automated_rule_engine.webp',
    tags: ['automated', 'rule', 'engine', 'underwriting', 'credit', 'algorithm', 'approval', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_digital_lending_app',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_digital_lending_app.webp',
    tags: ['digital', 'lending', 'app', 'mobile', 'application', 'phone', 'loan', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_ekyc_biometric',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_ekyc_biometric.webp',
    tags: ['ekyc', 'biometric', 'kyc', 'fingerprint', 'aadhaar', 'thumb', 'scanner', 'device', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },
  {
    id: 'nfbc_tool_credit_bureau_score',
    file: 'NFBC_SOP_Visual_Library_FINAL/tools_tech/tool_credit_bureau_score.webp',
    tags: ['credit', 'bureau', 'score', 'cibil', 'rating', 'check', 'history', 'report', 'tool'],
    category: 'tools_tech',
    source_generated: true
  },

  // verification_risk
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
    id: 'nfbc_verify_compliance_sanctions',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/compliance_sanctions.webp',
    tags: ['compliance', 'sanctions', 'aml', 'anti-money', 'laundering', 'check', 'blacklist', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_address_proof',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_address_proof.webp',
    tags: ['verify', 'address', 'proof', 'utility', 'bill', 'residence', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_business_stock',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_business_stock.webp',
    tags: ['verify', 'business', 'stock', 'inventory', 'shop', 'merchant', 'visit', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_commercial_asset',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_commercial_asset.webp',
    tags: ['verify', 'commercial', 'asset', 'property', 'machinery', 'collateral', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_pan_card',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_pan_card.webp',
    tags: ['verify', 'pan', 'card', 'tax', 'identity', 'number', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_geotag_photo',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_geotag_photo.webp',
    tags: ['verify', 'geotag', 'photo', 'gps', 'location', 'lat-long', 'map', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },
  {
    id: 'nfbc_verify_property_visit',
    file: 'NFBC_SOP_Visual_Library_FINAL/verification_risk/verify_property_visit.webp',
    tags: ['verify', 'property', 'visit', 'house', 'site', 'physical', 'investigation', 'verification'],
    category: 'verification_risk',
    source_generated: true
  },

  // branch_customer_security
  {
    id: 'nfbc_branch_security',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/branch_security.webp',
    tags: ['branch', 'security', 'guard', 'safety', 'vault', 'lock', 'office'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_board_presentation',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/board_presentation.webp',
    tags: ['board', 'presentation', 'meeting', 'slides', 'report', 'management'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_branch_cash_handling',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/branch_cash_handling.webp',
    tags: ['branch', 'cash', 'handling', 'vault', 'teller', 'counting', 'security'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_internal_audit_review',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/internal_audit_review.webp',
    tags: ['internal', 'audit', 'review', 'ledger', 'accounts', 'inspection', 'compliance'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_branch_customer_service',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/branch_customer_service.webp',
    tags: ['branch', 'customer', 'service', 'helpdesk', 'assistance', 'support'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_management_reporting',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/management_reporting.webp',
    tags: ['management', 'reporting', 'charts', 'metrics', 'data', 'performance'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_branch_field_visit_agent',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/branch_field_visit_agent.webp',
    tags: ['branch', 'field', 'visit', 'agent', 'travel', 'officer', 'physical'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_grievance_resolution',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/grievance_resolution.webp',
    tags: ['grievance', 'resolution', 'complaint', 'officer', 'customer', 'settlement'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_branch_safekeeping_documents',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/branch_safekeeping_documents.webp',
    tags: ['branch', 'safekeeping', 'documents', 'files', 'locker', 'security', 'records'],
    category: 'branch_customer_security',
    source_generated: true
  },
  {
    id: 'nfbc_customer_complaint',
    file: 'NFBC_SOP_Visual_Library_FINAL/branch_customer_security/customer_complaint.webp',
    tags: ['customer', 'complaint', 'issue', 'dispute', 'angry', 'feedback'],
    category: 'branch_customer_security',
    source_generated: true
  },

  // loan_operations
  {
    id: 'nfbc_loan_emi_reminder',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_emi_reminder.webp',
    tags: ['loan', 'emi', 'reminder', 'repayment', 'payment', 'call', 'sms', 'alert'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_loan_agreement_signing',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_agreement_signing.webp',
    tags: ['loan', 'agreement', 'signing', 'sign', 'contract', 'legal', 'documents'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_collections_call',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/collections_call.webp',
    tags: ['collections', 'call', 'recovery', 'phone', 'defaulter', 'emi', 'payment'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_cheque_bounce',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/cheque_bounce.webp',
    tags: ['cheque', 'bounce', 'dishonor', 'penalty', 'bank', 'insufficient', 'funds'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_npa_buckets_aging',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/npa_buckets_aging.webp',
    tags: ['npa', 'buckets', 'aging', 'delinquency', 'default', 'overdue', 'portfolio', 'report'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_loan_part_payment',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_part_payment.webp',
    tags: ['loan', 'part', 'payment', 'prepayment', 'principal', 'repayment'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_loan_repayment_schedule',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_repayment_schedule.webp',
    tags: ['loan', 'repayment', 'schedule', 'ledger', 'statement', 'dues', 'interest'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_field_collection',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/field_collection.webp',
    tags: ['field', 'collection', 'recovery', 'visit', 'agent', 'cash', 'receipt'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_loan_approval',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_approval.webp',
    tags: ['loan', 'approval', 'underwriter', 'approved', 'credit', 'sanction', 'letter'],
    category: 'loan_operations',
    source_generated: true
  },
  {
    id: 'nfbc_loan_disbursement',
    file: 'NFBC_SOP_Visual_Library_FINAL/loan_operations/loan_disbursement.webp',
    tags: ['loan', 'disbursement', 'payout', 'bank', 'transfer', 'neft', 'fund', 'credit'],
    category: 'loan_operations',
    source_generated: true
  },

  // people_roles
  {
    id: 'nfbc_person_co_applicant',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_co_applicant.webp',
    tags: ['co-applicant', 'guarantor', 'applicant', 'family', 'coapplicant', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_field_agent',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_field_agent.webp',
    tags: ['field', 'agent', 'verification', 'collection', 'officer', 'travel', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_cco_compliance',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_cco_compliance.webp',
    tags: ['cco', 'compliance', 'officer', 'legal', 'auditor', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_grievance_officer',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_grievance_officer.webp',
    tags: ['grievance', 'officer', 'complaint', 'ombudsman', 'support', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_recovery_agent',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_recovery_agent.webp',
    tags: ['recovery', 'agent', 'collection', 'field', 'officer', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_internal_auditor',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_internal_auditor.webp',
    tags: ['internal', 'auditor', 'inspection', 'compliance', 'accounts', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_rural_mfi_group',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_rural_mfi_group.webp',
    tags: ['rural', 'mfi', 'group', 'microfinance', 'shg', 'joint', 'liability', 'women', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_retail_borrower',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_retail_borrower.webp',
    tags: ['retail', 'borrower', 'customer', 'applicant', 'individual', 'person'],
    category: 'people_roles',
    source_generated: true
  },
  {
    id: 'nfbc_person_board_directors',
    file: 'NFBC_SOP_Visual_Library_FINAL/people_roles/person_board_directors.webp',
    tags: ['board', 'directors', 'management', 'executives', 'committee', 'person'],
    category: 'people_roles',
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

// Combine all sources
const allAssets: VisualAsset[] = [
  ...(visualLibraryData.assets as VisualAsset[]),
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

    // 1. Tag exact matches (highest weight)
    for (const tag of assetTags) {
      if (stepTokens.includes(tag)) {
        score += 15;
      } else if (contextTokens.includes(tag)) {
        score += 8;
      }
    }

    // 2. Tag partial matches or substring matches
    for (const tag of assetTags) {
      for (const token of allTokens) {
        if (token !== tag && (token.includes(tag) || tag.includes(token))) {
          score += 4;
        }
      }
    }

    // 3. Filename token matches
    const filenameNoExt = asset.file.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
    const filenameTokens = tokenize(filenameNoExt);
    for (const fToken of filenameTokens) {
      if (stepTokens.includes(fToken)) {
        score += 10;
      } else if (contextTokens.includes(fToken)) {
        score += 5;
      }
    }

    // 4. Category relevance matches
    const category = asset.category.toLowerCase();
    
    // Check NFBC / Banking specific categories

    if (isBankingSop && (
      category === 'pilot_25' || 
      category === 'tools_tech' || 
      category === 'verification_risk' || 
      category === 'branch_customer_security' || 
      category === 'loan_operations' || 
      category === 'people_roles'
    )) {
      score += 12; // High priority boost for NFBC images when matching an NFBC banking context
    }

    // Hospitality category weights
    if (category === 'hospitality' && (
      allTokens.includes('hotel') || allTokens.includes('chef') || allTokens.includes('waiter') ||
      allTokens.includes('guest') || allTokens.includes('reception') || allTokens.includes('room') ||
      allTokens.includes('dining') || allTokens.includes('valet') || allTokens.includes('serv') ||
      allTokens.includes('waitress') || allTokens.includes('kitchen') || allTokens.includes('bell')
    )) {
      score += 6;
    }

    // People Safety category weights
    if (category === 'people_safety' && (
      allTokens.includes('safe') || allTokens.includes('hazard') || allTokens.includes('wet') ||
      allTokens.includes('floor') || allTokens.includes('fire') || allTokens.includes('extinguish') ||
      allTokens.includes('work') || allTokens.includes('glove') || allTokens.includes('ladd') ||
      allTokens.includes('ppe') || allTokens.includes('accid') || allTokens.includes('clean') ||
      allTokens.includes('sanit')
    )) {
      score += 6;
    }

    // Retail category weights
    if (category === 'retail' && (
      allTokens.includes('retail') || allTokens.includes('cashier') || allTokens.includes('checkout') ||
      allTokens.includes('shelf') || allTokens.includes('restock') || allTokens.includes('cash') ||
      allTokens.includes('custom') || allTokens.includes('store') || allTokens.includes('price') ||
      allTokens.includes('bag')
    )) {
      score += 6;
    }

    // Ecommerce category weights
    if (category === 'ecommerce' && (
      allTokens.includes('warehous') || allTokens.includes('pick') || allTokens.includes('pack') ||
      allTokens.includes('tote') || allTokens.includes('box') ||
      allTokens.includes('conveyor') || allTokens.includes('pallet') || allTokens.includes('ship') ||
      allTokens.includes('deliv') || allTokens.includes('inventori')
    )) {
      score += 6;
    }

    // Tools & Props category weights
    if (category === 'tools_props' && (
      allTokens.includes('termin') || allTokens.includes('payment') || allTokens.includes('scan') ||
      allTokens.includes('barcod') || allTokens.includes('cart') || allTokens.includes('tablet') ||
      allTokens.includes('devic') || allTokens.includes('tool') || allTokens.includes('prop')
    )) {
      score += 4;
    }

    if (score > highestScore) {
      highestScore = score;
      bestAsset = asset;
    }
  }

  // Fallback if score is extremely low or no matches found
  if (!bestAsset || highestScore <= 0) {
    let defaultCategory = 'people_safety';
    if (allTokens.some(t => ['hotel', 'chef', 'waiter', 'guest', 'restaurant', 'dining', 'valet'].includes(t))) {
      defaultCategory = 'hospitality';
    } else if (allTokens.some(t => ['retail', 'cashier', 'store', 'checkout', 'bag', 'counter'].includes(t))) {
      defaultCategory = 'retail';
    } else if (allTokens.some(t => ['warehouse', 'picker', 'packer', 'packing', 'tote', 'conveyor', 'delivery'].includes(t))) {
      defaultCategory = 'ecommerce';
    } else if (allTokens.some(t => ['terminal', 'scanner', 'barcode', 'device', 'payment'].includes(t))) {
      defaultCategory = 'tools_props';
    } else if (isBankingSop) {
      defaultCategory = 'pilot_25';
    }

    const categoryAsset = allAssets.find(a => a.category === defaultCategory) || allAssets[0];
    return {
      asset: categoryAsset,
      score: 0,
      url: `/Guruji_Real_Photo_Visual_Library_500/${categoryAsset.file}`
    };
  }

  return {
    asset: bestAsset,
    score: highestScore,
    url: `/Guruji_Real_Photo_Visual_Library_500/${bestAsset.file}`
  };
}
