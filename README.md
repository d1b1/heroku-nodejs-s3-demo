This is a demo application that shows how to manage file uploads and AWS using Node.js on Heroku.
This sample app makes use of the Heroku 'ephemeral file system'.

## Reference
* [Heroku Ephermal File Storage](https://devcenter.heroku.com/articles/dynos#ephemeral-filesystem)
* [Node.js Knox Package](https://github.com/LearnBoost/knox)
* [Node.js Blitline Package](https://github.com/blitline-dev/blitline_node)

## Requirements

* AWS Account and defined bucket.
* Heroku Account
* Node installed locally.

## Setup
To test this application you need to define the following variables in either your 
local node workspace (.bash_profile) or as heroku configuration variables. I usually
create a .settings file in my local workspace and add .setting to my repos .gitignore.

For local development (.settings or ~/.bash_profile)

    export AWS_ACCESS_KEY_ID=XXXXX
    export AWS_ACCESS_ACCESS_KEY=XXXX
    export AWS_S3_BUCKET=XXXXXXXX
    export BLITLINE_API_KEY=XXXXX

For Heroku Config SDK

    heroku config:add AWS_ACCESS_KEY_ID=XXXXX
    heroku config:add AWS_ACCESS_ACCESS_KEY=XXXX
    heroku config:add AWS_S3_BUCKET=XXXXXXXX
    heroku config:add BLITLINE_API_KEY=XXXXX

## Blitline.com Setup
The blitline image resize API is an optional element in this demo. If you 
do not want to setup an account, then leave the BLITLINE_API_KEY variable 
defined. The code code will only call the resizing code when it is defined.

Remember to allow Blitline to save resized images back to your AWS bucket, you
need to define the access rules in your AWS console to give them specific write
access. Get the API specific settings from https://blitline.com/docs/s3_permissions

