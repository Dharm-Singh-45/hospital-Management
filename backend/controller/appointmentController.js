import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

// Controller to handle booking an appointment
export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  // Extracting appointment details and patient information from the request body
  const {
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    appointment_date,
    department,
    doctor_firstName,
    doctor_lastName,
    hasVisited,
    address,
  } = req.body;

  // Validating required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !aadharNumber ||
    !dob ||
    !gender ||
    !appointment_date ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address
  ) {
    return next(new ErrorHandler("Please Fill Full Form", 400)); // Return error if any field is missing
  }

  // Finding the doctor in the database based on provided details
  const isConflict = await User.find({
    firstName: doctor_firstName, // Doctor's first name
    lastName: doctor_lastName, // Doctor's last name
    role: "Doctor", // Ensuring the role is "Doctor"
    doctorDepartment: department, // Matching the doctor's department
  });

  // Handling cases where no doctor is found
  if (isConflict.length === 0) {
    return next(new ErrorHandler("Doctor not found", 404)); // Error if doctor doesn't exist
  }

  // Handling cases where multiple doctors match the criteria
  if (isConflict.length > 1) {
    return next(
      new ErrorHandler(
        "Doctors Conflict Please Contact Through Phone or Email", // Prompt user to contact support
        404
      )
    );
  }

  // If exactly one doctor is found, retrieve their ID
  const doctorId = isConflict[0]._id;

  // Get the patient's ID from the authenticated request
  const patientId = req.user._id;

  // Creating a new appointment record in the database
  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    aadharNumber,
    dob,
    gender,
    appointment_date,
    department,
    doctor: {
      firstName: doctor_firstName,
      lastName: doctor_lastName,
    },
    hasVisited,
    address,
    doctorId,
    patientId,
  });

  // Responding with success and appointment details
  res.status(200).json({
    success: true,
    message: "Appointment sent Successfully",
    appointment, // Appointment details returned in the response
  });
});

/*  Controller to handle fetching all appointments */

export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  // Fetch all appointment records from the database
  const appointments = await Appointment.find();

  // Responding with success and the list of appointments
  res.status(200).json({
    success: true, // Indicates the request was successful
    appointments, // Returns all appointment records as part of the response
  });
});

/* Appointment status update */

export const updateAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
    const { id } = req.params; // Extract appointment ID from request parameters

    // Check if the appointment exists in the database
    let appointment = await Appointment.findById(id);
    if (!appointment) {
      return next(new ErrorHandler("Appointment not found", 404)); // Handle case when appointment is not found
    }

    // Update the appointment with the provided data in the request body
    appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Ensure validation rules are applied during the update
      useFindAndModify: false, // Use the native `findOneAndUpdate` method instead of the deprecated MongoDB driver method
    });

    // Send success response with the updated appointment details
    res.status(200).json({
      success: true,
      message: "Appointment Status Updated!",
      appointment,
    });
  }
);

/* Delete Appointment */

export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Extract appointment ID from request parameters

  // Find the appointment by ID in the database
  let appointment = await Appointment.findById(id);

  // If the appointment doesn't exist, return an error
  if (!appointment) {
    return next(new ErrorHandler("Appointment not found", 404));
  }

  // Delete the appointment from the database
  await appointment.deleteOne();

  // Send a success response confirming the deletion
  res.status(200).json({
    success: true,
    message: "Appointment deleted successfully!",
  });
});
