const User = require('./models/User');
const Commande = require('./models/Commande');

console.log('User type:', typeof User);     // ✅ doit afficher 'function'
console.log('Commande type:', typeof Commande); // ✅ doit afficher 'function'
