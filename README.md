This is a demo application that shows how to manage file uploads and AWS using Node.js on Heroku.
This sample app makes use of the Heroku 'ephemeral file system'.

https://devcenter.heroku.com/articles/dynos#ephemeral-filesystem

Requirements

## Required

# AWS Account and defined bucket.
# Heroku Account
# Node installed locally.

## Setup
To test this application you need to define the following variables in either your 
local node workspace (.bash_profile) or as heroku configuration variables. I usually
create a .settings file in my local workspace and add .setting to my repos .gitignore.

  export AWS_ACCESS_KEY_ID=XXXXX
  export AWS_ACCESS_ACCESS_KEY=XXXX
  export AWS_S3_BUCKET=XXXXXXXX
  export BLITLINE_API_KEY=XXXXX

  heroku config:add AWS_ACCESS_KEY_ID=XXXXX
  heroku config:add AWS_ACCESS_ACCESS_KEY=XXXX
  heroku config:add AWS_S3_BUCKET=XXXXXXXX
  heroku config:add BLITLINE_API_KEY=XXXXX

## Description
This demo provides a simple file upload, list and display of images. The working demo uses S3. 
The list of files shows the ephimeral file path, and the final S3 file path. Files are limited
to 500k and will only remain in the S3 budget for 2 hours. 

How to
Heroku has no persistent storage. The developer is responsible for finding and implementing
the storage of file; images, css, html etc. S3 provides an API for storage and a number of 
different authentication approaches and management tools. Heroku recommends either a passthru,
where the file is upload and programmatically submitted to S3, or using a direct connect, where
the end user (browser and/or application) submit the files directly. For large files, the passthru
feature is not recommend to heroku, as it consume dyno resources while uploading and submitting, 
but with Node.js and smalle files, the passthru is a much more app fiendly approach. 

So, per the dev-center notes, Cedar provides support for files within the slug generated at deployment
time. Each dyno a its own local file system (i.e. setup of application files). Using expressjs 
and a traditional HTML upload for, node.js will store the uploaded file in a tmp folder at the dyno 
app root. These files only exist on the dyno while the dyno is running. When the dyno spins down
because its not used, the storage goes with it. So as long as your upload process handles the file
in the same request, the developer can take advantage of this storage to handle the passthru. 

