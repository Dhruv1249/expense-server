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

  deleteByGroup: async (groupId) => {
    return await Expense.deleteMany({ group: groupId });
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
    const uid = userId.toString();

    // Expenses where user was the payer
    const expensesPaid = await Expense.find({ payer: userId });
    let totalOwedToUser = 0;

    expensesPaid.forEach(expense => {
      expense.splits.forEach(split => {
        const splitUserId = (split.user._id || split.user).toString();
        if (splitUserId !== uid && split.status === 'PENDING') {
          totalOwedToUser += split.amount;
        }
      });
    });
    const allUserExpenses = await Expense.find({ "splits.user": userId });
    let totalPaid = 0;
    allUserExpenses.forEach(expense => {
      const mySplit = expense.splits.find(s => {
        const splitUserId = (s.user._id || s.user).toString();
        return splitUserId === uid;
      });
      if (mySplit) {
        totalPaid += mySplit.amount;
      }
    });

    const expensesInvolved = await Expense.find({
      "splits.user": userId,
      payer: { $ne: userId }
    });

    let totalUserOwes = 0;
    expensesInvolved.forEach(expense => {
      const mySplit = expense.splits.find(s => {
        const splitUserId = (s.user._id || s.user).toString();
        return splitUserId === uid;
      });
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