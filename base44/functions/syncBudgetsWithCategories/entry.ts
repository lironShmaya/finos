import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all categories
    const categories = await base44.entities.Category.list();
    const budgets = await base44.entities.Budget.list();

    // Delete budgets with no matching category
    const categoriesToDelete = budgets.filter(b => {
      if (!b.category_id) return false;
      return !categories.some(c => c.id === b.category_id);
    });

    for (const budget of categoriesToDelete) {
      await base44.entities.Budget.delete(budget.id);
    }

    // Create budgets for categories that don't have one
    const budgetsWithCategories = budgets.filter(b => b.category_id);
    const categoryIdsWithBudgets = new Set(budgetsWithCategories.map(b => b.category_id));

    const categoriesToCreate = categories.filter(c => !categoryIdsWithBudgets.has(c.id));

    for (const category of categoriesToCreate) {
      await base44.entities.Budget.create({
        item_name: category.name,
        category_id: category.id,
        category_name: category.name,
        section: category.section || 'expenses',
        amount: 0,
        period: 'monthly'
      });
    }

    return Response.json({ 
      deleted: categoriesToDelete.length,
      created: categoriesToCreate.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});