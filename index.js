var Imap = require("imap");
var MailParser = require("mailparser").MailParser;
var Promise = require("bluebird");
Promise.longStackTraces();
const simpleParser = require('mailparser').simpleParser;


var imapConfig = {
    user: 'akhilesh.blinds@outlook.com',
    password: 'akhileshblinds123',
    host: 'imap-mail.outlook.com',
    port: 993,
    tls: true
};

var imap = new Imap(imapConfig);
Promise.promisifyAll(imap);
let state = '';

imap.once("ready", execute);
imap.once("error", function(err) {
    log.error("Connection error: " + err.stack);
});

imap.connect();

async function execute() {
    await imap.openBox("INBOX", false, function(err, mailBox) {
        if (err) {
            console.error(err);
            return;
        }
        imap.search(["UNSEEN"], function(err, results) {
            if(!results || results.length == 0){console.log("No unseen email available"); imap.end();return;}     

            imap.setFlags(results, ['\\Seen'], function(err) {
                if (!err) {
                    console.log("marked messages as read");
                } else {
                    console.log(JSON.stringify(err, null, 2));
                }
            });

            var f = imap.fetch(results, { bodies: "" });
            const parseMessages = new Promise((resolve, reject) =>  {
                f.on('message', function (msg, seqno) {
                    var prefix = '(#' + seqno + ') ';
    
                    msg.on('body', function (stream, info) {
                        // use a specialized mail parsing library (https://github.com/andris9/mailparser)        
                        simpleParser(stream, async function (err, mail) {
                            console.log(prefix + mail.subject);
                            if (mail.subject == 'open blinds') {
                                state = 'open';
                            } else if (mail.subject == 'close blinds') {
                                state = 'close'
                            }
                        })
                        //
                        // or, write to file
                        //stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
                    });
                });
            })

            parseMessages
                .then(function(value) {
                    console.log("priomise tttesttt");
                    if (state == 'open') {
                        console.log("running python script to open blinds");
                    } else if (state == 'close') {
                        console.log("running python script to close blinds");
                    } else {
                        console.log("no trigger found");
                    }
                })
                .catch(function(e) {
                    console.log(e)
                })

            f.once("error", function(err) {
                return Promise.reject(err);
            });
            f.once("end", function() {
                console.log("Done fetching all unseen messages.");
                imap.end();
            });
        });
    });
    console.log("done with opening the inbox");
}

