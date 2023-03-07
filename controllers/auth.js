const crypto = require('crypto'); const ErrorResponse = require('../utils/errorResponse'); const asyncHandler = require('../middleware/async'); 
const sendEmail = require('../utils/sendEmail'); const User = require('../models/User');

exports.register = asyncHandler(async (req, res, next) => {  // Register user   POST /api/v1/auth/register  Public
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });         // Create user
  const confirmEmailToken = user.generateEmailConfirmToken();               // grab token and send to email
  const confirmEmailURL = `${req.protocol}://${req.get('host',)}/api/v1/auth/confirmemail?token=${confirmEmailToken}`; // Create reset url
  const message = `You are receiving this email because you need to confirm your email address. Please make a GET request to: \n\n ${confirmEmailURL}`;
  user.save({ validateBeforeSave: false });
  const sendResult = await sendEmail({ email: user.email, subject: 'Email confirmation token', message });
  sendTokenResponse(user, 200, res)  });

exports.confirmEmail = asyncHandler(async (req, res, next) => {           // Confirm Email  GET /api/v1/auth/confirmemail  Public
  const { token } = req.query;                                                           // grab token from email
  if (!token) {  return next(new ErrorResponse('Invalid Token', 400));  }
  const splitToken = token.split('.')[0];
  const confirmEmailToken = crypto.createHash('sha256').update(splitToken).digest('hex');
  const user = await User.findOne({ confirmEmailToken, isEmailConfirmed: false });       // get user by token
  if (!user) {  return next(new ErrorResponse('Invalid Token', 400))  }
  user.confirmEmailToken = undefined;                                                    // update confirmed to true
  user.isEmailConfirmed = true;
  user.save({ validateBeforeSave: false });                                              // save
  sendTokenResponse(user, 200, res)  });                                                // return token

exports.login = asyncHandler(async (req, res, next) => {        // Login user  POST /api/v1/auth/login    Public
  const { email, password } = req.body;
  if (!email || !password) { return next(new ErrorResponse('Please provide an email and password', 400)); }  // Validate emil & password
  const user = await User.findOne({ email }).select('+password');                // Check for user
  if (!user) { return next(new ErrorResponse('Invalid credentials', 401)) }
  const isMatch = await user.matchPassword(password);                            // Check if password matches
  if (!isMatch) { return next(new ErrorResponse('Invalid credentials', 401)) }
  sendTokenResponse(user, 200, res);  });

exports.logout = asyncHandler(async (req, res, next) => {   // Log user out / clear cookie   GET /api/v1/auth/logout   Public
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, data: {} })  });

exports.getMe = asyncHandler(async (req, res, next) => {     // Get current logged in user    GET /api/v1/auth/me   Private
  const user = req.user;                                     // user is already available in req due to the protect middleware
  res.status(200).json({ success: true, data: user })  });

exports.updateDetails = asyncHandler(async (req, res, next) => {  // Update user details PUT /api/v1/auth/updatedetails(Private)
  const fieldsToUpdate = { name: req.body.name, email: req.body.email };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: user })  });

exports.updatePassword = asyncHandler(async (req, res, next) => {  // Update password  PUT /api/v1/auth/updatepassword(Private)
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {                         // Check current password
    return next(new ErrorResponse('Password is incorrect', 401)) }
  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res)  });

exports.forgotPassword = asyncHandler(async (req, res, next) => { // Forgot password   POST /api/v1/auth/forgotpassword(Public)
  const user = await User.findOne({ email: req.body.email });
  if (!user) { return next(new ErrorResponse('There is no user with that email', 404)) }
  const resetToken = user.getResetPasswordToken();                                          // Get reset token
  await user.save({ validateBeforeSave: false });
  const resetUrl = `${req.protocol}://${req.get('host',)}/api/v1/auth/resetpassword/${resetToken}`; // Create reset url
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
  try {
    await sendEmail({ email: user.email, subject: 'Password reset token', message });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500)) }  });

exports.resetPassword = asyncHandler(async (req, res, next) => {  // Reset password   PUT /api/v1/auth/resetpassword/:resettoken(Public)
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');  // Get hashed token
  const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: Date.now() }, });
  if (!user) { return next(new ErrorResponse('Invalid token', 400)); }
  user.password = req.body.password;                                                   // Set new password
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res)  });

const sendTokenResponse = (user, statusCode, res) => {                 // "Create Cookie" Get token from model and send response
  const token = user.getSignedJwtToken();                                                // Create token
  const options = { expires: new Date(  Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 ), httpOnly: true };
  if (process.env.NODE_ENV === 'production') { options.secure = true }                   //for https in production
  res.status(statusCode).cookie('token', token, options).json({ success: true, token })  };
