import menuHelper from '../../helpers/menu.helper';
import { v2 as cloudinary } from "cloudinary";

async function uploadImages(files) {
    const imageUrls = [];
    if (files && files.length > 0) {
        for (const file of files) {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: "restaurantapp/menu",
            });
            imageUrls.push(result.secure_url);
        }
    }
    return imageUrls;
}

function parseJsonField(value, fallback) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch (err) {
        return fallback;
    }
}

export async function addNewMenuItemHandler(input) {
    input.images = await uploadImages(input.images);
    input.options = parseJsonField(input.options, []);
    input.tags = parseJsonField(input.tags, []);

    return await menuHelper.addObject(input);
}

export async function getMenuItemDetailsHandler(input) {
    return await menuHelper.getObjectById(input);
}

export async function updateMenuItemDetailsHandler(input) {
    const imageUrls = await uploadImages(input.images);
    const existingImages = parseJsonField(input.updateObject.existingImages, []);

    input.updateObject.images = [...existingImages, ...imageUrls];
    delete input.updateObject.existingImages;

    if (input.updateObject.options !== undefined) {
        input.updateObject.options = parseJsonField(input.updateObject.options, []);
    }
    if (input.updateObject.tags !== undefined) {
        input.updateObject.tags = parseJsonField(input.updateObject.tags, []);
    }
    input.updateObject.updated_at = new Date();

    return await menuHelper.directUpdateObject(input.objectId, input.updateObject);
}

export async function getMenuItemListHandler(input) {
    const list = await menuHelper.getAllObjects(input);
    const count = await menuHelper.getAllObjectCount(input);
    return { list, count };
}

export async function deleteMenuItemHandler(input) {
    return await menuHelper.deleteObjectById(input);
}

export async function getMenuItemByQueryHandler(input) {
    return await menuHelper.getObjectByQuery(input);
}

export async function setMenuItemAvailabilityHandler(objectId, isAvailable) {
    return await menuHelper.directUpdateObject(objectId, {
        is_available: isAvailable,
        updated_at: new Date(),
    });
}

/**
 * The customer-facing menu: available items grouped by category,
 * ordered by each item's display_order.
 */
export async function getGroupedMenuHandler(filters = {}) {
    const query = { is_deleted: false, is_available: true, ...(filters.query || {}) };

    const items = await menuHelper.getAllObjects({
        query,
        sortBy: { display_order: 1, name: 1 },
        pageSize: 500,
    });

    const grouped = items.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    return Object.keys(grouped).map((category) => ({
        category,
        items: grouped[category],
    }));
}
