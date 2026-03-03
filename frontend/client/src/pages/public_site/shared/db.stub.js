async function selectOne(_ctx, _sql, _args){ return null; }
async function selectMany(_ctx, _sql, _args){ return []; }
async function run(_ctx, _sql, _args){ return { ok:true }; }
module.exports = { selectOne, selectMany, run };
