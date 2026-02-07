const Group = require("../model/group");

const groupDao = {
    create: async (groupData) => {
        const newGroup = new Group(groupData);
        return await newGroup.save();
    },
    // We are using .populate() here since currently in groups only reference to users is stored
    // and we want to fetch the details of the user and to get it we are using .populate()
    getGroupsByUserId: async (userId) => {
        return await Group.find({ "members.user": userId })
            .populate('members.user', 'name email') 
            .populate('creator', 'name');
    },

    getGroupById: async (groupId) => {
        return await Group.findById(groupId)
            .populate('members.user', 'name email');
    },

    addMember: async (groupId, userId, role = 'member') => {
        const group = await Group.findById(groupId);
        const isMember = group.members.some(m => m.user.toString() === userId.toString());
        
        if (isMember) return group;

        return await Group.findByIdAndUpdate(groupId, {
            $push: { members: { user: userId, role } }
        }, { new: true }).populate('members.user', 'name email');
    },

    removeMember: async (groupId, userId) => {
        return await Group.findByIdAndUpdate(groupId, {
            $pull: { members: { user: userId } }
        }, { new: true });
    },

    delete: async (groupId) => {
        return await Group.findByIdAndDelete(groupId);
    }
};

module.exports = groupDao;