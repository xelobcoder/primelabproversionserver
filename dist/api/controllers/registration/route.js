"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registrationHandlers_1 = require("./registrationHandlers");
const router = express_1.default.Router();
router.post("/api/v1/register", registrationHandlers_1.addNewPatient);
router.put("/api/v1/register/personalinformation", registrationHandlers_1.updatePersonalInformation);
router.put("/api/v1/register/emmergencycontactinformation", registrationHandlers_1.updateEmergencyContactInformation);
router.put("/api/v1/register/addressinginformation", registrationHandlers_1.updateAddressingInformation);
router.get("/api/v1/register/personalinformation", registrationHandlers_1.getPersonalInformation);
router.get("/api/v1/register/checkmobile", registrationHandlers_1.checkMobileNumber);
router.get("/api/v1/register/addressingformation", registrationHandlers_1.getAddressingInformation);
router.get("/api/v1/register/emmergencycontactinformation", registrationHandlers_1.getEmergencyContactInformation);
router.get("/api/v1/register/registration/settings", registrationHandlers_1.getRegistrationSettings);
exports.default = router;
