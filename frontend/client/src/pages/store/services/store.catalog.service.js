// Store Catalog Service (scaffold)
module.exports = {
  async listProducts(ctx, { org_id, branch_id }) {
    // NOTE: integrate with DB layer used in your repo
    return { items: [], org_id, branch_id: branch_id || null };
  },
};
