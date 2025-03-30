"use strict";
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeesImageUpload = exports.expenseImageUpload = exports.clinicianImageUpload = exports.organizationImageUpload = exports.getUploadedImages = void 0;
const multer_1 = __importDefault(require("multer"));
const node_path_1 = __importDefault(require("node:path"));
const promises_1 = require("node:fs/promises");
const accepted = ['jpeg', 'png', 'jpg'];
const createUploadMiddleware = (destination, fieldName, identifier) => {
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const ext = node_path_1.default.extname(file.originalname).toLowerCase().substring(1);
            if (accepted.includes(ext)) {
                cb(null, destination);
            }
            else {
                cb(new Error('File type jpeg, png, jpg required'), false);
            }
        },
        filename: async (req, file, cb) => {
            const id = req.query[identifier];
            const uniqueSuffix = id + '-' + fieldName + "-" + Date.now() + node_path_1.default.extname(file.originalname);
            await unlinkPreviousImages(fieldName, id);
            cb(null, uniqueSuffix);
        }
    });
    return (0, multer_1.default)({ storage }).single(fieldName);
};
async function unlinkPreviousImages(fieldName, target) {
    var _a, e_1, _b, _c;
    const folderPath = getFolderPath(fieldName);
    if (folderPath) {
        const filesInDir = await (0, promises_1.opendir)(folderPath);
        try {
            for (var _d = true, filesInDir_1 = __asyncValues(filesInDir), filesInDir_1_1; filesInDir_1_1 = await filesInDir_1.next(), _a = filesInDir_1_1.done, !_a; _d = true) {
                _c = filesInDir_1_1.value;
                _d = false;
                const file = _c;
                if (file && file.name) {
                    const _file = file.name.split("-");
                    const _fileField = _file[1];
                    const identifier = _file[0];
                    if (identifier == target && fieldName === _fileField) {
                        await (0, promises_1.unlink)(node_path_1.default.join(folderPath, file.name));
                        console.log('file removed successfully');
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = filesInDir_1.return)) await _b.call(filesInDir_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
}
function getFolderPath(category) {
    switch (category) {
        case "organizations":
            return node_path_1.default.join(__dirname, "../../../asserts/organizations");
        case "clinicians":
            return node_path_1.default.join(__dirname, "../../../asserts/clinician");
        default:
            return null;
    }
}
const getUploadedImages = async function (fieldName, target) {
    var _a, e_2, _b, _c;
    try {
        const folderPath = getFolderPath(fieldName);
        if (!folderPath)
            return folderPath;
        const filesInDir = await (0, promises_1.opendir)(folderPath);
        try {
            for (var _d = true, filesInDir_2 = __asyncValues(filesInDir), filesInDir_2_1; filesInDir_2_1 = await filesInDir_2.next(), _a = filesInDir_2_1.done, !_a; _d = true) {
                _c = filesInDir_2_1.value;
                _d = false;
                const file = _c;
                if (file && file.name) {
                    const _file = file.name.split("-");
                    const _fileField = _file[1];
                    const identifier = _file[0];
                    if (identifier == target && fieldName === _fileField) {
                        return node_path_1.default.normalize(node_path_1.default.join(folderPath, file.name));
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = filesInDir_2.return)) await _b.call(filesInDir_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
    catch (err) {
        return null;
    }
};
exports.getUploadedImages = getUploadedImages;
exports.organizationImageUpload = createUploadMiddleware('./asserts/organizations/', 'organizations', 'id');
exports.clinicianImageUpload = createUploadMiddleware('./asserts/clinician/', 'clinician', 'id');
exports.expenseImageUpload = createUploadMiddleware('./asserts/expensesRecords/', 'expenses', 'id');
exports.employeesImageUpload = createUploadMiddleware('./asserts/employees/', 'employeesImage', 'id');
