import { GoogleGenAI } from '@google/genai';

function getApiKey(): string | undefined {
  const rawKey = (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();
  return rawKey.replace(/^["']|["']$/g, '').trim() || undefined;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('[API Error] GEMINI_API_KEY is not defined in deployment environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  const { rawText, fileBase64, mimeType, filename, pageCount, wordCount } = req.body;

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];
    const docText = rawText ? rawText.slice(0, 16000) : '';

    if (docText && docText.length > 50) {
      // Use text directly
    } else if (fileBase64 && typeof fileBase64 === 'string') {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileBase64,
        },
      });
    }

    const systemInstruction = `You are a Lead Operational Intelligence Engineer and Instructional Designer.
Your task is to transform an uploaded Standard Operating Procedure (SOP) into a structured OPERATIONAL BLUEPRINT.

CRITICAL RULES:
1. DISTINGUISH METADATA VS OPERATIONAL CONTENT:
   - METADATA (DO NOT MAKE INTO STEPS): Document titles, REF codes ("DOCUMENT REF: SOP-HTL-101"), Version numbers ("VERSION 1.0"), Effective dates, Approvals, Section headers.
   - OPERATIONAL CONTENT (MUST DRIVE BLUEPRINT): Physical actions, system entries, verbal communications, verifications, decision points, exception handling, escalations.
2. BEHAVIOR CHANGE TEST: Ask: "If this item were removed from the SOP, would the worker's actual physical, verbal, system or decision-making behavior change?"
   - YES -> Candidate operational content
   - NO -> Metadata / background context
3. SOURCE GROUNDING: Ground ALL outputs strictly in the provided SOP text. Retain source quotes and references for EVERY operational step, decision, and rule.
4. ZERO DOMAIN FALLBACKS: Extract the REAL role and domain (e.g., Phlebotomy Technician, Retail Cashier, Hotel Front Office Agent). NEVER fall back to generic warehouse/picking terms unless in source text.
5. NO GENERIC TEMPLATE STRINGS: Do NOT output strings like "frontline specialist duties", "Follow written operational procedure guidelines carefully", "Approved Operational Rule", "Non-compliant action". Be specific to the SOP!`;

    const textPrompt = `Uploaded SOP Document: "${filename}" (${pageCount || 1} pages, ${wordCount || 100} words)
${docText ? `Document Text:\n"""\n${docText}\n"""\n` : ''}

Extract the complete OPERATIONAL BLUEPRINT as JSON with this exact schema:
{
  "document_identity": {
    "doc_title": "${filename ? filename.replace(/\.(txt|pdf|docx)$/i, '') : 'Operational Procedure'}",
    "doc_ref": "Extracted document reference or empty",
    "version": "Extracted version or empty"
  },
  "role": "Exact worker role described in SOP (e.g., Phlebotomy Technician, Retail Cashier, Hotel Front Office Agent)",
  "process": "Exact core operational process (e.g., Patient Registration & Blood Collection, POS Return Processing, Guest Check-In)",
  "purpose": "1-2 sentence primary operational goal for the worker",
  "scope": "Applicable department or workspace boundaries",
  "prerequisites": [
    { "text": "Requirement before starting", "source_ref": "S1.pre1", "source_text": "Quote from text" }
  ],
  "tools_and_systems": [
    { "name": "Tool or system name", "purpose": "What it is used for", "never_do": "Key prohibition", "source_ref": "S1.tool1", "source_text": "Quote" }
  ],
  "terminology": [
    { "term": "Key term or code", "meaning": "Plain definition", "source_ref": "S1.term1", "source_text": "Quote" }
  ],
  "operational_steps": [
    {
      "instruction": "Specific, clear workplace action (e.g., Verify patient full name and date of birth against photo ID)",
      "category": "DO" | "CHECK" | "KNOW" | "DECIDE" | "RESPOND" | "RECOVER" | "ESCALATE",
      "why_it_matters": "Operational reason or consequence",
      "action_verb": "Action verb",
      "critical_control": true/false,
      "source": { "page_or_section": "Page 1 · Section 1", "source_ref": "S1.sec1", "source_text": "Exact quote from document" }
    }
  ],
  "decision_points": [
    { "situation": "Condition triggering decision", "decision": "Decision choice", "action": "Required action", "source_ref": "S1.dec1", "source_text": "Quote" }
  ],
  "exceptions": [
    { "trigger": "Unexpected scenario or error", "resolution": "Corrective resolution", "source_ref": "S1.exp1", "source_text": "Quote" }
  ],
  "escalations": [
    { "situation": "When stuck or anomaly occurs", "contact_or_action": "Who to notify or call", "source_ref": "S1.esc1", "source_text": "Quote" }
  ],
  "critical_controls": [
    { "rule": "Mandatory non-negotiable rule", "rationale": "Why it is critical", "source_ref": "S1.ctrl1", "source_text": "Quote" }
  ],
  "safety_rules": [
    { "rule": "Safety or compliance rule", "source_ref": "S1.safe1", "source_text": "Quote" }
  ],
  "quality_rules": [
    { "rule": "Quality standard rule", "source_ref": "S1.qual1", "source_text": "Quote" }
  ],
  "customer_or_business_impact": [
    { "impact": "Who depends and impact", "source_ref": "S1.imp1", "source_text": "Quote" }
  ],
  "common_mistakes": [
    { "mistake": "Potential worker error", "prevention": "How to avoid it", "source_ref": "S1.err1", "source_text": "Quote" }
  ],
  "source_evidence": [
    { "id": "E1", "page_or_section": "Page 1", "excerpt": "Document excerpt" }
  ],
  "confidence": 0.98
}`;

    parts.push({ text: textPrompt });

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
          temperature: 0.2,
        },
      });
    } catch (primaryErr: any) {
      console.warn('[api/gemini/generate-blueprint] Primary model failed, trying fallback gemini-flash-latest:', primaryErr?.message);
      response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          maxOutputTokens: 8192,
          temperature: 0.2,
        },
      });
    }

    const outputText = response.text || '';
    if (!outputText.trim()) {
      return res.status(200).json({ success: false, useLocalGenerator: true, error: 'Empty response received from LLM' });
    }

    const parsedData = cleanAndRepairJson(outputText);
    return res.status(200).json({
      success: true,
      blueprint: parsedData,
    });
  } catch (error: any) {
    console.error('[API Error] Blueprint generation failed:', error);
    return res.status(200).json({
      success: false,
      useLocalGenerator: true,
      error: 'LLM_PARSE_OR_PROVIDER_ERROR',
      message: error?.message || 'Blueprint generation failed, falling back to domain-neutral generator.',
    });
  }
}

