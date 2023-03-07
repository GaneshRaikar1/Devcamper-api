const path = require('path'); const ErrorResponse = require('../utils/errorResponse'); const asyncHandler = require('../middleware/async'); const geocoder = require('../utils/geocoder'); const Bootcamp = require('../models/Bootcamp');

exports.getBootcamps = asyncHandler(async (req, res, next) => {  // Get all bootcamps    GET /api/v1/bootcamps   Public
  res.status(200).json(res.advancedResults)  });

exports.getBootcamp = asyncHandler(async (req, res, next) => {   // Get single bootcamp   GET /api/v1/bootcamps/:id   Public
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) { return next( new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404) ) }
  res.status(200).json({ success: true, data: bootcamp })  });

exports.createBootcamp = asyncHandler(async (req, res, next) => { //  Create new bootcamp   POST /api/v1/bootcamps  Private
  req.body.user = req.user.id;                                    // Add user to req,body
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });  // Check for published bootcamp
  if (publishedBootcamp && req.user.role !== 'admin') {        // If the user is not an admin, they can only add one bootcamp
    return next( new ErrorResponse( `The user with ID ${req.user.id} has already published a bootcamp`, 400 ) ) }
  const bootcamp = await Bootcamp.create(req.body);
  res.status(201).json({ success: true, data: bootcamp })  });

exports.updateBootcamp = asyncHandler(async (req, res, next) => { // Update bootcamp    PUT /api/v1/bootcamps/:id   Private
  let bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) { return next( new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404) ) }
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {   // Make sure user is bootcamp owner
    return next( new ErrorResponse( `User ${req.user.id} is not authorized to update this bootcamp`, 401 ) ) }
  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: bootcamp })  });

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {  // Delete bootcamp   DELETE /api/v1/bootcamps/:id  Private
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) { return next( new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404) ) }
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {  // Make sure user is bootcamp owner
    return next( new ErrorResponse( `User ${req.user.id} is not authorized to delete this bootcamp`, 401 ) ) }
  await bootcamp.remove();
  res.status(200).json({ success: true, data: {} })  });

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {  // Get bootcamps within a radius   GET /api/v1/bootcamps/radius/:zipcode/:distance   Private
  const { zipcode, distance } = req.params;
  const loc = await geocoder.geocode(zipcode);                           // Get lat/lng from geocoder
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;
  const radius = distance / 3963;  // Calc radius using radians , Divide dist by radius of Earth , Earth Radius = 3,963 mi / 6,378 km
  const bootcamps = await Bootcamp.find({ location: { $geoWithin: { $centerSphere: [[lng, lat], radius]} }  });
  res.status(200).json({ success: true, count: bootcamps.length, data: bootcamps })  });
  
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {  // Upload photo for bootcamp   PUT /api/v1/bootcamps/:id/photo  Private
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) { return next( new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404) ) }
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {   // Make sure user is bootcamp owner
    return next( new ErrorResponse( `User ${req.user.id} is not authorized to update this bootcamp`, 401 ) ) }
  if (!req.files) { return next(new ErrorResponse(`Please upload a file`, 400)) }
  const file = req.files.file;
  if (!file.mimetype.startsWith('image')) { return next(new ErrorResponse(`Please upload an image file`, 400)) } // Make sure the image is a photo
  if (file.size > process.env.MAX_FILE_UPLOAD) {              // Check filesize ,1 MB
    return next( new ErrorResponse( `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 400 ) ) }
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;        // Create custom filename
  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500))
    }
    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(200).json({ success: true, data: file.name })
  });
});
