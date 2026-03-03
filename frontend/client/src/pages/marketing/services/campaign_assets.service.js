const { generateBlocks } = require('../../public_site/blocks/services/ai_blocks.service');

function genAdCopy(input){
  const name = input.company_name || 'شركتنا';
  const offer = input.offer || 'عرض خاص';
  const phone = input.phone || '';
  const wa = input.whatsapp || '';
  return {
    headline: `${offer} من ${name}`,
    primary: `استفد الآن — تواصل معنا${phone?` على ${phone}`:''}${wa?` أو واتساب ${wa}`:''}.`,
    short: `${offer} — اطلب الآن.`,
    keywords: [input.industry||'خدمات','سعر','عرض','جودة'].filter(Boolean)
  };
}

async function createAsset(ctx, { campaign_id, asset_type, title, content_json, content_md }){
  await ctx.db.run(
    `INSERT INTO marketing_campaign_assets (org_id, campaign_id, asset_type, title, content_json, content_md, created_by)
     VALUES (?,?,?,?,?,?,?)`,
    [ctx.org_id, campaign_id, asset_type, title||null,
     content_json ? JSON.stringify(content_json) : null,
     content_md || null,
     ctx.actor_id||null
    ]
  );
  return { ok:true };
}

async function generateCampaignAssets(ctx, campaign_id, input){
  // ad copy
  const ad = genAdCopy(input||{});
  await createAsset(ctx,{ campaign_id, asset_type:'ad_copy', title: ad.headline, content_json: ad });

  // landing blocks
  const blocks = generateBlocks({
    company_name: input.company_name,
    industry: input.industry,
    services: input.services || []
  }).map(b=>{
    // default visibility (public)
    return Object.assign({}, b, { visibility:{ audiences:['anonymous','staff','admin'] }});
  });
  await createAsset(ctx,{ campaign_id, asset_type:'landing_blocks', title:'Landing Blocks', content_json:{ blocks } });

  // image prompt (for later integration with image gen)
  const prompt = `صمّم صورة إعلانية حديثة لـ ${input.company_name||'الشركة'} في مجال ${input.industry||'الخدمات'}، تتضمن عنوان: "${ad.headline}".`;
  await createAsset(ctx,{ campaign_id, asset_type:'image_prompt', title:'Image Prompt', content_md: prompt });

  return { ok:true, ad_copy: ad, landing_blocks: blocks, image_prompt: prompt };
}

module.exports = { generateCampaignAssets };
