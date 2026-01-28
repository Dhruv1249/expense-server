const userDao = require('../dao/userDao');
const bcrypt = require('bcryptjs');
const user = require('../model/user');
const jwt = require('jsonwebtoken');

const authController = {
  login: async (request, response) => {
    const {email, password} = request.body;
    if (!email || !password){
      return response.status(400).json({
        message: "Please enter both email and password",
      });
    }

    const user = await userDao.findByEmail(email); 
    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (user && isPasswordMatched){
      const token = jwt.sign({
        name: user.name,
        email: user.email,
        id: user._id
      }, process.env.JWT_SECRET,
        {expiresIn: '1h'}
      );

      response.cookie('jwtToken',token, {
        httpOnly: true,
        secure: true,
        domain: "localhost",
        path: '/'
      });

      return response.status(200).json({
        message: "Successfully logged in!",
      });
    }
  
    return response.status(400).json({
      message: "Account doesn't exist!",
    });

  },

  register: async (request, response) => {
  
    const {name, email, password } = request.body;
  
    // Return status 400 (client error) if a field it missing
    if (!name || !email || !password){
      return response.status(400).json({
        message: 'Name, Email, Password all are required.'
      });
    }
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userDao.create({
      name: name,
      email: email,
      password: hashedPassword
    })
      .then((u) => {
        return response.status(200).json({
          message: "Successfully registered",
          user: {id: user.id} 
        });
      })
      .catch(error => {
        if (error.code ==  11000){
          return response.status(400).json({
            message: "User with the email already exists"
          })
        } else {
            console.log(error);
            return response.status(500).json({
            message: "Internal server error"
          });
        }
      });
  
  }

      
};

module.exports = authController;
