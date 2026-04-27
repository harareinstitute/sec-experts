const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { product, limit = 25, offset = 0, search } = req.query;

  let url = `${SUPABASE_URL}/rest/v1/items?select=*&order=published_at.desc&limit=${limit}&offset=${offset}`;

  if (product && product !== 'all') {
    url += `&product=eq.${encodeURIComponent(product)}`;
  }

  if (search) {
    url += `&or=(title.ilike.*${encodeURIComponent(search)}*,summary.ilike.*${encodeURIComponent(search)}*,product.ilike.*${encodeURIComponent(search)}*)`;
  }

  try {
    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'count=exact'
      }
    });
    const data = await r.json();
    const total = parseInt(r.headers.get('content-range')?.split('/')[1] || '0');
    res.status(200).json({ items: data, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
