import userHelper from "../../helpers/user.helper";
import bcrypt from "bcryptjs";
import { generateToken } from "../../util/authUtil";
import {
  getUserInfo,
  sendWelcomeEmail,
  sendVerificationEmail,
  verifyEmailOTP,
} from "../../util/utilHelper";
import { OAuth2Client } from "google-auth-library";
import _ from "lodash";
import configVariables from "../../../server/config";

const client = new OAuth2Client(configVariables.GOOGLE_CLIENT_ID);

async function generateUniqueUsername(fullName) {
  const baseUsername = fullName.toLowerCase().replace(/\s+/g, "");
  let attempt = 0;

  while (true) {
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Always 4 digits
    const username = `${baseUsername}${randomNum}`;

    const exists = await userHelper.getObjectByQuery({ query: { username } });
    if (!exists) {
      return username;
    }

    attempt++;
    if (attempt > 10000) {
      throw new Error("Too many attempts to generate a unique username");
    }
  }
}

export async function userSignupHandler(input) {
  if (!input.name || !input.phone || !input.email || !input.password) {
    throw "All fields (name, phone, email, password) are required";
  }

  const email = input.email.toLowerCase();

  const existing = await userHelper.getObjectByQuery({ query: { email } });
  if (existing) {
    throw "An account with this email already exists";
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const username = input.username || (await generateUniqueUsername(input.name));

  const user = await userHelper.addObject({
    name: input.name,
    email,
    phone: input.phone,
    username,
    password: hashedPassword,
  });

  await sendWelcomeEmail(user.email, user.name);

  const token = generateToken(
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      phone: user.phone,
    },
    "user"
  );

  return { user: getUserInfo(user), token };
}

export async function userLoginHandler(input) {
  let user;
  if (input.email) {
    user = await userHelper.getObjectByQuery({
      query: { email: input.email.toLowerCase() },
    });
  } else if (input.phone) {
    user = await userHelper.getObjectByQuery({
      query: { phone: input.phone },
    });
  }

  if (!user) {
    throw "User not found";
  }
  if (user.googleId && !user.password) {
    throw "User logged in with Google";
  }

  const isMatch = await bcrypt.compare(input.password, user.password);
  if (!isMatch) {
    throw "Invalid credentials";
  }

  await userHelper.directUpdateObject(user._id, { lastLogin: new Date() });

  const userData = {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    username: user.username,
    profile_image: user.profile_image || "",
  };

  const token = generateToken(userData, "user");

  return { user: getUserInfo(user), token };
}

/**
 * Signs a Google user up, or logs them in if the account already exists —
 * the client cannot know which it is before verifying the token.
 */
export async function userSignupHandlerGoogle(input) {
  const { idToken } = input;

  if (!idToken) {
    throw "ID token is required";
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: configVariables.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let user = await userHelper.getObjectByQuery({
    query: { $or: [{ googleId }, { email: email.toLowerCase() }] },
  });

  if (!user) {
    user = await userHelper.addObject({
      name,
      email: email.toLowerCase(),
      username: await generateUniqueUsername(name || email.split("@")[0]),
      googleId,
      profile_image: picture,
      email_verified: true,
    });
    await sendWelcomeEmail(user.email, user.name);
  } else if (!user.googleId) {
    await userHelper.directUpdateObject(user._id, { googleId });
  }

  const token = generateToken(user, "user");

  return { user: getUserInfo(user), token };
}

export async function userLoginHandlerGoogle(input) {
  const { idToken } = input;

  if (!idToken) {
    throw "ID token is required";
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: configVariables.GOOGLE_CLIENT_ID,
  });

  const { sub: googleId } = ticket.getPayload();

  const user = await userHelper.getObjectByQuery({ query: { googleId } });

  if (!user) {
    throw "User not found";
  }

  const token = generateToken(user, "user");

  return { user: getUserInfo(user), token };
}

export async function getUserByEmailHandler(input) {
  try {
    if (_.isEmpty(input.email)) {
      throw "Email is required";
    }

    const user = await userHelper.getObjectByQuery({
      query: { email: input.email.toLowerCase() },
      selectFrom: { name: 1, email: 1 },
    });

    if (!user) {
      throw "User not found!";
    }

    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function getUserByEmailPasswordHandler(input) {
  try {
    if (_.isEmpty(input.email) || _.isEmpty(input.password)) {
      throw "Email and password are required";
    }

    const user = await userHelper.getObjectByQuery({
      query: { email: input.email.toLowerCase() },
      selectFrom: { name: 1, email: 1, password: 1 },
    });

    if (!user) {
      throw "User not found!";
    }

    const passwordMatch = await bcrypt.compare(input.password, user.password);

    if (!passwordMatch) {
      throw "Incorrect password!";
    }

    delete user.password;
    return user;
  } catch (error) {
    console.log("Error in getUserByEmailPasswordHandler:", error);
    throw error;
  }
}

export function handleValidationChangePassword(body) {
  const { oldPassword, newPassword } = body;

  if (!oldPassword || !newPassword) {
    return {
      isValid: false,
      errors: ["oldPassword and newPassword are required"],
    };
  }

  if (oldPassword === newPassword) {
    return {
      isValid: false,
      errors: ["new password must differ from the old password"],
    };
  }

  if (newPassword.length < 8) {
    return {
      isValid: false,
      errors: ["new password must be at least 8 characters"],
    };
  }

  return { isValid: true, errors: [] };
}

export async function changeUserPasswordHandler(objectId, oldPassword, newPassword) {
  const user = await userHelper.getObjectById({ id: objectId });

  if (!user) {
    throw "User not found";
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password || "");
  if (!isMatch) {
    throw "Current password is incorrect";
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  return await userHelper.directUpdateObject(objectId, {
    password: hashedPassword,
    updated_at: new Date(),
  });
}

/**
 * Sends a reset OTP. OTPs live in the Otp collection (see models/otp),
 * which expires them itself via a TTL index.
 */
export async function forgotPasswordHandler(input) {
  try {
    const { email } = input;

    if (!email) {
      throw "Email is required";
    }

    const user = await userHelper.getObjectByQuery({
      query: { email: email.toLowerCase() },
      selectFrom: { name: 1, email: 1, _id: 1 },
    });

    if (!user) {
      throw "User with this email does not exist";
    }

    await sendVerificationEmail(user.email, "Reset your password");

    return {
      message: "OTP sent successfully to your email",
      email: user.email,
    };
  } catch (error) {
    console.log("Error in forgotPasswordHandler:", error);
    throw error;
  }
}

export async function resetPasswordHandler(input) {
  try {
    const { email, otp, newPassword } = input;

    if (!email || !otp || !newPassword) {
      throw "Email, otp, and new password are required";
    }

    const user = await userHelper.getObjectByQuery({
      query: { email: email.toLowerCase() },
      selectFrom: { name: 1, email: 1, _id: 1 },
    });

    if (!user) {
      throw "User with this email does not exist";
    }

    await verifyEmailOTP(user.email, otp);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userHelper.directUpdateObject(user._id, {
      password: hashedPassword,
      updated_at: new Date(),
    });

    return { message: "Password reset successfully" };
  } catch (error) {
    console.log("Error in resetPasswordHandler:", error);
    throw error;
  }
}
