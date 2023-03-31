import { Jwt } from './jwt';
var FCM = require('fcm-node');

const moment = require('moment');
const jwtModel = new Jwt();
export class FcmModel {

    sendMessage(fcmToken, title = null, body = null, key = {}) {
        var fcm = new FCM(process.env.FIREBASE_SERVER_KEY);
        var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
            to: fcmToken,
            // collapse_key: 'your_collapse_key',
            contentAvailable: true,
            // "apns-collapse-id": 1,
            message_id: 1,
            notification: {
                // id: "1",
                title: title,
                body: body
                // tag: "1"
            },

            data: key
        };
        return new Promise<any>((resolve, reject) => {
            fcm.send(message, function (err, response) {
                if (err) {
                    console.log(err);
                    console.log("Something has gone wrong!");
                    resolve(false);
                } else {
                    console.log("Successfully sent with response: ", response);
                    resolve(true);
                }
            });
        })
    }



}