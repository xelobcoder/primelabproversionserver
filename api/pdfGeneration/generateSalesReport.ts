type User = {
  id: number
  role: string
  employeeid: number
}

class SalesReportPdf {
  execTime: number
  private readonly defaultExecTime = 12

  constructor(execTime: number) {
    this.execTime = execTime
  }

  generateSalesReport(user: User) {
    console.log(user)
  }
}

