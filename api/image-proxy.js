export default async (req, res) => {
  const RENDER_URL = 'https://portfolio-node-js-1.onrender.com';
  console.log('Incoming request:', req.url);

  const filename = req.url.match(/\/img\/(.+)/)?.[1];
  console.log('Extracted filename:', filename);

  if (!filename) {
    console.log('Blocked invalid path');
    return res.status(404).json({ error: "Invalid path" });
  }

  try {
    const renderUrl = `${RENDER_URL}/img/${filename}`;
    console.log('Fetching from Render:', renderUrl);

    const renderRes = await fetch(renderUrl);
    console.log('Render response status:', renderRes.status);

    if (!renderRes.ok) throw new Error(`Render status: ${renderRes.status}`);

    // Set appropriate headers
    res.setHeader('Content-Type', renderRes.headers.get('content-type') || 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    // Pipe the response properly
    const arrayBuffer = await renderRes.arrayBuffer();
    res.end(Buffer.from(arrayBuffer));

  } catch (err) {
    console.error('Proxy failed:', err.message);
    res.status(500).json({ 
      error: "Proxy error",
      details: err.message 
    });
  }
};