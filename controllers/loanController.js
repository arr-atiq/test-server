const readXlsxFile = require("read-excel-file/node");
const xlsx = require("xlsx");
const moment = require("moment");
const { sendApiResult, blockunblock, retailerAvgByManufacturer } = require("./helperController");
const model = require("../Models/Retailer");
const { default: axios } = require("axios");
const knex = require("../config/database");
const { pushNotification } = require("./notification_helper");

// var moment = require('moment');

/**
 *
 * NOTE  Transaction Type : DISBURSEMENT , REPAYMENT , INTERESTANDOTHERS , EXPIRYINTEREST , TRANSACTION
 *
 */

const { HOSTIP } = process.env;

exports.insertLoanCalculation = async (req, res) => {
  let totalInterest = 0;
  let totalLoan = 0;
  const config = {
    headers: {
      Authorization: `${req.headers.authorization}`,
      "Content-Type": "application/json",
    },
  };
  var responseValue = [];
  try{
    // get all rmn account 
    const allRMNAccount = await getAllRmnAccount();

    var allValueResponse = [];
    const myPromise = new Promise((resolve, reject) => {
      // map rmn account
      allRMNAccount &&
        allRMNAccount?.length > 0 &&
        allRMNAccount?.map(async (rmnAccount) => {
          var loanTableData = await getDataLoanTable(rmnAccount.ac_number_1rmn);
          if (loanTableData?.onermn_acc) {
            // get scheme id
            const getSchemeId = await getSchemeID(rmnAccount.ac_number_1rmn);
  
            const principalAmount = await getPrincipalAmount(
              rmnAccount.ac_number_1rmn
            );
            // get scheme value call axios
            // const schemaGetvalue = await axios.get(
            //   `${HOSTIP}/scheme/${getSchemeId[0].scheme_id}`,
            //   config
            // );
            const schemaGetvalue =await getSchemeValue(getSchemeId[0]?.scheme_id)
            // console.log('schemaGetvalue',schemaGetvalue[0])
            // return
            const schemavalue = schemaGetvalue[0];
            // loan tenor in days found
            var LoanTenorIndays = await findLoanTenorIndays(
              rmnAccount.ac_number_1rmn,
              schemavalue
            );
            var dailyInterestValue;
  
            let overdue_amount_value = {
              onermn : rmnAccount.ac_number_1rmn,
              disbursement_id:LoanTenorIndays.disID,
              overdue_amount:parseFloat(LoanTenorIndays?.minimum_amount) + (parseFloat(principalAmount.total_outstanding) - parseFloat(principalAmount.principal_outstanding))
            }
            // scheme expiry date er sathe add hbe ... expiry date month ase oita er sathe 12 multiply korte hbe , expiry date er jnno
            var date = moment(
              moment(rmnAccount?.crm_approve_date),
              "YYYY-MM-DD"
            ).add(schemavalue.expiry_date * 30, "days");
            var now = moment();
  
           
           // check expiry or not expiry condition
            var checkExpiry = false;
            if (now > date) {
              checkExpiry = true;
            } else {
              checkExpiry = false;
            }
            //found grace value. Grace value loan tenor in days hole pore extra grace date add korte hbe 
            var graceValue =
              parseInt(schemavalue.loan_tenor_in_days) +
              parseInt(schemavalue.grace_periods_in_days);
              console.log('checkExpirycheckExpiry',checkExpiry)
           // expiry check condition
            if (checkExpiry) {
              const interestAfterExpiryOverdue = calculateInterest(
                principalAmount.total_outstanding,
                1,
                schemavalue.overdue_amount,
                2
              );
              const interestAfterExpiryPenal = calculateInterest(
                principalAmount.total_outstanding,
                1,
                schemavalue.penal_charge,
                2
              );
  
              var expiryInterestValue;
              totalInterest =
                parseFloat(interestAfterExpiryOverdue) +
                parseFloat(interestAfterExpiryPenal);
              totalLoan =
                parseFloat(principalAmount.total_outstanding) +
                parseFloat(totalInterest);
  
                console.log('graceValue',graceValue)
                console.log('LoanTenorIndays?.days',LoanTenorIndays?.days)
  
                overdue_amount_value = {
                  onermn : rmnAccount.ac_number_1rmn,
                  disbursement_id:LoanTenorIndays.disID,
                  overdue_amount:parseFloat(LoanTenorIndays?.minimum_amount) + (parseFloat(principalAmount.total_outstanding) - parseFloat(principalAmount.principal_outstanding)) + parseFloat(totalInterest)
                }
  
              if (graceValue <= LoanTenorIndays?.days) {
                const interestAfterGracePenal =
                  calculateInterest(
                    principalAmount.principal_outstanding,
                    1,
                    schemavalue.penal_charge,
                    2
                  ) ?? 0;
                expiryInterestValue = {
                  overdue_amount: interestAfterExpiryOverdue,
                  penal_interest: interestAfterExpiryPenal,
                  penal_charge: interestAfterGracePenal,
                  principal_outstanding: parseFloat(
                    principalAmount.principal_outstanding
                  ),
                  retailer_id: principalAmount.retailer_id,
                  onermn_acc: principalAmount.onermn_acc,
                  // 'disbursement_id': principalAmount.disbursement_id,
                  total_outstanding:
                    totalLoan + parseFloat(interestAfterGracePenal),
                  manu_scheme_mapping_id: getSchemeId[0]?.id,
                  // 'transaction_cost_type':principalAmount.transaction_cost_type,
                  transaction_type: "EXPIRYINTEREST",
                };
              } else {
                expiryInterestValue = {
                  overdue_amount: interestAfterExpiryOverdue,
                  penal_interest: interestAfterExpiryPenal,
                  principal_outstanding: parseFloat(
                    principalAmount.principal_outstanding
                  ),
                  retailer_id: principalAmount.retailer_id,
                  manu_scheme_mapping_id: getSchemeId[0]?.id,
                  onermn_acc: principalAmount.onermn_acc,
                  // 'disbursement_id': principalAmount.disbursement_id,
                  total_outstanding: totalLoan,
                  // 'transaction_cost_type':principalAmount.transaction_cost_type,
                  transaction_type: "EXPIRYINTEREST",
                };
  
              }
  
              const createInterestExpiry = await knex(
                "APSISIPDC.cr_retailer_loan_calculation"
              ).insert(expiryInterestValue);
  
  
              const limit_update_overdue_amount = await knex(
                "APSISIPDC.cr_overdue_amount"
              ).insert(overdue_amount_value);
  
              await knex.transaction(async (trx) => {
                const limit_update_overdue_amount = await trx(
                  "APSISIPDC.cr_disbursement"
                )
                  .where({ id: LoanTenorIndays.disID })
                  .update({overdue_amount:parseFloat(LoanTenorIndays?.minimum_amount) + (parseFloat(expiryInterestValue.total_outstanding) - parseFloat(expiryInterestValue.principal_outstanding))});              
              });
  
              responseValue.push(expiryInterestValue);
              // return res.send(
              //   sendApiResult(true, "You have Successfully Add Credit.", createInterestExpiry)
              // );
            } else {
              const dailyInterest = calculateInterest(
                principalAmount.principal_outstanding,
                1,
                schemavalue.rate_of_interest,
                2
              );
              const interestOfCharge = calculateInterest(
                principalAmount.principal_outstanding,
                1,
                schemavalue.charge,
                2
              );
              const interestOftherCharge = calculateInterest(
                principalAmount.principal_outstanding,
                1,
                schemavalue.other_charge,
                2
              );
              const interestOfreimbursment = calculateInterest(
                principalAmount.principal_outstanding,
                1,
                schemavalue.reimbursment_cost,
                2
              );
  
              totalInterest =
                parseFloat(dailyInterest) +
                parseFloat(interestOfCharge) +
                parseFloat(interestOftherCharge) +
                parseFloat(interestOfreimbursment);
              totalLoan =
                parseFloat(principalAmount.total_outstanding) +
                parseFloat(totalInterest);
  
              console.log("graceValue", graceValue);
              console.log("LoanTenorIndays", LoanTenorIndays?.days);
  
              if (graceValue <= LoanTenorIndays?.days) {
                const interestAfterGracePenal =
                  calculateInterest(
                    principalAmount.principal_outstanding,
                    1,
                    schemavalue.penal_charge,
                    2
                  ) ?? 0;
  
                console.log("interestAfterGracePenal", interestAfterGracePenal);
                dailyInterestValue = {
                  retailer_id: principalAmount.retailer_id,
                  onermn_acc: principalAmount.onermn_acc,
                  // 'penal_charge':parseFloat(interestAfterGracePenal),
                  // 'retailer_id':principalAmount.retailer_id,
                  // 'retailer_id':principalAmount.retailer_id,
                  principal_outstanding: principalAmount.principal_outstanding,
                  daily_principal_interest: dailyInterest,
                  interest_reimbursment: interestOfreimbursment,
                  other_charge: interestOftherCharge,
                  charge: interestOfCharge,
                  total_outstanding:
                    totalLoan + parseFloat(interestAfterGracePenal),
                  penal_charge: interestAfterGracePenal,
                  //  'transaction_cost_type':principalAmount.transaction_cost_type,
                  processing_fee: 0,
                  manu_scheme_mapping_id: getSchemeId[0]?.id,
                  transaction_type: "INTERESTANDOTHERS",
                };

                overdue_amount_value = {
                  onermn : rmnAccount.ac_number_1rmn,
                  disbursement_id:LoanTenorIndays.disID,
                  overdue_amount:parseFloat(LoanTenorIndays?.minimum_amount) + (parseFloat(dailyInterestValue.total_outstanding) - parseFloat(dailyInterestValue.principal_outstanding))
                }
                const limit_update_overdue_amount = await knex(
                  "APSISIPDC.cr_overdue_amount"
                ).insert(overdue_amount_value);
    
                await knex.transaction(async (trx) => {
                  const limit_update_overdue_amount = await trx(
                    "APSISIPDC.cr_disbursement"
                  )
                    .where({ id: LoanTenorIndays.disID })
                    .update({overdue_amount: ((parseFloat(dailyInterestValue.total_outstanding) - parseFloat(dailyInterestValue.total_outstanding)) + overdue_amount_value.overdue_amount).toFixed(2)});              
                });
              } else {
                dailyInterestValue = {
                  retailer_id: principalAmount.retailer_id,
                  onermn_acc: principalAmount.onermn_acc,
                  // 'retailer_id':principalAmount.retailer_id,
                  // 'retailer_id':principalAmount.retailer_id,
                  principal_outstanding: principalAmount.principal_outstanding,
                  daily_principal_interest: dailyInterest,
                  interest_reimbursment: interestOfreimbursment,
                  other_charge: interestOftherCharge,
                  charge: interestOfCharge,
                  total_outstanding: totalLoan,
                  //  'transaction_cost_type':principalAmount.transaction_cost_type,
                  processing_fee: 0,
                  manu_scheme_mapping_id: getSchemeId[0]?.id,
                  transaction_type: "INTERESTANDOTHERS",
                };
              }
  
              //  delete dailyInterestValue.id
              //  delete dailyInterestValue.overdue_amount
              //  delete dailyInterestValue.penal_charge
              console.log("dailyInterestValue", dailyInterestValue);
  
              const createInterest = await knex(
                "APSISIPDC.cr_retailer_loan_calculation"
              ).insert(dailyInterestValue);
              responseValue.push(dailyInterestValue);
  
             
              // return res.send(
              //   sendApiResult(true, "You have Successfully Add Credit.", createInterest)
              // );
            }
            if (allRMNAccount.length == responseValue.length) {
              resolve(true);
            }
          } else {
            responseValue.push("This Retailer have no loan");
          }
        });
    }).then(() => {
      return res.send(
        sendApiResult(true, "You have Successfully Add Credit.", responseValue)
      );
    });
  }
  catch (error) {
    console.log('error',error)
  }
  
};

