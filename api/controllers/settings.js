const router = require('express').Router();
const { addNewDepartment, updateDepartment, getDepartments, deleteDepartment, getSpecificDepartment } = require('../models/settings');
const { AddCompanyInfo, getCompanyInfo, getCompanyImage } = require('../settings/companydata');

const upload = require('../settings/companyimage');

router.get('/api/v1/departments', async (request, response) => {
  getDepartments(request, response)
});



router.post('/api/v1/departments', async (request, response) => {
  addNewDepartment(request, response)
});


router.delete('/api/v1/departments', async (request, response) => {
  deleteDepartment(request, response)
})


// update 
router.put('/api/v1/departments', async (request, response) => {
  updateDepartment(request, response)
})


// get a speciiic department
// router.get('/api/v1/departments/:id', async (request, response) => {
//   getSpecificDepartment(request, response)
// })




router.post('/api/v1/settings/companyprofile', function (request, response) {
  AddCompanyInfo(request, response);
})


router.get('/api/v1/settings/companyprofile', function (request, response) {
  getCompanyInfo(request, response)
})

router.post('/api/v1/settings/companyprofile/images', upload, function (req, res) {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
  } else {
    // File uploaded successfully
    res.status(200).json({ message: 'File uploaded successfully' });
  }
});


router.get('/api/v1/settings/companyprofile/images', function (request, response) {
  getCompanyImage(request, response)
})


module.exports = router;