function sanitizeJsonString(str: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inString) {
      if (isEscaped) {
        result += ch;
        isEscaped = false;
      } else if (ch === '\\') {
        result += ch;
        isEscaped = true;
      } else if (ch === '"') {
        result += ch;
        inString = false;
      } else if (ch === '\n') {
        result += '\\n';
      } else if (ch === '\r') {
        result += '\\r';
      } else if (ch === '\t') {
        result += '\\t';
      } else {
        result += ch;
      }
    } else {
      result += ch;
      if (ch === '"') {
        inString = true;
      }
    }
  }
  return result;
}

function repairTruncatedJson(jsonStr: string): string {
  let text = jsonStr.trim().replace(/[,:\s]+$/, '');
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (ch === '\\') {
        isEscaped = true;
      } else if (ch === '"') {
        inString = false;
      }
    } else {
      if (ch === '"') {
        inString = true;
      } else if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}' || ch === ']') {
        stack.pop();
      }
    }
  }

  if (inString) {
    text += '"';
  }
  text = text.replace(/[,:\s]+$/, '');

  while (stack.length > 0) {
    const opening = stack.pop();
    if (opening === '{') {
      text += '}';
    } else if (opening === '[') {
      text += ']';
    }
  }

  return text;
}

function cleanAndRepairJson(rawText: string): any {
  if (!rawText) throw new Error('Empty text response from model');

  let text = rawText.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find the first and last of either '{' / '}' or '[' / ']'
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  let startIdx = -1;
  let endChar = '';
  
  if (firstBrace !== -1 && firstBracket !== -1) {
    if (firstBrace < firstBracket) {
      startIdx = firstBrace;
      endChar = '}';
    } else {
      startIdx = firstBracket;
      endChar = ']';
    }
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endChar = ']';
  }

  if (startIdx !== -1) {
    const lastIdx = text.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      text = text.slice(startIdx, lastIdx + 1);
    } else {
      text = text.slice(startIdx);
    }
  }

  const sanitized = sanitizeJsonString(text);

  try {
    return JSON.parse(sanitized);
  } catch (parseErr) {
    try {
      const repaired = repairTruncatedJson(sanitized);
      return JSON.parse(repaired);
    } catch (repairErr) {
      throw parseErr;
    }
  }
}
