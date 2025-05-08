import fetch from 'node-fetch';

export default async (req, res) => {
  const RENDER_URL = 'https://portfolio-node-js-1.onrender.com';
  const apiRes = await fetch(`${RENDER_URL}/api/project/list`);

  res.setHeader('Content-Type', 'application/json');
  apiRes.body.pipe(res);
};