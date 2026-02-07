const expenseDao = require('../dao/expenseDao');
const groupDao = require('../dao/groupDao');

const expenseController = {
    addExpense: async (req, res) => {
        try {
            const { description, amount, groupId, splitType, splitData } = req.body;
            const payerId = req.user._id; 

            if (!amount || !groupId || !splitType) {
                return res.status(400).json({ message: "Amount, Group ID, and Split Type are required" });
            }

            const group = await groupDao.getGroupById(groupId);
            if (!group) return res.status(404).json({ message: "Group not found" });

            const memberRecord = group.members.find(m => m.user._id.toString() === payerId.toString());
            
            if (!memberRecord) {
                return res.status(403).json({ message: "You are not in this group" });
            }

            // BLOCK VIEWERS
            if (memberRecord.role === 'viewer') {
                return res.status(403).json({ message: "Viewers cannot add expenses. Please ask an Admin to upgrade you." });
            }

            // Calculate Splits based on Type
            let finalSplits = [];

            if (splitType === 'EQUAL') {
                // splitData: [{ user: "userId"}, ...]

                // If array is empty we just split between every member
                const involvedUsers = (splitData && splitData.length > 0) 
                    ? splitData 
                    : group.members.map(m => m.user._id.toString());
                
                const share = amount / involvedUsers.length;

                finalSplits = involvedUsers.map(userId => ({
                    user: userId,
                    amount: Number(share.toFixed(2)), // Round to 2 decimals
                    status: 'PENDING'
                }));

            } else if (splitType === 'PERCENTAGE') {
                // splitData: [{ user: "userId", percentage: 50 }, ...]
                
                // Second check of percentage if it is not 100 then return error
                let totalPercent = 0;
                for (const item of splitData) {
                    totalPercent = totalPercent + item.percentage;
                }
                if (totalPercent !== 100) {
                    return res.status(400).json({ message: "Percentages must add up to 100%" });
                }

                finalSplits = splitData.map(item => ({
                    user: item.user,
                    amount: Number(((amount * item.percentage) / 100).toFixed(2)),
                    percentage: item.percentage,
                    status: 'PENDING'
                }));

            } else if (splitType === 'EXACT') {
                // splitData: [{ user: "userId", amount: 200 }, ...]

                // Second check of exact amount if it is not equal to total amount then return error
                const totalSplitAmount = splitData.reduce((sum, item) => sum + item.amount, 0);
                if (totalSplitAmount !== amount) {
                    return res.status(400).json({ message: "Split amounts must equal the total expense amount" });
                }

                finalSplits = splitData.map(item => ({
                    user: item.user,
                    amount: item.amount,
                    status: 'PENDING'
                }));
            }

            
            const expense = await expenseDao.create({
                description,
                amount,
                date: new Date(),
                payer: payerId,
                group: groupId,
                splitType,
                splits: finalSplits
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
            const expenses = await expenseDao.getExpensesByGroup(groupId);
            res.status(200).json(expenses);
        } catch (error) {
            res.status(500).json({ message: "Error fetching expenses" });
        }
    }
};

module.exports = expenseController;