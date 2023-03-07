const crypto = require('crypto');     const bcrypt = require('bcryptjs');       const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');  const randomize = require('randomatic');
const UserSchema = new mongoose.Schema({
  name:     { type: String, required: [true, 'Please add a name'] },
  email:    { type: String, required: [true, 'Please add an email'], unique: true,
    match: [ /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email' ]  },
  role:     { type: String, enum: ['user', 'publisher'], default: 'user' },
  password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },
  resetPasswordToken: String,   resetPasswordExpire: Date,   confirmEmailToken: String,
  isEmailConfirmed: { type: Boolean, default: false },
  twoFactorCode: String,  twoFactorCodeExpire: Date,
  twoFactorEnable:  { type: Boolean, default: false },
  createdAt:        { type: Date,    default: Date.now }  });

UserSchema.pre('save', async function (next) {                    // Encrypt password using bcrypt
  if (!this.isModified('password')) { next() }                    // if pw not modifeid then just run below 2 lines
     const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt)  });

UserSchema.methods.getSignedJwtToken = function () {               // Sign JWT and return
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })  };

UserSchema.methods.matchPassword = async function (enteredPassword) {  // Match user entered password to hashed password in database
  return await bcrypt.compare(enteredPassword, this.password)  };

UserSchema.methods.getResetPasswordToken = function () {                                  // Generate and hash password token 
          const resetToken = crypto.randomBytes(20).toString('hex');                      // Generate token, 20 random bytes are added, buffer to string convert
   this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // Hash token and set to resetPasswordToken field
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;                                 // Set expire- 10 mins
  return resetToken  };                                                                   // token is sent in reponse, but its hashed version is saved in Database
  
UserSchema.methods.generateEmailConfirmToken = function (next) {                 // Generate email confirm token
   const confirmationToken = crypto.randomBytes(20).toString('hex');             // email confirmation token
    this.confirmEmailToken = crypto.createHash('sha256').update(confirmationToken).digest('hex');
  const confirmTokenExtend = crypto.randomBytes(100).toString('hex');
  const confirmTokenCombined = `${confirmationToken}.${confirmTokenExtend}`;
  return confirmTokenCombined; };

module.exports = mongoose.model('User', UserSchema);
