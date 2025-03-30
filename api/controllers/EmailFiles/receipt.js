const router = require('express').Router();
const path = require("path");
const { testInformation, clientInformation } = require('../../models/invoice');


router.get('/receipt/email', async function (request, response) {
  const { token, patientid } = request.query;
  if (token && patientid) {
    const x = await  testInformation(219);
    const y = await clientInformation(219);
    const data = { x, y };
   response.render(path.join(__dirname, 'Templates', 'receipt.ejs'),{data})
  }
})






module.exports = router;