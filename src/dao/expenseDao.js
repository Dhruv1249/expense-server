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

  getExpensesByGroup: async (groupId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [expenses, total] = await Promise.all([
      Expense.find({ group: groupId })
        .populate("payer", "name email username")
        .populate("splits.user", "name email username")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Expense.countDocuments({ group: groupId }),
    ]);
    return { expenses, total };
  },

  delete: async (expenseId) => {
    return await Expense.findByIdAndDelete(expenseId);
  },

  getById: async (id) => {
    return await Expense.findById(id)
      .populate("payer", "name email username")
      .populate("splits.user", "name email username");
  },

  settleAllByGroup: async (groupId) => {
    const result = await Expense.updateMany(
      { group: groupId, "splits.status": "PENDING" },
      { $set: { "splits.$[elem].status": "SETTLED" } },
      { arrayFilters: [{ "elem.status": "PENDING" }] }
    );
    return result;
  },

  getGroupStats: async (groupId) => {
    const expenses = await Expense.find({ group: groupId });
    let totalSpent = 0;
    let pendingCount = 0;
    let settledCount = 0;
    let pendingAmount = 0;

    expenses.forEach((expense) => {
      totalSpent += expense.amount;
      const allSettled = expense.splits.every((s) => s.status === "SETTLED");
      if (allSettled) {
        settledCount++;
      } else {
        pendingCount++;
        expense.splits.forEach((s) => {
          if (s.status === "PENDING") {
            pendingAmount += s.amount;
          }
        });
      }
    });

    return { totalSpent, pendingCount, settledCount, pendingAmount };
  },

  getStats: async (userId) => {
  
    const expensesPaid = await Expense.find({ payer: userId });
    const totalPaid = expensesPaid.reduce((acc, curr) => acc + curr.amount, 0);

    let totalOwedToUser = 0;
    expensesPaid.forEach(expense => {
        expense.splits.forEach(split => {
            if (split.user.toString() !== userId.toString() && split.status === 'PENDING') {
                totalOwedToUser += split.amount;
            }
        });
    });

    const expensesInvolved = await Expense.find({
        "splits.user": userId,
        payer: { $ne: userId }
    });

    let totalUserOwes = 0;
    expensesInvolved.forEach(expense => {
        const mySplit = expense.splits.find(s => s.user.toString() === userId.toString());
        if (mySplit && mySplit.status === 'PENDING') {
            totalUserOwes += mySplit.amount;
        }
    });

    return {
        totalPaid,
        totalOwedToUser,
        totalUserOwes
    };
  }
};

module.exports = expenseDao;