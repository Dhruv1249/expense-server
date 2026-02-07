const userDao = require("../dao/userDao");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { validationResult } = require("express-validator");
const { ADMIN_ROLE } = require('../utility/userRoles');


const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" } // Increased login session to 7 days
  );
};

const authController = {
  login: async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = request.body;

    const user = await userDao.findByEmail(email);
    if (!user) {
        return response.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.password) {
         return response.status(400).json({ message: "Please login with Google" });
    }
    
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (user && isPasswordMatched) {
      const token = generateToken(user);

      response.cookie("jwtToken", token, {
        httpOnly: true,
        secure: true,
        domain: "localhost",
        path: "/",
      });
      return response.status(200).json({
        message: "User authenticated",
        user: user,
      });
    } else {
      return response.status(400).json({
        message: "Invalid email or password",
      });
    }
  },

  register: async (request, response) => {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Name, Email, Password are required",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    userDao
      .create({
        name: name,
        email: email,
        password: hashedPassword,
      })
      .then((u) => {
        // Auto-login after register
        const token = generateToken(u);
        response.cookie("jwtToken", token, {
          httpOnly: true,
          secure: true,
          domain: "localhost",
          path: "/",
        });
        return response.status(200).json({
          message: "User registered",
          user: { id: u._id },
        });
      })
      .catch((error) => {
        if (error.code === "USER_EXIST") {
          console.log(error);
          return response.status(400).json({
            message: "User with the email already exist",
          });
        } else {
          return response.status(500).json({
            message: "Internal server error",
          });
        }
      });
  },

  isUserLoggedIn: async (request, response) => {
    try {
      const token = request.cookies?.jwtToken;

      if (!token) {
        return response.status(401).json({
          message: "Unauthorized access",
        });
      }

      jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
          return response.status(401).json({
            message: "Invalid token",
          });
        } else {
          response.json({
            user: user,
          });
        }
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Invalid token",
      });
    }
  },

  logout: async (request, response) => {
    try {
      response.clearCookie("jwtToken");
      response.json({ message: "Logout successfull" });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Invalid token",
      });
    }
  },

  googleSso: async (request, response) => {
    try {
      const { idToken } = request.body;
      if (!idToken) {
        return response.status(401).json({ message: "Invalid request" });
      }

      const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const googleResponse = await googleClient.verifyIdToken({
        idToken: idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = googleResponse.getPayload();
      const { sub: googleId, name, email } = payload;

      let user = await userDao.findByEmail(email);
      if (!user) {
        user = await userDao.create({
          name: name,
          email: email,
          googleId: googleId,
        });
      }

      const token = generateToken(user);

      response.cookie("jwtToken", token, {
        httpOnly: true,
        secure: true,
        domain: "localhost",
        path: "/",
      });
      return response.status(200).json({
        message: "User authenticated",
        user: user,
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Google Auth Failed",
      });
    }
  },
};

module.exports = authController;
