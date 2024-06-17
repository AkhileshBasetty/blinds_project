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

imap.on("ready", execute);
imap.once("error", function(err) {
    log.error("Connection error: " + err.stack);
});

imap.connect();

function execute() {
    imap.openBox("INBOX", false, function(err, mailBox) {
        if (err) {
            console.error(err);
            return;
        }
        imap.search(["UNSEEN"], function(err, results) {
            if(!results || results.length == 0){console.log("No unseen email available"); imap.end();return;}     

            imap.setFlags(results, ['\\Seen'], function(err) {
                if (!err) {
                    console.log("marked as read");
                } else {
                    console.log(JSON.stringify(err, null, 2));
                }
            });

            var f = imap.fetch(results, { bodies: "" });
            f.on('message', function (msg, seqno) {
                var prefix = '(#' + seqno + ') ';

                msg.on('body', function (stream, info) {
                    // use a specialized mail parsing library (https://github.com/andris9/mailparser)        
                    simpleParser(stream, async function (err, mail) {
                        console.log(prefix + mail.subject);
                    })
                    //
                    // or, write to file
                    //stream.pipe(fs.createWriteStream('msg-' + seqno + '-body.txt'));
                });
            });
            f.once("error", function(err) {
                return Promise.reject(err);
            });
            f.once("end", function() {
                console.log("Done fetching all unseen messages.");
            });
        });
    });
    console.log("end");
    sleep(1000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function processMessage(msg, seqno) {
    console.log("Processing msg #" + seqno);
    // console.log(msg);

    var parser = new MailParser();
    parser.on("headers", function(headers) {
        console.log("Header: " + JSON.stringify(headers));
    });

    parser.on('data', data => {
        if (data.type === 'text') {
            console.log(seqno);
            console.log(data.text);  /* data.html*/
        }

        // if (data.type === 'attachment') {
        //     console.log(data.filename);
        //     data.content.pipe(process.stdout);
        //     // data.content.on('end', () => data.release());
        // }
     });

    msg.on("body", function(stream) {
        stream.on("data", function(chunk) {
            parser.write(chunk.toString("utf8"));
        });
    });
    msg.once("end", function() {
        // console.log("Finished msg #" + seqno);
        parser.end();
    });
}