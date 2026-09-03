const fs = require('fs'); // ES5
const lodash = require('lodash');

const path = `src/common/helpers`;

function getTemplateV2({model_name}) {
    return `
'use strict';

import ${lodash.startCase(model_name).replace(/ /g,'')} from '../models/${model_name}';

function getAllObjects(filters, next) {
    let query = filters.query ? filters.query : {};
    let selectFrom = filters.selectFrom ? filters.selectFrom : {};
    let sortBy = filters.sortBy ? filters.sortBy : {_id: -1};
    let pageNum = filters.pageNum ? filters.pageNum : 1;
    let pageSize = filters.pageSize ? filters.pageSize : 50;
    ${lodash.startCase(model_name).replace(/ /g,'')}.find(query)
        .select(selectFrom)
        .sort(sortBy)
        .skip((pageNum - 1) * pageSize)
        .limit(parseInt(pageSize))
        .lean()
        .exec((err, objects) => {
            if (err) {
                console.log(err);
                return next(err);
            } else {
                return next(null, objects);
            }

        });
}

function getAllObjectsCount(filters, next) {
    let query = filters.query ? filters.query : {};
    ${lodash.startCase(model_name).replace(/ /g,'')}.count(query, (err, count) => {
        if (err) {
            console.log(err);
            return next(err);
        } else {
            return next(null, count);
        }

    });
}

function getObjectById(filters, next) {
    ${lodash.startCase(model_name).replace(/ /g,'')}.findById(filters.id)
        .select(filters.selectFrom ? filters.selectFrom : {})
        .exec((err, object) => {
            if (err) {
                console.log(err);
                return next(err);
            } else {
                return next(null, object);
            }

        });
}

function updateObjectById(id, updatedObject, next) {
    ${lodash.startCase(model_name).replace(/ /g,'')}.findById(id, (err, object) => {
        if (err) {
            return next && next(err); 
        }
        for (let prop in updatedObject) {
            object[prop] = updatedObject[prop];
        }
        object.save((err, savedObject) => {
            if (err) {
                return next && next(err); 
            } else {
                return next && next(null, savedObject); 
            }
        });
    });
}
 


function deleteObject(objectId, next) {
    ${lodash.startCase(model_name).replace(/ /g,'')}.findByIdAndRemove(objectId, (err, object) => {
        if (err) {
            console.log(err);
            return next(err);
        } else {
            return next(null, objectId);
        }
    });
}




function addObject(object, next) {
    let objectModel = new ${lodash.startCase(model_name).replace(/ /g,'')}(object);
    objectModel.save((err, savedObject) => {
      if (err) {
        console.log(err);
        if (typeof next === 'function') {
          return next(err);
        }
      } else {
        if (typeof next === 'function') {
          return next(null, savedObject);
        }
      }
    });
  }

export default {
    getAllObjects: getAllObjects,
    getAllObjectsCount: getAllObjectsCount,
    getObjectById: getObjectById,
    updateObjectById: updateObjectById,
    deleteObject: deleteObject,
    addObject: addObject,
    getObjectByQuery: getObjectByQuery,
};
`
}

function getTemplateV3({model_name}) {
    return `
'use strict';

import ${lodash.startCase(model_name).replace(/ /g,'')} from '../models/${model_name}';
import BaseHelper from  "./baseHelper.js";

const ${model_name}Helper = new BaseHelper(${lodash.startCase(model_name).replace(/ /g,'')});

export default ${model_name}Helper;
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
    let file_path = `${path}/${modelName}.helper.js`;
    fs.writeFile(file_path, data, (err, result) => {
        if (err) {
            console.log(err);
        }
    })
}

writeFile();