import _ from 'lodash';
import { Router } from 'express';

import {
    createManualBillHandler,
    getBillDetailsHandler
} from '../../common/lib/bill/billHandler';
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";
import protectRoutes from '../../common/util/protectRoutes.js';
import { MANAGER, STAFF } from '../../common/constants/enum';

const router = new Router();

router.route('/manual').post(protectRoutes.verifyUserType(MANAGER, STAFF), async (req, res) => {
    try {
        if (_.isEmpty(req.body)) {
            throw 'no request body sent';
        }

        const bill = await createManualBillHandler({
            ...req.body,
            created_by: req.userDoc._id,
        });

        res.status(responseStatus.STATUS_SUCCESS_CREATED);
        res.send({
            status: responseData.SUCCESS,
            data: { bill }
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

router.route('/:id').get(protectRoutes.verifyUserType(MANAGER, STAFF), async (req, res) => {
    try {
        if (!req.params.id) {
            throw 'no id param sent';
        }

        const bill = await getBillDetailsHandler({ id: req.params.id });

        res.status(responseStatus.STATUS_SUCCESS_OK);
        res.send({
            status: responseData.SUCCESS,
            data: { bill: bill ? bill : {} }
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

export default router;
