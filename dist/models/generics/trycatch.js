"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapperTryCatch = void 0;
function wrapperTryCatch(cb, errcb = null) {
    try {
        return cb();
    }
    catch (err) {
        if (errcb && typeof errcb == "function") {
            errcb(err);
        }
        else {
            console.error("Error uncaught in and unhandled", err);
        }
    }
}
exports.wrapperTryCatch = wrapperTryCatch;
