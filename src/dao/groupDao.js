const Group = require("../model/group");

const groupDao = {
  create: async (groupData) => {
    const newGroup = new Group(groupData);
    return await newGroup.save();
  },
  // We are using .populate() here since currently in groups only reference to users is stored
  // and we want to fetch the details of the user and to get it we are using .populate()
  getGroupsByUserId: async (userId, page = 1, limit = 9) => {
    const skip = (page - 1) * limit;
    const filter = { "members.user": userId };
    const [groups, total] = await Promise.all([
      Group.find(filter)
        .populate("members.user", "name email username")
        .populate("creator", "name username")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Group.countDocuments(filter),
    ]);
    return { groups, total };
  },

  getGroupById: async (groupId) => {
    return await Group.findById(groupId).populate(
      "members.user",
      "name email username",
    );
  },

  addMember: async (groupId, userId, role = "member") => {
    const group = await Group.findById(groupId);
    const isMember = group.members.some(
      (m) => m.user.toString() === userId.toString(),
    );

    if (isMember) return group;

    return await Group.findByIdAndUpdate(
      groupId,
      {
        $push: { members: { user: userId, role } },
      },
      { new: true },
    ).populate("members.user", "name email username");
  },

  removeMember: async (groupId, userId) => {
    return await Group.findByIdAndUpdate(
      groupId,
      {
        $pull: { members: { user: userId } },
      },
      { new: true },
    );
  },

  delete: async (groupId) => {
    return await Group.findByIdAndDelete(groupId);
  },

  updateMemberRole: async (groupId, userId, newRole) => {
    return await Group.findOneAndUpdate(
      { _id: groupId, "members.user": userId },
      { $set: { "members.$.role": newRole } },
      { new: true },
    ).populate("members.user", "name email username");
  },
};

module.exports = groupDao;
