var SalesReportPdf = /** @class */ (function () {
    function SalesReportPdf(execTime) {
        this.defaultExecTime = 12;
        this.execTime = execTime;
    }
    SalesReportPdf.prototype.generateSalesReport = function (user) {
        console.log(user);
    };
    return SalesReportPdf;
}());
var t2 = new SalesReportPdf(45).generateSalesReport({ id: 1, role: "admin", employeeid: 45 });
console.log(t2);
