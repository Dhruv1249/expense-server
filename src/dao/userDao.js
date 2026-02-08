const User = require("../model/users");

const userDao = {
  findByEmail: async (email) => {
    // We need to explicitly ask for the password because select: false is set in schema
    return await User.findOne({ email }).select("+password");
  },

  findByUsername: async (username) => {
    return await User.findOne({ username: username.toLowerCase() });
  },

  checkUsernameAvailable: async (username) => {
    const user = await User.findOne({ username: username.toLowerCase() });
    return !user;
  },

  create: async (userData) => {
    // Normalize username to lowercase
    if (userData.username) {
      userData.username = userData.username.toLowerCase();
    }
    const newUser = new User(userData);
    try {
      return await newUser.save();
    } catch (error) {
      if (error.code === 11000) {
        // Determine which field caused the duplicate
        const field = Object.keys(error.keyPattern)[0];
        const err = new Error();
        err.code = field === "username" ? "USERNAME_TAKEN" : "USER_EXIST";
        err.field = field;
        throw err;
      } else {
        console.log(error);
                const err = new Error('Something went wrong while communicating with DB');
                err.code = 'INTERNAL_SERVER_ERROR';
        throw err;
      }
    }
    }
};

module.exports = userDao;