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

export default async function handler(_req: any, res: any) {
  const key = getApiKey();
  res.status(200).json({
    status: 'ok',
    hasGeminiKey: Boolean(key && key.length > 5),
    keyPrefix: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    environment: 'vercel-serverless',
    time: new Date().toISOString(),
  });
}
