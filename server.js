import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
app.use(express.json({ limit: "15mb" }));
function getApiKey() {
  const rawKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GEMINI_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY || "").trim();
  const cleanKey = rawKey.replace(/^["']|["']$/g, "").trim();
  return cleanKey || void 0;
}
function getGeminiClient() {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.get("/api/health", (_req, res) => {
  const key = getApiKey();
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(key && key.length > 5),
    keyPrefix: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    nodeEnv: process.env.NODE_ENV || "development",
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/pdf/extract", async (req, res) => {
  try {
    const { fileBase64, mimeType = "application/pdf", filename = "uploaded_document.pdf" } = req.body;
    if (!fileBase64 || typeof fileBase64 !== "string") {
      return res.status(400).json({ success: false, error: "No fileBase64 data provided." });
    }
    const aiClient = getGeminiClient();
    if (!aiClient) {
      console.warn("[Server PDF Extract] No Gemini API key detected on server.");
      return res.json({ success: false, useLocal: true, reason: "GEMINI_API_KEY missing on server" });
    }
    let docPart;
    let textDirect = null;
    const lowerName = filename.toLowerCase();
    const isDocx = lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || mimeType.includes("word") || mimeType.includes("openxmlformats");
    if (isDocx) {
      try {
        const decodedStr = Buffer.from(fileBase64, "base64").toString("utf-8");
        const xmlMatches = decodedStr.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
        if (xmlMatches && xmlMatches.length > 0) {
          textDirect = xmlMatches.map((node) => node.replace(/<[^>]+>/g, "")).join(" ");
        }
      } catch (e) {
        console.warn("[Server DOCX Extract] Direct buffer decode failed:", e);
      }
    }
    if (textDirect && textDirect.trim().length > 10) {
      const extractedText2 = textDirect.trim();
      const wordCount2 = extractedText2.split(/\s+/).filter(Boolean).length;
      const pageCount2 = Math.max(1, Math.ceil(wordCount2 / 220));
      console.log(`[Server /api/pdf/extract SUCCESS] Direct XML decoded ${wordCount2} words from '${filename}'`);
      return res.json({
        success: true,
        extractedText: extractedText2,
        wordCount: wordCount2,
        pageCount: pageCount2
      });
    }
    const cleanMime = mimeType.includes("image") ? mimeType : mimeType.includes("text") ? "text/plain" : "application/pdf";
    docPart = {
      inlineData: {
        mimeType: cleanMime,
        data: fileBase64
      }
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
        model: "gemini-3.8-flash",
        contents: { parts: [docPart, { text: prompt }] },
        config: {
          responseMimeType: "application/json"
        }
      });
    } catch (primaryErr) {
      console.warn("[Server PDF Extract] Primary model gemini-3.8-flash failed, trying gemini-flash-latest:", primaryErr?.message);
      response = await aiClient.models.generateContent({
        model: "gemini-flash-latest",
        contents: { parts: [docPart, { text: prompt }] },
        config: {
          responseMimeType: "application/json"
        }
      });
    }
    const outputText = response.text || "";
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    const parsed = JSON.parse(cleanJson);
    const extractedText = parsed.extractedText || "";
    const wordCount = parsed.wordCount || extractedText.split(/\s+/).filter(Boolean).length;
    const pageCount = parsed.pageCount || Math.max(1, Math.ceil(wordCount / 220));
    console.log(`[Server /api/pdf/extract SUCCESS] Extracted ${wordCount} words from '${filename}' (${pageCount} pages)`);
    return res.json({
      success: true,
      extractedText,
      wordCount,
      pageCount
    });
  } catch (err) {
    console.error("[Server /api/pdf/extract Error]:", err?.message || err);
    return res.json({ success: false, error: err?.message || "Server PDF extraction failed" });
  }
});
app.post("/api/gemini/generate-blueprint", async (req, res) => {
  try {
    const { rawText, fileBase64, mimeType, filename, fileHash, pageCount, wordCount } = req.body;
    const aiClient = getGeminiClient();
    if (!aiClient) {
      console.warn("[Server /api/gemini/generate-blueprint] No Gemini API key found in environment.");
      return res.json({
        success: false,
        useLocalGenerator: true,
        reason: "GEMINI_API_KEY is not configured on server. Fallback to local domain-neutral generator."
      });
    }
    const parts = [];
    const docText = rawText ? rawText.slice(0, 48e3) : "";
    if (docText && docText.length > 50) {
    } else if (fileBase64 && typeof fileBase64 === "string") {
      parts.push({
        inlineData: {
          mimeType: mimeType || "application/pdf",
          data: fileBase64
        }
      });
    }
    const systemInstruction = `You are a World-Class Lead Operational Intelligence Engineer and Instructional Designer for Guruji Work Coach.
Your task is to transform an uploaded Standard Operating Procedure (SOP) into a deep, high-fidelity, simulation-grade OPERATIONAL BLUEPRINT.

CRITICAL ARCHITECTURAL RULES:
1. DEEP REALISM & UNCOMPROMISING SPECIFICITY:
   - Ground ALL extractions strictly and verbatim in the provided SOP document.
   - Extract the TRUE frontline role (e.g. Quick Commerce Picker, Phlebotomist, Residential Housekeeping Specialist, Retail Cashier).
   - Every scenario question must put the worker in a concrete, high-stakes operational situation directly based on the SOP details (specific product names, equipment, barcodes, shelf codes, temperatures, error codes, edge cases, exceptions).
   - NEVER generate generic questions like "What is your required action?" or "How should you complete this task?" or "Before taking the next step, what details must you verify?".
   - NEVER generate generic choices like "Skip step and proceed" or "Use unverified shortcut". Create REALISTIC frontline errors, tempting shortcuts, and common mistakes that real workers actually make on the floor!
2. THREE NUANCED CHOICES WITH EXPLICIT FAILURE MODES:
   - For EACH operational step, you MUST generate exactly 3 nuanced choices:
     * Choice 1 (isCorrect: true): The precise, compliant SOP action with actionable steps. Subtitle explaining why this is correct per SOP.
     * Choice 2 (isCorrect: false): A realistic, tempting operational shortcut or common rushed mistake that workers often make. Subtitle explicitly details the failure consequence (e.g., inventory mismatch, customer complaint, safety hazard).
     * Choice 3 (isCorrect: false): An unapproved workaround or procedural bypass. Subtitle details the regulatory, safety, or quality violation.
3. EXPERT COACH TIPS & SPECIFIC HINTS:
   - coach_tip: Guruji's practical wisdom directly referencing the subtle details, pitfalls, or mnemonic tips from the SOP.
   - hint: Specific reference to the SOP document section, visual cues, or indicators.
   - target_code: Authentic code extracted from or reflecting the SOP (e.g., LOC-A02-04, SKU-88421, FORM-Q7).
4. METADATA VS OPERATIONAL CONTENT:
   - METADATA (DO NOT MAKE INTO STEPS): Administrative headers, document approval tables, version histories, ISO reference codes.
   - OPERATIONAL CONTENT (MUST DRIVE BLUEPRINT): Physical actions, system entries, verbal communications, verifications, decision points, exception handling, escalations.
5. MANDATORY OUTPUT FORMAT: Respond strictly with valid, un-truncated JSON conforming to the requested schema.`;
    const textPrompt = `Uploaded SOP Document: "${filename}" (${pageCount || 1} pages, ${wordCount || 100} words)
${docText ? `Document Text:
"""
${docText}
"""
` : ""}

Extract the complete OPERATIONAL BLUEPRINT as JSON with this exact schema:
{
  "document_identity": {
    "doc_title": "${filename ? filename.replace(/\.(txt|pdf|docx)$/i, "") : "Operational Procedure"}",
    "doc_ref": "Extracted document reference or empty",
    "version": "Extracted version or empty",
    "department": "Extracted department or operations division"
  },
  "role": "Exact worker role described in SOP (e.g., Quick Commerce Picker, Phlebotomy Technician, Retail Cashier)",
  "process": "Exact core operational process (e.g., Order Picking & Cold Chain Packing, Blood Sample Collection)",
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
        "page_or_section": "Page 1 \xB7 Section 2",
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
  "confidence": 0.98
}

Generate between 5 to 9 comprehensive operational_steps covering the entire lifecycle of the SOP.`;
    parts.push({ text: textPrompt });
    let response;
    try {
      response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.25
        }
      });
    } catch (primaryErr) {
      console.warn("[Server LLM Blueprint] Primary model gemini-3.8-flash failed, trying gemini-flash-latest:", primaryErr?.message);
      response = await aiClient.models.generateContent({
        model: "gemini-flash-latest",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.25
        }
      });
    }
    const outputText = response.text || "";
    let cleanJson = outputText.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    if (!cleanJson.startsWith("{") && cleanJson.includes("{")) {
      cleanJson = cleanJson.slice(cleanJson.indexOf("{"));
      const lastBrace = cleanJson.lastIndexOf("}");
      if (lastBrace !== -1) {
        cleanJson = cleanJson.slice(0, lastBrace + 1);
      }
    }
    const parsedData = JSON.parse(cleanJson);
    console.log(`[Server /api/gemini/generate-blueprint SUCCESS] Extracted ${parsedData.operational_steps?.length || 0} high-fidelity steps from '${filename}'`);
    return res.json({
      success: true,
      blueprint: parsedData
    });
  } catch (err) {
    console.error("[Server /api/gemini/generate-blueprint Error]:", err?.message || err);
    if (err instanceof SyntaxError) {
      return res.status(502).json({
        success: false,
        useLocalGenerator: true,
        error: "JSON_PARSE_ERROR",
        message: "The model output was malformed or truncated.",
        details: err.message
      });
    }
    return res.json({
      success: false,
      useLocalGenerator: true,
      error: err?.message || "Server error, falling back to local generator."
    });
  }
});
app.post("/api/coach", async (req, res) => {
  const { prompt, systemInstruction, fileBase64, mimeType = "application/pdf", maxOutputTokens = 4e3, temperature = 0.3 } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt in request body" });
  }
  const aiClient = getGeminiClient();
  if (!aiClient) {
    console.error("[API Error] GEMINI_API_KEY is not defined in deployment environment variables.");
    return res.status(500).json({ error: "Server configuration error: Missing API Key" });
  }
  try {
    const parts = [];
    if (fileBase64 && typeof fileBase64 === "string") {
      const cleanMime = mimeType.includes("image") ? mimeType : mimeType.includes("text") ? "text/plain" : "application/pdf";
      parts.push({
        inlineData: {
          mimeType: cleanMime,
          data: fileBase64
        }
      });
    }
    parts.push({ text: prompt });
    const contentsPayload = parts.length > 1 ? { parts } : prompt;
    let response;
    try {
      response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contentsPayload,
        config: {
          systemInstruction: systemInstruction || "You are an expert assistant. Respond strictly with valid JSON.",
          responseMimeType: "application/json",
          maxOutputTokens,
          temperature
        }
      });
    } catch (primaryErr) {
      console.warn("[Server /api/coach] Primary model failed, trying fallback gemini-flash-latest:", primaryErr?.message);
      response = await aiClient.models.generateContent({
        model: "gemini-flash-latest",
        contents: contentsPayload,
        config: {
          systemInstruction: systemInstruction || "You are an expert assistant. Respond strictly with valid JSON.",
          responseMimeType: "application/json",
          maxOutputTokens,
          temperature
        }
      });
    }
    const rawText = response.text || "";
    const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    if (!cleanedText) {
      return res.status(502).json({ error: "Empty response received from LLM" });
    }
    const parsedData = JSON.parse(cleanedText);
    return res.status(200).json(parsedData);
  } catch (error) {
    console.error("[API Error] LLM generation failed:", error);
    if (error instanceof SyntaxError) {
      return res.status(502).json({
        error: "JSON_PARSE_ERROR",
        message: "The model output was malformed or truncated.",
        details: error.message
      });
    }
    return res.status(500).json({
      error: "LLM_PROVIDER_ERROR",
      message: error.message || "Failed to generate response"
    });
  }
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    error: "API_ENDPOINT_NOT_FOUND",
    message: `API endpoint ${req.method} ${req.path} not found on server`
  });
});
const distPath = path.resolve(process.cwd(), "dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Express server running on http://0.0.0.0:${PORT}`);
});
