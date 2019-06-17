"use strict";
let Stream = require('stream')
let Docker = require('dockerode')
const uuidv4 = require('uuid/v4'); // random uuid
let docker = new Docker({ socketPath: '/var/run/docker.sock' })
let moduleDocker = require('./moduleDocker');

const data_manager = require('./data_manager');

console.log("Connecting to mysql server ...");
const dm = new data_manager();

// Port where we'll run the websocket server
var webSocketsServerPort = 1337;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

var enableRegistration = true;

/**
 * Global variables
 */

var clients = new Map();

let status = {
    INIT: 0,
    LOGIN: 1,
    REGISTER: 2,
    CONFIRM: 3,
    GAME: 4,
}

let containeurs = {};
/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}



function sendMessage(uuid, text, password = false) {
    let obj = {
        time: (new Date()).getTime(),
        text: text,
        author: "",
        color: false,
        password: password
    };

    let json = JSON.stringify({
        type: 'message',
        data: obj
    });

    clients.get(uuid).connection.sendUTF(json);
}

/**
 * HTTP server
 * Base server on which the WebSocket server will run
 */
var server = http.createServer(function (request, response) { });
server.listen(webSocketsServerPort, function () {
    console.log((new Date()) + " Server is listening on port "
        + webSocketsServerPort);
});


/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    httpServer: server
});

var optsc = {
    'Hostname': '',
    'User': '',
    'AttachStdin': true,
    'AttachStdout': true,
    'AttachStderr': true,
    'Tty': true,
    'OpenStdin': true,
    'StdinOnce': false,
    'Env': null,
    'Cmd': [],
    'Dns': ['8.8.8.8', '8.8.4.4'],
    'Image': 'docker-game',
    'Volumes': {},
    'VolumesFrom': [],
    'HostConfig': {
        "Memory": 32000000,
        "DiskQuota": 8000000,
    }
};

async function createContainer(userName, uuid) {
    console.log("Creating containeur for " + userName + ':' +uuid + "...");
    docker.createContainer(optsc)
        .then(container => {
            containeurs[uuid] = {
                stdin: null,
                stdout: null,
                container_id: null
            };

            var attach_opts = {
                stream: true,
                stdin: false,
                stdout: true,
                stderr: false
            };

            containeurs[uuid].container_id = container;

            //stdout
            container.attach(attach_opts, (err, stream) => {

                stream.on('data', key => {
                    var text = String(key);

                    text = text.replace(/(\n)/g, '\\n');
                    sendMessage(uuid, text, false);
                })

                console.log("Starting container...");
                container.start()
                    .then(container => {
                        console.log("Containeur for " + uuid + " succefully created and ready !");
                    })
            });

            var attach_opts = {
                stream: true,
                stdin: true,
                stdout: false,
                stderr: false
            };

            //stdin
            container.attach(attach_opts, (err, stream) => {
                containeurs[uuid]['stdin'] = stream;
            });
        }).catch(e => {
            sendMessage(uuid,"Désolé, le serveur est actuellement surchargé. Veuillez réessayer ultérieurement. "+e);
        })
}

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    var connection = request.accept(null, request.origin);
    var uuid = uuidv4();

    clients.set(uuid,{
        connection: connection,
        status: 0
    });

    var userName = false;

    console.log((new Date()) + ' Connection accepted with uuid ' + uuid);
    sendMessage(uuid, "Enter your login : ");

    // user sent some message
    connection.on('message', async function (message) {
        if (message.type === 'utf8') {

            switch (clients.get(uuid).status) {
                case status.INIT:
                    // remember user name
                    userName = htmlEntities(message.utf8Data).split("\n")[0];

                    console.log((new Date()) + ' Login request : ' + userName + '.');
                    // Challenge username with the database
                    await dm.getUserFromUsername(userName).then(rows => {
                        if (!rows || !rows.length) {
                            if(enableRegistration) {
                                // New user
                                console.log((new Date()) + ' New user registering : ' + userName + ':'+uuid+'.');
                                sendMessage(uuid, userName + "\\nNew Password for " + userName + " : ", true);
                                // Go in state 2 for registration
                                clients.get(uuid).status = status.REGISTER;
                            } else {
                                sendMessage(uuid, userName + "\\nUnknown login, please try again with a new one : ");
                            }
                        } else {
                            // Existing user, asking for identification
                            console.log((new Date()) + " " +  userName + ':'+uuid+ + " logging in.");
                            sendMessage(uuid, userName + "\\nPassword for " + userName + " : ", true);
                            clients.get(uuid).status = status.LOGIN;
                        }
                    });
                    break;
                case status.LOGIN:
                    // Check password and either connect (state 4) or simply retry.
                    sendMessage(uuid, "\\n\\n");

                    await dm.checkUserLogin(userName, message.utf8Data).then(
                        rows => {
                            if (rows.length) {

                                // Temporary container, since saves don't work yet
                                // TODO : load user's save
                                createContainer(userName, uuid).then(function (v) {
                                    clients.get(uuid).status = status.GAME;
                                });
                            } else {
                                sendMessage(uuid, "\\nWrong password. Try again.\n", true);
                            }
                        }
                    )

                    break;
                case status.REGISTER:

                    // Check if the password is good and either ask for validation (state 3) or simply retry

                    sendMessage(uuid, "\\nRepeat Password : ", true);
                    clients.get(uuid).status = status.CONFIRM;
                    break;
                case status.CONFIRM:
                    // Check if the password is good then either create the container and connect (state 4) or retry
                    sendMessage(uuid, "\\n\\n");

                    await dm.registerUser(userName, message.utf8Data).then(
                        rows => {
                            if (rows.insertId > 0) {
                                console.log((new Date()) + " " + userName + " registered.");
                                createContainer(userName, uuid).then(function (v) {
                                    clients.get(uuid).status = status.GAME;
                                });
                            } else {
                                sendMessage(uuid, "An error occured. Try again!\n");
                                clients.get(uuid).status = status.INIT;
                            }
                        }
                    )
                    break;
                case status.GAME:
                    if (containeurs[uuid]) {
                        containeurs[uuid]['stdin'].write(message.utf8Data);
                    }
                    break;
            }

        }
    });

    // user disconnected
    connection.on('close', function (connection) {
        console.log((new Date()) + " Peer "
            + connection.remoteAddress + " disconnected.");
        if (uuid !== false && containeurs[uuid]) {

            console.log("Removing container of " + uuid);
            containeurs[uuid].container_id.stop()
                .catch(error => {
                    //Container already stoped
                });

            console.log("Container succesfully removed !");


            // remove user from the list of connected clients
           delete clients[uuid];
        }
    });
});