exports.addCredit = async (req, res) => {
  let reqValue = req.body;
  console.log(reqValue);
  const createScheme = await knex(
    "APSISIPDC.cr_retailer_loan_calculation"
  ).insert(reqValue);
  return res.send(
    sendApiResult(true, "You have Successfully Add Credit.", createScheme)
  );
};

exports.disbursement = async (req, res) => {
  let { retailer_id, onermn_acc, sales_agent_id, disbursement_amount } =
    req.body;

  /**
   * Getting Scheme Configure Data
   */
  const findSalesAgent = await findSalesrelation(sales_agent_id, retailer_id);
  const principalAmount = await getPrincipalAmount(onermn_acc);
  const getLimitAmountValue = await getLimitAmount(onermn_acc);
  var slab = false;
  var transaction_cost = 0;
  // console.log('getLimitAmountValue',getLimitAmountValue[0]?.crm_approve_limit > disbursement_amount)
  let totalLimit =
    parseInt(getLimitAmountValue[0]?.crm_approve_limit) -
    parseInt(getLimitAmountValue[0]?.current_limit);

  if (findSalesAgent[0]?.id) {
    if (totalLimit > disbursement_amount) {
      const getSchemeId = await getSchemeID(onermn_acc);
      let distributor_Email;
      let SchemeValue;
      if (getSchemeId) {
        distributor_Email = await getDistributorEmail(
          getSchemeId[0]?.distributor_id
        );
        SchemeValue = await getSchemeValue(getSchemeId[0].scheme_id);
      } else {
        /**
         * If scheme not found . Then in future we will hir global parameter
         */
      }

      let disbursement = {
        retailer_id: retailer_id,
        sales_agent_id: sales_agent_id,
        disbursement_amount: disbursement_amount,
        onermn_acc:onermn_acc
        // 'transaction_fee' : disbursement_amount * (SchemeValue[0]?.processing_cost/100),
      };

      const createDisbursment = await knex("APSISIPDC.cr_disbursement")
        .insert(disbursement)
        .returning("id");
      if (createDisbursment) {
        var outstanding = principalAmount?.total_outstanding ?? 0;
        // var processingFeeValue = disbursement_amount * (SchemeValue[0]?.processing_cost/100)
        if (getSchemeId[0]?.transaction_type == "SLAB") {
          const now = moment.utc();
          var end = moment(dateSlab);
          var days = now.diff(end, "days");
          const getSlabValue = await getSlabAmount(disbursement_amount, days);
          transaction_cost = getSlabValue[0]?.transaction_fee ?? 0;
        } else {
          transaction_cost =
            disbursement_amount * (SchemeValue[0]?.transaction_fee / 100) ?? 0;
        }
        var transactionFeeValue = parseFloat(transaction_cost);
        // var transsactionFeeValue = 0;
        // if(slab){
        // }else{
        //   transsactionFeeValue = disbursement_amount * (SchemeValue[0]?.transaction_fee/100) ?? 0
        // }

        var loan = {
          retailer_id: retailer_id,
          principal_outstanding: principalAmount?.principal_outstanding
            ? parseInt(principalAmount.principal_outstanding) +
              parseFloat(disbursement_amount)
            : parseFloat(disbursement_amount),
          disburshment: disbursement_amount,
          onermn_acc: onermn_acc,
          transaction_type: "DISBURSEMENT",
          disbursement_id: createDisbursment[0],
          total_outstanding: outstanding + disbursement_amount,
          sales_agent_id: sales_agent_id,
          manu_scheme_mapping_id: getLimitAmountValue[0]?.id,
          // 'transaction_cost_type':transaction_cost_type
        };
        console.log("loan", loan);
        var limitUpdate = {
          current_limit:
            parseFloat(getLimitAmountValue[0]?.current_limit) +
            parseFloat(disbursement_amount),
        };
        // var processingFee = {
        //   'retailer_id' : retailer_id,
        //   'principal_outstanding' :principalAmount?.principal_outstanding ? (parseFloat(principalAmount.principal_outstanding) + disbursement_amount) : disbursement_amount ,
        //   'onermn_acc' : onermn_acc,
        //   'transaction_type' : 'TRANSACTIONFEE',
        //   'disbursement_id': createDisbursment[0],
        //   'sales_agent_id' :sales_agent_id,
        //   // 'processing_fee':processingFeeValue,
        //   'transaction_cost':transactionFeeValue,
        //   'total_outstanding':outstanding + transactionFeeValue + disbursement_amount
        //   // 'transaction_cost_type':transaction_cost_type
        // }

        // var transsactionFee = {
        //   'retailer_id' : retailer_id,
        //   'principal_outstanding' :principalAmount?.principal_outstanding ? (parseFloat(principalAmount.principal_outstanding) + disbursement_amount) : disbursement_amount ,
        //   'onermn_acc' : onermn_acc,
        //   'transaction_type' : 'TRANSACTIONFEE',
        //   'disbursement_id': createDisbursment[0],
        //   'transaction_cost':transsactionFeeValue,
        //   'total_outstanding':outstanding + processingFeeValue + disbursement_amount + transsactionFeeValue,
        // }

        await knex("APSISIPDC.cr_retailer_loan_calculation")
          .insert(loan)
          .returning("id")
          .then(async (response) => {
            try {
              const sendMail = await axios.post(
                `${process.env.HOSTIP}/mail/tempSendmail`,
                {
                  email:
                    distributor_Email && distributor_Email[0]?.official_email,
                  mail_subject: `IPDC DANA | Collection Confirmation| <${parseInt(
                    response[0]
                  )}.>`,
                  mail_body: `
                <p>Dear IPDC DANA Partner,</p>
  
                <p>Please find the disbursement details:</p>
  
                <p>Disbursement Date: ${moment().format("YYYY-MM-DD")}</p>
                <p>Disbursed Amount: ${disbursement_amount}</p>
                <p>Request ID: ${response[0]}</p>
                <p>Bank Account:  ${onermn_acc}</p>
  
                <p>Please let us know if you have any queries. </p>
                <p>Regards, </p>
                <p>IPDC Finance</p>
                `,
                }
              );
              console.log("sendMailsendMailsendMail", sendMail);
            } catch (err) {
              console.log("errorerrorerrorerrorerror", err);
            }
            // await knex("APSISIPDC.cr_retailer_loan_calculation").insert(processingFee).then(async ()=>{
            await knex.transaction(async (trx) => {
              // await knex("APSISIPDC.cr_retailer_loan_calculation").insert(transsactionFee).then(async ()=>{
              const limit_update = await trx(
                "APSISIPDC.cr_retailer_manu_scheme_mapping"
              )
                .where({ ac_number_1rmn: onermn_acc })
                .update(limitUpdate);
              console.log("limit_update", limit_update);
              if (limit_update <= 0) {
                return res.send(
                  sendApiResult(false, "failed to update one rmn account ")
                );
              }
            });
            // });
            // })
          });

        /* Implementin push notification */
        let body = `BDT ${disbursement_amount} has been disbursed to your bank account upon your request. Your account number is : ${onermn_acc} `;
        const device_token_response = await knex("APSISIPDC.cr_users")
          .leftJoin(
            "APSISIPDC.cr_sales_agent_user",
            "cr_sales_agent_user.user_id",
            "cr_users.id"
          )
          .where("cr_users.status", "Active")
          .where("cr_sales_agent_user.sales_agent_id", sales_agent_id)
          .select("cr_users.device_token");
        console.log("device_token", device_token_response);
        let receiver_token =device_token_response ? device_token_response[0]?.device_token : '';
        console.log("device_token", device_token_response);

        await pushNotification(
          retailer_id,
          sales_agent_id,
          "DISBURSEMENT",
          "Disbursement completed!",
          body,
          receiver_token
        );
      }
      return res.send(
        sendApiResult(true, "You have Successfully Added Credit.", loan)
      );
    } else {
      return res.send(
        sendApiResult(false, "Disbursement is higher than propose limit.")
      );
    }
  } else {
    return res.send(
      sendApiResult(false, "No relation Between Sales Agent And Retailer.")
    );
  }
};

