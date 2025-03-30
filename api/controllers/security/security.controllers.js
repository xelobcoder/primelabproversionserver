const router = require("express").Router()
const { responseError, customError } = require("../../../helper")
const User = require("../../LobnosAuth/user")
const Security = require("../../models/security/security");


router.get("/api/v1/security/getloggedsessions", async function (request, response) {
          try {
                    const { email } = request.query
                    const user = await new User().getUserData(email)
                    const employeeid = user["employeeid"]
                    const sessions = await new Security(employeeid).getCurrentUserLoginSessionsWithDetails()
                    response.send(sessions)
          } catch (err) {
                    responseError(response)
          }
})


router.get("/api/v1/security/getloggedsessions/update", async function (request, response) {
          const { keyupdate, email } = request.query;
          if (keyupdate == 1) {
                    return;
          } else {
                    const user = await new User().getUserData(email);
                    const employeeid = user["employeeid"]
                    const status = await new Security(employeeid).destroyUserSessions();
                    response.send({status})
          }
})


router.get("/api/v1/security/user/logout", async function (request, response) {
          try {
                    const { employeeid } = request.query;
                    if (!employeeid) {
                              return customError('employeeid not found', 404, response);
                    }

                    if (isNaN(employeeid)) {
                              return customError('employeeid type invalid', 404, response);
                    }

                    const isLoggedOut = await new Security(parseInt(employeeid)).destroyUserSessions();
                    response.send({ status: isLoggedOut })
          } catch (err) {
                    responseError(response);
          }
})



router.get("/api/v1/security/users/logged/count", async function (request, response) {
          try {
                    const loggedCount = await new Security().getCurrentLoginCounts();
                    response.send({ loggedCount })
          } catch (err) {
                    responseError(response);
          }
})

router.get("/api/v1/security/users/getlogin/history", async function (request, response) {
          try {
                    const { page, count, employeeid } = request.query;
                    const security = new Security();
                    if (!isNaN(page) && !isNaN(count)) {
                              const history = await security.getGeneralLoginHistory(page, count, employeeid || null);
                              response.send(history)
                    } else {
                              return customError("bad request", 400, response);      
                    }
          } catch (err) {
                    console.log(err)
                    responseError(response);
          }
})
module.exports = router
