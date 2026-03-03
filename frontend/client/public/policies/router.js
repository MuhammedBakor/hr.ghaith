import express from 'express';
import db from '../../models/database.js';
import { requireScope } from '../../middleware/requireScope.js';
import { requireFeature } from '../../middleware/requireFeature.js';
import { authMiddleware, requirePermission, auditLog } from '../../middleware/index.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { success, error, ErrorCodes } from '../../utils/response.js';
import { beginTxnFromRequest } from '../../kernel/ledger.js';
import { initRulesTables } from './models.js';
import { evaluatePolicyPack } from './policyPackEngine.js';
import { listRuleSets, createRuleSet, createRuleVersion, disableRuleSet, runRuleTest, listPolicyPackTemplates, upsertPolicyPackTemplate, applyPolicyPackTemplate } from './service.js';
import fs from 'fs';
import path from 'path';

initRulesTables();

// Seed global policy pack templates (idempotent)
try {
  const baseDir = path.dirname(new URL(import.meta.url).pathname);
  const p = path.join(baseDir, 'data', 'hr_discipline_sa_2024_v1.json');
  const raw = fs.readFileSync(p, 'utf8');
  const jsonPack = JSON.parse(raw);
  upsertPolicyPackTemplate({
    actorId: 'system',
    key: 'hr.discipline.sa.2024',
    name: 'لائحة الانضباط الوظيفي العام (مكتبة) – السعودية',
    version: '1.0.0',
    jsonPack
  });
} catch (e) {
  // ignore seed errors (e.g., read-only FS in some envs)
}

const router = express.Router();

router.use(authMiddleware);
router.use(requireFeature('feature.rules.enabled'));
router.use(requireScope());

// Contracts
const RuleSetCreateBody = {
  type: 'object',
  required: ['key', 'name', 'rule', 'reason'],
  shape: {
    key: { type:'string' },
    name:{ type:'string' },
    rule:{ type:'object' },
    note:{ type:'string' },
    reason:{ type:'string' }
  }
};

const RuleVersionCreateBody = {
  type: 'object',
  required: ['rule', 'reason'],
  shape: {
    rule:{ type:'object' },
    note:{ type:'string' },
    reason:{ type:'string' }
  }
};

const RuleTestBody = {
  type:'object',
  required:['input','reason'],
  shape:{
    input:{ type:'object' },
    versionId:{ type:'string' },
    reason:{ type:'string' }
  }
};
// ---- Policy Pack Contracts
const PolicyPackCreateBody = {
  type:'object',
  required:['key','name','pack'],
  additional:false,
  shape:{
    key:{type:'string', minLength:1, maxLength:120},
    name:{type:'string', minLength:1, maxLength:200},
    note:{type:'string', maxLength:4000},
    pack:{type:'object', required:['meta','rules'], additional:true, shape:{}}
  }
};

const PolicyPackApplyTemplateBody = {
  type:'object',
  required:['template_key','template_version'],
  additional:false,
  shape:{
    template_key:{type:'string', minLength:1, maxLength:200},
    template_version:{type:'string', minLength:1, maxLength:40},
    key:{type:'string', minLength:1, maxLength:120},
    name:{type:'string', minLength:1, maxLength:200},
    note:{type:'string', maxLength:4000}
  }
};

const PolicyPackEvaluateBody = {
  type:'object',
  required:['input'],
  additional:false,
  shape:{
    input:{type:'object', additional:true, shape:{}}
  }
};


const IdParam = { type:'object', required:['id'], shape:{ id:{ type:'string' } } };

router.get('/sets',
  requirePermission('rules:read'),
  (req,res) => {
    try {
      const rows = listRuleSets({ orgId: req.context.orgId, branchId: req.context.branchId || null });
      return success(res, { items: rows });
    } catch (e) {
      return error(res, ErrorCodes.INTERNAL_ERROR, 'Failed to list rule sets', { message: e.message }, 500);
    }
  }
);

