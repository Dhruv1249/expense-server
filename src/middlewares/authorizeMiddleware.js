// Redundant code still keeping it if sir needs it

const permissions = require('../utility/permissions');
 const authorize = (requiredPermission) => {
   return (request, response, next) => {
     // AuthMiddleware must run before this middleware so that
     // we can access the user object.
     const user = request.user;

     if (!user) {
       return response.status(401).json({
         message: 'User not authorized'
       });
     }

     const userPermissions = permissions[user.role] || [];
     if (!userPermissions.includes(requiredPermission)) {
       return response.status(403).json({
         message: 'Forbidden access: Insufficient permissions'
       });
     }

     next();
   }
 };

module.exports = authorize;
