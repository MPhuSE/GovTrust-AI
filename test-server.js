const express = require('express');
const app = express();
app.use((req, res, next) => {
  const path = req.path;
  const PUBLIC_PREFIXES = ['/api/docs'];
  if (PUBLIC_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'))) {
    return res.send('Bypassed');
  }
  return res.status(401).json({ statusCode: 401, message: 'Thiếu token xác thực' });
});
app.listen(8081, () => {
  console.log('Test server on 8081');
});
