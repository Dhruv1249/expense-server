const express = require('express');

const app = express();

app.use(express.json()); // Middleware

// Post request ending with /register
app.post('/register', (request, response) =>{
  const {name, email, password } = request.body;
  
  // Return status 400 (client error) if a field it missing
  if (!name || !email || !password){
    return response.status(400).json({
      message: 'Name, Email, Password all are required.'
    });
  }

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
    id: { newUser.id }
  });

});

app.listen(5001, () =>{
  console.log('Server is running on port 5001');
});
