import express from "express";
import {
  addNewPatient,
  updatePersonalInformation,
  updateEmergencyContactInformation,
  updateAddressingInformation,
  getPersonalInformation,
  checkMobileNumber,
  getAddressingInformation,
  getEmergencyContactInformation,
  getRegistrationSettings,
} from "./registrationHandlers";

const router = express.Router();

router.post("/api/v1/register", addNewPatient);
router.put("/api/v1/register/personalinformation", updatePersonalInformation);
router.put("/api/v1/register/emmergencycontactinformation", updateEmergencyContactInformation);
router.put("/api/v1/register/addressinginformation", updateAddressingInformation);
router.get("/api/v1/register/personalinformation", getPersonalInformation);
router.get("/api/v1/register/checkmobile", checkMobileNumber);
router.get("/api/v1/register/addressingformation", getAddressingInformation);
router.get("/api/v1/register/emmergencycontactinformation", getEmergencyContactInformation);
router.get("/api/v1/register/registration/settings", getRegistrationSettings);

export default router;
