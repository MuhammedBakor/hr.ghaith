
async function uploadAsset(ctx,{file,meta}){
  // NOTE: real storage + scan hook to be wired
  return { ok:true, asset_id:file.id, status:'UPLOADED' };
}
module.exports={ uploadAsset };
