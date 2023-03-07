const jwt = require('jsonwebtoken');const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];}                                     // Set token from Bearer token in header
                                                                                           // else if (req.cookies.token) {token = req.cookies.token;} // Set token from cookie
  if (!token) {return next(new ErrorResponse('Not authorized to access this route', 401));}// Make sure token exists
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);                             // Verify token
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) { return next(new ErrorResponse('Not authorized to access this route', 401)) }
});
                                        // Authorise after protect,since u need req.user.role
// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next( new ErrorResponse( `User role ${req.user.role} is not authorized to access this route` , 403) );
    }
    next();
  };
};
