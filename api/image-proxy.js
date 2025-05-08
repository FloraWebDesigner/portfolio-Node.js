export default async (req, res) => {
  const imagePath = req.url.replace('/img/', '');
  const renderRes = await fetch(`https://portfolio-node-js-1.onrender.com/img/${imagePath}`);

  res.setHeader('Content-Type', renderRes.headers.get('content-type'));
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  renderRes.body.pipe(res);
};