import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddleware.js";
import { User } from "../models/userSchema.js";

// Middleware to authenticate and authorize admin users
export const isAdminAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.adminToken; // Retrieve admin token from cookies
  if (!token) {
    return next(new ErrorHandler("Admin not Authenticated")); // If no token, return authentication error
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Verify the token
  req.user = await User.findById(decoded.id); // Find user by ID from token
  if (req.user.role !== "Admin") {
    // Check if the user role is not admin
    return next(
      new ErrorHandler(
        `${req.user.role} is not authorized for this resource!`, // Role mismatch error
        403
      )
    );
  }
  next(); // Proceed if user is authenticated as admin
});

// Middleware to authenticate and authorize patient users
export const isPatientAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.patientToken; // Retrieve patient token from cookies
  if (!token) {
    return next(new ErrorHandler("Patient not Authenticated")); // If no token, return authentication error
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); // Verify the token
  req.user = await User.findById(decoded.id); // Find user by ID from token
  if (req.user.role !== "Patient") {
    // Check if the user role is not patient
    return next(
      new ErrorHandler(
        `${req.user.role} is not authorized for this resource!`, // Role mismatch error
        403
      )
    );
  }
  next(); // Proceed if user is authenticated as patient
});
