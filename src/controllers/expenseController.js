const expenseDao = require("../dao/expenseDao");
const groupDao = require("../dao/groupDao");

const expenseController = {
  addExpense: async (req, res) => {
    try {
      const { description, amount, groupId, splitType, splitData } = req.body;
      const payerId = req.user._id;

      if (!amount || !groupId || !splitType) {
        return res
          .status(400)
          .json({ message: "Amount, Group ID, and Split Type are required" });
      }

      const group = await groupDao.getGroupById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const memberRecord = group.members.find(
        (m) => m.user._id.toString() === payerId.toString(),
      );

      if (!memberRecord) {
        return res.status(403).json({ message: "You are not in this group" });
      }

      // BLOCK VIEWERS
      if (memberRecord.role === "viewer") {
        return res
          .status(403)
          .json({
          message:
            "Viewers cannot add expenses. Please ask an Admin to upgrade you.",
        });
      }

      // Calculate Splits based on Type
      let finalSplits = [];

      if (splitType === "EQUAL") {
        //If splitData is provided, it must be an array of UserIDs.

        // If array is empty we just split between every member
        const involvedUsers =
          splitData && splitData.length > 0
            ? splitData
            : group.members.map((m) => m.user._id.toString());

        const share = amount / involvedUsers.length;

        finalSplits = involvedUsers.map((userId) => ({
          user: userId,
          amount: Number(share.toFixed(2)), // Round to 2 decimals
          status: userId.toString() === payerId ? "SETTLED" : "PENDING",
        }));
      } else if (splitType === "PERCENTAGE") {
        // splitData: [{ user: "userId", percentage: 50 }, ...]

        // Second check of percentage if it is not 100 then return error
        let totalPercent = 0;
        for (const item of splitData) {
          totalPercent = totalPercent + item.percentage;
        }
        if (totalPercent !== 100) {
          return res
            .status(400)
            .json({ message: "Percentages must add up to 100%" });
        }

        finalSplits = splitData.map((item) => ({
          user: item.user,
          amount: Number(((amount * item.percentage) / 100).toFixed(2)),
          percentage: item.percentage,
          status:
            item.user.toString() === payerId.toString() ? "SETTLED" : "PENDING",
        }));
      } else if (splitType === "EXACT") {
        // splitData: [{ user: "userId", amount: 200 }, ...]

        // Second check of exact amount if it is not equal to total amount then return error
        const totalSplitAmount = splitData.reduce(
          (sum, item) => sum + item.amount,
          0,
        );
        if (totalSplitAmount !== amount) {
          return res
            .status(400)
            .json({
            message: "Split amounts must equal the total expense amount",
          });
        }

        finalSplits = splitData.map((item) => ({
          user: item.user,
          amount: item.amount,
          status:
            item.user.toString() === payerId.toString() ? "SETTLED" : "PENDING",
        }));
      }

      const expense = await expenseDao.create({
        description,
        amount,
        date: new Date(),
        payer: payerId,
        group: groupId,
        splitType,
        splits: finalSplits,
      });

      res.status(201).json({ message: "Expense added successfully", expense });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding expense" });
    }
  },

  getGroupExpenses: async (req, res) => {
    try {
      const { groupId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const { expenses, total } = await expenseDao.getExpensesByGroup(groupId, page, limit);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        expenses,
        currentPage: page,
        totalPages,
        totalExpenses: total,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching expenses" });
    }
  },

  settleExpense: async (req, res) => {
    try {
      const { expenseId, debtorId } = req.body; // debtorId = The person who paid you back
      const userId = req.user._id;

      const expense = await expenseDao.getById(expenseId);
      if (!expense)
        return res.status(404).json({ message: "Expense not found" });

      // VERIFY PAYER (Only the Payer can mark it as settled)
      if (expense.payer._id.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({
          message: "Only the person who paid this bill can settle it.",
        });
      }

      // Update the specific split status
      const splitIndex = expense.splits.findIndex(
        (s) => s.user._id.toString() === debtorId.toString(),
      );

      if (splitIndex === -1) {
        return res
          .status(404)
          .json({ message: "This user is not involved in this expense" });
      }

      // Mark as SETTLED
      expense.splits[splitIndex].status = "SETTLED";
      await expense.save();

      res
        .status(200)
        .json({ message: "Expense settled successfully", expense });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error settling expense" });
    }
  },
};

module.exports = expenseController;
