
import _ from 'lodash';
import { Router } from 'express';

import {
    cancelOrderHandler,
    deleteOrderHandler,
    getOrderDetailsHandler,
    getOrderListHandler,
    getUserOrderListHandler,
    placeOrderHandler,
    updateOrderStatusHandler,
    updatePaymentStatusHandler
} from '../../common/lib/order/orderHandler';
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";
import protectRoutes from '../../common/util/protectRoutes.js';

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
        filter.populatedQuery = [{ path: 'user', select: 'name email phone' }];

        const outputResult = await getOrderListHandler(filter);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: {
                orderList: outputResult.list ? outputResult.list : [],
                orderCount: outputResult.count ? outputResult.count : 0,
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

router.route('/my').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        const inputData = { ...req.body };
        const filter = {
            pageNum: inputData.pageNum ? inputData.pageNum : 1,
            pageSize: inputData.pageSize ? inputData.pageSize : 50,
            query: inputData.filters ? inputData.filters : {},
        };

        const outputResult = await getUserOrderListHandler(req.user.userId, filter);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: {
                orderList: outputResult.list ? outputResult.list : [],
                orderCount: outputResult.count ? outputResult.count : 0,
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

router.route('/new').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        if (!_.isEmpty(req.body)) {
            const outputResult = await placeOrderHandler({
                ...req.body,
                user: req.user.userId,
            });
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    order: outputResult ? outputResult : {}
                }
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

router.route('/:id').get(protectRoutes.authenticateToken, async (req, res) => {
    try {
        if (req.params.id) {
            const gotOrder = await getOrderDetailsHandler({ id: req.params.id });
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    order: gotOrder ? gotOrder : {}
                }
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

router.route('/:id/status').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (req.params.id && req.body.status) {
            const updated = await updateOrderStatusHandler({
                objectId: req.params.id,
                status: req.body.status,
                reason: req.body.reason,
                changedBy: req.admin._id,
            });
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { order: updated ? updated : {} }
            });
        } else {
            throw 'expecting id param and status in body'
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

router.route('/:id/cancel').post(protectRoutes.verifyUser, async (req, res) => {
    try {
        if (req.params.id) {
            const cancelled = await cancelOrderHandler({
                objectId: req.params.id,
                reason: req.body.reason,
                changedBy: req.user.userId,
            });
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { order: cancelled ? cancelled : {} }
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

router.route('/:id/payment').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (req.params.id && req.body.payment_status) {
            await updatePaymentStatusHandler(
                req.params.id,
                req.body.payment_status,
                req.body.payment_reference
            );
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { hasPaymentUpdated: true }
            });
        } else {
            throw 'expecting id param and payment_status in body'
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
            await deleteOrderHandler(req.params.id);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    hasOrderDeleted: true
                }
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
