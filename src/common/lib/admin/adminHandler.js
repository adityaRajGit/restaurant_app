import adminHelper from '../../helpers/admin.helper';
import bcrypt from "bcryptjs";
import { generateToken } from '../../util/authUtil';
import { getAdminInfo } from '../../util/utilHelper';

export async function addNewAdminHandler(input) {
    return await adminHelper.addObject(input);
}

export async function addAdminHandler(input) {
    // Validate input fields
    if (!input.name || !input.role || !input.email || !input.password) {
        throw "All fields (name, role, email, password) are required"
    }

    // Hash the provided password
    const hashedPassword = await bcrypt.hash(input.password, 10);

    const existingAdmin = await adminHelper.getObjectByQuery({
        query: { email: input.email },
    });

    if (existingAdmin) {
        throw "Admin with this email already exists"
    }

    // Prepare admin data
    const adminDetails = {
        name: input.name,
        role: input.role,
        email: input.email,
        password: hashedPassword,
    };

    // Add the new admin to the database
    const newAdmin = await adminHelper.addObject(adminDetails);

    const adminData = {
        _id: newAdmin._id,
        name: newAdmin.name,
        role: newAdmin.role,
        email: newAdmin.email,
    }

    // Generate a token for the new admin
    const token = generateToken(adminData, 'admin');

    // Return the admin info and token
    return { admin: getAdminInfo(newAdmin), token };
}

export async function adminLoginHandler(input) {
    let admin;

    admin = await adminHelper.getObjectByQuery({
        query: { email: input.email },
    });


    if (!admin) {
        throw "Admin not found"
    }

    const isMatch = await bcrypt.compare(input.password, admin.password);
    if (!isMatch) {
        throw "Invalid credentials"
    }

    const adminData = {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        _id: admin._id
    }

    const token = generateToken(adminData, "admin");

    return { admin: getAdminInfo(adminData), token };
}


export async function getAdminDetailsHandler(input) {
    return await adminHelper.getObjectById(input);
}

export async function updateAdminDetailsHandler(input) {
    return await adminHelper.directUpdateObject(input.objectId, input.updateObject);
}

export async function getAdminListHandler(input) {
    const list = await adminHelper.getAllObjects(input);
    const count = await adminHelper.getAllObjectCount(input);
    return { list, count };
}

export async function deleteAdminHandler(input) {
    return await adminHelper.deleteObjectById(input);
}

export async function getAdminByQueryHandler(input) {
    return await adminHelper.getObjectByQuery(input);
}  
