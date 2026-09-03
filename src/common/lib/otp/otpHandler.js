import otpHelper from '../../helpers/otp.helper';

export async function addNewOtpHandler(input) {
    return await otpHelper.addObject(input);
}

export async function getOtpDetailsHandler(input) {
    return await otpHelper.getObjectById(input);
}

export async function updateOtpDetailsHandler(input) {
    return await otpHelper.directUpdateObject(input.objectId, input.updateObject);
}

export async function getOtpListHandler(input) {
    const list = await otpHelper.getAllObjects(input);
    const count = await otpHelper.getAllObjectCount(input);
    return { list, count };
}

export async function deleteOtpHandler(input) {
    return await otpHelper.deleteObjectById(input);
}

export async function getOtpByQueryHandler(input) {
    return await otpHelper.getObjectByQuery(input);
}  
