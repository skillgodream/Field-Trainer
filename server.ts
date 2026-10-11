import express from 'express';
import { GoogleGenAI, GenerateVideosOperation } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import { planVideoDemonstration } from './src/utils/videoPlanEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractDocxTextFromBuffer(buffer: Buffer): string {
  try {
    let offset = 0;
    while (offset < buffer.length - 30) {
      if (
        buffer[offset] === 0x50 &&
        buffer[offset + 1] === 0x4b &&
        buffer[offset + 2] === 0x03 &&
        buffer[offset + 3] === 0x04
      ) {
        const compMethod = buffer.readUInt16LE(offset + 8);
        const compSize = buffer.readUInt32LE(offset + 18);
        const nameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLen);
        const dataOffset = offset + 30 + nameLen + extraLen;

        if (name === 'word/document.xml' && compSize > 0 && dataOffset + compSize <= buffer.length) {
          const compressedData = buffer.subarray(dataOffset, dataOffset + compSize);
          let xmlStr = '';
          if (compMethod === 8) {
            xmlStr = zlib.inflateRawSync(compressedData).toString('utf8');
          } else if (compMethod === 0) {
            xmlStr = compressedData.toString('utf8');
          }
          const matches = xmlStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches && matches.length > 0) {
            return matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ').trim();
          }
          break;
        }
        offset = dataOffset + compSize;
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.warn('[extractDocxTextFromBuffer] Error parsing docx zip structure:', err);
  }
  return '';
}

