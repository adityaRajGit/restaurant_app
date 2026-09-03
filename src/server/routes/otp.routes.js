
import _ from 'lodash';
import { Router } from 'express';

import {
    getOtpListHandler,
    deleteOtpHandler
} from '../../common/lib/otp/otpHandler';
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";
import userHelper from '../../common/helpers/user.helper';
import { sendVerificationEmail, verifyEmailOTP } from '../../common/util/utilHelper';
import protectRoutes from '../../common/util/protectRoutes.js';

const router = new Router();

router.route('/send').post(async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw 'email is required'
        }

        const result = await sendVerificationEmail(email.toLowerCase(), "Your verification code");
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({ status: responseData.SUCCESS, data: result });
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/verify').post(async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw 'email and otp are required'
        }

        const result = await verifyEmailOTP(email.toLowerCase(), otp);

        // If the OTP belonged to a registered account, mark that email verified.
        const user = await userHelper.getObjectByQuery({ query: { email: email.toLowerCase() } });
        if (user) {
            await userHelper.directUpdateObject(user._id, {
                email_verified: true,
                updated_at: new Date(),
            });
        }

        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({ status: responseData.SUCCESS, data: result });
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/list').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        let filter = {};
        filter.query = {};

        const inputData = { ...req.body };
        if (inputData) {
            filter.pageNum = inputData.pageNum ? inputData.pageNum : 1;
            filter.pageSize = inputData.pageSize ? inputData.pageSize : 50;

            if (inputData.filters) {
                filter.query = inputData.filters;
            }
        } else {
            filter.pageNum = 1;
            filter.pageSize = 50;
        }

        const outputResult = await getOtpListHandler(filter);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: {
                otpList: outputResult.list ? outputResult.list : [],
                otpCount: outputResult.count ? outputResult.count : 0,
            },
        });
    } catch (err) {
        console.log(err);
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err },
        });
    }
});

router.route('/:id/remove').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (req.params.id) {
            await deleteOtpHandler(req.params.id);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { hasOtpDeleted: true }
            });
        } else {
            throw 'no id param sent'
        }
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

export default router;
