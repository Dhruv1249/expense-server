const groupDao = require('../dao/groupDao');
const Group = require("../model/group");

const groupController = {
  create: async (request, response) => {
    try{
      const user = request.user;
      const adminEmail = user.email;
      const {
        name, description, 
        membersEmail, thumbnail,
      } = request.body;

      let allMembers = [adminEmail];
      if (membersEmail && Array.isArray(membersEmail)) {
        allMembers = [...new Set([...allMembers, ...membersEmail])];
      }
      
      const newGroup = await groupDao.createGroup({
        name, description, adminEmail, allMembers, thumbnail,
        paymentStatus: {
          amount: 0,
          currency: 'INR',
          date: Date.now(),
          isPaid: false
        }
      });

      response.status(200).json({
        message: 'Group created',
        groupId: newGroup._id
      });
      
    } catch (error) {
      console.log(error);
      response.status(500).json({
        message: "Interenal server error"
      });
    } 
  },

  update: async (request, response) => {
    try{ 
      const user = request.user;
      const adminEmail = user.email;
      const {
        name, description, 
        membersEmail, thumbnail,
      } = request.body;

      let allMembers = [adminEmail];
      if (membersEmail && Array.isArray(membersEmail)) {
        allMembers = [...new Set([...allMembers, ...membersEmail])];
      }
      const group = await Group.findOne({adminEmail: adminEmail});
      const groupId = group._id;
      if(!groupId){
        response.status(500).json({
          message: 'No group with this adminEmail exists',
        });

      } 

      const newGroup = await groupDao.updateGroup({
       groupId, name, description, adminEmail, allMembers, thumbnail,
        paymentStatus: {
          amount: 0,
          currency: 'INR',
          date: Date.now(),
          isPaid: false
        }
      });

      response.status(200).json({
        message: 'Group updated',
        groupId: newGroup._id
      });


      
    } catch(error) {
      console.log(error);
      response.status(500).json({
        message: "Internal server error"
      });
    }
    
  },

  addMembers: async (request, response) => {
    try{  
      const user = request.user;
      const adminEmail = user.email;
      const group = await Group.findOne({adminEmail: adminEmail});
      const groupId = group._id;
      const {emails} = request.body
      const updatedGroup = await groupDao.addMembers(groupId,emails);
      
      response.status(200).json({
        message: 'Members added to the group',
        groupId: updatedGroup._id
      });
    } catch(error) {
      console.log(error);
      response.status(500).json({
        message: "Internal server error"
      });
    }
  },

  removeMembers: async (request, response) => {
    try{  
      const user = request.user;
      const adminEmail = user.email;
      const group = await Group.findOne({adminEmail:adminEmail});
      const groupId = group._id;
      const {emails} = request.body
      const updatedGroup = await groupDao.addMembers(groupId,emails);
      
      response.status(200).json({
        message: 'Members removed from the group',
        groupId: updatedGroup._id
      });
    } catch(error) {
      console.log(error);
      response.status(500).json({
        message: "Internal server error"
      });
    }
  },

  getGroupByEmail: async (request, response) => {
     try{  
      const {email} = request.body;
      const group = await groupDao.getGroupByEmail(email);
      
      response.status(200).json({
        message: ' Group found!',
        group: group
      });
    } catch(error) {
      console.log(error);
      response.status(500).json({
        message: "Internal server error"
      });
    }

  },

  getGroupByStatus: async (request, response) => {
     try{  
      const status = request.body;
      const group = await groupDao.getGroupByStatus(status);
      
      response.status(200).json({
        message: 'Members removedt from the group',
        group: group
      });
    } catch(error) {
      console.log(error);
      response.status(500).json({
        message: "Internal server error"
      });
    }
  },

};

module.exports = groupController;
