import User from "../modules/user.modules.js";

export const getUser = async(req, res, next)=>{
    try {
        const user = await User.findById(req.params.id).select('-password');
        if(!user){
            const error = new Error('User not Found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({success: true, data: user})
    } catch (error) {
        next(error);
    }
}

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUser = async (req, res) => {
    try {
      console.log('Authenticated user making request:', req.user); // Log who's making the request
      
      // Advanced filtering, sorting, pagination
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
  
      const users = await User.find({})
        .select('-password -refreshToken') // Exclude sensitive fields
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(); // Convert to plain JS object
  
      const count = await User.countDocuments();
  
      res.status(200).json({
        success: true,
        data: users,
        meta: {
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalUsers: count
        }
      });
  
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Server error',
        message: error.message
      });
    }
  };