const fs = require('fs');
const path = require('path');

const dirs = [
  'src/couple/dto',
  'src/media/dto',
  'src/posts/dto',
  'src/time-capsule/dto',
];

dirs.forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

console.log('✅ Đã khởi tạo cấu trúc thư mục Giai đoạn 2 thành công!');