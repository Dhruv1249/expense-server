const Group = require("../model/group");

const groupDao = {
  createGroup: async (groupData) => {
    return await Group.create(groupData);
  },

  updateGroup: async (data) => {
    const { groupId, ...updateData } = data;
    return await Group.findByIdAndUpdate(groupId, updateData, { new: true });
  },

  addMembers: async (groupId, ...membersEmails) => {
    return await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { membersEmail: { $each: membersEmails } } },
      { new: true },
    );
  },

  removeMembers: async (groupId, ...membersEmails) => {
    return await Group.findByIdAndUpdate(
      groupId,
      { $pull: { membersEmail: { $in: membersEmails } } },
      { new: true },
    );
  },

  getGroupByEmail: async (email) => {
    return await Group.find({ membersEmail: email });
  },

  getGroupByStatus: async (status) => {
    return await Group.find({ "paymentStatus.isPaid": status });
  },

  getAuditLog: async (groupId) => {
    const group = await Group.findById(groupId).select("paymentStatus.date");
    return group ? group.paymentStatus.date : null;
  },
};

module.exports = groupDao;
