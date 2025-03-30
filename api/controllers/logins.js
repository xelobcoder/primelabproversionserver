const { promisifyQuery } = require('../../helper');
const {
  createNewAccount,
  getAllLogins,
  userLogin,
  deleteAccount,
  updateUserPermission,
  getPermissions,
  activateAUser,
  getAUser,
  updateUserBasicInfo,
} = require("../LobnosAuth/createAccount")
const router = require("express").Router()
const { customError } = require("../../helper")
const User = require("../LobnosAuth/user")

router.get("/api/v1/logins", async (request, response) => {
  getAllLogins(request, response)
})

router.get("/api/v1/logins/user", async (request, response) => {
  getAUser(request, response)
})

router.post("/api/v1/logins", async (request, response) => {
  createNewAccount(request, response)
})

router.delete("/api/v1/logins", async (request, response) => {
  deleteAccount(request, response)
})

router.post("/api/v1/logins/update", async (request, response) => {
  updateUserBasicInfo(request, response)
})

router.post("/api/v1/authenticate", async (request, response) => {
  const { email, password } = request.body
  if (!email || !password) {
    return customError("Bad Request", 400, response)
  }
  userLogin(request, response)
})

router.put("/api/v1/user/authentication/activate", async (request, response) => {
  activateAUser(request, response)
})

router.get("/api/v1/user/permissions", async function (request, response) {
  const { permissions } = request.query
  if (!permissions) {
    return customError("employeeid permission id required", 404, response)
  }
  let result = await getPermissions(permissions, response)
   response.send(result);
})


router.put('/api/v1/user/permissions', function (request, response) {
   updateUserPermission(request, response);
})

router.post("/api/v1/login/clinicians", async (request, response) => {
    try {
      const { email, password } = request.body;
  
        if (!email || !password) { customError("email and password required", 404, response); return; };

        const query = `SELECT * FROM clinicianscredentials WHERE email = ?`;

        const getUserDetails = await promisifyQuery(query, [email]);

        if (getUserDetails.length === 0) { customError("Invalid credentials seen", 404, response); return }

         const { ispasswordUpdated, clinicianid } = getUserDetails[0];

        const data = { role: 'clinician',email, employeeid:clinicianid }

        if (ispasswordUpdated === 0 && getUserDetails[0]['password'] === password) {
            const token  = await new User().tokenizeData(data, "40m");
            response.send({ message: "Clinician authenticated", statusCode: 200, status: 'success', token,result: data }); return;
        }

        if (ispasswordUpdated === 0 && getUserDetails[0]['password'] !== password) {
            response.send({ message: "Invalid user credentials", statusCode: 200, status: 'fail' }); return;
        }

        if (ispasswordUpdated === 1) {
            // we compare password provided and compare to the hash of the db password
            const isMatched = new User().isPasswordSame(password, getUserDetails[0]['password']);
            isMatched ? response.send({ message: 'password authenticated', statusCode: 200, status: 'success', result: getUserDetails[0] })
                :
                response.send({ message: "Invalid user credentials", statusCode: 200, status: "error" })
            return;
        }
    } catch (err) {
        logger.error(err);
        customError('Something wrong has occured', 404, response);
    }
})





module.exports = router;