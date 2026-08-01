const db = require("better-sqlite3")("database.sqlite");
const allContacts = db.prepare('SELECT * FROM contacts WHERE whitelisted = 1').all();
console.log(allContacts);
