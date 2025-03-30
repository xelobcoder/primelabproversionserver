"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synchronize = void 0;
const queries_1 = require("../queries");
const helper_1 = require("../../../../helper");
async function getSyncCurrentRecord() {
    return await (0, helper_1.promisifyQuery)(queries_1._current_record_synchronization);
}
function parseTarget(test) {
    if (!test.includes(","))
        throw new Error("wrong string  provided");
    const list = test.split(",").map((a, b) => parseInt(a));
    return list;
}
async function requestSynchronization(syncdata, requestby) {
    let requestdata = "";
    if (typeof syncdata == "string" && syncdata.includes(",")) {
        requestdata = syncdata;
    }
    else if (Array.isArray(syncdata) && syncdata.length > 0) {
        requestdata = syncdata.join(",");
    }
    else {
        throw new TypeError("Bad Data provide,array of numbers required or a , split string");
    }
    const request = (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(queries_1.syncRequestQuery, [requestdata, requestby]));
}
async function synchronize() {
    let testList = await getSyncCurrentRecord();
    let shouldSyn = await shouldSynchronize(testList);
    if (!shouldSyn)
        return false;
    const Tpackets = await (0, helper_1.promisifyQuery)(`SELECT * FROM customtestcreation WHERE testid IN (${testList})`);
    if (Tpackets.length == 0)
        return false;
    const parsedTest = parseTarget(testList);
    const synTest = {};
    for (let i = 0; i < parsedTest.length; i++) {
        synTest[parsedTest[i]] = Tpackets.filter((a, b) => parsedTest[i] == a.testid);
    }
    return synTest;
}
exports.synchronize = synchronize;
async function shouldSynchronize(record) {
    if (record.length == 0)
        return false;
    const packet = record[0];
    const { status, lastSyncdatetime } = packet;
    if (status == "done" && lastSyncdatetime != null)
        return false;
    return true;
}
// requestSynchronization("1001100,1001101,1001102,1001103", 3)
//   .then((t) => console.log(t))
//   .catch((d) => console.log(d));
