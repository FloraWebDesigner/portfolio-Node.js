const ALLOWED_ORIGINS = [
  'https://www.floracode.ca',
  'https://floracode.ca',
  'https://vite-project-v3.vercel.app',
  'http://localhost:5173'
];

export default async (req, res) => {

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); 
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.url === '/' || req.url === '/api/project/list') {
    try {
      const renderRes = await fetch('https://portfolio-node-js-1.onrender.com/api/project/list');
      const data = await renderRes.json();
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.json(data);
    } catch (err) {
      console.error('Proxy failed:', err);
      return res.status(500).json({ 
        error: "Proxy error",
        details: err.message 
      });
    }
  }

  if (req.url.startsWith('/img/')) {
    const filename = req.url.match(/\/img\/(.+)/)?.[1];
    if (!filename) return res.status(404).json({ error: "Invalid path" });

    try {
      const renderRes = await fetch(`https://portfolio-node-js-1.onrender.com/img/${filename}`);

      if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      const contentType = renderRes.headers.get('content-type') || 'image/svg+xml';
      const contentLength = renderRes.headers.get('content-length');
      
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      
      const arrayBuffer = await renderRes.arrayBuffer();
      return res.end(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('Image proxy failed:', err);
      return res.status(500).json({ 
        error: "Image proxy error",
        details: err.message 
      });
    }
  }

  return res.status(404).json({ error: "Not found" });
};