const router = require('express').Router();
const multer = require('multer')
const path = require('path');
const fs = require('fs');
const o = require('../models/organization');
const { customError } = require('../../helper');
const Organization = require("../models/organization/index");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let extension = file.originalname.split('.');
    let accepted = ['jpeg', 'png', 'jpg'];

    if (accepted.includes(extension[1])) {
      const destinationPath = path.join(__dirname, './../../asserts/organizations');
      cb(null, path.join(destinationPath));
    } else {
      cb(new Error('File type jpeg, png, jpg required'));
    }
  },
  filename: (req, file, cb) => {
    const { imageid } = req.query;
    if (!imageid) {
      return cb('imageid is required', null);
    }
    const uniqueSuffix = imageid + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage }).single('file')





router.get('/api/v1/organization', function (request, response) {
  o.getOrganizations(request, response);
})

router.get('/api/v1/organization/basic', function (request, response) {
  o.getOrganizationsBasic(request, response);
})

router.get('/api/v1/organization/contactperson', function (request, response) {
  o.getOrganizationsContact(request, response);
})

router.get(`/api/v1/organization/payment`, async function (request, response) {
  o.getOrganizationsPayment(request, response);
})

router.delete('/api/v1/organization', function (request, response) {
  o.deleteOrganization(request, response)
})


router.get('/api/v1/organizations/details', function (request, response) {
  o.getOrganizationWithDetails(request, response);
})

router.post('/api/v1/new/organizations', function (request, response) {
  o.createAOrganization(request, response);
})

router.put('/api/v1/organization/update/basic', async function (request, response) {
  o.updateOrganizationBasic(request, response);
})

router.put('/api/v1/organization/update/contact', async function (request, response) {
  o.updateOrganizationContact(request, response);
})

router.put('/api/v1/organization/update/payment', async function (request, response) {
  o.updateOrganizationPayment(request, response);
})


router.post('/api/v1/new/organization/images', upload, function (request, response) {
  if (!request.file) {
    response.status(400).json({ error: 'No file uploaded' });
  } else {
    response.status(200).json({ message: 'File uploaded successfully' });
  }
})


router.get('/api/v1/organization/daily', function (request, response) {
  o.dailyOrganizationCommission(request, response);
})

router.get('/api/v1/organization/monthly', function (request, response) {
  o.getOrganizationCommissionByMonth(request, response);
})

router.get('/api/v1/organization/id', function (request, response) {
  o.getOrganizationId(request, response);
})


router.get('/api/v1/organization/performance/top', function (request, response) {
  o.getTopPerformance(request, response)
})

router.get("/api/v1/organization/detail/report/monthly", async function (request, response) {
  try {
    const { organizationid } = request.query;
    if (!organizationid) {
      return customError('id required', 404, response)
    };
        const report = await new Organization(organizationid).generateSalesReport();
        response.send({status: 'success',statusCode: 200, result: report})
    } catch (err) {
        customError("something wrong occured", 500, response);
    }
})
module.exports = router;