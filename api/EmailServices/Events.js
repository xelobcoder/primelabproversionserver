const EmailService = require("./EmailCore")
const EmailQueries = require("./EmailQueries")
const { testInformation, clientInformation } = require("../models/invoice")
const logger = require("../../logger")
const ejs = require("ejs")
const path = require("path")

class ApplicationEvents extends EmailService {
  constructor(employeeid, events) {
    super(employeeid)
    this.events = events
  }

  hasEvent(key, checker) {
    if (typeof this.events != "object") {
      throw new TypeError("object type required")
    }
    if (!this.events[key]) return false
    if (this.events[key] && typeof checker == "number") {
      return this.events[key] == "0" ? false : true
    }
    if (typeof this.events && typeof checker == "string") {
      return this.events[key] == "Yes" ? true : false
    }
    return this.events[key]
  }

  async forwardBillingReceipt(billingid) {
     try {
        const is_service_activated = new EmailQueries();
      if (!billingid || typeof billingid != "number") return false
      let testdata = await testInformation(billingid)
      let personalInfo = await clientInformation(billingid)
      const email = personalInfo[0]["email"]
      if (!email) {
        return "email not provided"
      }

      if (testdata.length > 0 && personalInfo.length > 0 && email) {
        const html = await ejs.renderFile(path.join(__dirname, "../views", "templates" + "/billing.ejs"), {
          data: {
            testdata,
            personalInfo: personalInfo[0],
            facillity: this.company,
          },
        })

        const mail = this.mailOptions(email, "Transaction Alert", html)
        return await this.transportEmail(mail)
      }
      return false
    } catch (err) {
      logger.error({ type: "email", err })
      throw new Error(err)
    }
  }

  resultApproval(billingid, testname) {
    var result = this.hasEvent("result", "string")
   }
   
}


new ApplicationEvents().forwardBillingReceipt()

module.export = ApplicationEvents
