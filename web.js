var express    = require('express'),
    fs         = require('fs'),
    jade       = require('jade'),
    path       = require('path');

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

  fs.readdir( "/tmp", function (err, files) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(files);
    res.render('list', { files: files });
  });

});

app.get('/show/:name', function(req, res) {
  fs.createReadStream( path + req.params.name ).pipe(res);
});

app.get('/list', function(req, res) {

  fs.readdir( "/tmp", function (err, files) {
    if (err) {
      console.log(err);
      return;
    }
    res.render('list', { files: files });
  });

});

app.post('/', function(req, res) {

  console.log(req.files);

  //res.send(req.files);

  res.redirect('/'); 

  // req.form.complete(function(err, fields, files) {
  //   if(err) {
  //     next(err);
  //   } else {
  //     ins = fs.createReadStream(files.photo.path);
  //     ous = fs.createWriteStream(__dirname + '/directory were u want to store image/' + files.photo.filename);
  //     util.pump(ins, ous, function(err) {
  //       if(err) {
  //         next(err);
  //       } else {
  //         res.redirect('/photos');
  //       }
  //     });
  //     //console.log('\nUploaded %s to %s', files.photo.filename, files.photo.path);
  //     //res.send('Uploaded ' + files.photo.filename + ' to ' + files.photo.path);
  //   }
  // });
});

// ------ Start the App ----------------------------------------

var port = process.env.PORT || 4000;
app.listen(port, function() { 
  console.log('StartUp: api.formagg.io ' + port ); 
});
