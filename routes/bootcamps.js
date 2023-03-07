const express = require('express');
const {getBootcamps,getBootcamp,createBootcamp,updateBootcamp,deleteBootcamp,getBootcampsInRadius,bootcampPhotoUpload} = require('../controllers/bootcamps');
const Bootcamp = require('../models/Bootcamp');

const courseRouter = require('./courses');                        // Include other resource routers
const reviewRouter = require('./reviews');

const router = express.Router();
const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router.use('/:bootcampId/courses', courseRouter);                 // Re-route into other resource routers
router.use('/:bootcampId/reviews', reviewRouter);

router
   .route('/radius/:zipcode/:distance')
   .get(getBootcampsInRadius);
   
router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);

router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp);

router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

module.exports = router;