router.post('/sets',
  requirePermission('rules:set:create'),
  validateBody(RuleSetCreateBody),
  auditLog('rules.set.create','rule_set'),
  (req,res) => {
    try {
      const ctx = req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:set:create', txn_type:'USER', reason: { text: req.body.reason } });
      ctx.txnId = txn.txn_id;

      const r = createRuleSet({
        orgId: ctx.orgId,
        branchId: ctx.branchId || null,
        actorId: req.user.id,
        key: req.body.key,
        name: req.body.name,
        initialRule: req.body.rule,
        note: req.body.note
      });

      return success(res, { entityId: r.id, id: r.id, active_version_id: r.active_version_id || null, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create rule set', { message: e.message }, 500);
    }
  }
);

router.post('/sets/:id/versions',
  requirePermission('rules:version:create'),
  validateParams(IdParam),
  validateBody(RuleVersionCreateBody),
  auditLog('rules.version.create','rule_version'),
  (req,res) => {
    try {
      const ctx = req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:version:create', txn_type:'USER', reason: { text: req.body.reason } });
      ctx.txnId = txn.txn_id;

      const r = createRuleVersion({
        orgId: ctx.orgId,
        actorId: req.user.id,
        ruleSetId: req.params.id,
        jsonRule: req.body.rule,
        note: req.body.note
      });

      if (!r.ok) return error(res, ErrorCodes.BAD_REQUEST, r.error, {}, 400);
      return success(res, { entityId: r.id, id: r.id, version: r.version, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.INTERNAL_ERROR, 'Failed to create rule version', { message: e.message }, 500);
    }
  }
);

router.post('/sets/:id/disable',
  requirePermission('rules:set:disable'),
  validateParams(IdParam),
  validateBody({ type:'object', required:['reason'], shape:{ reason:{type:'string'} } }),
  auditLog('rules.set.disable','rule_set'),
  (req,res) => {
    try {
      const ctx = req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:set:disable', txn_type:'USER', reason: { text: req.body.reason } });
      ctx.txnId = txn.txn_id;

      const r = disableRuleSet({ orgId: ctx.orgId, actorId: req.user.id, ruleSetId: req.params.id });
      if (!r.ok) return error(res, ErrorCodes.BAD_REQUEST, r.error, {}, 400);
      return success(res, { entityId: req.params.id, id: req.params.id, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.INTERNAL_ERROR, 'Failed to disable rule set', { message: e.message }, 500);
    }
  }
);

router.post('/sets/:id/test',
  requirePermission('rules:test:run'),
  validateParams(IdParam),
  validateBody(RuleTestBody),
  auditLog('rules.test.run','rule_test'),
  (req,res) => {
    try {
      const ctx = req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:test:run', txn_type:'USER', reason: { text: req.body.reason } });
      ctx.txnId = txn.txn_id;

      const r = runRuleTest({
        orgId: ctx.orgId,
        branchId: ctx.branchId || null,
        actorId: req.user.id,
        ruleSetId: req.params.id,
        input: req.body.input,
        versionId: req.body.versionId
      });

      if (!r.ok) return error(res, ErrorCodes.BAD_REQUEST, r.error, {}, 400);
      return success(res, { entityId: r.test_id, test_id: r.test_id, version: r.version, result: r.result, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.INTERNAL_ERROR, 'Failed to run rule test', { message: e.message }, 500);
    }
  }
);


// ---------------- Policy Packs (Specialized Rule Sets) ----------------

// GET /policy-packs/templates
router.get('/policy-packs/templates',
  requirePermission('rules:policy_pack:template:read'),
  (req,res)=>{
    const items = listPolicyPackTemplates();
    return success(res,{ items });
  }
);

// POST /policy-packs/templates/apply
router.post('/policy-packs/templates/apply',
  requirePermission('rules:policy_pack:create'),
  validateBody(PolicyPackApplyTemplateBody),
  auditLog('rules.policy_pack.apply_template','policy_pack'),
  (req,res)=>{
    try {
      const ctx = req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:policy_pack:apply_template', txn_type:'USER', reason:{ text: req.body.note || 'apply policy pack template' } });
      ctx.txnId = txn.txn_id;

      const r = applyPolicyPackTemplate({
        orgId: ctx.orgId,
        branchId: ctx.branchId || null,
        actorId: req.user.id,
        templateKey: req.body.template_key,
        templateVersion: req.body.template_version,
        newKey: req.body.key,
        newName: req.body.name,
        note: req.body.note
      });
      if (!r.ok) return error(res, ErrorCodes.BAD_REQUEST, { message: r.error }, 400);
      return success(res, { ok:true, ...r, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.SERVER_ERROR, { message: e.message }, 500);
    }
  }
);

// GET /policy-packs (list)
router.get('/policy-packs',
  requirePermission('rules:policy_pack:read'),
  (req,res)=>{
    const ctx=req.context;
    const items = listRuleSets({ orgId: ctx.orgId, branchId: ctx.branchId || null, type: 'policy_pack' });
    return success(res,{ items });
  }
);

// POST /policy-packs (create custom)
router.post('/policy-packs',
  requirePermission('rules:policy_pack:create'),
  validateBody(PolicyPackCreateBody),
  auditLog('rules.policy_pack.create','policy_pack'),
  (req,res)=>{
    try {
      const ctx=req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:policy_pack:create', txn_type:'USER', reason:{ text: req.body.note || 'create policy pack' } });
      ctx.txnId = txn.txn_id;

      const r = createRuleSet({
        orgId: ctx.orgId,
        branchId: ctx.branchId || null,
        actorId: req.user.id,
        type: 'policy_pack',
        key: req.body.key,
        name: req.body.name,
        initialRule: req.body.pack,
        note: req.body.note || 'initial'
      });
      return success(res,{ ok:true, ...r, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.SERVER_ERROR, { message: e.message }, 500);
    }
  }
);

// POST /policy-packs/:id/versions (new version)
router.post('/policy-packs/:id/versions',
  requirePermission('rules:policy_pack:write'),
  validateParams(IdParam),
  validateBody(PolicyPackCreateBody),
  auditLog('rules.policy_pack.version.create','policy_pack'),
  (req,res)=>{
    try {
      const ctx=req.context;
      const txn = beginTxnFromRequest(req, { action:'rules:policy_pack:version', txn_type:'USER', reason:{ text: req.body.note || 'new policy pack version' } });
      ctx.txnId = txn.txn_id;

      const r = createRuleVersion({
        orgId: ctx.orgId,
        actorId: req.user.id,
        ruleSetId: req.params.id,
        jsonRule: req.body.pack,
        note: req.body.note || 'update'
      });
      if (!r.ok) return error(res, ErrorCodes.BAD_REQUEST, { message: r.error }, 400);
      return success(res,{ ok:true, ...r, txn_id: ctx.txnId });
    } catch (e) {
      return error(res, ErrorCodes.SERVER_ERROR, { message: e.message }, 500);
    }
  }
);

// POST /policy-packs/:id/evaluate
router.post('/policy-packs/:id/evaluate',
  requirePermission('rules:policy_pack:evaluate'),
  validateParams(IdParam),
  validateBody(PolicyPackEvaluateBody),
  auditLog('rules.policy_pack.evaluate','policy_pack'),
  (req,res)=>{
    try {
      const ctx=req.context;
      const set = db.prepare(`SELECT * FROM rule_sets WHERE id=? AND org_id=? AND type='policy_pack'`).get(String(req.params.id), String(ctx.orgId));
      if (!set) return error(res, ErrorCodes.NOT_FOUND, { message:'POLICY_PACK_NOT_FOUND' }, 404);

      const verId = set.active_version_id;
      const ver = db.prepare(`SELECT * FROM rule_versions WHERE id=? AND rule_set_id=?`).get(String(verId), String(set.id));
      if (!ver) return error(res, ErrorCodes.NOT_FOUND, { message:'POLICY_PACK_VERSION_NOT_FOUND' }, 404);

      let pack = {};
      try { pack = JSON.parse(ver.json_rule); } catch { pack = {}; }
      const out = evaluatePolicyPack(pack, req.body.input || {});
      return success(res,{ ok:true, matched: out.matched, count: out.count });
    } catch (e) {
      return error(res, ErrorCodes.SERVER_ERROR, { message: e.message }, 500);
    }
  }
);


export default router;
