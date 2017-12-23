const opcua = require("node-opcua");
const async = require("async");
const fs = require("fs");

let client = new opcua.OPCUAClient();
const endpointUrl = "opc.tcp://DanielLenovo:48020";

var the_session, the_subscription;
let point = {
    timestamp: new Array(),
    measurements: new Array()
}
    ;
let bezeichung = {
    tag: [],
    ids: []
};
const serie = () => {
    async.series([
        // step 1 : connect to
        (callback) => {
            client.connect(endpointUrl, function (err) {
                if (err) {
                    console.log(" cannot connect to endpoint :", endpointUrl);
                } else {
                    console.log("connected !");
                }
                callback(err);
            });
        },

        // step 2 : createSession
        (callback) => {
            client.createSession(function (err, session) {
                if (!err) {
                    the_session = session;
                }
                callback(err);
            });
        },

        // step 3 : browse
        (callback) => {
            the_session.browse("ns=4;s=Demo.Massfolder_Dynamic", function (err, browse_result) {
                if (!err) {
                    let gebrowste = browse_result[0].references;
                    browse_result[0].references.forEach(function (reference) {
                        if (reference.nodeClass.key === "Variable") {
                            // console.log(reference.browseName.toString());
                            // console.log(reference.nodeId.toString());
                            let test = { nodeId: reference.nodeId.toString() };
                            bezeichung.ids.push(test);
                            bezeichung.tag.push(reference.displayName.text.toString());
                        };
                    });

                }
                callback(err);
            });
        },

        // step 4 : read a variable with readVariableValue
        (callback) => {
            var max_age = 10;
            var nodes_to_read = bezeichung.ids;

            the_session.read(nodes_to_read, max_age, function (err, nodes_to_read, dataValues) {
                if (!err) {
                    point.timestamp = { timestamp: dataValues[0].serverTimestamp };
                    dataValues.forEach(function (dataValue, index) {
                        point.measurements[index] = {
                            index: index,
                            tag: bezeichung.tag[index],
                            value: dataValue.value.value,
                            type: dataValue.value.dataType.key,
                        };
                        
                    });

                };
                let jsonDatapoint = JSON.stringify(point);
                fs.appendFile("./data/data.json", jsonDatapoint + '\n', (err) => {
                    if (err) throw err;
                });
                callback(err);
            });

        },

        // // step 4' : read a variable with read
        // (callback) => {
        //     bezeichung.ids.forEach((id) => {
        //         the_session.readVariableValue(id, function (err, dataValue) {
        //             if (!err) {
        //                 console.log(dataValue.value.value);
        //             }
        //             callback(err)}
        //         );
        //     });

        // },

        // // step 5: install a subscription and install a monitored item for 10 seconds
        // function(callback) {
        //    _"install a subscription"
        // },

        // // close session
        // (callback) => {
        //     the_subscription = new opcua.ClientSubscription(the_session, {
        //         requestedPublishingInterval: 1000,
        //         requestedLifetimeCount: 10,
        //         requestedMaxKeepAliveCount: 2,
        //         maxNotificationsPerPublish: 10,
        //         publishingEnabled: true,
        //         priority: 10
        //     });

        //     the_subscription.on("started", function () {
        //         console.log("subscription started for 2 seconds - subscriptionId=", the_subscription.subscriptionId);
        //     }).on("keepalive", function () {
        //         console.log("keepalive");
        //     }).on("terminated", function () {
        //         callback();
        //     });

        //     setTimeout(function () {
        //         the_subscription.terminate();
        //     }, 20000);
        //     let monitoredItem = [];
        //     bezeichung.ids.forEach(function (id, index) {
        //         // install monitored item
        //         monitoredItem[index] = the_subscription.monitor({
        //             nodeId: opcua.resolveNodeId(id),

        //         },
        //             {
        //                 samplingInterval: 100,
        //                 discardOldest: true,
        //                 queueSize: 10
        //             },
        //             opcua.read_service.TimestampsToReturn.Server
        //         );



        //         monitoredItem[index].on("changed", function (dataValue) {
        //             let datapoint = {
        //                 time: dataValue.serverTimestamp,
        //                 value: dataValue.value.value,
        //                 tag: id,
        //                 type: dataValue.value.dataType.key
        //             };
        //             let jsonDatapoint = JSON.stringify(datapoint);
        //             fs.appendFile("./data/data.json", jsonDatapoint + '\n', (err) => {
        //                 if (err) throw err;
        //             });
        //         });
        //     });
        // }

    ],
        (err) => {
            if (err) {
                console.log(" failure ", err);
            } else {
                console.log("done!");
            }
            client.disconnect(function () { });
        });
};
serie();