const express = require('express');
const router = express.Router();
const SampleHandler = require('../sample');
const { responseError } = require('../../helper');
const logger = require('../../logger');
const handleSample = new SampleHandler()
router.get('/api/v1/rejected', function (request, response) {
    handleSample.getRejectedSamplesList(request, response);
})

router.post('/api/v1/rejected', function (request, response) {
    handleSample.rejectedSampleApproval(request, response);
})


router.put('/api/v1/sample/rejection/disputed', function (request, response) {
    handleSample.disputeSampleRejection(request, response);
})


router.get('/api/v1/sample/disputed/log/single', async function (request, response) {
    try {
        await handleSample.getSampleDisputeLog(request, response);
    } catch (err) {
        logger.error(err)
        responseError(response)
    }
})






module.exports = router;