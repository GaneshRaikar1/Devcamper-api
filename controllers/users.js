const ErrorResponse = require('../utils/errorResponse');  const asyncHandler = require('../middleware/async');
const User = require('../models/User');

exports.getUsers = asyncHandler(async (req, res, next) => {    //  Get all users    GET-/api/v1/users          Private/Admin
  res.status(200).json(res.advancedResults);
});

exports.getUser = asyncHandler(async (req, res, next) => {     // Get single user   GET /api/v1/users/:id      Private/Admin
  const user = await User.findById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

exports.createUser = asyncHandler(async (req, res, next) => {  // Create user       POST /api/v1/users         Private/Admin
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res, next) => {  // Update user       PUT /api/v1/users/:id      Private/Admin
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true,runValidators: true});
  res.status(200).json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {  // Delete user       DELETE /api/v1/users/:id   Private/Admin
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {}   });
});

