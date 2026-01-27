const groupDao = require('../dao/groupDao');

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


};

module.exports = groupController
