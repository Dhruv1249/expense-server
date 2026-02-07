const User = require('../model/users');

const userDao = {
    findByEmail: async (email) => {
        // We need to explicitly ask for the password because select: false is set in schema
        // Took so much time to figure this out *sighs*
        return await User.findOne({ email }).select('+password');
    },

    create: async (userData) => {
        const newUser = new User(userData);
        try {
            return await newUser.save();
        } catch (error) {
            if (error.code === 11000) {
                const err =  new Error()
                err.code = 'USER_EXIST';
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