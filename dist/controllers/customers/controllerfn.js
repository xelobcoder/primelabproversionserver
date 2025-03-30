"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomers = void 0;
const registration_1 = __importDefault(require("../../models/registration/registration"));
async function getCustomers(request, response) {
    try {
        const query = request.query;
        const data = await new registration_1.default().getCustomersRecords(query);
        response.send(data);
    }
    catch (err) {
        response.send([]);
    }
}
exports.getCustomers = getCustomers;
