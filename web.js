var express   = require('express'),
    fs        = require('fs'),
    jade      = require('jade'),
    path      = require('path'),
    knox      = require('knox'),
    http      = require('http'),
    blitline  = require('blitline');

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

  app.use('/images', express.static( '/tmp' ));
  app.use('/', express.static(__dirname + '/'));
});

// -------------------------------------------------------------

app.get('/about', function(req, res){
  res.render('about', { params : { title: 'Proof of Concept', showform: false } });
});

app.get('/local', function(req, res){
  fs.readdir( '/tmp', function (err, files) {
    if (err) {
      return;
    }
    res.render('list', { title: 'Local Files', params: { showform: true, files: files }});
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

app.get('/bitline/resize/:name', function(req, res) {

  var bl = new blitline();

  var job = bl.addJob(process.env.BLITLINE_API_KEY, 'https://s3.amazonaws.com/formaggio-dev/' + encodeURIComponent(req.params.name) );
  var crop_function = job.addFunction('resize', { width: 50, height: 50}, 'sfdg');

  console.log('function', crop_function);
  console.log('');

  var save_function = job.addFunction('save', { s3_destination: 'formaggio-small'} );

  // console.log('jobs', job.functions[0]);

  bl.postJobs(function(response) {
    
    console.log(response);
    // var data = JSON.parse(response);
    // var image_url = data.results[0].images[0];
    // console.log(image_url.s3_url);

  });

  res.send('done')

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

      res.redirect('/'); 
    }).end();

});

app.get('/', function(req, res) {

  var knoxCopy = require('knox-copy');
 
  var client = knoxCopy.createClient({
      key: process.env.AWS_ACCESS_KEY_ID.toString(),
      secret: process.env.AWS_SECRET_ACCESS_KEY.toString(),
      bucket: 'formaggio-dev'
  });

  client.listPageOfKeys({ prefix: ''}, function(err, page) {
    console.log(page.Contents);
    res.render('s3list', { params: { title: 'S3 Files', showform: true, files: page.Contents }});
  });

});

// ------ Start the App ----------------------------------------

var port = process.env.PORT || 4000;
app.listen(port, function() { 
  console.log('StartUp: api.formagg.io ' + port ); 
});
