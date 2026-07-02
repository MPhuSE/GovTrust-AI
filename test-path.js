const path = '/api/docs';
const PUBLIC_PREFIXES = [
  '/health',
  '/auth/login',
  '/auth/register',
  '/procedures',
  '/document-types',
  '/api/docs',
  '/api/docs-json',
];
console.log(PUBLIC_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?')));