exports.repayment = async (req, res) => {
  let { retailer_id, onermn_acc, sales_agent_id, repayment, transaction_cost , nid ,manuID  } =
    req.body;
  // let transaction_cost = transaction_cost_value;

  // const retailerAvg = await retailerAvgByManufacturer(nid , manuID)
  // console.log('retailerAvg',retailerAvg)
  // res.send(retailerAvg)
  //  return 
  const findSalesAgent = await findSalesrelation(sales_agent_id, retailer_id);
  const firstRepaymentID = await getfirstRepaymentID(onermn_acc);
  var newInterestPaid = 0
  const principalAmount = await getPrincipalAmount(onermn_acc);
  const getLimitAmountValue = await getLimitAmount(onermn_acc);
  const getSlabDateValue = await getSlabDate(onermn_acc);
  const dateSlab = getSlabDateValue?.created_at;
  var getSchemeId = await getSchemeID(onermn_acc);
  var distributor_Email;
  var interestValueAll;
  var SchemeValue;
  if (getSchemeId) {
    distributor_Email = await getDistributorEmail(
      getSchemeId[0]?.distributor_id
    );
    SchemeValue = await getSchemeValue(getSchemeId[0]?.scheme_id);
  } else {
    /**
     * If scheme not found . Then in future we will hir global parameter
     */
  }
  if (principalAmount?.total_outstanding >= repayment) {
    // let repaymentType = {
    //   retailer_id: retailer_id,
    //   sales_agent_id: sales_agent_id,
    //   disbursement_amount: 0,
    //   transaction_fee: 0,
    //   sales_agent_id: sales_agent_id,
    //   repayment: repayment,
    // };
    let calculateRepaymentInterest =
      parseFloat(principalAmount.total_outstanding) -
        parseFloat(principalAmount.principal_outstanding) ?? 0;
    interestValueAll = calculateRepaymentInterest
    // const createRepayment = await knex("APSISIPDC.cr_disbursement")
    //   .insert(repaymentType)
    //   .returning("id");
    // if (createRepayment) {
    // if(getSchemeId[0]?.transaction_type == 'SLAB'){
    //   const now = moment.utc();
    //   var end = moment(dateSlab);
    //   var days = now.diff(end, "days");
    //   const getSlabValue =await getSlabAmount(repayment , days )
    //   transaction_cost = getSlabValue[0]?.transaction_fee ?? 0
    // }else{
    //   transaction_cost = repayment * (SchemeValue[0]?.transaction_fee/100) ?? 0
    // }

    var intersetPaid = 0;

    if (calculateRepaymentInterest > repayment) {
      intersetPaid = parseFloat(repayment);
      // intersetPaid = parseFloat(calculateRepaymentInterest) - parseFloat(repayment)
      // let totalInterestResponse = {
      //   'totalInterest' : calculateRepaymentInterest
      // }
      // return res.send((sendApiResult(false, "Your repayment is less than your total interest",totalInterestResponse)));
    } else {
      // intersetPaid = parseFloat(repayment) - parseFloat(calculateRepaymentInterest)
      intersetPaid = parseFloat(calculateRepaymentInterest);
    }
    newInterestPaid = intersetPaid
    console.log("intersetPaidintersetPaid", intersetPaid);
    // let dailyInterestValue = {...principalAmount,
    let repaymentValueAll = {
      principal_outstanding:
        calculateRepaymentInterest >= repayment
          ? parseFloat(principalAmount.principal_outstanding)
          : parseFloat(principalAmount.principal_outstanding) -
            parseFloat(repayment) +
            parseFloat(intersetPaid),
      retailer_id: principalAmount.retailer_id,
      onermn_acc: principalAmount.onermn_acc,
      disbursement_id: principalAmount.disbursement_id,
      total_outstanding:
        parseFloat(principalAmount.total_outstanding) - parseFloat(repayment),
      repayment: repayment,
      sales_agent_id: sales_agent_id,
      //  'transaction_cost_type':principalAmount.transaction_cost_type,
      transaction_cost: parseFloat(transaction_cost),
      manu_scheme_mapping_id: getLimitAmountValue[0]?.id,
      transaction_type: "REPAYMENT",
    };
    //   let transactionCost = {
    //     'principal_outstanding': calculateRepaymentInterest > repayment ? (parseFloat(principalAmount.principal_outstanding)) :
    //     (parseFloat(principalAmount.principal_outstanding) - parseFloat(intersetPaid)),
    //     'retailer_id': principalAmount.retailer_id,
    //     'onermn_acc': principalAmount.onermn_acc,
    //     'disbursement_id': createRepayment[0],
    //     'total_outstanding': (parseFloat(principalAmount.total_outstanding) - repayment) + parseFloat(transaction_cost) ,
    //     'transaction_cost_type':principalAmount.transaction_cost_type,
    //     'transaction_cost':parseFloat(transaction_cost),
    //     'transaction_type':'TRANSACTION'
    //  }
    var limitUpdate = {
      current_limit:
        parseFloat(getLimitAmountValue[0]?.current_limit) -
        parseFloat(repayment),
    };

    await knex("APSISIPDC.cr_retailer_loan_calculation")
      .insert(repaymentValueAll)
      .returning("id")
      .then(async (response) => {
        // await knex("APSISIPDC.cr_retailer_loan_calculation").insert(transactionCost).then(async ()=>{
        // console.log("firstRepaymentID", firstRepaymentID);
        // console.log("response", response);

        try {
          const sendMail = await axios.post(
            `${process.env.HOSTIP}/mail/tempSendmail`,
            {
              email: distributor_Email[0].official_email,
              mail_subject: `IPDC DANA | Collection Confirmation| <${parseInt(
                response[0]
              )}.>`,
              mail_body: `
              <p>Dear IPDC DANA Partner,</p>

              <p>Please find the collection details:</p>

              <p>Collection Date: ${moment().format("YYYY-MM-DD")}</p>
              <p>Collected Amount: ${repayment}</p>
              <p>Request ID: ${response[0]}</p>
              <p>Due Amount: ${repaymentValueAll?.total_outstanding}</p>

              <p>Please let us know if you have any queries. </p>
              <p>Regards, </p>
              <p>IPDC Finance</p>
              `,
            }
          );
          console.log("sendMailsendMailsendMail", sendMail);
        } catch (err) {
          console.log("errorerrorerrorerrorerror", err);
        }

        var interest;
        if (firstRepaymentID) {
          interest = await findRepaymentInterest(
            onermn_acc,
            parseInt(firstRepaymentID?.id),
            parseInt(response[0])
          );
        } else {
          interest = await findRepaymentInterestFirstTime(onermn_acc);
        }

        if (interest?.length > 0) {
          let sumofReimbursement =
            interest.reduce(function (accumulator, curValue) {
              return (
                parseFloat(accumulator) +
                parseFloat(curValue.interest_reimbursment)
              );
            }, 0) ?? 0;

          let sumOFpenal_interest =
            interest.reduce(function (accumulator, curValue) {
              return (
                parseFloat(accumulator) + parseFloat(curValue.penal_interest)
              );
            }, 0) ?? 0;

          let sumOfoverdue_amount =
            interest.reduce(function (accumulator, curValue) {
              return (
                parseFloat(accumulator) + parseFloat(curValue.overdue_amount)
              );
            }, 0) ?? 0;

          let sumOfpenal_charge =
            interest.reduce(function (accumulator, curValue) {
              return (
                parseFloat(accumulator) + parseFloat(curValue.penal_charge)
              );
            }, 0) ?? 0;

          let sumOfdaily_principal_interest =
            interest.reduce(function (accumulator, curValue) {
              return (
                parseFloat(accumulator) +
                parseFloat(curValue.daily_principal_interest)
              );
            }, 0) ?? 0;

          let sumOfcharge =
            interest.reduce(function (accumulator, curValue) {
              return parseFloat(accumulator) + parseFloat(curValue.charge);
            }, 0) ?? 0;

          let sumOfother_charge =
            interest.reduce(function (accumulator, curValue) {
              return (
                parseFloat(accumulator) + parseFloat(curValue.other_charge)
              );
            }, 0) ?? 0;

          var interest_reimbursment = sumofReimbursement;
          var penal_interest = sumOFpenal_interest;
          var overdue_amount = sumOfoverdue_amount;
          var penal_charge = sumOfpenal_charge;
          var daily_principal_interest = sumOfdaily_principal_interest;
          var charge = sumOfcharge;
          var other_charge = sumOfother_charge;

          var payInterest_reimbursment = 0;
          var paypenal_interest = 0;
          var payoverdue_amount = 0;
          var paypenal_charge = 0;
          var paydaily_principal_interest = 0;
          var paycharge = 0;
          var payintersetPaid = 0;

          

          const sequenceData = await getSequenceData();

          sequenceData &&
            sequenceData.length > 0 &&
            sequenceData?.map((sequenceValue) => {
              if (sequenceValue.name == "interest_reimbursment") {
                if (intersetPaid > 0) {
                  if (
                    parseFloat(intersetPaid) >= parseFloat(sumofReimbursement)
                  ) {
                    intersetPaid =
                      parseFloat(intersetPaid) - parseFloat(sumofReimbursement);
                    payInterest_reimbursment = parseFloat(sumofReimbursement);
                    interest_reimbursment = 0;
                  } else {
                    interest_reimbursment =
                      parseFloat(sumofReimbursement) - parseFloat(intersetPaid);
                    payInterest_reimbursment = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                }
              }

              if (sequenceValue.name == "penal_interest") {
                if (intersetPaid > 0) {
                  if (
                    parseFloat(intersetPaid) >= parseFloat(sumOFpenal_interest)
                  ) {
                    intersetPaid =
                      parseFloat(intersetPaid) -
                      parseFloat(sumOFpenal_interest);
                    paypenal_interest = parseFloat(sumOFpenal_interest);
                    penal_interest = 0;
                  } else {
                    penal_interest =
                      parseFloat(sumOFpenal_interest) -
                      parseFloat(intersetPaid);
                    paypenal_interest = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                }
              }

              if (sequenceValue.name == "overdue_amount") {
                if (intersetPaid > 0) {
                  if (
                    parseFloat(intersetPaid) >= parseFloat(sumOfoverdue_amount)
                  ) {
                    intersetPaid =
                      parseFloat(intersetPaid) -
                      parseFloat(sumOfoverdue_amount);
                    payoverdue_amount = parseFloat(sumOfoverdue_amount);
                    overdue_amount = 0;
                  } else {
                    overdue_amount =
                      parseFloat(sumOfoverdue_amount) -
                      parseFloat(intersetPaid);
                    payoverdue_amount = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                }
              }

              if (sequenceValue.name == "penal_charge") {
                if (intersetPaid > 0) {
                  if (
                    parseFloat(intersetPaid) >= parseFloat(sumOfpenal_charge)
                  ) {
                    intersetPaid =
                      parseFloat(intersetPaid) - parseFloat(sumOfpenal_charge);
                    paypenal_charge = parseFloat(sumOfpenal_charge);
                    penal_charge = 0;
                  } else {
                    penal_charge =
                      parseFloat(sumOfpenal_charge) - parseFloat(intersetPaid);
                    paypenal_charge = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                }
              }

              if (sequenceValue.name == "daily_principal_interest") {
                if (intersetPaid > 0) {
                  if (
                    parseFloat(intersetPaid) >=
                    parseFloat(sumOfdaily_principal_interest)
                  ) {
                    intersetPaid =
                      parseFloat(intersetPaid) -
                      parseFloat(sumOfdaily_principal_interest);
                    paydaily_principal_interest = parseFloat(
                      sumOfdaily_principal_interest
                    );
                    daily_principal_interest = 0;
                  } else {
                    daily_principal_interest =
                      parseFloat(sumOfdaily_principal_interest) -
                      parseFloat(intersetPaid);
                    paydaily_principal_interest = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                }
              }

              if (sequenceValue.name == "charge") {
                if (intersetPaid > 0) {
                  if (parseFloat(intersetPaid) >= parseFloat(sumOfcharge)) {
                    intersetPaid =
                      parseFloat(intersetPaid) - parseFloat(sumOfcharge);
                    paycharge = parseFloat(sumOfcharge);
                    charge = 0;
                  } else {
                    charge = parseFloat(sumOfcharge) - parseFloat(intersetPaid);
                    paycharge = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                }
              }
              if (sequenceValue.name == "other_charge") {
                if (intersetPaid > 0) {
                  if (
                    parseFloat(intersetPaid) >= parseFloat(sumOfother_charge)
                  ) {
                    intersetPaid =
                      parseFloat(intersetPaid) - parseFloat(sumOfother_charge);
                    payintersetPaid = parseFloat(sumOfother_charge);
                    other_charge = 0;
                  } else {
                    other_charge =
                      parseFloat(other_charge) - parseFloat(intersetPaid);
                    payintersetPaid = parseFloat(intersetPaid);
                    intersetPaid = 0;
                  }
                  // intersetPaid = parseFloat(intersetPaid) - parseFloat(other_charge)
                }
              }
            });

          let updateInterest = {
            interest_reimbursment: parseFloat(interest_reimbursment).toFixed(2),
            penal_interest: parseFloat(penal_interest).toFixed(2),
            overdue_amount: parseFloat(overdue_amount).toFixed(2),
            penal_charge: parseFloat(penal_charge).toFixed(2),
            daily_principal_interest: parseFloat(
              daily_principal_interest
            ).toFixed(2),
            charge: parseFloat(charge).toFixed(2),
            other_charge: parseFloat(other_charge).toFixed(2),
          };

          let InterestCalculation = {
            retailer_id: retailer_id,
            onermn_acc: onermn_acc,
            interest_reimbursment: parseFloat(payInterest_reimbursment).toFixed(
              2
            ),
            penal_interest: parseFloat(paypenal_interest).toFixed(2),
            overdue_amount: parseFloat(payoverdue_amount).toFixed(2),
            penal_charge: parseFloat(paypenal_charge).toFixed(2),
            daily_principal_interest: parseFloat(
              paydaily_principal_interest
            ).toFixed(2),
            charge: parseFloat(paycharge).toFixed(2),
            other_charge: parseFloat(payintersetPaid).toFixed(2),
            cr_retailer_loan_interest_calculation_id:response[0],
            principal_amount_cut:(parseFloat(repayment) -
            parseFloat(newInterestPaid)).toFixed(2),
          };


           console.log('response',response);
           console.log('parseFloat(repayment)',parseFloat(repayment));
           console.log('parseFloat(intersetPaid)',parseFloat(newInterestPaid).toFixed(2));
           console.log('parseFloat(repayment) +parseFloat(intersetPaid)',(parseFloat(repayment) -
           parseFloat(newInterestPaid).toFixed(2)));

           

          await knex("APSISIPDC.cr_retailer_loan_interest_calculation")
            .insert(InterestCalculation)
            .then(async (resPonseSaveInterest) => {
              console.log("resPonseSaveInterest", resPonseSaveInterest);
            });

          await knex.transaction(async (trx) => {
            const interest_update = await trx(
              "APSISIPDC.cr_retailer_loan_calculation"
            )
              .where({ id: response[0] })
              .update(updateInterest);
            console.log("limit_update", interest_update);
            if (interest_update <= 0) {
              return res.send(
                sendApiResult(false, "failed to update one rmn account ")
              );
            }
          });
        }

        var newRepayment = parseFloat(repayment) - parseFloat(interestValueAll)
        var getDisData = await getAllDisData(onermn_acc)
        console.log('getDisData' , getDisData)
        // while(newRepayment > 0){
          getDisData.length > 0 && getDisData.map(async (value , index)=>{
            console.log(index , newRepayment)
            console.log('value' , value)
            if(newRepayment > 0){
              if((value?.disbursement_amount-value?.rep_rem_amount) == newRepayment){
                console.log('ashik1')
                let remAmount = newRepayment
                let repSequence = {
                  disbursement_id:value.id,
                  repayment_amount:newRepayment,
                  rest_of_principal_amount:0,
                  one_rmn_account : onermn_acc
                }
                newRepayment = 0;
                await knex("APSISIPDC.cr_loan_principal_repayment_sequence")
                .insert(repSequence)
                .returning("id").then(async ()=>{
                  await knex.transaction(async (trx) => {
                    const limit_update = await trx(
                      "APSISIPDC.cr_disbursement"
                    )
                      .where({ id: value.id })
                      .update({dis_status : 1 , rep_rem_amount:((value?.rep_rem_amount + remAmount))});
                    console.log("limit_update", limit_update);
                    
                  });
                })    
              }
              else if((value?.disbursement_amount-value?.rep_rem_amount) < newRepayment){
                console.log('ashik2')
                let remAmount = newRepayment
                let repSequence = {
                  disbursement_id:value.id,
                  // repayment_amount:newRepayment - value?.disbursement_amount + value?.rep_rem_amount,
                  repayment_amount:newRepayment - (newRepayment - value?.disbursement_amount + value?.rep_rem_amount),
                  rest_of_principal_amount: 0 ,
                  one_rmn_account : onermn_acc
                }
                // newRepayment =(newRepayment - value?.disbursement_amount) >=0 ? newRepayment - value?.disbursement_amount + value?.rep_rem_amount : value?.disbursement_amount;
                newRepayment =newRepayment - value?.disbursement_amount + value?.rep_rem_amount;

                await knex("APSISIPDC.cr_loan_principal_repayment_sequence")
                .insert(repSequence).then(async ()=>{
                  await knex.transaction(async (trx) => {
                    const limit_update = await trx(
                      "APSISIPDC.cr_disbursement"
                    )
                      .where({ id: value.id })
                      .update({dis_status : 1 , rep_rem_amount:(newRepayment - value?.disbursement_amount) >=0 ? value?.rep_rem_amount + remAmount :value?.disbursement_amount });
                    console.log("limit_update", limit_update);
                  });
                })
               
                console.log('newRepayment',newRepayment)
              }
              else if((value?.disbursement_amount-value?.rep_rem_amount) > newRepayment){
                console.log('ashik3')
                let remAmount = newRepayment
                let repSequence = {
                  disbursement_id:value.id,
                  repayment_amount:newRepayment,
                  rest_of_principal_amount:value?.disbursement_amount - newRepayment - value?.rep_rem_amount,
                  one_rmn_account : onermn_acc
                }
                newRepayment = 0
                console.log('interestValueAll',interestValueAll)
                console.log('remAmount + value?.rep_rem_amount)-interestValueAll',(remAmount + value?.rep_rem_amount)-newInterestPaid)

                await knex("APSISIPDC.cr_loan_principal_repayment_sequence")
                .insert(repSequence)
                .returning("id").then(async()=>{
                  await knex.transaction(async (trx) => {
                    const limit_update = await trx(
                      "APSISIPDC.cr_disbursement"
                    )
                      .where({ id: value.id })
                      .update({ rep_rem_amount:(((parseFloat(remAmount) + parseFloat(value?.rep_rem_amount)))).toFixed(2)
                        // , overdue_amount:value.overdue_amount-remAmount
                       });
                    console.log("limit_update", limit_update);
                    newRepayment = 0;
                  });
                })
              }
            }
            
          })
        // }

        

        // let sumOfother_charge= allRepayment.reduce(function (accumulator, curValue) {
        //   return parseFloat(accumulator) + parseFloat(curValue.other_charge:)
        // }, 0) ?? 0;
        // return
        await knex.transaction(async (trx) => {
          const limit_update = await trx(
            "APSISIPDC.cr_retailer_manu_scheme_mapping"
          )
            .where({ ac_number_1rmn: onermn_acc })
            .update(limitUpdate);
          console.log("limit_update", limit_update);
          if (limit_update <= 0) {
            return res.send(
              sendApiResult(false, "failed to update one rmn account ")
            );
          }
        });
        //  });

        /* Implementin push notification */
        let body = `BDT ${repayment} has been collected in our bank account upon your request <Request ID>. . Your account number is : ${onermn_acc} `;
        const device_token_response = await knex("APSISIPDC.cr_users")
          .leftJoin(
            "APSISIPDC.cr_sales_agent_user",
            "cr_sales_agent_user.user_id",
            "cr_users.id"
          )
          .where("cr_users.status", "Active")
          .where("cr_sales_agent_user.sales_agent_id", sales_agent_id)
          .select("cr_users.device_token");

        let receiver_token = device_token_response[0]?.device_token ?? "";
        await pushNotification(
          retailer_id,
          sales_agent_id,
          "REPAYMENT",
          "Collection completed!",
          body,
          receiver_token
        );

        return res.send(
          sendApiResult(true, "Sucessly Repayment", repaymentValueAll)
        );
      });
    // }

    //let totalLimit = parseInt(getLimitAmountValue[0]?.crm_approve_limit) - parseInt(getLimitAmountValue[0]?.current_limit)
  } else {
    return res.send(
      sendApiResult(false, "Repayment is higher than Total Outstanding")
    );
  }
};

exports.slab = async (req, res) => {
  console.log("req.params", req.query);

  let { onermn_acc, repayment } = req.query;
  const getSlabDateValue = await getSlabDate(onermn_acc);

  // const dateSlab = getSlabDateValue?.created_at;
  const dateSlab = await getSlapValueDate(onermn_acc);
  console.log("dateSlabdateSlab", dateSlab);

  // const dateSlab = getSlabDateValue?.crm_approve_date

  let transaction_cost = 0;
  var getSchemeId = await getSchemeID(onermn_acc);
  var SchemeValue;
  if (getSchemeId) {
    SchemeValue = await getSchemeValue(getSchemeId[0]?.scheme_id);
  } else {
    /**
     * If scheme not found . Then in future we will hir global parameter
     */
  }
  console.log("SchemeValue", SchemeValue);
  if (SchemeValue[0]?.transaction_type == "SLAB") {
    const now = moment.utc();
    var end = moment(dateSlab);
    var days = now.diff(end, "days");
    console.log("daysdaysdays");

    console.log("daysdaysdays", days);

    const getSlabValue = await getSlabAmount(
      repayment,
      days,
      getSchemeId[0]?.scheme_id
    );
    transaction_cost = getSlabValue[0]?.transaction_fee ?? 0;
  } else {
    transaction_cost = repayment * (SchemeValue[0]?.transaction_fee / 100) ?? 0;
  }
  console.log("transaction_costtransaction_cost", transaction_cost);
  return;
  var value = {
    transaction_cost: transaction_cost,
  };
  return res.send(sendApiResult(true, "Transaction Cost", value));
};

exports.totalLoan = async (req, res) => {
  let { onermn_acc } = req.params;
  const getSchemeId = await getSchemeID(onermn_acc);
  let SchemeValue;
  let loanTenorDays;
  if (getSchemeId) {
    SchemeValue = await getSchemeValue(getSchemeId[0]?.scheme_id);
  }
  console.log("SchemeValue", SchemeValue);
  if (SchemeValue[0]) {
    loanTenorDays = await findLoanTenorIndays(onermn_acc, SchemeValue[0]);
  }
  let totalValue = await getPrincipalAmount(onermn_acc);
  console.log("totalValue", totalValue);
  let retailerPhone;
  if (totalValue) {
    retailerPhone = (await getRetailerPhone(totalValue?.retailer_id)) ?? "";
  }

  console.log("retailerPhone", retailerPhone);
  var resPonseVaslue = {
    ...loanTenorDays,
    total_outstanding: totalValue?.total_outstanding.toFixed(2) ?? 0,
    principal_outstanding: totalValue?.principal_outstanding.toFixed(2) ?? 0,
    total_interest:
      (
        parseFloat(totalValue?.total_outstanding) -
        parseFloat(totalValue?.principal_outstanding)
      ).toFixed(2) ?? 0,
    retailer_id: totalValue?.retailer_id,
    onermn_acc: totalValue?.onermn_acc,
    retailer_phone: retailerPhone ? retailerPhone[0]?.phone : "",
    retailer_status: retailerPhone ? retailerPhone[0]?.retailer_status : "",
  };
  if (totalValue) {
    return res.send(sendApiResult(true, "Find Total Cost", resPonseVaslue));
  } else {
    var reponse = {
      retailer: "This Retailer Have No Loan Yet",
    };
    return res.send(sendApiResult(false, "No Data Found", reponse));
  }
};

exports.processingFeeAmout = async (req, res) => {
  let { onermn_acc } = req.params;
  var SchemeID = await getSchemeID(onermn_acc);

  if (SchemeID[0]?.scheme_id) {
    var schemeValue = await getSchemeValue(SchemeID[0].scheme_id);
    var value = {
      processing_fee: schemeValue[0]?.processing_cost,
    };
    return res.send(sendApiResult(true, "Processing Fee Success", value));
  } else {
    return res.send(sendApiResult(false, "No Schema Found"));
  }
};

exports.UpdateprocessingFeeAmount = async (req, res) => {
  let { onermn_acc, processing_fee } = req.body;
  var SchemeID = await getSchemeID(onermn_acc);
  console.log("onermn_acc", SchemeID);

  if (SchemeID[0]?.scheme_id) {
    var schemeValue = await getSchemeValue(SchemeID[0].scheme_id);

    if (processing_fee == schemeValue[0]?.processing_cost) {
      await knex.transaction(async (trx) => {
        const processing_fee_update = await trx(
          "APSISIPDC.cr_retailer_manu_scheme_mapping"
        )
          .whereIn("ac_number_1rmn", onermn_acc)
          .update({
            processing_fee,
          });

        if (processing_fee_update) {
          return res.send(
            sendApiResult(true, "Processing Fee Success", processing_fee_update)
          );
        } else {
          return res.send(sendApiResult(false, "Something Went Wrong"));
        }
      });
    } else {
      return res.send(
        sendApiResult(
          false,
          "Processing Fee Value And Schema Processing Fee Value Do not match"
        )
      );
    }
    // var value = {
    //   'transaction_cost' : schemeValue[0]?.processing_cost
    // }
  } else {
    return res.send(sendApiResult(false, "No Schema Found"));
  }
};

exports.loanTenorInDays = async (req, res) => {
  const { onermn_acc } = req.body;
  var allDisbursements = await getAllDisbursement(onermn_acc);
  var allRepayment = await getAllRepayment(onermn_acc);
  var SchemeID = await getSchemeID(onermn_acc);
  var schemeValue = await getSchemeValue(SchemeID[0]?.scheme_id);

  let sumRepayment =
    allRepayment.reduce(function (accumulator, curValue) {
      return accumulator + curValue.repayment;
    }, 0) ?? 0;

  var tenorValue;
  let disbursementAdd = 0;
  // allDisbursements.map((disbursementValue)=>{
  const myPromise = new Promise((resolve, reject) => {
    for (var i = 0; i < allDisbursements.length; i++) {
      disbursementAdd = allDisbursements[i].disburshment + disbursementAdd;
      if (disbursementAdd > sumRepayment) {
        tenorValue = allDisbursements[i];
        resolve(true);
        break;
      }
    }
  }).then(() => {
    const todayDate = new Date(tenorValue?.created_at);
    console.log("todayDate", todayDate);
    // return
    const now = moment.utc();
    var end = moment(todayDate);
    var days = now.diff(end, "days");

    // console.log('days',schemeValue[0]?.loan_tenor_in_days)
    // return
    if (days >= schemeValue[0]?.loan_tenor_in_days) {
      let responseValue = {
        tanor: true,
        days: days,
        minimum_amount: parseFloat(disbursementAdd) - parseFloat(sumRepayment),
      };
      return res.send(
        sendApiResult(
          true,
          "You have Successfully Found Loan Tanor.",
          responseValue
        )
      );
    } else {
      let responseValue = {
        tanor: false,
        days: days,
        minimum_amount: 0,
      };
      return res.send(
        sendApiResult(
          true,
          "You have Successfully Found Loan Tanor.",
          responseValue
        )
      );
    }
  });

  //   const { page, per_page } =  req.body;
  //   console.log('req.body',req.body)
  //   const allRMNAccount = await getAllRmnAccount(page , per_page)
  //   console.log('allRMNAccount',allRMNAccount.pagination)
  //   var allValueResponse = []
  //   const myPromise = new Promise((resolve, reject) => {
  //   allRMNAccount && allRMNAccount?.data?.length> 0 && allRMNAccount?.data?.map(async (rmnAccount)=>{
  //   console.log('rmnAccount',rmnAccount)
  //     var loanTableData = await getDataLoanTable(rmnAccount.ac_number_1rmn)
  //     if(loanTableData?.onermn_acc){
  //       var SchemeID =await getSchemeID(rmnAccount.ac_number_1rmn)
  //       if(SchemeID[0]?.scheme_id){
  //         var schemeValue =await getSchemeValue(SchemeID[0]?.scheme_id)
  //         console.log('schemeValue',schemeValue);

  //         const todayDate = new Date(schemeValue[0]?.expiry_date)
  //         const now = moment.utc();
  //         var end = moment(todayDate);
  //         var days = now.diff(end, "days");
  //         console.log('daysssss',days)
  //         var value ={}
  //         if(days > schemeValue[0]?.loan_tenor_in_days){
  //           value ={
  //             'onermn_acc':rmnAccount.ac_number_1rmn,
  //             'retailer_id':rmnAccount.retailer_id,
  //             'retailer_code':rmnAccount.retailer_code,
  //             'manufacturer_id':rmnAccount.manufacturer_id,
  //             'distributor_id':rmnAccount.distributor_id,
  //             'loan_tenor_in_days' : true
  //           }
  //           allValueResponse.push(value)
  //         }else{
  //           value ={
  //             'onermn_acc':rmnAccount.ac_number_1rmn,
  //             'retailer_id':rmnAccount.retailer_id,
  //             'retailer_code':rmnAccount.retailer_code,
  //             'manufacturer_id':rmnAccount.manufacturer_id,
  //             'distributor_id':rmnAccount.distributor_id,
  //             'loan_tenor_in_days' : false
  //           }
  //           allValueResponse.push(value)
  //         }

  //       }else{
  //         value ={
  //           'onermn_acc':rmnAccount.ac_number_1rmn,
  //           'retailer_id':rmnAccount.retailer_id,
  //           'retailer_code':rmnAccount.retailer_code,
  //           'manufacturer_id':rmnAccount.manufacturer_id,
  //           'distributor_id':rmnAccount.distributor_id,
  //           'loan_tenor_in_days' : 'No Schema Found'
  //         }
  //         allValueResponse.push(value)
  //       }
  //     } else{
  //       value ={
  //         'onermn_acc':rmnAccount.ac_number_1rmn,
  //         'retailer_id':rmnAccount.retailer_id,
  //         'retailer_code':rmnAccount.retailer_code,
  //         'manufacturer_id':rmnAccount.manufacturer_id,
  //         'distributor_id':rmnAccount.distributor_id,
  //         'loan_tenor_in_days' : 'This Retailer Have No Loan'
  //       }
  //       allValueResponse.push(value)
  //     }
  //     if(allRMNAccount?.data?.length == allValueResponse.length){
  //        allValueResponse.paginate = allRMNAccount?.pagination
  //        console.log("allValueResponse.paginate",allValueResponse.paginate)
  //       resolve(true)
  //     }
  //   })
  // }).then(()=>{
  //   if(allValueResponse){
  //     return res.send((blockunblock(true, allRMNAccount?.pagination,allValueResponse)));
  //   }
  // });
};

exports.addSlab = async (req, res) => {
  let reqValue = req.body;
  console.log(reqValue);
  const createSlab = await knex("APSISIPDC.cr_slab").insert(reqValue);
  return res.send(
    sendApiResult(true, "You have Successfully Add Slab.", createSlab)
  );
};

exports.sequence = async (req, res) => {
  let reqValue = req.body;
  console.log(reqValue);
  const showSequence = await knex
    .from("APSISIPDC.cr_repayment_sequence")
    .select()
    .orderBy("sequence", "asc");

  return res.send(
    sendApiResult(true, "You have Successfully Get Sequence.", showSequence)
  );
};

exports.updateSequence = async (req, res) => {
  let reqValue = req?.body?.sequence;
  console.log("reqValue", reqValue);
  var responseValue = [];
  reqValue &&
    reqValue.length > 0 &&
    reqValue.map(async (seqValue, index) => {
      const myPromise = new Promise(async (resolve, reject) => {
        let update_sequence;
        await knex.transaction(async (trx) => {
          update_sequence = await trx("APSISIPDC.cr_repayment_sequence")
            .whereIn("name", seqValue.label)
            .update({
              sequence: index + 1,
            });
        });
        responseValue.push(update_sequence);

        if (reqValue.length == index + 1) {
          resolve(true);
        }
      }).then(() => {
        console.log("responseValue", responseValue);
        return res.send(
          sendApiResult(
            true,
            "You have Successfully Get Sequence.",
            responseValue
          )
        );
      });
    });
};

exports.loanDashboard = async (req, res) => {
  let { salesAgentID } = req.params;
  let pendingAmountValue = 0;
  let odRetailers = 0;
  let odRetailersRisk = 0;
  let odAmount = 0;

  // const pendingAmount = await knex("APSISIPDC.cr_retailer_loan_calculation")
  //       .select(
  //         knex.raw('SUM("cr_retailer_loan_calculation"."total_outstanding") AS total_amount')
  //       )
  //       .where("sales_agent_id",salesAgentID);
  const saRetailer = await knex("APSISIPDC.cr_retailer_loan_calculation")
    .select("retailer_id")
    .where("sales_agent_id", salesAgentID)
    .distinct();

  // const myPromise = new Promise((resolve, reject) => {
  saRetailer.length > 0 &&
    saRetailer.map(async (saRetailerData, index) => {
      new Promise(async (resolve, reject) => {
        let pdAmount = await knex("APSISIPDC.cr_retailer_loan_calculation")
          .select("total_outstanding", "onermn_acc")
          .where("sales_agent_id", salesAgentID)
          .where("retailer_id", saRetailerData.retailer_id)
          .orderBy("id", "desc")
          .first();

        pendingAmountValue = pendingAmountValue + pdAmount.total_outstanding;
        const getSchemeId = await getSchemeID(pdAmount.onermn_acc);
        const schemavalue = await getSchemeValue(getSchemeId[0].scheme_id);
        const rmnAccount = await oneRMnAccDateValue(pdAmount.onermn_acc);

        if (schemavalue) {
          var date = moment(
            moment(rmnAccount?.crm_approve_date),
            "YYYY-MM-DD"
          ).add(schemavalue[0].expiry_date * 30, "days");

          var riskDate = moment(
            moment(rmnAccount?.crm_approve_date),
            "YYYY-MM-DD"
          ).add(schemavalue[0].expiry_date * 29, "days");

          var now = moment();

          console.log('datedatedatedate',date)

          if (now >= date) {
            odAmount = odAmount + parseFloat(pdAmount.total_outstanding);
            odRetailers++;
          }
          if (riskDate >= date) {
            odRetailersRisk++;
          }
        }

        if (saRetailer.length == index + 1) {
          resolve(true);
        }
      }).then(() => {
        let responseValue = {
          odRetailers: odRetailers,
          odAmount: odAmount,
          odRetailersOdRisk: odRetailersRisk,
          pendingAmount: pendingAmountValue,
        };

        return res.send(
          sendApiResult(
            true,
            "You have Successfully Get Dashboard Data.",
            responseValue
          )
        );
      });
    });
};

var calculateInterest = function (total, days, ratePercent, roundToPlaces) {
  var interestRate = ratePercent / 100;
  return ((days / 360) * total * interestRate).toFixed(roundToPlaces);
};

var calculateTransactionCost = function (total, ratePercent, roundToPlaces) {
  var transactionRestRate = ratePercent / 100;
  return (total * transactionRestRate).toFixed(roundToPlaces);
};

var getfirstRepaymentID = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .where("transaction_type", "REPAYMENT")
    .orderBy("id", "desc")
    .first();
};

var getSchemeID = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
    .select()
    .where("ac_number_1rmn", onermn_acc);
};

var getSchemeValue = async (id) => {
  return await knex.from("APSISIPDC.cr_schema").select().where("id", id);
};

var findSalesrelation = async (sales_agent_id, retailer_id) => {
  return await knex
    .from("APSISIPDC.cr_retailer_vs_sales_agent")
    .select("id")
    .where("sales_agent_id", sales_agent_id)
    .andWhere("retailer_id", retailer_id);
};

var getPrincipalAmount = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .orderBy("id", "desc")
    .first();
};

var getSlabDate = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .where("transaction_type", "DISBURSEMENT")
    .orderBy("id", "desc")
    .first();
};

var oneRMnAccDateValue = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
    .select()
    .where("ac_number_1rmn", onermn_acc);
};

var getLimitAmount = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
    .select()
    .where("ac_number_1rmn", onermn_acc);
};

