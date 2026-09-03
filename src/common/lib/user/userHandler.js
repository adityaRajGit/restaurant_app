import userHelper from '../../helpers/user.helper.js';
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";
import { verifyEmailOTP, sendVerificationEmail } from '../../util/utilHelper.js';

export async function addNewUserHandler(input) {
    if (input.password) {
        input.password = await bcrypt.hash(input.password, 10);
    }
    return await userHelper.addObject(input);
}

export async function getUserDetailsHandler(input) {
    return await userHelper.getObjectById({
        ...input,
        selectFrom: { password: 0 },
    });
}

export async function updateUserDetailsHandler(input) {
    if (input.profile_image) {
        const result = await cloudinary.uploader.upload(input.profile_image.path, {
            folder: "restaurantapp/users",
        });
        input.updateObject.profile_image = result.secure_url;
    }

    // Password changes go through auth/change-password, never a profile update.
    delete input.updateObject.password;
    delete input.updateObject.email_verified;
    input.updateObject.updated_at = new Date();

    return await userHelper.directUpdateObject(input.objectId, input.updateObject);
}

export async function getUserListHandler(input) {
    const list = await userHelper.getAllObjects({ ...input, selectFrom: { password: 0 } });
    const count = await userHelper.getAllObjectCount(input);
    return { list, count };
}

export async function deleteUserHandler(input) {
    return await userHelper.directUpdateObject(input, {
        is_deleted: true,
        status: 'inactive',
        updated_at: new Date(),
    });
}

export async function getUserByQueryHandler(input) {
    return await userHelper.getObjectByQuery(input);
}

export async function requestEmailVerificationHandler(userId) {
    const user = await userHelper.getObjectById({ id: userId });
    if (!user) {
        throw "User not found";
    }
    return await sendVerificationEmail(user.email, "Verify your email");
}

export async function verifyUserEmailHandler(userId, otp) {
    const user = await userHelper.getObjectById({ id: userId });
    if (!user) {
        throw "User not found";
    }

    await verifyEmailOTP(user.email, otp);

    return await userHelper.directUpdateObject(userId, {
        email_verified: true,
        updated_at: new Date(),
    });
}

export async function addUserAddressHandler(userId, address) {
    const user = await userHelper.getObjectById({ id: userId });
    if (!user) {
        throw "User not found";
    }
    if (!address || !address.line1) {
        throw "address line1 is required";
    }

    const addresses = user.addresses || [];

    // Only one address can be the default at a time.
    if (address.is_default) {
        addresses.forEach((a) => { a.is_default = false; });
    }
    addresses.push(address);

    return await userHelper.directUpdateObject(userId, {
        addresses,
        updated_at: new Date(),
    });
}

export async function removeUserAddressHandler(userId, addressId) {
    const user = await userHelper.getObjectById({ id: userId });
    if (!user) {
        throw "User not found";
    }

    const addresses = (user.addresses || []).filter(
        (a) => String(a._id) !== String(addressId)
    );

    return await userHelper.directUpdateObject(userId, {
        addresses,
        updated_at: new Date(),
    });
}

export async function toggleFavouriteItemHandler(userId, menuItemId) {
    const user = await userHelper.getObjectById({ id: userId });
    if (!user) {
        throw "User not found";
    }

    const favourites = (user.favourite_items || []).map(String);
    const isFavourite = favourites.includes(String(menuItemId));

    const updated = isFavourite
        ? favourites.filter((id) => id !== String(menuItemId))
        : [...favourites, String(menuItemId)];

    await userHelper.directUpdateObject(userId, {
        favourite_items: updated,
        updated_at: new Date(),
    });

    return { is_favourite: !isFavourite };
}
