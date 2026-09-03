const fs = require('fs'); // ES5
const lodash = require('lodash');

const path = `src/server/routes`;

function getTemplateV2({model_name}) {
    return `
import _ from 'lodash';
import { Router } from 'express';
import ${model_name}Helper from '../helpers/${model_name}.helper';
import {
    addNew${lodash.startCase(model_name).replace(/ /g,'')}Handler,
    delete${lodash.startCase(model_name).replace(/ /g,'')}Handler,
    get${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler,
    get${lodash.startCase(model_name).replace(/ /g,'')}ListHandler,
    update${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler
} from '../lib/${model_name}/${model_name}Handler';

import responseStatus from "../constants/responseStatus.json";
import responseData from "../constants/responseData.json";

const router = new Router();

router.route('/list').post((req, res) => {
    let results = [];
    let totalCount = 0;
    const filters = {};
    let query = {};
    filters.sortBy = { '_id': -1 };
    filters.pageNum = req.body.pageNum ? req.body.pageNum : 1;
    filters.pageSize = req.body.pageSize ? req.body.pageSize : 50;
    filters.query = query;
    filters.selectFrom = req.body.selectFrom ? req.body.selectFrom : {};
    async.series([
        cb => {
            ${model_name}Helper.getAllObjects(filters, (err, objects) => {
                if (err) {
                    results = [];
                } else {
                    results = objects;
                }
                cb(err);
            });
        },
        cb => {
            ${model_name}Helper.getAllObjectsCount(filters, (err, count) => {
                if (!err) {
                    totalCount = count;
                }
                cb(err);
            });
        }], (err) => {
        if (err) {
            res.status(500);
            res.json({
                status: 'Error',
                data: "Error occurred"
            });
        } else {
            res.status(201);
            res.json({
                status: 'Success',
                data: {
                    ${model_name}list: results,
                    ${model_name}count: totalCount
                }
            });
        }
    });
});


router.route('/new').post((req, res) => {
    if (_.isEmpty(req.body.${model_name})) {
        setServerError(res, 'No ${model_name} in response body')
    } else {
        const {isValid, message} = handleValidation${lodash.startCase(model_name).replace(/ /g,'')}Model(req.body.${model_name});
        if (isValid) {
            let model = {};
            async.series([
                (cb) => {
                    ${model_name}Helper.addObject(req.body.${model_name}, (err, object) => {
                        if (err) {
                            return cb(err);
                        } else {
                            model.${model_name} = object;
                            return cb();
                        }
                    });
                }], (err) => {
                    setResponse(req, res, err, model);
                }
            );
        } else {
            setServerError(res, message);
        }
    }
});

router.route('/:id').get((req, res) => {
    if (req.params.id) {
        const filters = { id: req.params.id, selectFrom: {} };
        ${model_name}Helper.getObjectById(filters, (err, ${model_name}) => {
            setResponse(req, res, err, { ${model_name} });
        });
    } else {
        setServerError(res, 'No response id sent');
    }
});

router.route('/:id/update').post((req, res) => {
    if (req.params.id && !_.isEmpty(req.body.${model_name})) {
        let model = {};
        async.series([
            (cb) => {
                checkExistingUsernameFor${lodash.startCase(model_name).replace(/ /g,'')}(req.params.id, req.body.${model_name}, (err, obect) => {
                    if(err) {
                        return cb(err);
                    } else {
                        return cb()
                    }
                })
            },
            (cb) => {
                ${model_name}Helper.updateObjectById(req.params.id, req.body.${model_name}, (err, object) => {
                    if (err) {
                        return cb(err);
                    } else {
                        model.${model_name} = object;
                        return cb();
                    }
                });
            }
        ],(err) => {
            setResponse(req, res, err, model);
        });
    } else {
        setServerError(res, 'No response id or data sent');
    }
});

function checkExistingUsernameFor${lodash.startCase(model_name).replace(/ /g,'')}(inputId, body, next){
    let model = {}
    async.series([
        cb => {
            const filter = {
                id: inputId
            }
            ${model_name}Helper.getObjectById(filter, (err, object) => {
                if(err) {
                    return cb(err);
                } else {
                    model.got${model_name} = object;
                    return cb()
                }
            })
        },
        cb => {
            if(model.got${model_name} && body.username) {
                const usernameFilter = {
                    query: { username: body.username }
                }
                ${model_name}Helper.getObjectByQuery(usernameFilter, (err, object) => {
                    if(err) {
                        return cb(err);
                    } else {
                        if(object && object._id.toString() != inputId ) {
                            console.log(object._id.toString());
                            console.log(inputId);
                            return cb('username already exisits')
                        } else {
                            return cb()
                        }
                    }
                })
            } else {
                return cb();
            }
        }
    ], err => {
        if(err) {
            next(err);
        } else {
            next(null, model);
        }
    })
}

router.route('/:id/remove').post((req, res) => {
    if (req.params.id) {
        let model = {};
        async.series([
            (cb) => {
                const filters = {id: req.params.id, selectFrom: {}};
                ${model_name}Helper.getObjectById(filters, (err, ${model_name}) => {
                    if (err) {
                       return cb(err);
                    } else {
                        model.${model_name} = ${model_name};
                        return cb();
                    }
                });
            },
            (cb) => {
                ${model_name}Helper.deleteObject(req.params.id, (err, object) => {
                    if (err) {
                       return cb(err);
                    } else {
                        model.${model_name}_del = object;
                        return cb();
                    }
                });
            }
        ],(err)=>{
            setResponse(req, res, err, model);
        });
    } else {
        setServerError('No response id sent');
    }
});



`
}

