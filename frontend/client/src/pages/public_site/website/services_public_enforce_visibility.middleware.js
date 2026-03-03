
const { enforce } = require('./visibility.service');

// Usage:
// app.get('/public/pages/:slug', async (req,res,next)=>{ ... entity_id ...; const ok=await enforcePublic(req, 'page', id); if(!ok) return res.status(404).end(); next(); })

async function enforcePublic(req, entity_type, entity_id){
  // For public endpoints we treat actor as anonymous unless internal session exists
  req.ctx = req.ctx || {};
  req.ctx.actor_id = req.ctx.actor_id || null;
  const r = await enforce(req.ctx, entity_type, entity_id);
  return r.ok && r.allowed;
}

module.exports = { enforcePublic };
