require('dotenv/config');
const { getDb } = require('./dist/src/backend/db.js'); // can't run typescript directly easily, let's just write a ts script and run with tsx
