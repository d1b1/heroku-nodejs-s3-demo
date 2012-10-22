var express   = require('express'),
    fs        = require('fs'),
    jade      = require('jade'),
    path      = require('path'),
    knox      = require('knox'),
    http      = require('http'),
    Blitline  = require('blitline');

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
    console.log('successfully deleted /tmp/' + req.params.name);

    res.redirect('/local'); 
  });

});

var resizer = function( filename, width, height ) {

  var blitline = new Blitline();

  var url = 'http://s3.amazonaws.com/formaggio-dev/' + filename;
  var folder = width.toString() + 'x' + height.toString();

  var job = blitline.addJob(process.env.BLITLINE_API_KEY, url);
  job.addFunction('resize_to_fit', { width: width, height: height}, 'my_blurred_cropped_image')
    .addSave('my_image', 'formaggio-small', folder + '/' + filename.replace(/ /g, "-"));

  blitline.postJobs(function(response) {
    // Should have response, but it not really needed for poc.
    // console.log(response);
  });

}

app.get('/bitline/resize/:name', function(req, res) {

  // Sanitize the filename.
  var filename = (req.params.name).replace(/ /g, '-');

  // TODO Make certain the image is in the tmp folder.

  // Ok call the resizer.
  resizer(filename, 100, 100);
  resizer(filename, 400, 600 );

  res.redirect('/');
});

app.post('/', function(req, res) {

  var client = knox.createClient({
      key: process.env.AWS_ACCESS_KEY_ID,
      secret: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: 'formaggio-dev'
  });

  var file = req.files.file;
  var filename = (file.name).replace(/ /g, '-');

  client.putFile(file.path, filename, {'Content-Type': file.type, 'x-amz-acl': 'public-read'}, 
    function(err, result) {
      if (err) {
        return; 
      } else {
        if (200 == result.statusCode) { 
          console.log('Uploaded to Amazon S3!');

          // call the resizer function for to different sizes.
          resizer( filename, 100, 100 );
          resizer( filename, 400, 600 );

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
    res.render('s3list', { params: { title: 'S3 Files', showform: true, files: page.Contents }});
  });

});

// ------ Start the App ----------------------------------------

var port = process.env.PORT || 4000;
app.listen(port, function() { 
  console.log('StartUp: nodeloader for Heroku ' + port ); 
});
