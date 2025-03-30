"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadCompanyImage = exports.handleGetCompanyImage = exports.handleGetCompanyInfo = exports.handleAddCompanyInfo = void 0;
const companydata_1 = require("../settings/companydata");
const companyimage_1 = require("../settings/companyimage");
const handleAddCompanyInfo = (req, res) => {
    (0, companydata_1.AddCompanyInfo)(req, res);
};
exports.handleAddCompanyInfo = handleAddCompanyInfo;
const handleGetCompanyInfo = (req, res) => {
    (0, companydata_1.getCompanyInfo)(req, res);
};
exports.handleGetCompanyInfo = handleGetCompanyInfo;
const handleGetCompanyImage = (req, res) => {
    (0, companydata_1.getCompanyImage)(req, res);
};
exports.handleGetCompanyImage = handleGetCompanyImage;
exports.handleUploadCompanyImage = companyimage_1.upload.single('file');
(req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
    }
    else {
        res.status(200).json({ message: 'File uploaded successfully' });
    }
};