var getSlabAmount = async (repayment, days, scheme_id) => {
  console.log("repayment days scheme_id", repayment, days, scheme_id);
  return await knex
    .from("APSISIPDC.cr_slab")
    .select()
    .where("lower_limit", "<=", repayment)
    .where("upper_limit", ">=", repayment)
    .where("day_dis_lower_limit", "<=", days)
    .where("day_dis_upper_limit", ">=", days)
    .where("scheme_id", scheme_id);
};

var getAllRmnAccount = async (page, per_page) => {
  return await knex
    .from("APSISIPDC.cr_retailer_manu_scheme_mapping")
    .select(
      "ac_number_1rmn",
      "retailer_id",
      "retailer_code",
      "manufacturer_id",
      "distributor_id",
      "crm_approve_date"
    );
  // .paginate({
  //   perPage: per_page,
  //   currentPage: page,
  //   isLengthAware: true,
  // });
};

var getDataLoanTable = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select("onermn_acc")
    .where("onermn_acc", onermn_acc)
    .first();
};

var getAllDisbursement = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .where("transaction_type", "DISBURSEMENT")
    .orderBy("id", "asc");
};

var getAllRepayment = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .where("transaction_type", "REPAYMENT");
};

var findLoanTenorIndays = async (oneRMn, schemeValue) => {

  // Tenor Ber korar jnno eita lagbe kew jano delete kore nah @Ashik Mahmud 


  // var allDisbursements = await getAllDisbursement(oneRMn);
  // var allRepayment = await getAllRepayment(oneRMn);
  // var response = {};
  // var days;
  // let sumRepayment =
  //   allRepayment.reduce(function (accumulator, curValue) {
  //     return accumulator + curValue.repayment;
  //   }, 0) ?? 0;
  // var tenorValue;
  // let disbursementAdd = 0;
  // for (var i = 0; i < allDisbursements.length; i++) {
  //   disbursementAdd = allDisbursements[i].disburshment + disbursementAdd;
  //   if (disbursementAdd > sumRepayment) {
  //     tenorValue = allDisbursements[i];
  //     break;
  //   }
  // }


// Tenor Ber korar jnno eita lagbe kew jano delete kore nah @Ashik Mahmud

 const tenorValue = await findDisFinalValue(oneRMn)

 const todayDate = new Date(tenorValue?.created_at);
 
  const now = moment.utc();
  var end = moment(todayDate);
  days = now.diff(end, "days");
  

  if (days >= schemeValue?.loan_tenor_in_days) {
    response = {
      nextDisbursement: false,
      days: days,
      disID:tenorValue.id,
      minimum_amount: parseFloat(tenorValue.disbursement_amount) - parseFloat(tenorValue.rep_rem_amount),
    };
    return response;
  } else {
    response = {
      nextDisbursement: true,
      days: days,
      disID:tenorValue.id,
      minimum_amount: parseFloat(tenorValue.disbursement_amount) - parseFloat(tenorValue.rep_rem_amount),
    };
    return response;
  }
};

