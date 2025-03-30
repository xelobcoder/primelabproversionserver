import { Router } from "express";
import {
  handleGetDepartments,
  handleAddNewDepartment,
  handleUpdateDepartment,
  handleDeleteDepartment,
} from "./handlers/departmenthandlers";

import { handleAddCompanyInfo, handleGetCompanyInfo, handleGetCompanyImage, handleUploadCompanyImage } from "./handlers/companyHandlers";

const router = Router();

// Department routes
router.get("/api/v1/departments", handleGetDepartments);
router.post("/api/v1/departments", handleAddNewDepartment);
router.put("/api/v1/departments", handleUpdateDepartment);
router.delete("/api/v1/departments", handleDeleteDepartment);

// router.get('/api/v1/departments/:id', handleGetSpecificDepartment);

// Company profile routes
router.post("/api/v1/settings/companyprofile", handleAddCompanyInfo);
router.get("/api/v1/settings/companyprofile", handleGetCompanyInfo);
router.post("/api/v1/settings/companyprofile/images", handleUploadCompanyImage);
router.get("/api/v1/settings/companyprofile/images", handleGetCompanyImage);

export default router;
