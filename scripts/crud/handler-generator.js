const fs = require('fs'); // ES5
const lodash = require('lodash');
const {model} = require("mongoose");

const path = `src/common/lib`;

function getTemplateV2({model_name}) {
    return `
import ${model_name}Helper from '../../helpers/${model_name}.helper';

export function addNew${lodash.startCase(model_name).replace(/ /g,'')}Handler(input, callback) {
    ${model_name}Helper.addObject(input)
        .then(result => callback(null, result))
        .catch(error => callback(error));
}

export function get${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler(input, callback) {
    ${model_name}Helper.getObjectById(input)
        .then(result => callback(null, result))
        .catch(error => callback(error));
}

export function update${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler(input, callback) {
    ${model_name}Helper.directUpdateObject(input.objectId, input.updateObject)
        .then(result => callback(null, result))
        .catch(error => callback(error));
}

export function get${lodash.startCase(model_name).replace(/ /g,'')}ListHandler(input, callback) {
    Promise.all([
        ${model_name}Helper.getAllObjects(input),
        ${model_name}Helper.getAllObjectCount(input)
    ])
        .then(([list, count]) => callback(null, { list, count }))
        .catch(error => callback(error));
}

export function delete${lodash.startCase(model_name).replace(/ /g,'')}Handler(input, callback) {
    ${model_name}Helper.deleteObjectById(input)
        .then(result => callback(null, result))
        .catch(error => callback(error));
}

export function get${lodash.startCase(model_name).replace(/ /g,'')}ByQueryHandler(input, callback) {
    ${model_name}Helper.getObjectByQuery(input)
        .then(result => callback(null, result))
        .catch(error => callback(error));
}


`
}

function getTemplateV3({model_name}) {
    return `import ${model_name}Helper from '../../helpers/${model_name}.helper';

export async function addNew${lodash.startCase(model_name).replace(/ /g,'')}Handler(input) {
    return await ${model_name}Helper.addObject(input);
}

export async function get${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler(input) {
    return await ${model_name}Helper.getObjectById(input);
}

export async function update${lodash.startCase(model_name).replace(/ /g,'')}DetailsHandler(input) {
    return await ${model_name}Helper.directUpdateObject(input.objectId, input.updateObject);
}

export async function get${lodash.startCase(model_name).replace(/ /g,'')}ListHandler(input) {
    const list = await ${model_name}Helper.getAllObjects(input);
    const count = await ${model_name}Helper.getAllObjectCount(input);
    return { list, count };
}

export async function delete${lodash.startCase(model_name).replace(/ /g,'')}Handler(input) {
    return await ${model_name}Helper.deleteObjectById(input);
}

export async function get${lodash.startCase(model_name).replace(/ /g,'')}ByQueryHandler(input) {
    return await ${model_name}Helper.getObjectByQuery(input);
}  
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
    let directory_path = `${path}/${modelName}`;
    fs.mkdir(directory_path, (err, result) => {
        let file_path = `${path}/${modelName}/${modelName}Handler.js`;
        fs.writeFile(file_path, data, (err, result) => {
            if (err) {
                console.log(err);
            }
        })
    })
}

writeFile();