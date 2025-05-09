import { writeFileSync } from 'fs';
import fetch from 'node-fetch';

(async () => {
  try {
    const res = await fetch('https://portfolio-node-js-1.onrender.com/api/project/list');
    const data = await res.text();
    writeFileSync('./public/projects.json', data); 
    console.log('✅ success projects.json');
  } catch (err) {
    console.error('failed to generate:', err);
    process.exit(1); 
  }
})();