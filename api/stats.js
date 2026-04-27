const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

async function count(product) {
  let url = `${SUPABASE_URL}/rest/v1/items?select=id`;
  if (product) url += `&product=eq.${encodeURIComponent(product)}`;
  const r = await fetch(url + '&limit=1', {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'count=exact'
    }
  });
  return parseInt(r.headers.get('content-range')?.split('/')[1] || '0');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const [total, kev, breach, cve] = await Promise.all([
      count(''),
      count('CISA KEV'),
      count('Data Breach'),
      count('CVE')
    ]);
    res.status(200).json({ total, kev, breach, cve });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
