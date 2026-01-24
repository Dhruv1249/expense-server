const users = require('../dao/userDb')


const authController = {
  login: (request, response) => {
    const {email, password} = request.body;
    if (!email && !password){
      return response.status(400).json({
        message: "Please enter both email and passwor",
      });
    }

    const hasAccount = users.find( 
      user => user.password === password && user.email === email
    );
    if (hasAccount){
      return response.status(200).json({
        message: "Successfully logged in!",
      });
    }
  
    return response.status(400).json({
      message: "Account doesn't exist!",
    });

  },

  register: (request, response) => {
    const {name, email, password } = request.body;
  
    // Return status 400 (client error) if a field it missing
    if (!name || !email || !password){
      return response.status(400).json({
        message: 'Name, Email, Password all are required.'
      });
    }
  
    // Return status 401 if email already exists
    const emailExists = users.find(user => user.email === email);
    // find methods returns the object where it is present not true or false
    if(emailExists){
      return response.status(401).json({
        message: `User already exists for the email: ${email}`
      });
    };

    const newUser = {
      id: users.length + 1,
      name: name,
      email: email,
      password: password
    }

    users.push(newUser);
  
    // Return status 200 when regsitration is successfully done
    return response.status(200).json({
      message: "Successfully registered",
      user: {id: newUser.id} 
    });
  },

      
};

module.exports = authController;
