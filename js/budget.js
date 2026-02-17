// ============================================
// GENTLEFINANCES - Budget Module
// Budget management and visualization
// ============================================

/**
 * Budget Controller
 */
const Budget = {
    // Current month view
    currentMonth: new Date(),

    // Category groups
    groups: [
        { id: 'fixed', name: 'Gastos Fijos', icon: '🏠' },
        { id: 'variable', name: 'Gastos Variables', icon: '🛒' },
        { id: 'leisure', name: 'Ocio', icon: '🎉' },
        { id: 'savings', name: 'Ahorro', icon: '💰' }
    ],

    /**
     * Initialize budget module
     */
    init() {
        this.loadBudget();
        this.bindEvents();

        console.log('📊 Budget module initialized');
    },

    /**
     * Load budget data for current month
     */
    loadBudget() {
        const budgets = GentleFinances.state.budgets || [];
        this.render(budgets);
    },

    /**
     * Render budget view
     * @param {Array} budgets 
     */
    render(budgets) {
        // This would render the full budget view
        console.log('Rendering budget:', budgets);
    },

    /**
     * Calculate available to budget
     * @returns {number}
     */
    getAvailableToBudget() {
        const accounts = GentleFinances.state.accounts || [];
        const budgets = GentleFinances.state.budgets || [];

        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
        const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);

        return totalBalance - totalBudgeted;
    },

    /**
     * Create or update a budget category
     * @param {Object} data 
     */
    setCategory(data) {
        const budgets = GentleFinances.state.budgets || [];
        const index = budgets.findIndex(b => b.category === data.category);

        if (index !== -1) {
            budgets[index] = { ...budgets[index], ...data };
        } else {
            budgets.push({
                id: Utils.generateId(),
                spent: 0,
                ...data
            });
        }

        GentleFinances.state.budgets = budgets;
        GentleFinances.saveData();
    },

    /**
     * Move money between categories
     * @param {string} fromCategory 
     * @param {string} toCategory 
     * @param {number} amount 
     */
    moveMoney(fromCategory, toCategory, amount) {
        const budgets = GentleFinances.state.budgets;
        const from = budgets.find(b => b.category === fromCategory);
        const to = budgets.find(b => b.category === toCategory);

        if (from && to && from.budgeted >= amount) {
            from.budgeted -= amount;
            to.budgeted += amount;

            GentleFinances.saveData();
            this.loadBudget();

            GentleFinances.showToast(`${Utils.formatCurrency(amount)} → ${to.name}`, 'gold');
        }
    },

    /**
     * Get budget summary
     * @returns {Object}
     */
    getSummary() {
        const budgets = GentleFinances.state.budgets || [];

        return {
            totalBudgeted: budgets.reduce((sum, b) => sum + b.budgeted, 0),
            totalSpent: budgets.reduce((sum, b) => sum + b.spent, 0),
            categoriesOverBudget: budgets.filter(b => b.spent > b.budgeted).length,
            availableToBudget: this.getAvailableToBudget()
        };
    },

    /**
     * Bind events
     */
    bindEvents() {
        // Drag and drop for moving money would be implemented here
    }
};

// Make available globally
window.Budget = Budget;
