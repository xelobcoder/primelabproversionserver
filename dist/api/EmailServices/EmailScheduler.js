"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmailCore_1 = __importDefault(require("./EmailCore"));
class EmailScheduler extends EmailCore_1.default {
    constructor(employeeid, datetime) {
        super(employeeid);
        this.scheduleTime = datetime;
    }
    set scheduleDatetime(datetime) {
        if (!datetime)
            throw new Error("datetime not provided");
        this.scheduleTime = new Date(datetime);
    }
    get scheduleDatetime() {
        return this.scheduleTime;
    }
}
exports.default = EmailScheduler;
