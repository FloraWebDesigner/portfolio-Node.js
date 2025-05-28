// export default async (req, res) => {
//   const RENDER_URL = 'https://portfolio-node-js-1.onrender.com';
//   console.log('Incoming request:', req.url);

//   const filename = req.url.match(/\/img\/(.+)/)?.[1];
//   console.log('Extracted filename:', filename);

//   if (!filename) {
//     console.log('Blocked invalid path');
//     return res.status(404).json({ error: "Invalid path" });
//   }

//   try {
//     const renderUrl = `${RENDER_URL}/img/${filename}`;
//     console.log('Fetching from Render:', renderUrl);

//     const renderRes = await fetch(renderUrl);
//     console.log('Render response status:', renderRes.status);

//     if (!renderRes.ok) throw new Error(`Render status: ${renderRes.status}`);

//     // Set appropriate headers
// const contentType = renderRes.headers.get('content-type') || getContentTypeFromExtension(filename);
//     res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

//     // Pipe the response properly
//     const arrayBuffer = await renderRes.arrayBuffer();
//     res.end(Buffer.from(arrayBuffer));

//   } catch (err) {
//     console.error('Proxy failed:', err.message);
//     res.status(500).json({ 
//       error: "Proxy error",
//       details: err.message 
//     });
//   }
// };

export default async (req, res) => {
  const RENDER_URL = 'https://portfolio-node-js-1.onrender.com';
  const filename = req.url.match(/\/img\/(.+)/)?.[1];

  if (!filename) {
    return res.status(404).json({ error: "Invalid path" });
  }

  try {
    const renderUrl = `${RENDER_URL}/img/${filename}`;
    const renderRes = await fetch(renderUrl);

    if (!renderRes.ok) {
      throw new Error(`Render status: ${renderRes.status}`);
    }

    // 获取所有必要的头信息
    const headers = {};
    renderRes.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 确保内容类型正确
    if (!headers['content-type']) {
      headers['content-type'] = getContentTypeFromExtension(filename);
    }

    // 设置响应头
    Object.keys(headers).forEach(key => {
      res.setHeader(key, headers[key]);
    });

    // 添加缓存控制
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // 流式传输响应
    const reader = renderRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();

  } catch (err) {
    console.error('Proxy failed:', err.message);
    res.status(500).json({ 
      error: "Proxy error",
      details: err.message 
    });
  }
};

function getContentTypeFromExtension(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  const mimeTypes = {
    gif: 'image/gif',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
  };
  return mimeTypes[extension] || 'application/octet-stream';
}