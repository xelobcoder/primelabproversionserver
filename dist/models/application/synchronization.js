"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./queries");
const helper_1 = require("../../../helper");
async function getSyncCurrentRecord() {
    return await (0, helper_1.promisifyQuery)(queries_1._current_record_synchronization);
}
async function shouldSynchronize(record) {
    return false;
}
