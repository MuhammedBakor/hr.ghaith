function generateBlocks(input){
  const company = (input.company_name||'شركتنا');
  const serviceList = Array.isArray(input.services)? input.services.slice(0,6): [];
  const heroTitle = input.hero_title || `حلول ${input.industry||''} من ${company}`.trim();
  const heroSubtitle = input.hero_subtitle || 'تجربة عميل قوية + تنفيذ سريع + جودة عالية.';
  const items = serviceList.length ? serviceList.map(s=>({ title:String(s).slice(0,60), desc:'وصف مختصر للخدمة', icon:'✅', href:'/services' })) : [
    {title:'خدمة 1', desc:'وصف مختصر للخدمة', icon:'✅', href:'/services'},
    {title:'خدمة 2', desc:'وصف مختصر للخدمة', icon:'⚡', href:'/services'},
    {title:'خدمة 3', desc:'وصف مختصر للخدمة', icon:'🏗️', href:'/services'}
  ];

  return [
    { code:'hero', props:{ title: heroTitle, subtitle: heroSubtitle, primary_cta:{label:'اطلب عرض سعر', href:'/contact'}, secondary_cta:{label:'شوف أعمالنا', href:'/projects'} } },
    { code:'services_grid', props:{ heading:'خدماتنا', items } },
    { code:'features_zigzag', props:{ heading:'ليش تختارنا؟', features:[
      { title:'حوكمة ووضوح', desc:'إجراءات واضحة وتقارير دورية.' },
      { title:'تنفيذ قوي', desc:'معايير جودة + وقت تسليم مضبوط.' }
    ]}},
    { code:'cta', props:{ title:'جاهز نبدأ؟', subtitle:'تواصل معنا ونرتّب لك حل مناسب.', button:{label:'تواصل الآن', href:'/contact'} } }
  ];
}

module.exports = { generateBlocks };
