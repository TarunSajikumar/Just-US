import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import AppLockSettings from "../models/AppLockSettings";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth.middleware";

/**
 * POST /api/applock/setup
 * Setup app lock (PIN or biometric)
 */
export const setupAppLock = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { lockType, pin, biometricType, lockOnAppStart, lockOnAppBackground } = req.body;

  if (!lockType || (lockType === "pin" && !pin)) {
    return res.status(400).json({ message: "Valid lockType and PIN are required" });
  }

  if (lockType === "pin" && pin.length !== 4 && pin.length !== 6) {
    return res.status(400).json({ message: "PIN must be 4 or 6 digits" });
  }

  try {
    const pinHash = lockType === "pin" ? await bcrypt.hash(pin, 10) : null;

    let settings = await AppLockSettings.findOne({ userId });
    if (!settings) {
      settings = new AppLockSettings({ userId });
    }

    settings.isLockEnabled = true;
    settings.lockType = lockType as any;
    if (lockType === "pin") {
      settings.pinHash = pinHash;
    }
    settings.biometricEnabled = lockType === "biometric";
    settings.biometricType = biometricType || null;
    settings.lockOnAppStart = lockOnAppStart !== false;
    settings.lockOnAppBackground = lockOnAppBackground !== false;

    await settings.save();

    // Also update User model reference
    await User.findByIdAndUpdate(userId, { appLockSettings: settings._id });

    return res.status(201).json({
      success: true,
      message: "App lock configured",
      settings: {
        isLockEnabled: settings.isLockEnabled,
        lockType: settings.lockType,
        biometricEnabled: settings.biometricEnabled,
        lockOnAppStart: settings.lockOnAppStart,
        lockOnAppBackground: settings.lockOnAppBackground,
      },
    });
  } catch (error) {
    console.error("setupAppLock error:", error);
    return res.status(500).json({ message: "Failed to setup app lock" });
  }
};

/**
 * POST /api/applock/verify
 * Verify PIN or biometric
 */
export const verifyAppLock = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { pin, biometric } = req.body;

  try {
    const settings = await AppLockSettings.findOne({ userId }).select("+pinHash");
    if (!settings || !settings.isLockEnabled) {
      return res.status(400).json({ message: "App lock not enabled" });
    }

    // Check if locked due to failed attempts
    if (settings.lockedUntil && settings.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((settings.lockedUntil.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${minutesLeft} minutes`,
      });
    }

    let verified = false;

    if (settings.lockType === "pin" && pin) {
      verified = await bcrypt.compare(pin, settings.pinHash || "");
    } else if (settings.lockType === "biometric" && biometric) {
      verified = true; // Biometric verification is done on client side
    }

    if (!verified) {
      settings.failedAttempts += 1;

      // Lock for 5 minutes after 5 failed attempts
      if (settings.failedAttempts >= 5) {
        settings.lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
      }

      await settings.save();
      return res.status(401).json({
        message: "Verification failed",
        attemptsRemaining: Math.max(0, 5 - settings.failedAttempts),
      });
    }

    // Reset failed attempts on successful verification
    settings.failedAttempts = 0;
    settings.lockedUntil = null;
    settings.lastUnlockTime = new Date();
    await settings.save();

    return res.json({
      success: true,
      message: "App unlocked",
    });
  } catch (error) {
    console.error("verifyAppLock error:", error);
    return res.status(500).json({ message: "Verification failed" });
  }
};

/**
 * GET /api/applock/settings
 * Get app lock settings
 */
export const getAppLockSettings = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const settings = await AppLockSettings.findOne({ userId });
    if (!settings) {
      return res.json({
        isLockEnabled: false,
        lockType: "pin",
        biometricEnabled: false,
        lockOnAppStart: true,
        lockOnAppBackground: true,
        lockTimeoutMinutes: 5,
      });
    }

    return res.json({
      isLockEnabled: settings.isLockEnabled,
      lockType: settings.lockType,
      biometricEnabled: settings.biometricEnabled,
      biometricType: settings.biometricType,
      lockOnAppStart: settings.lockOnAppStart,
      lockOnAppBackground: settings.lockOnAppBackground,
      lockTimeoutMinutes: settings.lockTimeoutMinutes,
    });
  } catch (error) {
    console.error("getAppLockSettings error:", error);
    return res.status(500).json({ message: "Failed to fetch settings" });
  }
};

/**
 * PUT /api/applock/change-pin
 * Change PIN
 */
export const changePin = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { oldPin, newPin } = req.body;

  if (!oldPin || !newPin) {
    return res.status(400).json({ message: "Old and new PIN required" });
  }

  if (newPin.length !== 4 && newPin.length !== 6) {
    return res.status(400).json({ message: "PIN must be 4 or 6 digits" });
  }

  try {
    const settings = await AppLockSettings.findOne({ userId }).select("+pinHash");
    if (!settings || settings.lockType !== "pin") {
      return res.status(400).json({ message: "PIN lock not enabled" });
    }

    const isValid = await bcrypt.compare(oldPin, settings.pinHash || "");
    if (!isValid) {
      return res.status(401).json({ message: "Current PIN is incorrect" });
    }

    settings.pinHash = await bcrypt.hash(newPin, 10);
    await settings.save();

    return res.json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    console.error("changePin error:", error);
    return res.status(500).json({ message: "Failed to change PIN" });
  }
};

/**
 * PUT /api/applock/toggle
 * Enable/Disable app lock
 */
export const toggleAppLock = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { enabled } = req.body;

  try {
    const settings = await AppLockSettings.findOne({ userId });
    if (!settings) {
      return res.status(404).json({ message: "App lock settings not found" });
    }

    settings.isLockEnabled = enabled === true;
    await settings.save();

    return res.json({
      success: true,
      isLockEnabled: settings.isLockEnabled,
    });
  } catch (error) {
    console.error("toggleAppLock error:", error);
    return res.status(500).json({ message: "Failed to toggle app lock" });
  }
};

/**
 * DELETE /api/applock/remove
 * Remove app lock completely
 */
export const removeAppLock = async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    await AppLockSettings.deleteOne({ userId });
    await User.findByIdAndUpdate(userId, { appLockSettings: null });

    return res.json({
      success: true,
      message: "App lock removed",
    });
  } catch (error) {
    console.error("removeAppLock error:", error);
    return res.status(500).json({ message: "Failed to remove app lock" });
  }
};
