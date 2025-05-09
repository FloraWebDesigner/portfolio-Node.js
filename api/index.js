const ALLOWED_ORIGINS = [
  'https://vite-project-v3.vercel.app',
  'http://localhost:5173'
];

export default async (req, res) => {
  // 统一设置CORS头（必须放在最前面！）
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin'); // 防止CDN缓存污染
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // API路由
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

  // 图片路由（关键修改部分）
  if (req.url.startsWith('/img/')) {
    const filename = req.url.match(/\/img\/(.+)/)?.[1];
    if (!filename) return res.status(404).json({ error: "Invalid path" });

    try {
      const renderRes = await fetch(`https://portfolio-node-js-1.onrender.com/img/${filename}`);
      
      // 强制覆盖CORS头（图片请求特殊处理）
      if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      // 复制Content-Type和Content-Length
      const contentType = renderRes.headers.get('content-type') || 'image/svg+xml';
      const contentLength = renderRes.headers.get('content-length');
      
      res.setHeader('Content-Type', contentType);
      if (contentLength) res.setHeader('Content-Length', contentLength);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      
      // 流式传输二进制数据
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