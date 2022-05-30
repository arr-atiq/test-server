const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, uploaddir } = require("./helperController");
const model = require("../Models/RetailerModel");

exports.insertLoanCalculation = async (req, res) => {
      let totalInterest = 0
      const  interestValue = calculateInterest(987, 2, 10, 2);
      const interestValueCharge = calculateInterest(15, 2, 10, 2);
      const interestValueOtherCharge = calculateInterest(20, 2, 10, 2);
      const transscationCost = calculateTransactionCost(987 , 10 , 2)
      
      totalInterest = (interestValue +  interestValueCharge + interestValueOtherCharge)

      let jsonResponse = {
        'interestValue':interestValue,
        'interestValueCharge':interestValueCharge,
        'interestValueOtherCharge':interestValueOtherCharge,
        'totalInterest':totalInterest,
        'transscationCost':transscationCost
      }
       
      res.send(jsonResponse)
};




var calculateInterest = function (total, days, ratePercent, roundToPlaces) {
  var interestRate = ((ratePercent/100));
  return ((days/360)*total*interestRate).toFixed(roundToPlaces);
}


var calculateTransactionCost = function (total, ratePercent, roundToPlaces) {
  var transactionRestRate = ((ratePercent/100));
  return (total*transactionRestRate).toFixed(roundToPlaces);
}