const videosDir = path.resolve(process.cwd(), 'uploads', 'videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

function getSafeVideoPath(lessonId: string, clipIndex: number = 1): string {
  const safeId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(videosDir, `${safeId}_clip_${clipIndex}.mp4`);
}

const app = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-api-key');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

/**
 * Resolves the Gemini API Key dynamically from environment variables.
 * Checks GEMINI_API_KEY, GOOGLE_API_KEY, GEMINI_KEY, VITE_GEMINI_API_KEY, API_KEY.
 * Trims whitespace and quotes.
 */
function getApiKey(req?: express.Request): string | undefined {
  const headerKey = req ? (
    (typeof req.headers['x-gemini-api-key'] === 'string' ? req.headers['x-gemini-api-key'] : '') ||
    (typeof req.headers['authorization'] === 'string' ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : '')
  ).trim() : '';

  const rawKey = (
    headerKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.API_KEY ||
    ''
  ).trim();

  // Strip accidental surrounding single or double quotes
  const cleanKey = rawKey.replace(/^["']|["']$/g, '').trim();
  return cleanKey || undefined;
}

/**
 * Returns an initialized GoogleGenAI client instance or null if no key is present.
 */
function getGeminiClient(req?: express.Request): GoogleGenAI | null {
  const apiKey = getApiKey(req);
  if (!apiKey) return null;

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MODEL_PRO = process.env.GEMINI_PRO_MODEL || 'gemini-3.1-pro-preview';
const MODEL_FAST = process.env.GEMINI_FAST_MODEL || 'gemini-3.8-flash';

// Health check endpoint to diagnose deployment status and API key detection
app.get('/api/health', (_req, res) => {
  const key = getApiKey();
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(key && key.length > 5),
    keyPrefix: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    nodeEnv: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// Temporary endpoint to list available models for the provided API key
app.get('/api/models', async (req, res) => {
  const ai = getGeminiClient(req);
  if (!ai) return res.json({ error: 'no key' });
  const out: string[] = [];
  try {
    for await (const m of await ai.models.list()) {
      if (m.name) out.push(m.name);
    }
    res.json({ success: true, models: out });
  } catch (err: any) {
    res.json({ success: false, error: err?.message || String(err) });
  }
});

// API Route: Extract Text from PDF/Image using Gemini Server Multimodal Engine
app.post('/api/pdf/extract', async (req, res) => {
  try {
    const { fileBase64, mimeType = 'application/pdf', filename = 'uploaded_document.pdf' } = req.body;

    if (!fileBase64 || typeof fileBase64 !== 'string') {
      return res.status(400).json({ success: false, error: 'No fileBase64 data provided.' });
    }

    let textDirect: string | null = null;
    const lowerName = filename.toLowerCase();
    const isDocx = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || mimeType.includes('word') || mimeType.includes('openxmlformats');

    if (isDocx) {
      try {
        const fileBuffer = Buffer.from(fileBase64, 'base64');
        const extractedDocx = extractDocxTextFromBuffer(fileBuffer);
        if (extractedDocx && extractedDocx.length > 10) {
          textDirect = extractedDocx;
        } else {
          // Fallback to searching decoded text
          const decodedStr = fileBuffer.toString('utf-8');
          const xmlMatches = decodedStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (xmlMatches && xmlMatches.length > 0) {
            textDirect = xmlMatches.map((node) => node.replace(/<[^>]+>/g, '')).join(' ');
          }
        }
      } catch (e) {
        console.warn('[Server DOCX Extract] Buffer decode failed:', e);
      }
    }

    if (textDirect && textDirect.trim().length > 10) {
      const extractedText = textDirect.trim();
      const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
      const pageCount = Math.max(1, Math.ceil(wordCount / 220));
      console.log(`[Server /api/pdf/extract SUCCESS] Direct docx extracted ${wordCount} words from '${filename}'`);
      return res.json({
        success: true,
        extractedText,
        wordCount,
        pageCount,
      });
    }

    const aiClient = getGeminiClient(req);
    if (!aiClient) {
      console.warn('[Server PDF Extract] No Gemini API key detected on server.');
      return res.json({ success: false, useLocal: true, reason: 'GEMINI_API_KEY missing on server' });
    }

    let docPart: any;

    const cleanMime = mimeType.includes('image') ? mimeType : mimeType.includes('text') ? 'text/plain' : 'application/pdf';
    docPart = {
      inlineData: {
        mimeType: cleanMime,
        data: fileBase64,
      },
    };

    const prompt = `You are a High-Fidelity Document & OCR Extraction Engine.
Extract the COMPLETE human-readable text from this document ("${filename}") word-for-word.
Preserve paragraph structure, headers, section numbers, bullet points, and original Unicode typography (curly quotes, dashes, accents, symbols).
Do NOT summarize. Return JSON:
{
  "extractedText": "Complete extracted text content here...",
  "pageCount": estimated total pages as integer,
  "wordCount": estimated total words as integer
}`;

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: MODEL_PRO,
        contents: { parts: [docPart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
        },
      });
    } catch (primaryErr: any) {
      console.warn(`[Server PDF Extract] Primary model ${MODEL_PRO} failed, trying ${MODEL_FAST}:`, primaryErr?.message);
      response = await aiClient.models.generateContent({
        model: MODEL_FAST,
        contents: { parts: [docPart, { text: prompt }] },
        config: {
          responseMimeType: 'application/json',
        },
      });
    }

    const outputText = response.text || '';
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanJson);
    const extractedText = parsed.extractedText || '';
    const wordCount = parsed.wordCount || extractedText.split(/\s+/).filter(Boolean).length;
    const pageCount = parsed.pageCount || Math.max(1, Math.ceil(wordCount / 220));

    console.log(`[Server /api/pdf/extract SUCCESS] Extracted ${wordCount} words from '${filename}' (${pageCount} pages)`);

    return res.json({
      success: true,
      extractedText,
      wordCount,
      pageCount,
    });
  } catch (err: any) {
    console.error('[Server /api/pdf/extract Error]:', err?.message || err);
    return res.json({ success: false, error: err?.message || 'Server PDF extraction failed' });
  }
});

// API Route: Generate Blueprint & Lesson from SOP Source Document
app.post('/api/gemini/generate-blueprint', async (req, res) => {
  try {
    const { rawText, fileBase64, mimeType, filename, fileHash, pageCount, wordCount } = req.body;

    const aiClient = getGeminiClient(req);
    if (!aiClient) {
      console.warn('[Server /api/gemini/generate-blueprint] No Gemini API key found in environment.');
      return res.json({
        success: false,
        useLocalGenerator: true,
        reason: 'GEMINI_API_KEY is not configured on server. Fallback to local domain-neutral generator.',
      });
    }

    const parts: any[] = [];
    const docText = rawText ? rawText.slice(0, 48000) : '';

    // If text was already extracted, prioritize sending text directly (much faster and avoids payload limits)
    if (docText && docText.length > 50) {
      // Document text is available in docText
    } else if (fileBase64 && typeof fileBase64 === 'string') {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: fileBase64,
        },
      });
    }

    const systemInstruction = `You are a World-Class Lead Operational Intelligence Engineer and Instructional Designer for Guruji Work Coach.
LAW 3 — UNIVERSAL 8-STAGE OPERATIONAL LEARNING FRAMEWORK
The 8 stages are the Brain's universal framework for analysing and organising ANY SOP.
They are NOT a mandatory 8-slide structure.
The Brain must examine the SOP through all 8 stages and use only the stages that contain meaningful source-supported content. It may combine, expand or skip stages depending on the SOP.

1. ORIENT: What is the job/task? Why is it being done? What is the expected outcome? What is the worker responsible for?
2. PREPARE: What must the worker check, arrange, confirm or understand before starting? (Tools, information, prerequisites, environment, customer/patient/order details).
3. PERFORM: What does the worker actually do? Extract the real operational steps and preserve their correct sequence.
4. CONTROL: What must the worker verify while performing the task? Include safety, quality, accuracy, compliance, customer, equipment or other critical controls.
5. DECIDE: Where does the worker need to make a judgement? Identify the condition, available actions and the correct SOP-supported response.
6. HANDLE: What happens when the normal process does not go as expected? Include exceptions, unusual conditions, missing information, failed checks or process deviations.
7. ESCALATE: When is the issue beyond the worker's authority or capability? Identify when to stop, who/what to escalate to and what must happen before continuing.
8. PROVE: What does the worker need to demonstrate to show that the critical learning has been understood? Use the most important steps, controls, decisions or exceptions from the SOP.

SYNTHESIS RULE:
SOP → analyse through 8 stages → identify meaningful content → remove duplication → preserve critical details → arrange progressively → create the required training pages.
- Do NOT force an SOP into all 8 stages.
- Do NOT create empty pages just because a stage exists.
- Do NOT invent content to fill a stage.
- The 8 stages control the Brain's thinking and sequencing; the SOP controls the actual content.

CRITICAL ARCHITECTURAL RULES:
1. CONCISE WORKPLACE LANGUAGE (NO RAW TEXT DUMPS):
   - NEVER output long, run-on paragraph sentences concatenating multiple SOP lines.
   - Summarize every choice title into a crisp, COMPLETE, 5-12 word action statement written in natural workplace language.
   - NEVER end a choice title on a dangling conjunction or preposition (e.g., 'and', 'or', 'to', 'with', 'for'). Ensure every title is a full, grammatically complete action phrase.
   - Keep scenario questions under 2 concise sentences focused on a single execution dilemma.
2. DEEP REALISM & UNCOMPROMISING SPECIFICITY:
   - Ground ALL extractions strictly in the operational facts of the provided SOP document.
   - Extract the TRUE frontline role (e.g. Quick Commerce Picker, Phlebotomist, Residential Housekeeping Specialist, Retail Cashier, Primary School Teacher, Aviation Gate Agent).
   - Every scenario question must put the worker in a concrete, high-stakes operational situation directly based on the SOP details (specific equipment, classroom prep, barcodes, shelf codes, temperatures, error codes, edge cases, exceptions).
   - NEVER generate generic questions like "What is your required action?" or "How should you complete this task?" or "Before taking the next step, what details must you verify?".
   - NEVER generate generic choices like "Skip step and proceed" or "Use unverified shortcut". Create REALISTIC frontline errors, tempting shortcuts, and common mistakes that real workers actually make on the floor!
3. THREE NUANCED CHOICES WITH EXPLICIT FAILURE MODES:
   - For EACH operational step, you MUST generate exactly 3 nuanced choices with short, complete, clear titles (5 to 12 words):
     * Choice 1 (isCorrect: true): Concise, complete, compliant SOP action title. Subtitle explaining why this is correct per SOP.
     * Choice 2 (isCorrect: false): Concise, complete, tempting operational shortcut title. Subtitle explicitly details the failure consequence (e.g., inventory mismatch, customer complaint, safety hazard).
     * Choice 3 (isCorrect: false): Concise, complete, unapproved workaround title. Subtitle details the regulatory, safety, or quality violation.
3. EXPERT COACH TIPS, SPECIFIC HINTS & LUCIDE VECTOR ICONS:
   - coach_tip: Guruji's practical wisdom directly referencing the subtle details, pitfalls, or mnemonic tips from the SOP.
   - hint: Specific reference to the SOP document section, visual cues, or indicators.
   - target_code: Authentic code extracted from or reflecting the SOP (e.g., LOC-A02-04, SKU-88421, FORM-Q7).
   - icon_key: Assign a domain-appropriate, clean Lucide vector icon key for each operational step, tool, and safety rule (e.g., ShieldAlert, ScanBarcode, Thermometer, Microscope, Boxes, FileCheck, Droplets, Sparkles, SprayCan, Syringe, ClipboardCheck, Users, CheckCircle, AlertTriangle, Zap, Scale, Truck, Lock, Settings). Match the icon meaningfully to the operational step — no arbitrary overfitting or underfitting.
5. METADATA VS OPERATIONAL CONTENT:
   - METADATA (DO NOT MAKE INTO STEPS): Administrative headers, document approval tables, version histories, ISO reference codes.
   - OPERATIONAL CONTENT (MUST DRIVE BLUEPRINT): Physical actions, system entries, verbal communications, verifications, decision points, exception handling, escalations.
6. AI VIDEO DIRECTOR RULES FOR VEO 3.2 LITE:
   For every clip in video_demonstration_plan.clips, formulate the "veo_prompt" as a dense 65-85 word single cinematic sentence following:
   [Visual Style] + [Detailed Subject with Active Continuous Movement] + [Enriched Background Environment] + [Studio Lighting/Mood] + [Continuous Camera Tracking]
   - BACKGROUND ENRICHMENT: Always build a detailed, authentic physical workspace (e.g. sleek executive conference suite with frosted acoustic glass partitions, sterile clinical preparation bench with specimen centrifuge racks, modern retail checkout counter, organized staging aisle). Never leave the background blank or abstract.
   - PACING & CONTINUOUS MOVEMENT: Use active progressive verbs (e.g., "steadily reviewing and logging", "methodically cross-verifying", "carefully inspecting with deliberate hand movements"). Actions must be continuous, steady-state, or looping to prevent abrupt cutoffs at the 8-second mark.
   - BAN COMPLETION VERBS: Do not use verbs indicating an end state (e.g., 'closes the laptop', 'presses the button', 'sits down'). Instead mandate continuous progressive action states (e.g., 'the laptop remains open as data flows', 'finger holding down the button safely', 'seated stationary while analyzing').
   - CAMERA WORK: End every prompt with fluid continuous camera motion (e.g., "slow cinematic lateral tracking shot gently drifting leftward", "subtle continuous forward camera drift maintaining steady focal depth").
7. MANDATORY OUTPUT FORMAT: Respond strictly with valid, un-truncated JSON conforming to the requested schema.`;

    const textPrompt = `Uploaded SOP Document: "${filename}" (${pageCount || 1} pages, ${wordCount || 100} words)
${docText ? `Document Text:\n"""\n${docText}\n"""\n` : ''}

Extract the complete OPERATIONAL BLUEPRINT as JSON with this exact schema:
{
  "document_identity": {
    "doc_title": "${filename ? filename.replace(/\.(txt|pdf|docx)$/i, '') : 'Operational Procedure'}",
    "doc_ref": "Extracted document reference or empty",
    "version": "Extracted version or empty",
    "department": "Extracted department or operations division"
  },
  "role": "Exact worker role described in SOP (e.g., Compliance Officer, Operations Associate, Retail Cashier, Technician)",
  "process": "Exact core operational process (e.g., Incident Intake & Logging, Order Fulfillment, Blood Sample Collection)",
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
      "instruction": "Specific, clear workplace action grounded in the SOP (e.g., Verify tote barcode against PDA screen before placing picked items)",
      "category": "DO" | "CHECK" | "KNOW" | "DECIDE" | "RESPOND" | "RECOVER" | "ESCALATE",
      "action_verb": "Primary action verb (e.g., Scan, Verify, Inspect, Place)",
      "task_title": "Concise 2-4 word operational action title (e.g., Scan Tote Barcode, Check Expiry Date, Inspect Packaging)",
      "target_code": "Realistic barcode / SKU / rack / equipment or form code from SOP (e.g., TOTE-B12, SKU-4029, LOC-A02-04)",
      "why_it_matters": "Specific operational reason and consequence on safety, quality, or process compliance",
      "critical_control": true/false,
      "scenario_question": "Authentic, vivid frontline workplace simulation question putting the worker directly into the dilemma or execution moment with exact details from the SOP",
      "choices": [
        {
          "id": "c1",
          "title": "Exact correct operational procedure according to the SOP",
          "subtitle": "Compliant SOP standard procedure",
          "isCorrect": true
        },
        {
          "id": "c2",
          "title": "Tempting shortcut or common frontline worker mistake",
          "subtitle": "Failure mode: causes inventory discrepancy / customer complaint / quality defect",
          "isCorrect": false
        },
        {
          "id": "c3",
          "title": "Unapproved workaround or bypassed safety/compliance check",
          "subtitle": "Safety/compliance hazard: violates mandatory protocol",
          "isCorrect": false
        }
      ],
      "coach_tip": "Master Coach Guruji tip explaining insider nuances, physical dexterity, memory cues, or compliance wisdom from the SOP",
      "hint": "Specific clue pointing directly to the relevant section or physical indicator in the SOP",
      "source": {
        "page_or_section": "Page 1 · Section 2",
        "source_ref": "S1.sec1",
        "source_text": "Exact verbatim quote from document text"
      }
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
  "video_demonstration_plan": {
    "strategy": "sequential_steps",
    "total_clips": 3,
    "clips": [
      {
        "clip_index": 1,
        "step_ref": "Step 1: Receipt & Intake",
        "title": "Immediate Response & Intake",
        "duration_seconds": 8,
        "key_action": "Specific physical action from SOP",
        "veo_prompt": "Photorealistic 720p 16:9 cinematic instructional demonstration. A frontline specialist is methodically reviewing and cross-verifying intake documentation with continuous, deliberate hand movements. Setting is an executive private meeting suite with frosted acoustic glass partitions and polished oak conference desk. Soft natural morning daylight balanced by warm commercial recessed lighting. Slow cinematic lateral camera tracking shot gently drifting forward."
      }
    ]
  },
  "confidence": 0.98
}

Generate between 5 to 9 comprehensive operational_steps covering the entire lifecycle of the SOP.`;

    parts.push({ text: textPrompt });

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: MODEL_PRO,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          maxOutputTokens: 32768,
          temperature: 0.25,
        },
      });
    } catch (primaryErr: any) {
      console.warn(`[Server LLM Blueprint] Primary model ${MODEL_PRO} failed, trying ${MODEL_FAST}:`, primaryErr?.message);
      response = await aiClient.models.generateContent({
        model: MODEL_FAST,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          maxOutputTokens: 32768,
          temperature: 0.25,
        },
      });
    }

    const outputText = response.text || '';
    if (!outputText.trim()) {
      return res.json({ success: false, useLocalGenerator: true, error: 'Empty response received from LLM' });
    }

    const parsedData = cleanAndRepairJson(outputText);

    // Authoritative VideoPlan synthesis via Guruji VideoPlan engine
    try {
      parsedData.video_demonstration_plan = planVideoDemonstration(parsedData);
    } catch (vpErr) {
      console.warn('[Server Veo VideoPlan synthesis warning]:', vpErr);
    }

    console.log(`[Server /api/gemini/generate-blueprint SUCCESS] Extracted ${parsedData.operational_steps?.length || 0} high-fidelity steps from '${filename}'`);

    return res.json({
      success: true,
      blueprint: parsedData,
    });
  } catch (err: any) {
    console.error('[Server /api/gemini/generate-blueprint Error]:', err?.message || err);
    return res.json({
      success: false,
      useLocalGenerator: true,
      error: err?.message || 'Server error, falling back to local generator.',
    });
  }
});

