const userDao = require("../dao/userDao");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const authController = {
  login: async (request, response) => {
    try {
      const { email, password } = request.body;
      if (!email || !password) {
        return response.status(400).json({
          message: "Please enter both email and password",
        });
      }

      const user = await userDao.findByEmail(email);

      if (!user) {
        return response.status(400).json({
          message: "Invalid email or password",
        });
      }

      if (user.googleId && !user.password) {
        return response.status(400).json({
          message: "Please log in using Google SSO",
        });
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password);

      if (isPasswordMatch) {
        const token = jwt.sign(
          {
            name: user.name,
            email: user.email,
            id: user._id,
          },
          process.env.JWT_SECRET,
          {
            expiresIn: "1h",
          },
        );
        response.cookie("jwtToken", token, {
          httpOnly: true,
          secure: false,
          domain: "localhost",
          path: "/",
        });
        return response.status(200).json({
          message: "Successfully logged in!",
          user: user,
        });
      } else {
        return response.status(400).json({
          message: "Invalid email or password",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      return response.status(500).json({
        message: "An error occurred during login",
      });
    }
  },
  register: async (request, response) => {
    const { name, email, password } = request.body;

    // Return status 400 (client error) if a field it missing
    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Name, Email, Password all are required.",
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
        return response.status(200).json({
          message: "User registered successfully",
          user: { id: u._id },
        });
      })
      .catch((error) => {
        if (error.code === "USER_EXISTS") {
          return response.status(400).json({
            message: "User with this email already exists",
          });
        } else {
          return response.status(500).json({
            message: "Registration failed",
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
        message: "Internal server error",
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
        message: "Internal server error",
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
      const token = jwt.sign(
        {
          name: user.name,
          email: user.email,
          googleId: user.googleId,
          id: user._id,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" },
      );

      response.cookie("jwtToken", token, {
        httpOnly: true,
        secure: false,
        domain: "localhost",
        path: "/",
      });
      return response.status(200).json({
        message: "UserAuthenticated",
        user: user,
      });
    } catch (error) {
      console.log(error);
      return response.status(500).json({
        message: "Internal server error",
      });
    }
  },
};

module.exports = authController;
