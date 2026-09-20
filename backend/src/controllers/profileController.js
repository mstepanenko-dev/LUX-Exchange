const bcrypt = require("bcrypt");
const prisma = require("../lib/prisma");

const MAX_NAME_LENGTH = 80;

const profileSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  createdAt: true,
};

const getUserId = (req) => req.user.userId;

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: getUserId(req) },
      select: profileSelect,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({ success: true, user });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const body = req.body || {};

    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be changed",
      });
    }

    const updates = {};
    for (const field of ["firstName", "lastName"]) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        const value = body[field];
        if (value !== null && typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field === "firstName" ? "First" : "Last"} name must be text`,
          });
        }

        const trimmedValue = typeof value === "string" ? value.trim() : "";
        if (trimmedValue.length > MAX_NAME_LENGTH) {
          return res.status(400).json({
            success: false,
            message: "Names must be 80 characters or fewer",
          });
        }
        updates[field] = trimmedValue || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one profile name is required",
      });
    }

    const user = await prisma.user.update({
      where: { id: getUserId(req) },
      data: updates,
      select: profileSelect,
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body || {};

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password, new password, and confirmation are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirmation do not match",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: getUserId(req) },
      select: { passwordHash: true },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: getUserId(req) },
      data: { passwordHash },
    });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
