const router = require("express").Router();
const baseurl = '/api/v1';
const { getCustomers } = require("../../../dist/controllers/customers/controllerfn");
const { changeActivationRouter } = require("../../../dist/models/activation/activate");

router.get(`${baseurl}/customers`, getCustomers)
router.get(`${baseurl}/customer/activation/status/change`, changeActivationRouter)

module.exports = router;