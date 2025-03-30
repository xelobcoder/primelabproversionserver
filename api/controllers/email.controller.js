const router = require("express").Router();
const { customError } = require('../../helper');
const EmailService = require("../EmailServices/EmailCore")
const path = require("node:path");

router.get("/api/v1/email/summary", async function (request, response) {
  await new EmailService().emailSummary(response);
})


router.get("/api/v1/email/summary/daily", async function (request, response) {
  await new EmailService().getEmailSummaryByDay(response);
 })

router.get("/api/v1/email/logs", async function (request, response) {
  await new EmailService().getEmailLog(1,20,response);
})


router.get("/api/v1/email/custom/search", async function (request, response) { 
  const { email, category } = request.query;
  if (!email || !category) { customError(response, 400, "Email and Category are required"); return;}
  let result = await new EmailService().customSearch(request.query, response);
  Array.isArray(result) ? response.send({statusCode: 200, result})
   : response.send({statusCode: 400, message: result});
})



router.post("/api/v1/email/composed/draft", async function (request, response) {
  const { subject, draft, employeeid } = request.body;
  if (!subject || !draft || !employeeid) {
    customError("Subject,Draft and employeeid are required", 404, response);
  }
  const result = await new EmailService().saveComposedEmailDraft(subject, draft, employeeid);
  response.send({
    message: result == 1 ? "Draft saved successfully" : "Error saving draft",
    statusCode: result == 1 ? 200 : 400,
    status: result == 1 ? "success" : "error"
  })
})

router.get("/api/v1/email/composed/draft", async function (request, response) { 
  const { mode, id, target, limit } = request.query;
  try {
    const result = await new EmailService().getComposedEmailDraft(target,limit,mode,id);
    response.send({statusCode: 200, result,status: "success"})
  } catch (error) {
    customError(error?.message || "Error getting draft", 400, response);
  }
})


router.put("/api/v1/email/composed/draft", async function (request, response) {
  const { id, subject, draft, employeeid } = request.body;
  if (!id || !subject || !draft || !employeeid) {
    return customError("Id,Subject,Draft and employeeid are required", 404, response); 
  }
  const result = await new EmailService().updateEmailComposed(id, subject, draft, employeeid);
  response.send({
    message: result == 1 ? "Draft updated successfully" : "Error updating draft",
    statusCode: result == 1 ? 200 : 400,
    status: result == 1 ? "success" : "error"
  })
})
 

router.post("/api/v1/email/publish", async function (request, response) {
  const { id } = request.body;
  if (!id) { customError("Id is required", 404, response); return; }
  const result = await new EmailService().publishEmail(request.body);
  response.send({ statusCode: 200, message: result, status: "success" })
})
 

router.get("/verifyemail", async function (request, response) {
  response.render(path.join(__dirname,"../views/pages/verifyemail.ejs"));
})


router.get("/api/v1/verify/email/token", async function (request, response) { 
  const { token } = request.query;
  try
  {
    const eservice = new EmailService();
    const isVerify = await eservice.verifyClientAuthToken(token);

    if (typeof isVerify == "string") { 
      customError(isVerify, 400, response); return; 
    }
   
    if (isVerify) {
      response.send({ statusCode: 200, message: "Email verified successfully. Temporary access credentials will be sent to your mail.Kindly access it and use it to login to your portal. You are adviced to quickly update credentials as soon as possible", status: "success" });
    }
    
  } catch (err) {
    customError("Link is expired", 400, response);
  }
})
module.exports = router;