const bcrypt = require('bcryptjs');

const password = '123456';
const hash = bcrypt.hashSync(password, 12);

console.log('Mot de passe:', password);
console.log('Hash à utiliser:', hash);