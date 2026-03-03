const fs = require('fs');
const path = require('path');

function loadCatalog(){
  const p = path.join(__dirname, 'catalog.json');
  return JSON.parse(fs.readFileSync(p,'utf-8'));
}

module.exports = { loadCatalog };
