const ErrorResponse = require('../utils/errorResponse'); const asyncHandler = require('../middleware/async'); const Course = require('../models/Course'); const Bootcamp = require('../models/Bootcamp');

exports.getCourses = asyncHandler(async (req, res, next) => { // Get courses GET /api/v1/courses + /api/v1/bootcamps/:bootcampId/courses (Public)
  if (req.params.bootcampId) {
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({ success: true, count: courses.length, data: courses });
  } else { res.status(200).json(res.advancedResults) }  });

exports.getCourse = asyncHandler(async (req, res, next) => { // Get single course    GET /api/v1/courses/:id     Public
  const course = await Course.findById(req.params.id).populate({ path: 'bootcamp', select: 'name description' });
  if (!course) {return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404) );}
  res.status(200).json({ success: true, data: course })  });

exports.addCourse = asyncHandler(async (req, res, next) => { //Add course  POST /api/v1/bootcamps/:bootcampId/courses  Private
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) { return next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`, 404) ); }
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {  // Make sure user is bootcamp owner
    return next( new ErrorResponse(`User ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`, 401 ) ); }
  const course = await Course.create(req.body);  res.status(200).json({ success: true, data: course })  });

exports.updateCourse = asyncHandler(async (req, res, next) => { // Update course      PUT /api/v1/courses/:id       Private
  let course = await Course.findById(req.params.id);
  if (!course) { return next( new ErrorResponse(`No course with the id of ${req.params.id}`, 404) ); }
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {  // Make sure user is course owner
    return next( new ErrorResponse( `User ${req.user.id} is not authorized to update course ${course._id}`, 401 ) ) }
  course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  course.save();  res.status(200).json({ success: true, data: course })  });
  
exports.deleteCourse = asyncHandler(async (req, res, next) => { // Delete course   DELETE /api/v1/courses/:id     Private
  const course = await Course.findById(req.params.id);
  if (!course) { return next( new ErrorResponse(`No course with the id of ${req.params.id}`, 404) ) }
  if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {  // Make sure user is course owner
    return next( new ErrorResponse( `User ${req.user.id} is not authorized to delete course ${course._id}`, 401 ) ) }
  await course.remove();  res.status(200).json({ success: true, data: {} })  });
