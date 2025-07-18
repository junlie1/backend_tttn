const fs = require('fs');

const raw = fs.readFileSync('../../nhom18-tttn-firebase-adminsdk-5bys1-bc71d7b96c.json', 'utf8');
const json = JSON.parse(raw);

// Dòng này là thứ "ép" JSON thành 1 chuỗi 1 dòng chuẩn sạch đẹp
const oneLine = JSON.stringify(json).replace(/\n/g, '\\n');

console.log(`GOOGLE_CREDENTIALS=${oneLine}`);
