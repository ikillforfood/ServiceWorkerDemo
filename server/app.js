var express = require('express');
var PouchDB = require('pouchdb');
var app = express();
var db = new PouchDB('test');


app.post('/tasks', function (req, res) {
    var docs = db.allDocs({include_docs: true});
    res.send(docs);
});

app.post('/add', function(req, res){
    req._id = req.text;
    db.put(req)
        .then(function(resuponse){
        res.status(200);
    })
        .catch(function(err){
        console.log(err);
        res.status(500);
    })
});

app.post('/update', function(req, res){
    db.get(req.text)
        .then(function(doc){
        doc.completed = req.completed;
        res.status(200);
    })
        .catch(function(err){
        console.log(err);
        res.status(500);
    })
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
