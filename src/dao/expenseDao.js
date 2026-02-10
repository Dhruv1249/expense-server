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

  getStats: async (userId) => {
    // 1. Total Spent by user (where payer is user)
    // We only care about the amount they kept for themselves? No, total spent usually means how much they paid upfront. 
    // Or maybe "Your Share" of expenses?
    // Let's go with: 
    // - Total You Paid: Sum of amount where payer = user
    // - You Owe: Sum of splits where user = user AND status = PENDING AND payer != user
    // - You Are Owed: Sum of splits where payer = user AND status = PENDING AND user != user

    const expensesPaid = await Expense.find({ payer: userId });
    const totalPaid = expensesPaid.reduce((acc, curr) => acc + curr.amount, 0);

    // Calculate "You are Owed" (People haven't paid you back yet)
    let totalOwedToUser = 0;
    expensesPaid.forEach(expense => {
        expense.splits.forEach(split => {
            if (split.user.toString() !== userId.toString() && split.status === 'PENDING') {
                totalOwedToUser += split.amount;
            }
        });
    });

    // Calculate "You Owe" (You haven't paid others back yet)
    // Find expenses where you are in splits but NOT the payer
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