function getTemplateV3({model_name}) {
    return `
import _ from 'lodash';
import {Router} from 'express';

import {
    addNew${lodash.startCase(model_name).replace(/ /g,'')}Handler,
    delete${lodash.startCase(model_name).replace(/ /g,'')}Handler,
    get${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler,
    get${lodash.startCase(model_name).replace(/ /g,'')}ListHandler,
    update${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler
} from '../../common/lib/${model_name}/${model_name}Handler';
import responseStatus from "../../common/constants/responseStatus.json";
import responseData from "../../common/constants/responseData.json";

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
  
      filter.query = { ...filter.query };
  
      const outputResult = await get${lodash.startCase(model_name).replace(/ /g,'')}ListHandler(filter);
      res.status(responseStatus.STATUS_SUCCESS_OK);
      res.send({
        status: responseData.SUCCESS,
        data: {
          ${model_name}List: outputResult.list ? outputResult.list : [],
          ${model_name}Count: outputResult.count ? outputResult.count : 0,
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


router.route('/new').post(async (req, res) => {
    try {
       if (!_.isEmpty(req.body)) {
            const outputResult = await addNew${lodash.startCase(model_name).replace(/ /g,'')}Handler(req.body.${model_name});
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    ${model_name}: outputResult ? outputResult : {}
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
            const got${lodash.startCase(model_name).replace(/ /g,'')} = await get${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler(req.params);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    ${model_name}: got${lodash.startCase(model_name).replace(/ /g,'')} ? got${lodash.startCase(model_name).replace(/ /g,'')} : {}
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

router.route('/:id/update').post( async (req, res) => {
    try {
        if (!_.isEmpty(req.params.id) && !_.isEmpty(req.body) && !_.isEmpty(req.body.${model_name})) {
            let input = {
                objectId: req.params.id,
                updateObject: req.body.${model_name}
            }
            const updateObjectResult = await update${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler(input);
            res.status(responseStatus.STATUS_SUCCESS_OK);
                res.send({
                    status: responseData.SUCCESS,
                    data: {
                        ${model_name}: updateObjectResult ? updateObjectResult : {}
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

router.route('/:id/remove').post(async(req, res) => {
    try {
        if (req.params.id) {
            const deleted${lodash.startCase(model_name).replace(/ /g,'')} = await delete${lodash.startCase(model_name).replace(/ /g,'')}Handler(req.params.id);
            res.status(responseStatus.STATUS_SUCCESS_OK);
            res.send({
                status: responseData.SUCCESS,
                data: {
                    has${lodash.startCase(model_name).replace(/ /g,'')}Deleted: true
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
  
`
}
function writeFile() {
    let modelName = '';
    let version = '';
    let data = '';
    process.argv.forEach((val, index) => {
        if (val === '-name') {
            modelName = process.argv[index + 1];
        }
        if (val === '-version') {
            version = process.argv[index + 1];
        }
    });
    if (version) {
        if (version === 'v3') {
            data = getTemplateV3({model_name: modelName});
        } else if (version === 'v2') {
            data = getTemplateV2({model_name: modelName});
        }
    } else {
        data = getTemplateV3({model_name: modelName});
    }
    let file_path = `${path}/${modelName}.routes.js`;
    fs.writeFile(file_path, data, (err, result) => {
        if (err) {
            console.log(err);
        }
    })
}

writeFile();