var findRepaymentInterest = async (onermn_acc, firstId, secondId) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc)
    .whereBetween("id", [firstId, secondId - 1]);
};

var findRepaymentInterestFirstTime = async (onermn_acc, firstId, secondId) => {
  return await knex
    .from("APSISIPDC.cr_retailer_loan_calculation")
    .select()
    .where("onermn_acc", onermn_acc);
  // .whereBetween('id', [firstId+1, secondId-1]);
};

var getSlapValueDate = async (oneRMn, schemeValue) => {
  var allDisbursements = await getAllDisbursement(oneRMn);
  var allRepayment = await getAllRepayment(oneRMn);
  var response = {};
  var days;
  let sumRepayment =
    allRepayment.reduce(function (accumulator, curValue) {
      return accumulator + curValue.repayment;
    }, 0) ?? 0;
  var tenorValue;
  let disbursementAdd = 0;
  for (var i = 0; i < allDisbursements.length; i++) {
    disbursementAdd = allDisbursements[i].disburshment + disbursementAdd;
    if (disbursementAdd > sumRepayment) {
      tenorValue = allDisbursements[i];
      break;
    }
  }

  return tenorValue?.created_at ?? [];
};

var getSequenceData = async () => {
  return await knex
    .from("APSISIPDC.cr_repayment_sequence")
    .select()
    .orderBy("sequence", "asc");
};

var getDistributorEmail = async (id) => {
  return await knex
    .from("APSISIPDC.cr_distributor")
    .select("official_email")
    .where("id", id);
};

var getRetailerPhone = async (id) => {
  return await knex
    .from("APSISIPDC.cr_retailer")
    .select("phone", "retailer_status")
    .where("id", id);
};

var getAllDisData = async (onermn_acc) => {
  return await knex
    .from("APSISIPDC.cr_disbursement")
    .select()
    .where("onermn_acc", onermn_acc)
    .where("dis_status", 0)
    .orderBy("id", "asc");
};

var findDisFinalValue =async (oneRmn) =>{
    return  await knex("APSISIPDC.cr_disbursement")
    .where("dis_status", 0).orderBy("id", "asc")
    .where("onermn_acc", oneRmn).first()
  
}