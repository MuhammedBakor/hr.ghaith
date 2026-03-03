function createDefaultAdapters() {
  return {
    // RBAC adapter (NOTE) — replace with your kernel RBAC
    rbac: {
      requirePerm: (perm) => (req, res, next) => {
        // In standalone mode we allow everything. Hook here in ghaith.
        return next();
      }
    },
    // Settings adapter (NOTE) — branch/org scoped
    settings: {
      get: async (key, scope) => null,
      getMany: async (keys, scope) => ({})
    },
    // Counters adapter — generates doc_no/case_no in a deterministic way per scope
    counters: {
      next: async ({ key, org_id, branch_id, year, prefix }) => {
        // very simple counter: stored in-memory via closure in adapters
        if (!createDefaultAdapters._counters) createDefaultAdapters._counters = {};
        const k = [key, org_id || "0", branch_id || "0", year || "0"].join(":");
        createDefaultAdapters._counters[k] = (createDefaultAdapters._counters[k] || 0) + 1;
        const seq = String(createDefaultAdapters._counters[k]).padStart(5, "0");
        return `${prefix || "DOC"}-${year || "YYYY"}-${org_id || "ORG"}-${branch_id || "BR"}-${seq}`;
      }
    },
    // Audit adapter (NOTE)
    audit: {
      log: async (event) => {
        // noop in standalone
      }
    }
  };
}

module.exports = { createDefaultAdapters };
