import { GoogleGenAI } from '@google/genai';

function getApiKey(req?: any): string | undefined {
  const headerKey = req ? (
    (typeof req.headers?.['x-gemini-api-key'] === 'string' ? req.headers['x-gemini-api-key'] : '') ||
    (typeof req.headers?.['authorization'] === 'string' ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : '')
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

  return rawKey.replace(/^["']|["']$/g, '').trim() || undefined;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const apiKey = getApiKey(req);
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'Gemini API key is not configured in server environment or request headers.' });
  }

  const { prompt, aspectRatio = '16:9', resolution = '720p' } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, error: 'A prompt is required for video generation.' });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const safePrompt = prompt.trim().slice(0, 2000);

    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: safePrompt,
      config: {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    });

    console.log('[Serverless Veo] Video generation started:', operation.name);
    return res.status(200).json({ success: true, operationName: operation.name });
  } catch (error: any) {
    console.error('[Serverless Veo Generate Error]', error);
    const msg = error?.message || (typeof error === 'string' ? error : 'Failed to start video generation.');
    return res.status(500).json({ success: false, error: msg });
  }
}
