import config from "../../server/config";
import jwt from "jsonwebtoken";

/**
 * Signs a JWT for a user or admin document. Only the id, role and a couple
 * of display fields go in the payload — everything else is read from the DB
 * on each request, so a stale token can never carry stale permissions.
 */
export function generateToken(user, role) {
  const payload = {
    userId: user._id,
    role,
    email: user.email,
    name: user.name,
  };
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRATION,
  });
}
