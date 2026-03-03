const { safeText } = require('../../../kernel/sanitize.NOTE');

const ALLOWED = new Set(['hero','services','portfolio','blog','cta','offers','store_featured','stats','gallery','achievements']);
const SHAPES = {
  hero:['title','subtitle','bg_asset_id','cta_text','cta_href'],
  services:['items','title'],
  portfolio:['source','limit','title'],
  blog:['limit','title'],
  cta:['text','whatsapp','phone','href'],
  offers:['items','title'],
  store_featured:['source','limit','title'],
  stats:['items','title'],
  gallery:['source','limit','title'],
  achievements:['mode','limit','title']
};

function validateBlock(b){
  if(!b || typeof b!=='object') throw new Error('INVALID_BLOCK');
  for(const k of Object.keys(b)){ if(!['type','enabled','data','id'].includes(k)) throw new Error('UNKNOWN_BLOCK_KEY'); }
  const type = safeText(b.type,40);
  if(!ALLOWED.has(type)) throw new Error('INVALID_BLOCK_TYPE');
  const enabled = b.enabled===undefined ? true : !!b.enabled;
  const data = (b.data && typeof b.data==='object') ? b.data : {};
  const allow = SHAPES[type] || [];
  if(allow.length){
    for(const k of Object.keys(data)){ if(!allow.includes(k)) throw new Error('UNKNOWN_BLOCK_DATA_KEY'); }
  }
  return { type, enabled, id: b.id||null, data };
}

function validateHomepage(home){
  if(!home || typeof home!=='object') throw new Error('INVALID_HOMEPAGE');
  for(const k of Object.keys(home)){ if(k!=='blocks') throw new Error('UNKNOWN_HOMEPAGE_KEY'); }
  const blocks = Array.isArray(home.blocks) ? home.blocks : [];
  if(blocks.length>80) throw new Error('TOO_MANY_BLOCKS');
  return { blocks: blocks.map(validateBlock) };
}

module.exports = { validateHomepage };
