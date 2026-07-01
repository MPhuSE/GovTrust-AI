const { join } = require('path');

/** Đường dẫn tuyệt đối tới file .proto dùng chung cho cả core-svc và ai-svc. */
module.exports = {
  AI_SERVICE_PROTO: join(__dirname, 'ai_service.proto'),
  AI_PACKAGE: 'govtrust.ai',
};
