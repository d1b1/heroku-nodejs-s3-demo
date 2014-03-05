var express   = require('express'),
    fs        = require('fs'),
    jade      = require('jade'),
    path      = require('path'),
    knox      = require('knox'),
    knoxCopy  = require('knox-copy'),
    http      = require('http'),
    Blitline  = require('blitline');

var amazon_url = 'http://s3.amazonaws.com/' + process.env.AWS_S3_BUCKET;
var knox_params = {
    key: process.env.AWS_ACCESS_KEY_ID.toString(),
    secret: process.env.AWS_SECRET_ACCESS_KEY.toString(),
    bucket: process.env.AWS_S3_BUCKET.toString()
  }

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

  app.use(function(req, res, next) {
    var url = require('url')
    var queryURL = url.parse(req.url, true)
    req.urlparams = queryURL.query
    next()
  })

  app.use(app.router);

  app.use('/images', express.static( '/tmp' ))
  app.use('/', express.static(__dirname + '/'))
})

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

  var url = amazon_url + '/scratch/' + filename;
  var folder = width.toString() + 'x' + height.toString();

  var job = blitline.addJob(process.env.BLITLINE_API_KEY, url);
  job.addFunction('resize_to_fit', { width: width, height: height}, 'my_blurred_cropped_image')
    .addSave('my_image', process.env.AWS_S3_BUCKET, folder + '/' + filename.replace(/ /g, "-"));

  blitline.postJobs(function(response) {
    // Should have response, but it not really needed for poc.
    // console.log(response);
  });

}

app.get('/bitline/resize/:name', function(req, res) {

  if (process.env.BLITLINE_API_KEY) {
    // Sanitize the filename.
    var filename = (req.params.name).replace(/ /g, '-');

    // Ok call the resizer.
    resizer( filename, 100, 100);
    resizer( filename, 400, 600);

  } else {
    console.log('No BLITLINE_API_KEY key defined.')
  }

  res.redirect('/');
});

app.post('/', function(req, res) {

  var client = knox.createClient(knox_params);

  var file = req.files.file;
  var filename = (file.name).replace(/ /g, '-');

  client.putFile(file.path, 'scratch/' + filename, {'Content-Type': file.type, 'x-amz-acl': 'public-read'}, 
    function(err, result) {
      if (err) {
        return; 
      } else {
        if (200 == result.statusCode) { 
          console.log('Uploaded to Amazon S3!');

          // call the resizer function for to different sizes.
          if (process.env.BLITLINE_API_KEY) {
            resizer( filename, 100, 100 );
            resizer( filename, 400, 600 );
          }

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

  var client = knox.createClient(knox_params);

  client.del(encodeURIComponent( 'scratch/' + req.params.name))
    .on('response', function(result){
      console.log('Delete Code', result.statusCode);
    }).end();

  client.del(encodeURIComponent( '400x600/' + req.params.name))
    .on('response', function(result){
      console.log('Delete Code', result.statusCode); 
    }).end();

  client.del(encodeURIComponent( '100x100/' + req.params.name))
    .on('response', function(result){
      console.log('Delete Code', result.statusCode);
    }).end();

  // Ok send the user back to the list page. The resize API
  // calls might not be done, but not an issue with a refresh.
  res.redirect('/')
})

app.get('/', function(req, res) {

  var client = knoxCopy.createClient(knox_params);

  var marker = req.urlparams.marker || '';

  client.listPageOfKeys({ prefix: 'scratch', marker: marker, maxKeys: 5 }, function(err, page) {
    if (err) {
      res.render('error', {         
        params: { 
          title: 'List of S3 Resources', 
          showform: false
        }
      })
    } else {
      // Call the template with the page data.


      console.log('files', page.Contents.files.length)

      res.render('s3list', { 
        params: { 
          amazon_url: amazon_url, 
          showform: true, 
          files: page.Contents,
          paging: {
            next: null,
            previous: null
          }
        }
      }, function(err, html) {
        if (err) console.log(err)
        if (err) return res.send('Error in Page')

        res.send(200, html)
      })
    }
  })

})

// ------ Start the App ----------------------------------------

var port = process.env.PORT || 4000;
app.listen(port, function() { 
  console.log('StartUp: S3-Heroku Demo on ' + port )
})
