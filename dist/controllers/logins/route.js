"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authHandlers_1 = require("./authHandlers");
const router = express_1.default.Router();
router.get("/api/v1/logins", authHandlers_1.getLogins);
router.get("/api/v1/logins/user", authHandlers_1.getUser);
router.post("/api/v1/logins", authHandlers_1.createAccount);
router.delete("/api/v1/logins", authHandlers_1.deleteAccountHandler);
router.post("/api/v1/logins/update", authHandlers_1.updateBasicInfo);
router.post("/api/v1/authenticate", authHandlers_1.authenticateUser);
router.put("/api/v1/user/authentication/activate", authHandlers_1.activateUser);
router.get("/api/v1/user/permissions", authHandlers_1.getUserPermissions);
router.put("/api/v1/user/permissions", authHandlers_1.updatePermissions);
router.post("/api/v1/login/clinicians", authHandlers_1.authenticateClinician);
exports.default = router;
