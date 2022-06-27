const knex = require("../config/database");
const axios = require("axios")

module.exports.pushNotification = (retailer_id, sales_agent_id, action, title, body, receiver_token) =>{
    console.log(".............")
    console.log(retailer_id, sales_agent_id, action, title, body, receiver_token)
    let receiver_token = "d4V-VDYSTyObqGE9sglOBl:APA91bGZiEYV7ToddGTDPbpXrAPcfDcHiAIxwsQTt5FLO_RtB_sFI8404xyLrKpls5RGyadO0aU9Eqhcy2r7MyQydeKK0-B-ESTC8vZkSEpt5bactjeN9HkgQIGUzceB-WC3ypneLiBh"
    let title = "no-title"
    let body = "no-body"
    let action = "disbursement"
    let fcmPayload = {
        "to": receiver_token,
        "content_available": true,
        "notification": {
            "title": title,
            "body": body,
            "click_action": "FLUTTER_NOTIFICATION_CLICK"
        },
        "data": {
            "title": title,
            "body": body,
            "click_action": "FLUTTER_NOTIFICATION_CLICK",
            "status": "done"
        }
    }

    let payload = {
        retailer_id: 12,
        sales_agent_id: 13,
        action: action,
        title: title,
        body: body,
        receiver_token: receiver_token,
        seen_by: null
    };
    try
    {
        const response = await axios.post('https://fcm.googleapis.com/fcm/send',
            fcmPayload,
            {
                headers: {
                    'Authorization': "key=AAAA9hmmsKQ:APA91bGhmFO0bYwXG08mB7QtsHLJHw6Hs4Gj9rLlg4vs6Stuy42SB5QsC3h_GUYqLyM3jDAQwB229RzYjdHDfujA8Yit91zSouCKpzCLlqi1gHTTOjIdhgDJ1UEDjfzyn1Tf3WT1GeV8"
                }
            }
            )
            if(response.data.success=== 1){
                await knex("APSISIPDC.cr_push_notification")
                    .insert(payload)
                    .then(() => {
                        console.log("Sent push notification successfully");
                    });        
            }
            else
            {
                console.log("Device token is not registered!");
            }
    }
    catch(error){
        console.log("Failed..",error);
    }
};

