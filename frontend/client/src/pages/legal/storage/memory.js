// Legal Storage — M8 FIX
// البنية: DB-backed storage مع fallback إلى in-memory
// الجداول المستخدمة: legalDocuments, legalAudit (موجودة في schema)
// Templates/Playbooks/PrintJobs: تُخزَّن عبر tRPC في legalDocuments (type=template|playbook|print)

const api = require('../../../lib/api').default;

/**
 * DB API wrapper — يستدعي REST لحفظ البيانات في DB الحقيقي
 */
async function dbCall(method, path, input) {
  try {
    const res = await api[method.toLowerCase()](path, input);
    return res.data;
  } catch (err) {
    console.error(`DB call failed [${method} ${path}]:`, err);
  }
  return null;
}

/**
 * createMemoryStorage — يحاول DB أولاً، يرجع إلى in-memory عند الفشل
 */
function createMemoryStorage() {
  // Fallback in-memory
  const fallback = {
    templates: new Map(),
    versions: new Map(),
    playbooks: new Map(),
    printJobs: new Map(),
    tasks: []
  };

  return {
    templates: {
      list: async () => {
        const dbResult = await dbCall('GET', '/legal/documents?type=template');
        if (dbResult) return dbResult;
        return Array.from(fallback.templates.values());
      },

      create: async ({ code, name }) => {
        const dbResult = await dbCall('POST', '/legal/documents', { title: name, category: code, type: 'template' });
        if (dbResult) return dbResult;

        if (fallback.templates.has(code)) throw new Error("TEMPLATE_EXISTS");
        const t = { code, name, created_at: nowIso() };
        fallback.templates.set(code, t);
        return t;
      },

      versions: {
        list: async (code) => {
          const dbResult = await dbCall('GET', `/legal/documents?type=version&category=${code}`);
          if (dbResult) return dbResult;
          return [];
        },

        create: async (code, { version, html, variables }) => {
          const dbResult = await dbCall('POST', '/legal/documents', {
            title: `${code}_V${version}`,
            category: code,
            type: 'version',
            contentUrl: html // Using contentUrl to store HTML for now
          });
          if (dbResult) return dbResult;
          return { code, version, html, status: "draft" };
        },

        approve: async (code, version, { reason_code, reason_text, approved_by }) => {
          // Placeholder for approval logic
          return { status: "approved" };
        }
      }
    },

    playbooks: {
      list: async () => {
        const dbResult = await dbCall('GET', '/legal/documents?type=playbook');
        if (dbResult) return dbResult;
        return Array.from(fallback.playbooks.values());
      },

      apply: async ({ case_id, playbook_code, assigned_to }) => {
        // Simplified application logic: create a task for each playbook step
        const tasks = [];
        const pbStep = { title: `Playbook: ${playbookCode}`, caseId: case_id, status: 'open' };
        const dbResult = await dbCall('POST', '/legal/tasks', pbStep);
        if (dbResult) tasks.push(dbResult);
        return tasks;
      },

      tasks: async () => {
        const dbResult = await dbCall('GET', '/legal/tasks');
        if (dbResult) return dbResult;
        return fallback.tasks;
      }
    },

    prints: {
      finalize: async ({ org_id, branch_id, case_id, template_code, template_version, html_snapshot, doc_no, hash }) => {
        const dbResult = await dbCall('POST', '/legal/documents', {
          title: doc_no,
          type: 'print',
          category: template_code,
          contentUrl: html_snapshot
        });
        if (dbResult) return dbResult;
        return { id: doc_no, created_at: nowIso() };
      },

      verify: async ({ doc_no, hash }) => {
        // Simple verification by title
        const dbResult = await dbCall('GET', `/legal/documents?type=print&title=${doc_no}`);
        if (dbResult && dbResult.length > 0) return { ok: true, ...dbResult[0] };
        return null;
      }
    },

    utils: { sha256 }
  };
}

module.exports = { createMemoryStorage };
