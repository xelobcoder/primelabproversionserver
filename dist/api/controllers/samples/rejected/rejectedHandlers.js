"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSampleDisputeLog = exports.disputeSampleRejection = exports.rejectedSampleApproval = exports.getRejectedSamplesList = void 0;
const helper_1 = require("../../../../helper");
const logger_1 = __importDefault(require("../../../../logger"));
const sample_1 = __importDefault(require("../sample"));
const handleSample = new sample_1.default();
const getRejectedSamplesList = (req, res) => {
    handleSample.getRejectedSamplesList(req, res);
};
exports.getRejectedSamplesList = getRejectedSamplesList;
const rejectedSampleApproval = (req, res) => {
    handleSample.rejectedSampleApproval(req, res);
};
exports.rejectedSampleApproval = rejectedSampleApproval;
const disputeSampleRejection = (req, res) => {
    handleSample.disputeSampleRejection(req, res);
};
exports.disputeSampleRejection = disputeSampleRejection;
const getSampleDisputeLog = async (req, res) => {
    try {
        await handleSample.getSampleDisputeLog(req, res);
    }
    catch (err) {
        logger_1.default.error(err);
        (0, helper_1.responseError)(res);
    }
};
exports.getSampleDisputeLog = getSampleDisputeLog;
