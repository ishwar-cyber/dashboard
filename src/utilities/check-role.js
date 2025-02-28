import User from "../modules/user.modules.js";

const checkRole = (roles) => async (req, res, next) => {
    let { email } = req.body;
    //retrieve employee info from DB
    const user = await User.findOne({ email });
    !roles.includes(user.role)
      ? res.status(401).json("Sorry you do not have access to this route")
      : next();
  };

export default checkRole;