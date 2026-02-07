const Expense = require('../model/expense');

const expenseDao = {
    create: async (expenseData) => {
        const newExpense = new Expense(expenseData);
        return await newExpense.save();
    },

    getExpensesByGroup: async (groupId) => {
        return await Expense.find({ group: groupId })
            .populate('payer', 'name email') // Show who paid
            .populate('splits.user', 'name email') // Show who owes what
            .sort({ date: -1 }); // Newest first
    },

    delete: async (expenseId) => {
        return await Expense.findByIdAndDelete(expenseId);
    },

    getById: async (id) => {
        return await Expense.findById(id);
    },
};

module.exports = expenseDao;