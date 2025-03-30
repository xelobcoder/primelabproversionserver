const database_queries = require('./database/queries');
const router = require('express').Router();
const testpanel = require('./testpanel/list');

router.post('/api/v1/branches', function (request, response) {
  database_queries.addBranch(request, response)
});

router.put('/api/v1/branches/activation', function (request, response) {
  database_queries.activateDeactivate(request, response)
})


router.get('/api/v1/branches', function (request, response) {
  database_queries.getBranch(request, response)
});


router.put('/api/v1/branches', function (request, response) {
  database_queries.editBranch(request, response)
});


router.delete('/api/v1/branches', function (request, response) {
  const { branchid } = request.body;
  database_queries.deleteBranch(branchid, request, response)
});


router.post('/api/v1/sampletype', function (request, response) {
  testpanel.addSampleType(request, response);
})

router.get('/api/v1/sampletype', function (request, response) {
  testpanel.getSampleType(response);
})

router.delete('/api/v1/sampletype', function (request, response) {
  testpanel.deleteSampleType(request, response)
})







module.exports = router;