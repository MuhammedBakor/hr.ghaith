function buildPack({ brand, campaign, language='ar' }){
  const name = campaign?.name || 'حملة';
  const city = campaign?.city || '';
  const offer = campaign?.offer || '';
  const tone = brand?.tone || 'professional';

  const blog = {
    title: `${name} ${city}`.trim(),
    slug: (campaign?.slug || 'campaign').toString(),
    body_md:
`# ${name}
${offer ? ('**العرض:** ' + offer) : ''}

## ليش تختارنا؟
- جودة تنفيذ
- التزام بالوقت
- متابعة بعد التسليم

## تواصل
- واتساب: {{whatsapp}}
- بريد: {{email}}
`
  };

  const socials = [
    { channel:'instagram', text:`${name} ${city} ✨ ${offer}`.trim(), hashtags:['#مكة','#جدة','#خدمات'] },
    { channel:'x', text:`${name} ${offer} — احجز الآن`.trim(), hashtags:['#عروض','#خدمات'] },
    { channel:'snap', text:`${name} 📍 ${city} — ${offer}`.trim(), hashtags:[] },
    { channel:'linkedin', text:`إعلان: ${name} — ${offer}`.trim(), hashtags:['#Business'] },
    { channel:'tiktok', text:`${name} — لقطة قبل/بعد 🔥`, hashtags:['#قبل_بعد'] },
  ];

  const whatsapp = [
    { kind:'broadcast', text:`السلام عليكم 👋
${name}
${offer}
للتفاصيل/الحجز: {{whatsapp_link}}` },
    { kind:'reply', text:`حياك الله ✅
هذا عرضنا: ${offer}
تحب نرسل لك التفاصيل كاملة؟` },
    { kind:'followup', text:`نذكّرك بعرض ${name} 🌟
متى يناسبك نرتب الموعد؟` },
  ];

  return { blog, socials, whatsapp, meta:{ tone, language } };
}

module.exports = { buildPack };
