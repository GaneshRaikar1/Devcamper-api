const path = require('path');const express = require('express');const dotenv = require('dotenv');const morgan = require('morgan');
const colors = require('colors');const fileupload = require('express-fileupload');const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');const helmet = require('helmet');const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');const hpp = require('hpp');const cors = require('cors');
const errorHandler = require('./middleware/error');const connectDB = require('./config/db');

dotenv.config({ path: './config/config.env' });            // Load env vars
connectDB(); 
// Route files
const bootcamps = require('./routes/bootcamps');const courses = require('./routes/courses');
const auth = require('./routes/auth');const users = require('./routes/users');const reviews = require('./routes/reviews');

const app = express();
app.use(express.json());     // Body parser
app.use(cookieParser());     // Cookie parser
if (process.env.NODE_ENV === 'development') {app.use(morgan('dev'));}   // Dev logging middleware
const limiter = rateLimit({windowMs: 10 * 60 * 1000,max: 100});         // 10 mins,100 requests
app.use(limiter);            // Rate limiting
app.use(fileupload());       // File uploading
app.use(mongoSanitize());    // Sanitize data
app.use(helmet());           // Set security headers
app.use(xss());              // Prevent XSS attacks
app.use(hpp());              // Prevent http param pollution
app.use(cors());             // Enable CORS
app.use(express.static(path.join(__dirname, 'public')));// Set static folder
// Mount routers
app.use('/api/v1/bootcamps', bootcamps);app.use('/api/v1/courses', courses);app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);app.use('/api/v1/reviews', reviews);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

process.on('unhandledRejection', (err, promise) => {console.log(`Error: ${err.message}`.red)} );     // Handle unhandled promise rejections
// server.close(() => process.exit(1)); // Close server & exit process