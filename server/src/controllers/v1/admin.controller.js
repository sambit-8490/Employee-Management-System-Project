import { AdminModel, UserModel } from "../../models/index.js";
import bcrypt from "bcrypt";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { SALT_ROUND, USER_ROLE } from "../../constant.js";
import { compareRole } from "../../utils/roleHelper.js";
import {
  checkArgsIfExists,
  checkIfStringArgsIsEmpty,
} from "../../utils/bodyHelper.js";

/* ---------------- COOKIE CONFIG ---------------- */
const cookieOptions = {
  maxAge: 1000 * 60 * 60 * 24,
  httpOnly: true,
  secure: false,
  sameSite: "lax",
};

/* ---------------- HELPERS ---------------- */
const getAdminEmail = (req) =>
  req.user?.adminEmail || req.user?.email;

/* ---------------- REGISTER ADMIN ---------------- */
const registerAdmin = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phoneNumber,
  } = req.body;

  checkArgsIfExists(firstName, lastName, email, password, confirmPassword);
  checkIfStringArgsIsEmpty(
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    phoneNumber
  );

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password doesn't match");
  }

  const existingUser = await AdminModel.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const encryptedPassword = await bcrypt.hash(password, SALT_ROUND);

  const user = await AdminModel.create({
    firstName,
    lastName,
    email,
    password: encryptedPassword,
    Role: USER_ROLE.Admin,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "Admin registered successfully", user));
});

/* ---------------- LOGIN ADMIN ---------------- */
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  checkArgsIfExists(email, password);
  checkIfStringArgsIsEmpty(email, password);

  const user = await AdminModel.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Admin not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const adminToken = await user.generateAdminToken();

  return res
    .status(200)
    .cookie("adminToken", adminToken, cookieOptions)
    .json(
      new ApiResponse(200, "Login successful", {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.Role,
      })
    );
});

/* ---------------- UPDATE PASSWORD ---------------- */
const updatePassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  checkArgsIfExists(newPassword, confirmPassword);
  checkIfStringArgsIsEmpty(newPassword, confirmPassword);

  if (!compareRole(req.user.role, USER_ROLE.Admin)) {
    throw new ApiError(401, "Unauthorized");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const user = await AdminModel.findOne({ email: req.user.email });

  if (!user) {
    throw new ApiError(404, "Admin not found");
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUND);
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Password updated successfully"));
});

/* ---------------- LOGOUT ---------------- */
const logoutAdmin = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("adminToken", cookieOptions)
    .json(new ApiResponse(200, "Logout successful"));
});

/* ---------------- ADMIN PROFILE ---------------- */
const getAdminProfile = asyncHandler(async (req, res) => {
  const adminEmail = getAdminEmail(req);

  const user = await AdminModel.findOne({ email: adminEmail });

  if (!user) {
    throw new ApiError(404, "Admin not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Admin fetched successfully", {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.Role,
      })
    );
});

/* ---------------- REGISTER USER ---------------- */
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber } = req.body;
  const { adminId, adminEmail } = req.user;

  if (!firstName || !lastName || !email || !password || !phoneNumber) {
    throw new ApiError(400, "Missing required fields");
  }

  const exists = await UserModel.findOne({ email });

  if (exists) {
    throw new ApiError(400, "User already exists");
  }

  const encryptedPassword = await bcrypt.hash(password, SALT_ROUND);

  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    password: encryptedPassword,
    phoneNumber,
    adminId,
    adminEmail,
  });

  const { password: _, ...userWithoutPassword } = user.toObject();

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", userWithoutPassword));
});

/* ---------------- DELETE USER ---------------- */
const deleteUser = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOneAndDelete({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "User deleted successfully"));
});

/* ---------------- GET USERS ---------------- */
const getUsers = asyncHandler(async (req, res) => {
  const adminEmail = getAdminEmail(req);

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  const users = await UserModel.find({ adminEmail });

  return res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully", users));
});

/* ---------------- ACTIVE USERS ---------------- */
const getActiveUsers = asyncHandler(async (req, res) => {
  const adminEmail = getAdminEmail(req);

  const users = await UserModel.find({
    adminEmail,
    isActive: true,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Active users fetched", users));
});

/* ---------------- DAILY REPORTS ---------------- */
const getAllDailyReportsForAdmin = asyncHandler(async (req, res) => {
  const adminEmail = getAdminEmail(req);

  const users = await UserModel.find({ adminEmail });

  return res
    .status(200)
    .json(new ApiResponse(200, "Reports fetched successfully", users));
});

const getDailyReportByEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Report fetched successfully", user));
});

/* ---------------- SEND NOTICES ---------------- */
const sendNotices = asyncHandler(async (req, res) => {
  const adminEmail = getAdminEmail(req);
  const { message, email } = req.body;

  if (!message || !email) {
    throw new ApiError(400, "Missing required fields");
  }

  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.employeeNotices.push({
    message,
    createdAt: new Date(),
    createdBy: adminEmail,
  });

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Notice sent successfully", user));
});

/* ---------------- EXPORTS ---------------- */
export {
  registerAdmin,
  loginAdmin,
  updatePassword,
  logoutAdmin,
  getAdminProfile,

  registerUser,
  deleteUser,
  getUsers,
  getActiveUsers,

  getAllDailyReportsForAdmin,
  getDailyReportByEmail,

  sendNotices,
};
