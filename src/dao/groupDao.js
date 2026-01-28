const Group = require("../model/group")

const groupDao = {
  createGroup : async (data) =>{
    const newGroup = new Group(data);
    return await newGroup.save();
  },
  
  updateGroup: async (data) => {
    const {groupId, name, description, thumbnail, adminEmail, payamentStatus} = data;
    return await Group.findByIdAndUpdate(groupId,{
      name, description, thumbnail, adminEmail, payamentStatus
    }, {new: true},);
  },
  
  addMembers: async (groupId,membersEmails) => {
    return await Group.findByIdAndUpdate(groupId, {
      $addToSet: { membersEmail: {$each  : membersEmails} }
    }, {new : true}, );

  },

  removeMembers: async (groupId,membersEmails) => {
    return await Group.findByIdAndUpdate(groupId,{
      $pull :{membersEmail: {$in: membersEmails  }}
      }, {new : true},
    );  
  },
  
  getGroupByEmail : async (email) => {
    return await Group.find({membersEmail: email});
  },

  getgroupByStatus : async (status) =>{
    return await Group.find({paymentStatus: status});
  },

};

module.exports = groupDao; 
