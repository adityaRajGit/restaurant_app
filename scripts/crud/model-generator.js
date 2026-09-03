const fs = require('fs'); // ES5
const lodash = require('lodash');

const path = `src/common/models`;

function getTemplate({model_name}) {
    return `
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ${model_name}Schema = new Schema({
    is_deleted: {
        type: Boolean,
        default: false 
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

${model_name}Schema.set('versionKey', false);

export default mongoose.model('${lodash.startCase(lodash.snakeCase(model_name))}', ${model_name}Schema);
`
}
function writeFile() {
    let modelName = '';
    process.argv.forEach((val, index) => {
        if (val === '-name') {
            modelName = process.argv[index + 1];
        }
    });
    let data = getTemplate({model_name: modelName});
    let file_path = `${path}/${modelName}.js`;
    fs.writeFile(file_path, data, (err, result) => {
        if (err) {
            console.log(err);
        }
    })
}

writeFile();