import multer from 'multer';
import path from 'node:path';
import { opendir, unlink } from 'node:fs/promises';
const accepted = ['jpeg', 'png', 'jpg'];


const createUploadMiddleware = (destination: string, fieldName: string, identifier: string) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase().substring(1);
            if (accepted.includes(ext)) {
                cb(null, destination);
            } else {
                cb(new Error('File type jpeg, png, jpg required'), false);
            }
        },
        filename: async (req, file, cb) => {
            const id = req.query[identifier]
            const uniqueSuffix = id + '-' + fieldName + "-" + Date.now() + path.extname(file.originalname);
            await unlinkPreviousImages(fieldName, id)
            cb(null, uniqueSuffix);
        }
    });

    return multer({ storage }).single(fieldName);
};



async function unlinkPreviousImages(fieldName: string, target: string) {
    const folderPath = getFolderPath(fieldName);
    if (folderPath) {
        const filesInDir = await opendir(folderPath);
        for await (const file of filesInDir) {
            if (file && file.name) {
                const _file = file.name.split("-");
                const _fileField = _file[1];
                const identifier = _file[0];
                if (identifier == target && fieldName === _fileField) {
                    await unlink(path.join(folderPath, file.name));
                    console.log('file removed successfully');
                }
            }
        }
    }
}



function getFolderPath(category: string) {
    switch (category) {
        case "organizations":
            return path.join(__dirname, "../../../asserts/organizations");
        case "clinicians":
            return path.join(__dirname, "../../../asserts/clinician");
        default:
            return null
    }
}





export const getUploadedImages = async function (fieldName: string, target: (string | number)) {
    try {
        const folderPath = getFolderPath(fieldName);
        if (!folderPath) return folderPath;
        const filesInDir = await opendir(folderPath);

        for await (const file of filesInDir) {
            if (file && file.name) {
                const _file = file.name.split("-");
                const _fileField = _file[1];
                const identifier = _file[0];
                if (identifier == target && fieldName === _fileField) {
                    return path.normalize(path.join(folderPath, file.name));
                }
            }
        }
    } catch (err) {
        return null;
    }
}

export const organizationImageUpload = createUploadMiddleware('./asserts/organizations/', 'organizations', 'id');
export const clinicianImageUpload = createUploadMiddleware('./asserts/clinician/', 'clinician', 'id');
export const expenseImageUpload = createUploadMiddleware('./asserts/expensesRecords/', 'expenses', 'id');
export const employeesImageUpload = createUploadMiddleware('./asserts/employees/', 'employeesImage', 'id');


