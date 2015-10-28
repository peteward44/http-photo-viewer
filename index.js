'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var convertImage = require('./convertImage.js');

var newWidth = 300;

var photoDir = path.join( __dirname, 'testphotos' );
var staticDir = path.join( __dirname, 'static' );


function onNextRequest( req, res ) {
	//console.log( "req", req );
	var reqIndex = req.query.index;

	// TODO: error checking, making sure image files are only picked up...
	var files = fs.readdirSync( photoDir );
	var nextFilePath = path.join( photoDir, files[ reqIndex ] );

	convertImage( nextFilePath, function( err, str ) {
		res.send( JSON.stringify( {
			index: reqIndex,
			data: str
		} ) );
	} );
}


function start() {
	var app = express();

	app.use( express.static( staticDir ) );
	app.get('/next', onNextRequest );

	var server = app.listen(3000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Listening at http://%s:%s', host, port);
	});
}


start();
