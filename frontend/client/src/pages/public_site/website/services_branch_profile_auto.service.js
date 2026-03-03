function buildProfile({ branch_name, about, phone, whatsapp, address, achievements=[] }){
  return {
    branch_name: branch_name || '',
    about: about || '',
    contacts: { phone: phone||'', whatsapp: whatsapp||'' },
    address: address||'',
    achievements: achievements.map(a=>({
      title: a.title||'',
      year: a.year||'',
      description: a.description||'',
      images: a.images||[]
    }))
  };
}

function blocksForProfile(profile){
  const blocks = [];
  blocks.push({ code:'hero', props:{ title: profile.branch_name || 'الفرع', subtitle: profile.about || '' }, visibility:{ audiences:['anonymous','staff','admin'] }});
  if(profile.achievements && profile.achievements.length){
    blocks.push({ code:'section', props:{ title:'إنجازاتنا', items: profile.achievements.map(a=>({ title:a.title, desc: a.description, meta: a.year })) }, visibility:{ audiences:['anonymous','staff','admin'] }});
  }
  if(profile.contacts && (profile.contacts.phone || profile.contacts.whatsapp)){
    blocks.push({ code:'cta', props:{ title:'تواصل معنا', phone: profile.contacts.phone, whatsapp: profile.contacts.whatsapp }, visibility:{ audiences:['anonymous','staff','admin'] }});
  }
  return blocks;
}

module.exports = { buildProfile, blocksForProfile };
