const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'No question provided' });

  try {
    // Fetch recent items for context
    const feedUrl = `${SUPABASE_URL}/rest/v1/items?select=product,title,summary,link,published_at&order=published_at.desc&limit=80`;
    const feedResp = await fetch(feedUrl, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const items = await feedResp.json();

    const context = items.map(i =>
      `[${i.product}] ${i.title}${i.summary ? ' — ' + i.summary.slice(0, 120) : ''} (${i.published_at?.slice(0, 10)})`
    ).join('\n');

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `You are a cybersecurity intelligence analyst. Answer the user's question based ONLY on the intelligence data below. Be concise and specific. Include relevant product names and dates.\n\nINTELLIGENCE DATA:\n${context}\n\nUSER QUESTION: ${question}`
        }]
      })
    });

    const data = await aiResp.json();
    res.status(200).json({ answer: data.content?.[0]?.text || 'No response.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
