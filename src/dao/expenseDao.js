const Expense = require('../model/expense');

const expenseDao = {
  create: async (expenseData) => {
    const newExpense = new Expense(expenseData);
    const saved = await newExpense.save();
    // Populate the saved expense before returning
    return await Expense.findById(saved._id)
      .populate("payer", "name email username")
      .populate("splits.user", "name email username");
  },

  getExpensesByGroup: async (groupId) => {
    return await Expense.find({ group: groupId })
      .populate("payer", "name email username")
      .populate("splits.user", "name email username")
      .sort({ date: -1 });
  },

  delete: async (expenseId) => {
    return await Expense.findByIdAndDelete(expenseId);
  },

  getById: async (id) => {
    return await Expense.findById(id)
      .populate("payer", "name email username")
      .populate("splits.user", "name email username");
  },
};

module.exports = expenseDao;