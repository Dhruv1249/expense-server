const rbacDao = require('../dao/rbacDao');

const rbacController = {
    create: async (request, response) => {
      try {
        const adminId = request.user.id;
        const { name, email, role } = request.body;
        const user = await rbacDao.create(email, name, role, adminId);
        return response.status(200).json({
          message: 'User created',
          user: user
        });

      } catch (error) {
        console.log(error);
        console.log(request.user);
        return response.status(500).json({
          message: 'Internal server error'
        });
      }
    },

    update: async (request, response) => {
        try {
            const { userId, name, role } = request.body;
            const updatedUser = await rbacDao.update(userId, name, role);
            return response.status(200).json({
                message: 'User updated',
                user: updatedUser
            });
        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },

    delete: async (request, response) => {
        try {
            const { userId } = request.body;
            const deletedUser = await rbacDao.delete(userId);
            return response.status(200).json({
                message: 'User deleted',
                user: deletedUser
            });
        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },
    getAllUser: async (request, response) => {
        try {
            const adminId = request.user.id;
            const users = await rbacDao.getUsersByAdminId(adminId);
            return response.status(200).json({
                message: 'All users',
                users: users
            });
        } catch (error) {
            console.log(error);
            return response.status(500).json({
                message: 'Internal server error'
            });
        }
    },
}

module.exports = rbacController;
