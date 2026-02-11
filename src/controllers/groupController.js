const groupDao = require("../dao/groupDao");
const userDao = require("../dao/userDao");
const expenseDao = require("../dao/expenseDao");

const groupController = {
  create: async (request, response) => {
    try {
      const { name, description, thumbnail } = request.body;
      const creatorId = request.user._id;

      // Creator is automatically the first Admin
      const newGroup = await groupDao.create({
        name,
        description,
        thumbnail,
        creator: creatorId,
        members: [{ user: creatorId, role: "admin" }],
      });

      response.status(201).json({
        message: "Group created successfully",
        group: newGroup,
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error creating group" });
    }
  },

  getMyGroups: async (request, response) => {
    try {
      const userId = request.user._id;
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 9;

      const { groups, total } = await groupDao.getGroupsByUserId(userId, page, limit);
      const totalPages = Math.ceil(total / limit);

      // Compute actual totalSpent from expenses for each group
      const groupsWithSpending = await Promise.all(
        groups.map(async (group) => {
          const stats = await expenseDao.getGroupStats(group._id);
          const g = group.toObject ? group.toObject() : { ...group };
          g.totalSpent = stats.totalSpent;
          return g;
        })
      );

      response.status(200).json({
        groups: groupsWithSpending,
        currentPage: page,
        totalPages,
        totalGroups: total,
      });
    } catch (error) {
      response.status(500).json({ message: "Error fetching groups" });
    }
  },

  getGroupDetails: async (request, response) => {
    try {
      const { groupId } = request.params;
      const group = await groupDao.getGroupById(groupId);

      if (!group)
        return response.status(404).json({ message: "Group not found" });

      response.status(200).json(group);
    } catch (error) {
      response.status(500).json({ message: "Error fetching group details" });
    }
  },

  addMembers: async (request, response) => {
    try {
      const { groupId, emails } = request.body; // Expects array of emails

      if (!emails || !Array.isArray(emails)) {
        return response
          .status(400)
          .json({ message: "Please provide a list of emails" });
      }

      const group = await groupDao.getGroupById(groupId);
      if (!group)
        return response.status(404).json({ message: "Group not found" });

      // Security: Only Admins of the group can add members
      const requesterId = request.user._id.toString();
      const requester = group.members.find(
        (m) => m.user._id.toString() === requesterId,
      );
      const isAuthorized =
        requester &&
        (requester.role === "admin" || requester.role === "manager");

      if (!isAuthorized) {
        return response
          .status(403)
          .json({ message: "Only group admins can add members" });
      }

      const addedUsers = [];
      const failedEmails = [];

      for (const email of emails) {
        const user = await userDao.findByEmail(email);
        if (user) {
          await groupDao.addMember(groupId, user._id);
          addedUsers.push(user.email);
        } else {
          failedEmails.push(email);
        }
      }

      response.status(200).json({
        message: "Process completed",
        added: addedUsers,
        notFound: failedEmails, // Tell frontend which emails weren't registered users
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error adding members" });
    }
  },

  update: async (request, response) => {
    try {
      const { groupId, name, description, thumbnail } = request.body;

      if (!groupId) {
        return response.status(400).json({ message: "Group ID is required" });
      }

      const group = await groupDao.getGroupById(groupId);
      if (!group)
        return response.status(404).json({ message: "Group not found" });

      const requesterId = request.user._id.toString();
      const requester = group.members.find(
        (m) => m.user._id.toString() === requesterId,
      );
      const isAuthorized =
        requester &&
        (requester.role === "admin" || requester.role === "manager");

      if (!isAuthorized) {
        return response
          .status(403)
          .json({ message: "Access denied. Admins only." });
      }

      group.name = name || group.name;
      group.description = description || group.description;
      group.thumbnail = thumbnail || group.thumbnail;

      await group.save();

      response.status(200).json({ message: "Group updated", group });
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error updating group" });
    }
  },

  removeMember: async (request, response) => {
    try {
      const { groupId, email } = request.body;

      if (!groupId || !email) {
        return response
          .status(400)
          .json({ message: "Group ID and Email are required" });
      }

      const group = await groupDao.getGroupById(groupId);
      if (!group)
        return response.status(404).json({ message: "Group not found" });

      const userToRemove = await userDao.findByEmail(email);
      if (!userToRemove) {
        return response.status(404).json({ message: "User not found" });
      }

      const requesterId = request.user._id.toString();
      const requester = group.members.find(
        (m) => m.user._id.toString() === requesterId,
      );

      // Allow if:
      // A) You are an Admin
      // B) You are removing YOURSELF (Leave Group)
      const isSelfRemoval = requesterId === userToRemove._id.toString();
      const isAdmin =
        requester &&
        (requester.role === "admin" || requester.role === "manager");

      if (!isSelfRemoval && !isAdmin) {
        return response
          .status(403)
          .json({ message: "Only admins can remove other members." });
      }

      const updatedGroup = await groupDao.removeMember(
        groupId,
        userToRemove._id,
      );

      response.status(200).json({
        message: "Member removed successfully",
        group: updatedGroup,
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error removing member" });
    }
  },

  deleteGroup: async (request, response) => {
    try {
      const { groupId } = request.params;
      const group = await groupDao.getGroupById(groupId);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }

      const requesterId = request.user._id.toString();
      const requester = group.members.find(
        (m) => m.user._id.toString() === requesterId,
      );

      if (!requester || requester.role !== "admin") {
        return response
          .status(403)
          .json({ message: "Only Admins can delete the group." });
      }

      await groupDao.delete(groupId);

      response.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
      response.status(500).json({ message: "Error deleting group" });
    }
  },

  updateMemberRole: async (request, response) => {
    try {
      const { groupId, userId, newRole } = request.body;

      if (!groupId || !userId || !newRole) {
        return response
          .status(400)
          .json({ message: "Group ID, User ID, and new role are required" });
      }

      const validRoles = ["admin", "manager", "member", "viewer"];
      if (!validRoles.includes(newRole)) {
        return response
          .status(400)
          .json({
            message: "Invalid role. Must be: admin, manager, member, or viewer",
          });
      }

      const group = await groupDao.getGroupById(groupId);
      if (!group) {
        return response.status(404).json({ message: "Group not found" });
      }

      // Only admins can change roles
      const requesterId = request.user._id.toString();
      const requester = group.members.find(
        (m) => m.user._id.toString() === requesterId,
      );

      if (!requester || requester.role !== "admin") {
        return response
          .status(403)
          .json({ message: "Only admins can change member roles" });
      }

      // Cannot change own role
      if (userId === requesterId) {
        return response
          .status(400)
          .json({ message: "You cannot change your own role" });
      }

      const updatedGroup = await groupDao.updateMemberRole(
        groupId,
        userId,
        newRole,
      );

      response.status(200).json({
        message: "Role updated successfully",
        group: updatedGroup,
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ message: "Error updating member role" });
    }
  },
};

module.exports = groupController;
