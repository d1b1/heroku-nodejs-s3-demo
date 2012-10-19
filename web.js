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

var client = knox.createClient({
    key: process.env.AWS_ACCESS_KEY_ID,
    secret: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: 'formaggio-dev'
});

app.post('/', function(req, res) {

  var file = req.files.file;

  console.log('ddd', encodeURIComponent(file.name));

  client.putFile(file.path, encodeURIComponent(file.name), {'Content-Type': file.type, 'x-amz-acl': 'private'}, 
    function(err, result) {
      if (err) {
        return; 
      } else {
        if (200 == result.statusCode) { 
          console.log('Uploaded to Amazon S3!');
        } else { 
          console.log('Failed to upload file to Amazon S3'); 
        }

        res.redirect('/'); 
      }
  });

});

app.get('/s3', function(req, res) {

  client.streamKeys({
    // omit the prefix to list the whole bucket
    prefix: '' 
  }).on('data', function(key) {
    console.log(key);
  });

  // var s3 = require('aws2js').load('s3', process.env.AWS_ACCESS_KEY_ID, process.env.AWS_SECRET_ACCESS_KEY);    
  // var bucketName = 'formaggio-dev';

  // s3.setBucket(bucketName);

  // var folder = encodeURI('');
  // var url = '?prefix=' + folder;

  // s3.get(url, 'xml', function (error, data) {
  //     console.log(error);
  //     console.log(data);
  // });

});

// ------ Start the App ----------------------------------------

var port = process.env.PORT || 4000;
app.listen(port, function() { 
  console.log('StartUp: api.formagg.io ' + port ); 
});
