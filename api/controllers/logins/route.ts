import express from "express";
import {
          getLogins,
          getUser,
          createAccount,
          deleteAccountHandler,
          updateBasicInfo,
          authenticateUser,
          activateUser,
          getUserPermissions,
          updatePermissions,
          authenticateClinician,
} from "./authHandlers";

const router = express.Router();

router.get("/api/v1/logins", getLogins);
router.get("/api/v1/logins/user", getUser);
router.post("/api/v1/logins", createAccount);
router.delete("/api/v1/logins", deleteAccountHandler);
router.post("/api/v1/logins/update", updateBasicInfo);
router.post("/api/v1/authenticate", authenticateUser);
router.put("/api/v1/user/authentication/activate", activateUser);
router.get("/api/v1/user/permissions", getUserPermissions);
router.put("/api/v1/user/permissions", updatePermissions);
router.post("/api/v1/login/clinicians", authenticateClinician);

export default router;
