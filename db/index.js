'use strict';

const mysql = require('mysql');

module.exports = class db {

    // Sets up a connection and starts it
    constructor() {
        this.active = false;

        this.host = 'rhythmgamers.net';
        this.user = 'universitus';
        this.database = 'universitus';

        this.connection = mysql.createConnection({
          host: this.host,
          user: this.user,
          password: "P#_<#`Z'6s=[ySn`",
          database: this.database
        });

        this.connect();
    }

    // Establishes a connection between the server and the database
    // To be used only by the constructor
    async connect() {
        await this.connection.connect((err) => {
            if (err) throw err;
            console.log("Connected to mysql database "+this.database+"@"+this.host);
            this.active = true;
          });
    }
    
    // Destroys the active connection
    end() {
        return new Promise((resolve, reject) => {
            this.connection.end(err => {
                if (err)
                    return reject(err);
                this.active = false;
                resolve();
            });
        });
    }

    // Whether the connection is active
    isActive() {
        return this.active;
    }

    // Perform a request (exec)
    query(request) {
        return this.query(request, []);
    }

    // Perform a request with secure parameters
    async query(request, set) {
        return await this.do_query(request,set);
    }

    // Private
    // Executes a request
    do_query(request, set) {
        return new Promise( (resolve, reject) => {
            this.connection.query(request, set, (err, rows) => {
                if (err)
                    return reject(err );
                resolve(rows);
            } );
        } );
    }
}