// Generic /api/coach endpoint implementing developer guide specification
app.post('/api/coach', async (req, res) => {
  const { prompt, systemInstruction, fileBase64, mimeType = 'application/pdf', maxOutputTokens = 4000, temperature = 0.3 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt in request body' });
  }

  const aiClient = getGeminiClient(req);
  if (!aiClient) {
    console.error('[API Error] GEMINI_API_KEY is not defined in deployment environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
  }

  try {
    const parts: any[] = [];
    if (fileBase64 && typeof fileBase64 === 'string') {
      const cleanMime = mimeType.includes('image')
        ? mimeType
        : mimeType.includes('text')
        ? 'text/plain'
        : 'application/pdf';
      parts.push({
        inlineData: {
          mimeType: cleanMime,
          data: fileBase64,
        },
      });
    }
    parts.push({ text: prompt });

    const contentsPayload = parts.length > 1 ? { parts } : prompt;

    let response;
    try {
      response = await aiClient.models.generateContent({
        model: MODEL_PRO,
        contents: contentsPayload,
        config: {
          systemInstruction: systemInstruction || 'You are an expert assistant. Respond strictly with valid JSON.',
          responseMimeType: 'application/json',
          maxOutputTokens,
          temperature,
        },
      });
    } catch (primaryErr: any) {
      console.warn(`[Server /api/coach] Primary model ${MODEL_PRO} failed, trying fallback ${MODEL_FAST}:`, primaryErr?.message);
      response = await aiClient.models.generateContent({
        model: MODEL_FAST,
        contents: contentsPayload,
        config: {
          systemInstruction: systemInstruction || 'You are an expert assistant. Respond strictly with valid JSON.',
          responseMimeType: 'application/json',
          maxOutputTokens,
          temperature,
        },
      });
    }

    const rawText = response.text || '';
    if (!rawText.trim()) {
      return res.status(502).json({ error: 'Empty response received from LLM' });
    }

    try {
      const parsedData = cleanAndRepairJson(rawText);
      return res.status(200).json(parsedData);
    } catch (parseError: any) {
      console.error('[API Error /api/coach] cleanAndRepairJson failed:', parseError);
      return res.status(502).json({
        error: 'JSON_PARSE_ERROR',
        message: 'The model output was malformed or truncated.',
        details: parseError.message,
      });
    }
  } catch (error: any) {
    console.error('[API Error /api/coach] LLM generation failed:', error);
    return res.status(500).json({
      error: 'LLM_PROVIDER_ERROR',
      message: error.message || 'Failed to generate response',
    });
  }
});

// ==========================================
// Google Veo Video Generation API Endpoints
// ==========================================

// 1. Start on-demand video generation
app.post('/api/generate-video', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { prompt, aspectRatio = '16:9', resolution = '720p' } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, error: 'A prompt is required for video generation.' });
    }

    const aiClient = getGeminiClient(req);
    if (!aiClient) {
      return res.status(500).json({ success: false, error: 'Gemini API key is not configured on server or in request headers.' });
    }

    // Clean and bound prompt length to Veo supported limits
    const safePrompt = prompt.trim().slice(0, 2000);

    const VEO_MODELS = ['veo-3.1-fast-generate-preview', 'veo-3.1-lite-generate-preview'];
    let operation: any = null;
    let lastError: any = null;

    // Multi-lane routing with exponential backoff & jitter
    for (let attempt = 0; attempt < 2 && !operation; attempt++) {
      for (const modelName of VEO_MODELS) {
        try {
          console.log(`[Veo] Attempting video generation on model: ${modelName} (attempt ${attempt + 1})`);
          operation = await aiClient.models.generateVideos({
            model: modelName,
            prompt: safePrompt,
            config: {
              numberOfVideos: 1,
              resolution: resolution === '1080p' ? '1080p' : '720p',
              aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
            },
          });
          if (operation?.name) {
            console.log(`[Veo SUCCESS] Video generation initiated on ${modelName}:`, operation.name);
            break;
          }
        } catch (laneErr: any) {
          lastError = laneErr;
          const is429 = laneErr?.status === 429 || laneErr?.message?.includes('429') || laneErr?.message?.includes('RESOURCE_EXHAUSTED');
          console.warn(`[Veo Lane Warning] ${modelName} returned ${is429 ? '429 Rate Limit' : laneErr?.message?.slice(0, 60)}.`);
          // Backoff jitter delay before attempting alternate lane
          const backoffMs = (attempt + 1) * 2000 + Math.floor(Math.random() * 1500);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    if (!operation?.name) {
      throw lastError || new Error('Video generation failed on all available Veo model lanes.');
    }

    return res.status(200).json({ success: true, operationName: operation.name });
  } catch (error: any) {
    console.error('[Veo Generate Error]', error);
    let msg = error?.message || (typeof error === 'string' ? error : 'Failed to start video generation.');
    try {
      if (typeof msg === 'string' && msg.startsWith('{')) {
        const parsed = JSON.parse(msg);
        if (parsed.error?.message) msg = parsed.error.message;
      }
    } catch (_) {}

    const isQuota =
      msg.includes('429') ||
      msg.includes('quota') ||
      msg.includes('RESOURCE_EXHAUSTED') ||
      error?.status === 429 ||
      error?.code === 429;

    if (isQuota) {
      return res.status(429).json({
        success: false,
        isQuotaExceeded: true,
        error: 'Google Veo rate limit or daily quota reached (RESOURCE_EXHAUSTED). Video generation allows 1 request per minute on preview tiers. Please wait about 60 seconds and try again.',
      });
    }

    return res.status(500).json({ success: false, error: msg });
  }
});

