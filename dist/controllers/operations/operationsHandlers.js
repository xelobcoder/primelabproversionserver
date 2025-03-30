"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProcessedScanList = exports.getUltrasoundWaitingList = exports.getAllPendingCases = exports.getAllTestPreview = exports.getAllEnterResult = exports.initiateProcessing = exports.getBillingTest = exports.getAllCollections = void 0;
const express_1 = require("express");
const helper_1 = require("../../../helper");
const operations_1 = __importDefault(require("../../models/operations/operations"));
const getAllCollections = async (req, res) => {
    try {
        const { departmentid } = req.query;
        if (!departmentid) {
            return (0, helper_1.customError)("departmentid not included in request query", 400, res);
        }
        const collections = new operations_1.default(null);
        const result = await collections.getLaboratoryTestReadyForResultEntry(departmentid);
        res.send({ statusCode: 200, message: "success", result });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getAllCollections = getAllCollections;
const getBillingTest = async (req, res) => {
    const { billingid } = req.query;
    if (!billingid) {
        res.status(400).send({
            statusCode: 400,
            message: "Invalid billingid",
        });
        return;
    }
    const result = await new operations_1.default(billingid).billingTest(req);
    if (result === "Billingid is not ready for testing") {
        res.status(400).send({
            statusCode: 400,
            message: result,
        });
    }
    else {
        res.send({
            statusCode: 200,
            message: "success",
            result,
        });
    }
};
exports.getBillingTest = getBillingTest;
const initiateProcessing = async (req, res) => {
    try {
        const { billingid, testid } = req.query;
        if (!billingid || !testid) {
            return (0, helper_1.customError)("billing id or testid is missing", 404, res);
        }
        const operations = new operations_1.default(billingid);
        const result = await operations.initiateTestProcessing(testid, billingid);
        res.send({ status: result ? "success" : "failed" });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.initiateProcessing = initiateProcessing;
const getAllEnterResult = async (req, response) => {
    try {
        const result = await new operations_1.default(null).getAllEnterResult(req.query);
        response.send({ result, statusCode: 200 });
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getAllEnterResult = getAllEnterResult;
const getAllTestPreview = async (req, res) => {
    try {
        let billingid = req.query.billingid;
        if (!billingid)
            return (0, helper_1.customError)("billingid required", 400, res);
        const result = await new operations_1.default(billingid).getAllTestPreview(billingid);
        res.send({
            statusCode: 200,
            result,
            status: "success",
        });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getAllTestPreview = getAllTestPreview;
const getAllPendingCases = async (req, res) => {
    try {
        const { count = 10, page = 1, departmentid, status, testid, billingid, fullname, from, to } = req.query;
        const data = { count, page, departmentid, status, testid, fullname, from, to, billingid };
        const result = await new operations_1.default(null).getAllCasesResultEntryByMany(data);
        res.send({ result, statusCode: 200, status: "success" });
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getAllPendingCases = getAllPendingCases;
const getUltrasoundWaitingList = async (request, response) => {
    try {
        const { page, count } = request.query;
        const waitingList = await new operations_1.default(null).getUltrasoundWaitingList({ page, count });
        response.send(waitingList);
    }
    catch (err) {
        (0, helper_1.responseError)(response);
    }
};
exports.getUltrasoundWaitingList = getUltrasoundWaitingList;
const getProcessedScanList = async (req, res) => {
    try {
        const result = await new operations_1.default(null).processedScanList(req.query);
        express_1.response.send(result);
    }
    catch (err) {
        (0, helper_1.responseError)(res);
    }
};
exports.getProcessedScanList = getProcessedScanList;
