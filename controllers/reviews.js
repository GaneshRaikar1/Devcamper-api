const ErrorResponse = require('../utils/errorResponse');  const asyncHandler = require('../middleware/async'); const Review = require('../models/Review');  const Bootcamp = require('../models/Bootcamp');

exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {  // Get reviews   GET /api/v1/reviews + /api/v1/bootcamps/:bootcampId/reviews  Public
    const reviews = await Review.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } else { res.status(200).json(res.advancedResults) } });  

exports.getReview = asyncHandler(async (req, res, next) => {  // Get single review    GET /api/v1/reviews/:id    Public
  const review = await Review.findById(req.params.id).populate({path: 'bootcamp',select: 'name description'});
  if (!review) { return next(new ErrorResponse(`No review found with the id of ${req.params.id}`, 404)  ); }
  res.status(200).json({success: true,data: review}) });  

exports.addReview = asyncHandler(async (req, res, next) => { //Add review POST /api/v1/bootcamps/:bootcampId/reviews(Private)
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;
  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) { return next(new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`, 404 ) ); }
  const review = await Review.create(req.body);
  res.status(201).json({ success: true, data: review }) });  

exports.updateReview = asyncHandler(async (req, res, next) => { // Update review   PUT /api/v1/reviews/:id     Private
  let review = await Review.findById(req.params.id);
  if (!review) { return next(new ErrorResponse(`No review with the id of ${req.params.id}`, 404 ) ); }
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {return next(new ErrorResponse(`Not authorized to update review`, 401));}   // Make sure review belongs to user or user is admin
  review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  review.save();
  res.status(200).json({ success: true, data: review }) });  

exports.deleteReview = asyncHandler(async (req, res, next) => { // Delete review   DELETE /api/v1/reviews/:id  Private
  const review = await Review.findById(req.params.id);
  if (!review) { return next(new ErrorResponse(`No review with the id of ${req.params.id}`, 404 ) ); }
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {return next(new ErrorResponse(`Not authorized to update review`, 401));}  // Make sure review belongs to user or user is admin
  await review.remove();
  res.status(200).json({ success: true, data: {} });
});    
