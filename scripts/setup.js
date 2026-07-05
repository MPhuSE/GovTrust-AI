const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');

console.log('============================================================');
console.log(' GovTrust AI — Môi trường & Khoá Bảo Mật');
console.log('============================================================\n');

// 1. Tạo .env nếu chưa có
if (!fs.existsSync(envPath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✓ Đã tạo file .env từ .env.example');
} else {
  console.log('✓ File .env đã tồn tại — giữ nguyên');
}

let envContent = fs.readFileSync(envPath, 'utf8');

// 2. Sinh PII_ENCRYPTION_KEY
if (envContent.includes('PII_ENCRYPTION_KEY=AUTO_GENERATE')) {
  const piiKey = crypto.randomBytes(32).toString('base64');
  envContent = envContent.replace('PII_ENCRYPTION_KEY=AUTO_GENERATE', `PII_ENCRYPTION_KEY=${piiKey}`);
  console.log('✓ Đã sinh PII_ENCRYPTION_KEY (Mã hoá PII MongoDB)');
}

// 3. Sinh JWT RSA Keys (RS256)
if (envContent.includes('JWT_ACCESS_PRIVATE_KEY="AUTO_GENERATE"')) {
  console.log('→ Đang sinh JWT RSA keypair (RS256)...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  
  // Dùng .trim() để bỏ khoảng trắng thừa
  envContent = envContent.replace('JWT_ACCESS_PRIVATE_KEY="AUTO_GENERATE"', `JWT_ACCESS_PRIVATE_KEY="${privateKey.trim()}"`);
  envContent = envContent.replace('JWT_ACCESS_PUBLIC_KEY="AUTO_GENERATE"', `JWT_ACCESS_PUBLIC_KEY="${publicKey.trim()}"`);
  console.log('✓ Đã sinh JWT RSA keypair thành công');
}

fs.writeFileSync(envPath, envContent);

// 4. Kiểm tra API Keys thật
const missing = [];
if (!envContent.match(/^QWEN_OCR_API_KEY=.*[a-zA-Z0-9].*/m) || envContent.match(/^QWEN_OCR_API_KEY=$/m)) missing.push('QWEN_OCR_API_KEY');
if (!envContent.match(/^VNPT_EKYC_ACCESS_TOKEN=.*[a-zA-Z0-9].*/m) || envContent.match(/^VNPT_EKYC_ACCESS_TOKEN=$/m)) missing.push('VNPT_EKYC_ACCESS_TOKEN');
if (!envContent.match(/^QDRANT_API_KEY=.*[a-zA-Z0-9].*/m) || envContent.match(/^QDRANT_API_KEY=$/m)) missing.push('QDRANT_API_KEY');

if (missing.length > 0) {
  console.log('\n⚠️  LƯU Ý: Bạn chưa cấu hình các API key thật trong file .env:');
  missing.forEach(k => console.log(`      - ${k}`));
  console.log('\n   Hệ thống đăng nhập vẫn hoạt động, nhưng tính năng OCR & RAG cần API key thật.');
}

console.log('\n✓ Setup script hoàn tất.\n');
