// Adapter: Editor.js <-> Ghaith content_json.blocks
// Frontend will send Editor.js output; backend normalizes to blocks schema.
// This file documents mapping; it doesn't bundle Editor.js itself.

function editorJsToBlocks(editorJs){
  const out = [];
  const blocks = (editorJs && editorJs.blocks) || [];
  for(const b of blocks){
    if(b.type === 'header'){
      out.push({ code:'heading', props:{ text: b.data?.text || '', level: b.data?.level || 2 }, visibility:{ audiences:['anonymous','staff','admin'] }});
    } else if(b.type === 'paragraph'){
      out.push({ code:'richtext', props:{ html: b.data?.text || '' }, visibility:{ audiences:['anonymous','staff','admin'] }});
    } else if(b.type === 'image'){
      out.push({ code:'image', props:{ url: b.data?.file?.url || '', caption: b.data?.caption || '' }, visibility:{ audiences:['anonymous','staff','admin'] }});
    } else if(b.type === 'list'){
      out.push({ code:'list', props:{ style: b.data?.style || 'unordered', items: b.data?.items || [] }, visibility:{ audiences:['anonymous','staff','admin'] }});
    } else {
      out.push({ code:'raw', props:{ type: b.type, data: b.data||{} }, visibility:{ audiences:['anonymous','staff','admin'] }});
    }
  }
  return out;
}

module.exports = { editorJsToBlocks };
