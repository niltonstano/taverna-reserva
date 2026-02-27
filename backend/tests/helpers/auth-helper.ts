// tests/helpers/auth-helper.ts
import jwt from "jsonwebtoken";

export const generateTestToken = (
  id: string,
  email: string,
  role = "customer",
) => {
  // Use a mesma SECRET que está no seu .env ou config de teste
  const secret = process.env.JWT_SECRET || "test-secret";
  return jwt.sign({ id, email, role }, secret, { expiresIn: "1h" });
};
