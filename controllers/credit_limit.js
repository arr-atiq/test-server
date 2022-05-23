const logger = require('pino')();
module.exports.creditLimit = () => {
    const uninterrupt = 12;
    const min_avg_sale = 20000;
    const duraion_avg_sale_calculation_month = 06
    const multiplyFacotor = 2
    const sales_info = [20000, 0, 0, 0, 0, 0, 200000, 0, 0, 0, 0, 20000]
    const interval_check_month = 1
    var credit_limit = 0
    var count_uninterrupt = 0;
    var count_uninterrupt_if_first_input_zero = 0;
    var highest_gap = []
    for (let i = 0; i < sales_info.length; i++) {
        if (sales_info[i] != 0 && i == 0) {
            for (j = i; j < sales_info.length; j++) {
                if (sales_info[j + 1] == 0) {
                    count_uninterrupt++;
                }
                if (sales_info[j + 1] != 0) {
                    i = j;
                    j = sales_info.length
                    if (count_uninterrupt != 0) highest_gap.push(count_uninterrupt)
                    count_uninterrupt = 0
                }
            }
        }
        else if (sales_info[i] != 0 && i != 0) {
            for (j = i; j < sales_info.length; j++) {
                if (sales_info[j + 1] == 0) {
                    count_uninterrupt++;
                }
                if (sales_info[j + 1] != 0) {
                    i = j;
                    j = sales_info.length
                    if (count_uninterrupt != 0) highest_gap.push(count_uninterrupt)
                    count_uninterrupt = 0
                }
            }
        }
        else {
            count_uninterrupt = count_uninterrupt + 1
            for (j = i; j < sales_info.length; j++) {
                if (sales_info[j + 1] == 0) {
                    count_uninterrupt++;
                }
                if (sales_info[j + 1] != 0) {
                    i = j;
                    j = sales_info.length
                    if (count_uninterrupt != 0) highest_gap.push(count_uninterrupt)
                    count_uninterrupt = 0
                }
            }
        }
    }

    let uninterrupt_sale = true
    for (let k = 0; k < highest_gap.length; k++) {
        if (highest_gap[k] >= uninterrupt) {
            uninterrupt_sale = false
            break;
        }
    }

    if (uninterrupt_sale) {
        let sum = 0
        for (let l = 6; l < sales_info.length; l += interval_check_month) {
            sum = sum + sales_info[l]
        }
        let avg_sale = sum / duraion_avg_sale_calculation_month
        if (avg_sale >= min_avg_sale) {
            credit_limit = (sum / duraion_avg_sale_calculation_month) * multiplyFacotor;
        }

    }

    logger.info("Credit Limit:", credit_limit);
    return credit_limit;
}
