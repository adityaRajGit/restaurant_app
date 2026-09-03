import _ from "lodash";
import { Router } from "express";
import {
  userSignupHandler,
  userLoginHandler,
  userSignupHandlerGoogle,
  userLoginHandlerGoogle,
  forgotPasswordHandler,
  resetPasswordHandler,
  changeUserPasswordHandler,
  handleValidationChangePassword,
} from "../../common/lib/auth/authHandler";
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";
import { sendContactSupportEmail } from "../../common/util/utilHelper";
import { verifyToken } from "../../common/lib/auth/authMiddleware";
import protectRoutes from "../../common/util/protectRoutes.js";

const router = new Router();

router.route("/signup").post(async (req, res) => {
  try {
    const result = await userSignupHandler(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/login").post(async (req, res) => {
  try {
    const result = await userLoginHandler(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/me").get(verifyToken, async (req, res) => {
  res.status(responseStatus.STATUS_SUCCESS_OK).json(req.user);
});

router.route("/google-auth").post(async (req, res) => {
  try {
    const result = await userSignupHandlerGoogle(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/google-auth-signin").post(async (req, res) => {
  try {
    const result = await userLoginHandlerGoogle(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/forgot-password").post(async (req, res) => {
  try {
    const result = await forgotPasswordHandler(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/reset-password").post(async (req, res) => {
  try {
    const result = await resetPasswordHandler(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/change-password").post(protectRoutes.verifyUser, async (req, res) => {
  try {
    const validation = handleValidationChangePassword(req.body);
    if (!validation.isValid) {
      throw validation.errors.join(", ");
    }

    await changeUserPasswordHandler(
      req.user.userId,
      req.body.oldPassword,
      req.body.newPassword
    );

    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: { message: "Password changed successfully" },
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

router.route("/contact-support").post(async (req, res) => {
  try {
    if (_.isEmpty(req.body)) {
      throw "no request body sent";
    }
    const result = await sendContactSupportEmail(req.body);
    res.status(responseStatus.STATUS_SUCCESS_OK).json({
      status: responseData.SUCCESS,
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(responseStatus.INTERNAL_SERVER_ERROR).json({
      status: responseData.ERROR,
      data: { message: err.message || err },
    });
  }
});

export default router;
