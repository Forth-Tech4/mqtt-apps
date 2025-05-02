const jwt = require('jsonwebtoken');
const fs = require('fs');

const privateKey = fs.readFileSync('./Cert/private.key');

const token = jwt.sign(
  { username: 'kanji' },
  privateKey,
  { algorithm: 'RS256', expiresIn: '1h' }
);

console.log(token);
