
import _ from 'lodash';
import { Router } from 'express';

import {
    addNewMenuItemHandler,
    deleteMenuItemHandler,
    getGroupedMenuHandler,
    getMenuItemDetailsHandler,
    getMenuItemListHandler,
    setMenuItemAvailabilityHandler,
    updateMenuItemDetailsHandler
} from '../../common/lib/menu/menuHandler';
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";
import { storage } from "../../util/cloudinary.js";
import multer from 'multer';
import protectRoutes from '../../common/util/protectRoutes.js';

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
const router = new Router();

router.route('/list').post(async (req, res) => {
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
        filter.sortBy = { display_order: 1, _id: -1 };

        const outputResult = await getMenuItemListHandler(filter);
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: {
                menuList: outputResult.list ? outputResult.list : [],
                menuCount: outputResult.count ? outputResult.count : 0,
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

router.route('/grouped').get(async (req, res) => {
    try {
        const query = req.query.category ? { category: req.query.category } : {};
        const menu = await getGroupedMenuHandler({ query });
        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: { menu }
        });
    } catch (err) {
        console.log(err);
        res.status(responseStatus.INTERNAL_SERVER_ERROR);
        res.send({
            status: responseData.ERROR,
            data: { message: err }
        });
    }
});

router.route('/new').post(protectRoutes.verifyAdmin, upload.fields([{ name: "images", maxCount: 5 }]), async (req, res) => {
    try {
        if (!_.isEmpty(req.body)) {
            let data = {
                ...req.body,
                images: req.files?.images || []
            };
            const outputResult = await addNewMenuItemHandler(data);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    menuItem: outputResult ? outputResult : {}
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

router.route('/:id').get(async (req, res) => {
    try {
        if (req.params.id) {
            const gotMenuItem = await getMenuItemDetailsHandler(req.params);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    menuItem: gotMenuItem ? gotMenuItem : {}
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

router.route('/:id/update').post(protectRoutes.verifyAdmin, upload.fields([{ name: "images", maxCount: 5 }]), async (req, res) => {
    try {
        if (!_.isEmpty(req.params.id) && !_.isEmpty(req.body)) {
            let input = {
                objectId: req.params.id,
                updateObject: req.body,
                images: req.files?.images || []
            }
            const updateObjectResult = await updateMenuItemDetailsHandler(input);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    menuItem: updateObjectResult ? updateObjectResult : {}
                }
            });
        } else {
            throw 'no body or id param sent'
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

router.route('/:id/availability').post(protectRoutes.verifyAdmin, async (req, res) => {
    try {
        if (req.params.id && typeof req.body.is_available === 'boolean') {
            await setMenuItemAvailabilityHandler(req.params.id, req.body.is_available);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: { hasAvailabilityUpdated: true }
            });
        } else {
            throw 'expecting id param and boolean is_available'
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
            await deleteMenuItemHandler(req.params.id);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    hasMenuItemDeleted: true
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
