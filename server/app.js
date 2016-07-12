var express = require('express');
var PouchDB = require('pouchdb');
var cors = require('cors');
var bodyParser = require('body-parser')

var app = express();
app.use(cors());

// create/open pouchDB database
var db = new PouchDB('test');
// create application/json parser
var jsonParser = bodyParser.json()


app.post('/tasks', function (req, res) {
    db.allDocs({include_docs: true}).then(function(docs){
        res.send(docs);
    }).catch(function(err){
        console.log(err);
        res.send(500);
    })

});

app.post('/add', jsonParser, function(req, res){
    db.put(req.body).then(function(resuponse){
        res.send(200);
    }).catch(function(err){
        console.log(err);
        res.send(500);
    })
});

app.post('/update', jsonParser, function(req, res){
    console.log('searching index: ' + req.body.text);
    db.get(req.body.text).then(function(doc){
        doc.completed = req.body.completed;
        console.log('set task complete status to: ' + req.body.completed);
        return db.put(doc);
    }).then(function(){
        console.log('task updated!');
        res.send(200);
    }).catch(function(err){
        console.log(err);
        res.send(500);
    })
});

app.post('/heartbeat', function(req, res){
    res.send(200);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
