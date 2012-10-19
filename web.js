var express   = require('express'),
    fs        = require('fs'),
    jade      = require('jade'),
    path      = require('path'),
    knox      = require('knox');

// ---------------------------------------------------
// Define the express application.

var app = express();

var path = __dirname + '/tmp';

app.configure('production', function() {
 path = __dirname + '/../tmp';
});

app.configure(function(){
  app.set('port', process.env.PORT || 4000);
  app.set('views', __dirname + '/views');
  app.set('view options', { layout: true, pretty: true });
  app.set('view engine', 'jade');

  // Setup the basic express settings.
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());

  app.use(app.router);

  app.use('/', express.static(__dirname + '/'));
  app.use('/images', express.static( '/tmp' ));
});

// -------------------------------------------------------------

app.get('/', function(req, res){
  fs.readdir( '/tmp', function (err, files) {
    if (err) {
      return;
    }
    res.render('list', { files: files });
  });
});

app.get('/show/:name', function(req, res) {
  fs.createReadStream( path + req.params.name ).pipe(res);
});

app.get('/local/delete/:name', function(req, res) {

  fs.unlink('/tmp/' + req.params.name, function (err) {
    if (err) throw err;
    console.log('successfully deleted /tmp/'+req.params.name);

    res.redirect('/'); 
  });

});

app.post('/', function(req, res) {

  var client = knox.createClient({
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: 'formaggio-dev'
  });

  var file = req.files.file;

  client.putFile(file.path, encodeURIComponent(file.name), {'Content-Type': file.type, 'x-amz-acl': 'public-read'}, 
    function(err, result) {
      if (err) {
        return; 
      } else {
        if (200 == result.statusCode) { 
          console.log('Uploaded to Amazon S3!');

          fs.unlink(file.path, function (err) {
            if (err) throw err;
            console.log('successfully deleted /'+file.path); 
          });

        } else { 
          console.log('Failed to upload file to Amazon S3'); 
        }

        res.redirect('/'); 
      }
  });

});

app.get('/s3/delete/:name', function(req, res) {

  var client = knox.createClient({
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: 'formaggio-dev'
  });

  client.del(encodeURIComponent(req.params.name))
    .on('response', function(result){
      console.log('Delete Code', result.statusCode);
      console.log('Delete Header', result.headers);
      res.redirect('/s3'); 
    }).end();

});

app.get('/s3', function(req, res) {

  var knoxCopy = require('knox-copy');

  var client = knoxCopy.createClient({
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: 'formaggio-dev'
  });

  client.listPageOfKeys({ prefix: ''}, function(err, page) {
    console.log(page.Contents);
    res.render('s3list', { files: page.Contents });
  });

});

// ------ Start the App ----------------------------------------

var port = process.env.PORT || 4000;
app.listen(port, function() { 
  console.log('StartUp: api.formagg.io ' + port ); 
});
