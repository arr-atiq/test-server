const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helperController");
const model = require("../Models/RetailerModel");
const { default: axios } = require("axios");
const knex = require("../config/database");

exports.insertLoanCalculation = async (req, res) => {
      let totalInterest = 0
      let totalLoan = 0
      const config = {
        headers: { 
            Authorization: `${req.headers.authorization}`,
            'Content-Type': 'application/json'
        },
      };
      const schemaGetvalue =await axios.get(`http://localhost:5000/scheme/84`,config )
      const schemavalue = schemaGetvalue.data.data[0]
      const  interestValue = calculateInterest(987, 2, 10, 2);
      const interestValueCharge = calculateInterest(15, 2, 10, 2);
      const interestValueOtherCharge = calculateInterest(20, 2, 10, 2);
      const transscationCost = calculateTransactionCost(987 , 10 , 2)
      const reimbursmentCost = calculateInterest(87 , 2,  10 , 2)
      console.log(req.headers)
      
      
      totalInterest = (parseFloat(interestValue) +  parseFloat(interestValueCharge) + parseFloat(interestValueOtherCharge) + parseFloat(reimbursmentCost)).toFixed(2)
      totalLoan = 987 + parseFloat(totalInterest) - 100
      
      

      let jsonResponse = {
        'interestValue':interestValue,
        'interestValueCharge':interestValueCharge,
        'interestValueOtherCharge':interestValueOtherCharge,
        'totalInterest':totalInterest,
        'transscationCost':transscationCost,
        'reimbursmentCost':reimbursmentCost,
        'totalLoan':parseFloat(totalLoan).toFixed(2)
      }
       
      res.send(jsonResponse)
};

exports.addCredit = async (req, res) => {
        let reqValue = req.body
         console.log(reqValue)
        const createScheme = await knex("APSISIPDC.cr_retailer_loan_calculation").insert(reqValue);

       
       res.send(createScheme)
};




var calculateInterest = function (total, days, ratePercent, roundToPlaces) {
  var interestRate = ((ratePercent/100));
  return ((days/360)*total*interestRate).toFixed(roundToPlaces);
}


var calculateTransactionCost = function (total, ratePercent, roundToPlaces) {
  var transactionRestRate = ((ratePercent/100));
  return (total*transactionRestRate).toFixed(roundToPlaces);
}
