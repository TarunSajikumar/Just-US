import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

    req.userId = decoded.userId;
    req.user = { userId: decoded.userId }; // Compatibility with old controllers

    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