// 2. Poll video generation status
app.post('/api/video-status', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { operationName } = req.body || {};
    if (!operationName) {
      return res.status(400).json({ success: false, error: 'operationName is required.' });
    }

    const aiClient = getGeminiClient(req);
    if (!aiClient) {
      return res.status(500).json({ success: false, error: 'Gemini API key is not configured on server or in request headers.' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await aiClient.operations.getVideosOperation({ operation: op });

    let errObj: string | null = null;
    if (updated.error) {
      errObj = typeof updated.error === 'string' ? updated.error : (updated.error as any).message || JSON.stringify(updated.error);
    }

    return res.status(200).json({
      success: true,
      done: Boolean(updated.done),
      error: errObj,
    });
  } catch (error: any) {
    console.error('[Veo Status Error]', error);
    const msg = error?.message || (typeof error === 'string' ? error : 'Failed to check video status.');
    return res.status(500).json({ success: false, error: msg });
  }
});

// 3. Download / stream completed MP4 video and persist to server storage
app.post('/api/video-download', async (req, res) => {
  try {
    const { operationName, lessonId, clipIndex = 1 } = req.body;
    if (!operationName) {
      return res.status(400).json({ success: false, error: 'operationName is required.' });
    }

    const aiClient = getGeminiClient(req);
    const apiKey = getApiKey(req);
    if (!aiClient || !apiKey) {
      return res.status(500).json({ success: false, error: 'Gemini API key is not configured.' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await aiClient.operations.getVideosOperation({ operation: op });

    const downloadUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadUri) {
      return res.status(404).json({ success: false, error: 'Video URI not found in completed operation.' });
    }

    const videoRes = await fetch(downloadUri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    if (!videoRes.ok) {
      return res.status(videoRes.status).json({ success: false, error: `Failed to fetch video file: ${videoRes.statusText}` });
    }

    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to server storage for cross-device persistence
    if (lessonId && typeof lessonId === 'string') {
      try {
        const destPath = getSafeVideoPath(lessonId, Number(clipIndex) || 1);
        await fs.promises.writeFile(destPath, buffer);
        console.log(`[Server Storage] Saved video clip to server disk: ${destPath}`);
      } catch (saveErr) {
        console.warn('[Server Storage] Failed to write video to server disk:', saveErr);
      }
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', buffer.length.toString());
    return res.send(buffer);
  } catch (error: any) {
    console.error('[Veo Download Error]', error);
    return res.status(500).json({ success: false, error: error?.message || 'Failed to download video.' });
  }
});

// 4. Stream saved video from server storage (supports full range-requests / scrubbing)
app.get('/api/videos/stream/:lessonId/:clipIndex', (req, res) => {
  try {
    const { lessonId, clipIndex } = req.params;
    const filePath = getSafeVideoPath(lessonId, Number(clipIndex) || 1);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Video not found on server storage.' });
    }

    // res.sendFile handles byte range requests, Content-Range, Content-Length automatically
    return res.sendFile(filePath, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    console.error('[Video Stream Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to stream video.' });
  }
});

// 5. Check which clips are saved on the server for a lesson
app.get('/api/videos/check/:lessonId', (req, res) => {
  try {
    const { lessonId } = req.params;
    const safeId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const existingClips: number[] = [];

    // Check up to 10 clips
    for (let i = 1; i <= 10; i++) {
      const p = path.join(videosDir, `${safeId}_clip_${i}.mp4`);
      if (fs.existsSync(p)) {
        existingClips.push(i);
      }
    }

    return res.json({
      success: true,
      clips: existingClips,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to check video storage.' });
  }
});

// 6. Delete saved videos for a lesson (e.g. when regenerating)
app.delete('/api/videos/:lessonId', (req, res) => {
  try {
    const { lessonId } = req.params;
    const safeId = lessonId.replace(/[^a-zA-Z0-9_-]/g, '_');

    for (let i = 1; i <= 10; i++) {
      const p = path.join(videosDir, `${safeId}_clip_${i}.mp4`);
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch (_) {}
      }
    }

    return res.json({ success: true, message: 'Server video storage cleared.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete videos.' });
  }
});

// Explicitly prevent SPA route swallowing for all /api endpoints
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API_ENDPOINT_NOT_FOUND',
    message: `API endpoint ${req.method} ${req.path} not found on server`,
  });
});

// Static files in production / Vite middlewares in development
const distPath = path.resolve(process.cwd(), 'dist');

const indexHtmlExists = fs.existsSync(path.join(distPath, 'index.html'));
const isProduction = process.env.NODE_ENV === 'production' || (indexHtmlExists && process.env.NODE_ENV !== 'development');

if (isProduction) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ success: false, error: 'API route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] Express server running on http://0.0.0.0:${PORT}`);
});

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
        // Lookahead check: is this double-quote closing the property/value, or an interior unescaped quote?
        const rest = str.slice(i + 1).trimStart();
        if (rest.startsWith(':') || rest.startsWith(',') || rest.startsWith('}') || rest.startsWith(']')) {
          result += ch;
          inString = false;
        } else {
          // Interior unescaped quote -> escape it
          result += '\\"';
        }
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
  let text = jsonStr.trim();

  // Strip trailing markdown fences if present
  text = text.replace(/```$/g, '').trim();

  // Strip incomplete keys or values at end of truncated JSON string
  text = text.replace(/,?\s*"[^"]*"\s*:\s*$/, '');
  text = text.replace(/,?\s*"[^"]*$/, '');
  text = text.replace(/[,:\s]+$/, '');

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
        if (stack.length > 0) stack.pop();
      }
    }
  }

  // If ended mid-string, terminate string
  if (inString) {
    text += '"';
  }

  // Remove trailing punctuation again after string closure
  text = text.replace(/[,:\s]+$/, '');

  // Close all unclosed objects and arrays in stack order
  while (stack.length > 0) {
    const opening = stack.pop();
    if (opening === '{') {
      text += '}';
    } else if (opening === '[') {
      text += ']';
    }
  }

  // Strip invalid trailing commas before closing braces/brackets
  text = text.replace(/,\s*([\}\]])/g, '$1');

  return text;
}

function extractJsonBlock(text: string): string {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  let startIdx = -1;
  
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = firstBrace < firstBracket ? firstBrace : firstBracket;
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }
  
  if (startIdx === -1) {
    return text;
  }
  
  let inString = false;
  let isEscaped = false;
  const stack: string[] = [];
  
  for (let i = startIdx; i < text.length; i++) {
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
        const top = stack[stack.length - 1];
        if ((ch === '}' && top === '{') || (ch === ']' && top === '[')) {
          stack.pop();
          if (stack.length === 0) {
            return text.slice(startIdx, i + 1);
          }
        }
      }
    }
  }
  
  return text.slice(startIdx);
}

function cleanAndRepairJson(rawText: string): any {
  if (!rawText || !rawText.trim()) throw new Error('Empty text response from model');

  let text = rawText.trim();

  // Strip markdown codeblock enclosures
  text = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  text = extractJsonBlock(text);

  // Attempt 1: Direct JSON parse
  try {
    return JSON.parse(text);
  } catch (e1) {
    // Attempt 2: Sanitize control characters inside strings
    try {
      const sanitized = sanitizeJsonString(text);
      return JSON.parse(sanitized);
    } catch (e2) {
      // Attempt 3: Repair truncated JSON with sanitization
      try {
        const sanitized = sanitizeJsonString(text);
        const repaired = repairTruncatedJson(sanitized);
        return JSON.parse(repaired);
      } catch (e3) {
        // Attempt 4: Repair raw truncated JSON
        try {
          const repairedRaw = repairTruncatedJson(text);
          return JSON.parse(repairedRaw);
        } catch (e4) {
          console.error('[cleanAndRepairJson FAIL] Unrepairable JSON response from LLM:', text.slice(0, 300));
          throw new Error('MALFORMED_LLM_JSON_OUTPUT');
        }
      }
    }
  }
}
