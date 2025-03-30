"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("./helper"); // Adjust the path as per your project structure
const queries = __importStar(require("./queries"));
class Escrow {
    constructor(requisitionid) {
        this.requisitionid = requisitionid;
    }
    async getEsrowReqt() {
        if (!this.requisitionid)
            throw new Error("Requisition id is required");
        return await (0, helper_1.promisifyQuery)(queries.q_getEsrowReqt, [this.requisitionid]);
    }
    async pushNewGenDebitHx(record) {
        const { stockid, brandid, productordersid, debitqty, batchnumber, departmentid } = record;
        const query = queries.q_pushNewGenDebitHx;
        const values = [stockid, batchnumber, brandid, productordersid, debitqty, departmentid];
        const result = await (0, helper_1.promisifyQuery)(query, values);
        return (0, helper_1.rowAffected)(result);
    }
    async updateEscrow(requisitionid, status) {
        if (!requisitionid || !status) {
            throw new Error("Requisition id and status are required");
        }
        let query = queries.q_updateEscrow.replace("{{ifReceived}}", status === "received" ? ", receivedon = NOW()" : "");
        return (0, helper_1.rowAffected)(await (0, helper_1.promisifyQuery)(query, [status, requisitionid]));
    }
}
exports.default = Escrow;
