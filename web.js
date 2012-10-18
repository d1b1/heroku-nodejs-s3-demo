var express    = require('express');

// ---------------------------------------------------
// Define the express application.

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 4000);
  app.set('views', __dirname + '/views');
  app.set('view options', { layout: true, pretty: true });
  app.set('view engine', 'jade');

  // Setup the basic express settings.
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());

  console.log('Path 1:', __dirname);
  console.log('Path 2:', __dirname + './tmp');
  console.log('Path 3:', __dirname + '../tmp');

  app.use('/images', express.static('./tmp'));

  app.use(app.router)

});

// -------------------------------------------------------------

app.get('/photos', function(req, res){

  console.log('Path 1:', __dirname);
  console.log('Path 2:', __dirname + './tmp');
  console.log('Path 3:', __dirname + '../tmp');

  res.send('<form method="post" enctype="multipart/form-data">'
    + '<p>Data: <input type="filename" name="filename" /></p>'
    + '<p>file: <input type="file" name="file" /></p>'
    + '<p><input type="submit" value="Upload" /></p>'
    + '</form>');
});


app.post('/photos', function(req, res) {

  console.log(req.files);

  res.send(req.files);

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
