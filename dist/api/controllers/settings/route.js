"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmenthandlers_1 = require("./handlers/departmenthandlers");
const companyHandlers_1 = require("./handlers/companyHandlers");
const router = (0, express_1.Router)();
// Department routes
router.get("/api/v1/departments", departmenthandlers_1.handleGetDepartments);
router.post("/api/v1/departments", departmenthandlers_1.handleAddNewDepartment);
router.put("/api/v1/departments", departmenthandlers_1.handleUpdateDepartment);
router.delete("/api/v1/departments", departmenthandlers_1.handleDeleteDepartment);
// router.get('/api/v1/departments/:id', handleGetSpecificDepartment);
// Company profile routes
router.post("/api/v1/settings/companyprofile", companyHandlers_1.handleAddCompanyInfo);
router.get("/api/v1/settings/companyprofile", companyHandlers_1.handleGetCompanyInfo);
router.post("/api/v1/settings/companyprofile/images", companyHandlers_1.handleUploadCompanyImage);
router.get("/api/v1/settings/companyprofile/images", companyHandlers_1.handleGetCompanyImage);
exports.default = router;
