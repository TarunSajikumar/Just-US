import { supabase } from "../config/supabase";
import jwt from "jsonwebtoken";

export const signupUser = async (data: any) => {
  const { email, phone } = data;

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .or(`email.eq.${email},phone.eq.${phone}`)
    .maybeSingle();

  if (existingUser) {
    throw new Error("User already exists with this email or phone");
  }

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      relationship_mode: data.relationship_mode || "NONE",
      invite_code: data.invite_code || null
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase signup error:', error);
    throw new Error(error.message || "Signup failed");
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  const { password, ...safeUser } = user;

  return { user: safeUser, token };
};

export const loginUser = async (data: any) => {
  const contact = data.email || data.phone;
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${contact},phone.eq.${contact}`)
    .single();

  if (!user || error) {
    throw new Error("User not found");
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  const { password, ...safeUser } = user;

  return { token, user: safeUser };
};
