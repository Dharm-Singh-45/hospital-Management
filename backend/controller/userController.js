import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/userSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from 'cloudinary'


/* Register a patient */

export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    password,
    role
   
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !aadharNumber ||
    !dob ||
    !gender ||
    !password ||
    !role
  ) {
    return next(new ErrorHandler("Please Fill Full Form", 400));
  }
  let user = await User.findOne({ email });
  if (user) {
    return next(new ErrorHandler("User Already Registered", 400));
  }
  user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    password,
     role
  });

  generateToken(user, "user Registered!", 200, res);

  /* res.status(200).json({
    success:true,
    message:"user registered"
  }) */
});

/* Login patient */

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, confirmPassword, role } = req.body;

  if (!email || !password || !confirmPassword || !role) {
    return next(new ErrorHandler("Please Provide All Details", 400));
  }
  if (password !== confirmPassword) {
    return next(
      new ErrorHandler("Password and ConfirmPassword do not match!", 400)
    );
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found", 400));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password", 400));
  }
  if (role !== user.role) {
    return next(new ErrorHandler("user with this role not found", 400));
  }

  generateToken(user, "User loggedIn Successfully!", 200, res);
  /*   res.status(200).json({
        success:true,
        message:"User loggedIn Successfully"
      })
        */
});

/* Add New Admin  */
export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    password,
  } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !aadharNumber ||
    !dob ||
    !gender ||
    !password
  ) {
    return next(new ErrorHandler("Please Fill Full Form", 400));
  }
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(
      new ErrorHandler(
        `${isRegistered.role} with this email already exist`,
        400
      )
    );
  }
  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    password,
    role: "Admin",
  });
  res.status(200).json({
    success: true,
    message: "New Admin Registered",
  });
});

/* Get All Doctors */

export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({
    success: true,
    doctors,
  });
});

/* Get User Details */

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

/* Logout Admin */

export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("adminToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Admin Logged Out Successfully",
    });
});

/* Logout Patient */

export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("patientToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Patient Logged Out Successfully",
    });
});

/* Add new doctor */



export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar is Required", 400));
  }

  const { docAvatar } = req.files;

  // Validate file format
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype.toLowerCase())) {
    return next(new ErrorHandler("File Format Not Supported!", 400));
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    password,
    doctorDepartment,
  } = req.body;

  // Validate form fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !aadharNumber ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment
  ) {
    return next(new ErrorHandler("Please Fill Full Form", 400));
  }

  // Check if user already registered
  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(
      new ErrorHandler(
        `${isRegistered.role} Already Registered with this email`,
        400
      )
    );
  }

  // Upload file to Cloudinary
  const cloudinaryResponse = await cloudinary.v2.uploader.upload(
    docAvatar.tempFilePath,
    {
      folder: "doctors", // Store in 'doctors' folder
    }
  );

  if (!cloudinaryResponse || !cloudinaryResponse.secure_url) {
    return next(
      new ErrorHandler("Failed to upload avatar to Cloudinary", 500)
    );
  }

  // Create new doctor user
  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    password,
    doctorDepartment,
    role: "Doctor",
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  // Respond with success
  res.status(200).json({
    success: true,
    message: "New Doctor Registered!",
    doctor,
  });
});
