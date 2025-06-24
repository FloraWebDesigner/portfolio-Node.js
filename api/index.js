const ALLOWED_ORIGINS = [
  'https://www.floracode.ca',
  'https://floracode.ca',
  'https://vite-project-v3.vercel.app',
  'http://localhost:5173'
];

export default async (req, res) => {
  // Handle CORS first
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Handle image requests
  if (req.url.startsWith('/img/')) {
    const filename = req.url.match(/\/img\/(.+)/)?.[1];
    if (!filename) return res.status(404).json({ error: "Invalid path" });

    try {
      const renderUrl = `https://portfolio-node-js-1.onrender.com/img/${filename}`;
      const renderRes = await fetch(renderUrl);

      if (!renderRes.ok) {
        return res.status(renderRes.status).end();
      }

      // Forward content headers
      const contentType = renderRes.headers.get('content-type') || 
                         (filename.endsWith('.gif') ? 'image/gif' : 'application/octet-stream');
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      // Stream the response
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

  // Handle API requests
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

  // Default 404 for unmatched routes
  return res.status(404).json({ error: "Not found" });
};