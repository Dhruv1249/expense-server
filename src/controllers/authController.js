const userDao = require("../dao/userDao");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { validationResult } = require("express-validator");
//const { ADMIN_ROLE } = require('../utility/userRoles');


const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Validate username format
const isValidUsername = (username) => {
  if (!username || typeof username !== "string") return false;
  if (username.length < 3 || username.length > 20) return false;
  return /^[a-z0-9_]+$/i.test(username);
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
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.DOMAIN,
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
    const { username, name, email, password } = request.body;

    if (!username || !name || !email || !password) {
      return response.status(400).json({
        message: "Username, Name, Email, Password are required",
      });
    }

    // Validate username format
    if (!isValidUsername(username)) {
      return response.status(400).json({
        message:
          "Username must be 3-20 characters, containing only letters, numbers, and underscores",
      });
    }

    // Check username availability
    const isAvailable = await userDao.checkUsernameAvailable(username);
    if (!isAvailable) {
      return response.status(400).json({
        message: "Username is already taken",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    userDao
      .create({
        username: username.toLowerCase(),
        name: name,
        email: email,
        password: hashedPassword,
      })
      .then((u) => {
        // Auto-login after register
        const token = generateToken(u);
        response.cookie("jwtToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          domain: process.env.DOMAIN,
          path: "/",
        });
        return response.status(200).json({
          message: "User registered",
          user: { id: u._id, username: u.username },
        });
      })
      .catch((error) => {
        if (error.code === "USER_EXIST") {
          return response.status(400).json({
            message: "User with the email already exists",
          });
        } else if (error.code === "USERNAME_TAKEN") {
          return response.status(400).json({
            message: "Username is already taken",
          });
        } else {
          return response.status(500).json({
            message: "Internal server error",
          });
        }
      });
  },

  checkUsername: async (request, response) => {
    try {
      const { username } = request.body;

      if (!username) {
        return response.status(400).json({ message: "Username is required" });
      }

      if (!isValidUsername(username)) {
        return response.status(400).json({
          available: false,
          message:
            "Username must be 3-20 characters, containing only letters, numbers, and underscores",
        });
      }

      const isAvailable = await userDao.checkUsernameAvailable(username);

      return response.status(200).json({
        available: isAvailable,
        message: isAvailable
          ? "Username is available"
          : "Username is already taken",
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({ message: "Error checking username" });
    }
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

      // If user exists, log them in
      if (user) {
        const token = generateToken(user);
        response.cookie("jwtToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          domain: process.env.DOMAIN,
          path: "/",
        });
        return response.status(200).json({
          message: "User authenticated",
          user: user,
          needsUsername: false,
        });
      }

      // New user - they need to set a username first
      return response.status(200).json({
        message: "Username required",
        needsUsername: true,
        googleData: {
          googleId,
          name,
          email,
        },
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Google Auth Failed",
      });
    }
  },

  completeGoogleSignup: async (request, response) => {
    try {
      const { username, googleData } = request.body;

      if (!username || !googleData) {
        return response
          .status(400)
          .json({ message: "Username and Google data are required" });
      }

      const { googleId, name, email } = googleData;

      if (!googleId || !name || !email) {
        return response.status(400).json({ message: "Invalid Google data" });
      }

      // Validate username format
      if (!isValidUsername(username)) {
        return response.status(400).json({
          message:
            "Username must be 3-20 characters, containing only letters, numbers, and underscores",
        });
      }

      // Check if email is already registered (race condition check)
      const existingUser = await userDao.findByEmail(email);
      if (existingUser) {
        // User was created in the meantime, just log them in
        const token = generateToken(existingUser);
        response.cookie("jwtToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          domain: process.env.DOMAIN,
          path: "/",
        });
        return response.status(200).json({
          message: "User authenticated",
          user: existingUser,
        });
      }

      // Check username availability
      const isAvailable = await userDao.checkUsernameAvailable(username);
      if (!isAvailable) {
        return response.status(400).json({
          message: "Username is already taken",
        });
      }

      // Create user
      const user = await userDao.create({
        username: username.toLowerCase(),
        name: name,
        email: email,
        googleId: googleId,
      });

      const token = generateToken(user);

      response.cookie("jwtToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.DOMAIN,
        path: "/",
      });
      return response.status(200).json({
        message: "User registered",
        user: user,
      });
    } catch (error) {
      console.log(error);
      if (error.code === "USERNAME_TAKEN") {
        return response.status(400).json({
          message: "Username is already taken",
        });
      } else if (error.code === "USER_EXIST") {
        return response.status(400).json({
          message: "User with this email already exists",
        });
      }
      return response.status(500).json({
        message: "Google Auth Failed",
      });
    }
  },
};

module.exports = authController;
