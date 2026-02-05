const User = require("../model/users");
const generateTemporaryPassword = (desiredLength) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < desiredLength; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
const rbacDao = {
  create: async (email, name, role, adminId) => {
    return await User.create({
      email: email,
      password: generateTemporaryPassword(10),
      name: name,
      role: role,
      adminId: adminId,
    });
  },

  update: async (userId, name, role) => {
    return await User.findByIdAndUpdate(userId, { name, role }, { new: true });
  },

  delete: async (userId) => {
    return await User.findByIdAndDelete(userId);
  },

  getUsersByAdminId: async (adminId) => {
    return await User.find({ adminId: adminId }).select("-password");
  },
};

module.exports = rbacDao;
