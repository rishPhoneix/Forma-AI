const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/token");
const { validateSignup, validateLogin } = require("../validators/authValidator");


const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

function publicUser(u) {
  return { id: String(u._id), name: u.name, email: u.email, role: u.role };
}

exports.signup = async (req, res, next) => {
  try {
    const result = validateSignup(req.body);
    if (!result.ok) {
      return res.status(400).json({ message: "Invalid signup data", errors: result.errors });
    }
    const { name, email, password } = result.data;

    if (await User.exists({ email })) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    try {
      
      user = await User.create({ name, email, passwordHash });
    } catch (err) {
      if (err && err.code === 11000) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      throw err;
    }

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const result = validateLogin(req.body);
    if (!result.ok) {
      return res.status(400).json({ message: "Invalid login data", errors: result.errors });
    }
    const { email, password } = result.data;

    const user = await User.findOne({ email });
    const passwordOk = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);

    if (!user || !passwordOk) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
};

exports.me = (req, res) => {
  res.json({ user: publicUser(req.user) });
};