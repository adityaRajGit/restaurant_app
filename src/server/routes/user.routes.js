
import _ from 'lodash';
import { Router } from 'express';
import multer from 'multer';

import {
    addNewUserHandler,
    addUserAddressHandler,
    deleteUserHandler,
    getUserDetailsHandler,
    getUserListHandler,
    removeUserAddressHandler,
    requestEmailVerificationHandler,
    toggleFavouriteItemHandler,
    updateUserDetailsHandler,
    verifyUserEmailHandler
} from '../../common/lib/user/userHandler';
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";
import { storage } from "../../util/cloudinary.js";
import protectRoutes from '../../common/util/protectRoutes.js';

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
const router = new Router();

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

        filter.query = { is_deleted: false, ...filter.query };

        const outputResult = await getUserListHandler(filter);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: {
                userList: outputResult.list ? outputResult.list : [],
                userCount: outputResult.count ? outputResult.count : 0,
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

router.route('/new').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (!_.isEmpty(req.body)) {
            const outputResult = await addNewUserHandler(req.body);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { user: outputResult ? outputResult : {} }
            });
        } else {
            throw 'no request body sent'
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

router.route('/profile').get(protectRoutes.verifyUser, async (req, res) => {
    try {
        const gotUser = await getUserDetailsHandler({ id: req.user.userId });
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: { user: gotUser ? gotUser : {} }
        });
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/profile/update').post(protectRoutes.verifyUser, upload.single("profile_image"), async (req, res) => {
    try {
        if (!_.isEmpty(req.body) || req.file) {
            let input = {
                objectId: req.user.userId,
                updateObject: { ...req.body },
                profile_image: req.file
            }
            const updateObjectResult = await updateUserDetailsHandler(input);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { user: updateObjectResult ? updateObjectResult : {} }
            });
        } else {
            throw 'no request body sent'
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

router.route('/verify-email/request').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        const result = await requestEmailVerificationHandler(req.user.userId);
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

router.route('/verify-email').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        if (!req.body.otp) {
            throw 'otp is required'
        }
        await verifyUserEmailHandler(req.user.userId, req.body.otp);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: { hasEmailVerified: true }
        });
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/address').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        if (_.isEmpty(req.body)) {
            throw 'no request body sent'
        }
        await addUserAddressHandler(req.user.userId, req.body);
        const user = await getUserDetailsHandler({ id: req.user.userId });
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: { addresses: user ? user.addresses : [] }
        });
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/address/:addressId/remove').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        await removeUserAddressHandler(req.user.userId, req.params.addressId);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: { hasAddressRemoved: true }
        });
    } catch (err) {
        console.log(err)
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/favourite/:menuItemId').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        const result = await toggleFavouriteItemHandler(req.user.userId, req.params.menuItemId);
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

router.route('/:id').get(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (req.params.id) {
            const gotUser = await getUserDetailsHandler({ id: req.params.id });
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { user: gotUser ? gotUser : {} }
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

router.route('/:id/remove').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (req.params.id) {
            await deleteUserHandler(req.params.id);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { hasUserDeleted: true }
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
