const fs = require('fs'); // ES5
const lodash = require('lodash');
const {model} = require("mongoose");

const path = `scripts/curl`;

function getTemplateV3({model_name}) {
    return `
CREATE

curl --location '{{url}}/api/v1/${model_name}/new' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGE1NGRkOWZiMTA5OTMzZjg4MzY0MDciLCJjb250YWN0X2VtYWlsIjoicmFnaHZlbmRyYS5tb2RhbndhbEBhbnRjcmVhdGl2ZXMuY29tIiwiY29udGFjdF9uYW1lIjoiUmFnaGF2IiwiY29udGFjdF9waG9uZSI6Ijg3NTY4MDk4NzgiLCJpYXQiOjE2ODg1NTUyNzR9.sMRhMGvaYTc1cNEIiuMPvBl1j_VhiKt8mi3gDmQRuLU' \\
--data-raw '{
    "${model_name}": {
        "is_deleted": false,
        "created_at": "2023-09-21T05:40:39.287Z",
        "updated_at": "2023-09-21T05:40:39.288Z"
    }
}'

LIST

curl --location '{{url}}/api/v1/${model_name}/list' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGE1NGRkOWZiMTA5OTMzZjg4MzY0MDciLCJjb250YWN0X2VtYWlsIjoicmFnaHZlbmRyYS5tb2RhbndhbEBhbnRjcmVhdGl2ZXMuY29tIiwiY29udGFjdF9uYW1lIjoiUmFnaGF2IiwiY29udGFjdF9waG9uZSI6Ijg3NTY4MDk4NzgiLCJpYXQiOjE2ODg1NTUyNzR9.sMRhMGvaYTc1cNEIiuMPvBl1j_VhiKt8mi3gDmQRuLU' \\
--data '{
    "pageNum": 1,
    "pageSize": 20,
    "filters": {}
}'

GET

curl --location '{{url}}/api/v1/${model_name}/:${model_name}_id' \\
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGE1NGRkOWZiMTA5OTMzZjg4MzY0MDciLCJjb250YWN0X2VtYWlsIjoicmFnaHZlbmRyYS5tb2RhbndhbEBhbnRjcmVhdGl2ZXMuY29tIiwiY29udGFjdF9uYW1lIjoiUmFnaGF2IiwiY29udGFjdF9waG9uZSI6Ijg3NTY4MDk4NzgiLCJpYXQiOjE2ODg1NTUyNzR9.sMRhMGvaYTc1cNEIiuMPvBl1j_VhiKt8mi3gDmQRuLU'

UPDATE

curl --location '{{url}}/api/v1/${model_name}/:${model_name}_id/update' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGE1NGRkOWZiMTA5OTMzZjg4MzY0MDciLCJjb250YWN0X2VtYWlsIjoicmFnaHZlbmRyYS5tb2RhbndhbEBhbnRjcmVhdGl2ZXMuY29tIiwiY29udGFjdF9uYW1lIjoiUmFnaGF2IiwiY29udGFjdF9waG9uZSI6Ijg3NTY4MDk4NzgiLCJpYXQiOjE2ODg1NTUyNzR9.sMRhMGvaYTc1cNEIiuMPvBl1j_VhiKt8mi3gDmQRuLU' \\
--data '{
    "${model_name}" : {
        "contact_name" : "Adirta"
    }
}'


DELETE

curl --location --request POST '{{url}}/api/v1/${model_name}/:${model_name}_id/remove' \\
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NGE1NGRkOWZiMTA5OTMzZjg4MzY0MDciLCJjb250YWN0X2VtYWlsIjoicmFnaHZlbmRyYS5tb2RhbndhbEBhbnRjcmVhdGl2ZXMuY29tIiwiY29udGFjdF9uYW1lIjoiUmFnaGF2IiwiY29udGFjdF9waG9uZSI6Ijg3NTY4MDk4NzgiLCJpYXQiOjE2ODg1NTUyNzR9.sMRhMGvaYTc1cNEIiuMPvBl1j_VhiKt8mi3gDmQRuLU'

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
    data = getTemplateV3({model_name: modelName});
    let directory_path = `${path}/${modelName}`;
    fs.mkdir(directory_path, (err, result) => {
        let file_path = `${path}/${modelName}/${modelName}.txt`;
        fs.writeFile(file_path, data, (err, result) => {
            if (err) {
                console.log(err);
            }
        })
    })
}

writeFile();
