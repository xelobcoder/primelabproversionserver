"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billErrors = void 0;
var billErrors;
(function (billErrors) {
    billErrors["already"] = "client billed on same day. Kindly check the billing history to update billing";
    billErrors["failed"] = "billing client failed";
    billErrors["error"] = "error occured in processing  transaction";
    billErrors["badparams"] = "Bad Request provided";
})(billErrors || (exports.billErrors = billErrors = {}));
