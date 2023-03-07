const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
      let error = { ...err };
  error.message = err.message;

  console.log(err);                                                   // Log to console for dev
  
  if (err.name === 'CastError') {                                     // Mongoose bad ObjectId(wrong or extra numbers)
    const message = `Resource not found`;
            error = new ErrorResponse(message, 404);
  }
  if (err.code === 11000) {                                           // Mongoose duplicate key(same bootcamp name for 2)
    const message = 'Duplicate field value entered';
            error = new ErrorResponse(message, 400);
  }
  if (err.name === 'ValidationError') {                               // Mongoose validation error(each field required)
    const message = Object.values(err.errors).map(val => val.message);// err has array of errors with each a message,etc
            error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
      error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
