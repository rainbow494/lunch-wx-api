const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);
const morgan = require('morgan');
const express = require('express');
const timeout = require('connect-timeout');
const port = '<server.port>';
const route = require('./route');

var app = express();
app.use(timeout('60s'));
app.use(haltOnTimedout);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.xml({
    limit: '1MB', // Reject payload bigger than 1 MB
    xmlParseOptions: {
        normalize: true, // Trim whitespace inside text nodes
        normalizeTags: true, // Transform tags to lowercase
        explicitArray: false // Only put nodes in array if >1
    }
}));

app.use(morgan('combined'));

app.get('/test', function(req, res) {
    res.send('Test Success');
});

app.use('/', route);

app.listen(port, (error) => {
    if (error) {
        console.log('Server Start Up Error:' + error);
    } else {
        console.log(`==> 🌎  Listening on port ${port}. Open up http://localhost:${port}/ in your browser.`);
    }
});

app.use(function(err, req, res, next) { // jshint ignore:line
    res.send('Exprssjs Error Stack:' + err.stack);
});

process.on('uncaughtException', function(error) {
    console.log('server is broken by unhandle exception :' + error);
});

function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
}