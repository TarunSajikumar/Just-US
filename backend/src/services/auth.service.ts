import User from "../models/User";
import jwt from "jsonwebtoken";

export const signupUser = async (data: any) => {
  const { email, phone } = data;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email: email }, { phone: phone }]
  });

  if (existingUser) {
    throw new Error("User already exists with this email or phone");
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    relationship_mode: data.relationship_mode || "NONE",
    invite_code: data.invite_code || null
  });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  return { user, token };
};

export const loginUser = async (data: any) => {
  const contact = data.email || data.phone;
  const user = await User.findOne({
    $or: [{ email: contact }, { phone: contact }]
  });

  if (!user) {
    throw new Error("User not found");
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  return { token, user };
};
