'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var sharp = require('sharp');

var newWidth = 300;

var photoDir = path.join( __dirname, 'testphotos' );
var staticDir = path.join( __dirname, 'static' );


function onNextRequest( req, res ) {
	//console.log( "req", req );
	var reqIndex = req.query.index;

	// TODO: error checking, making sure image files are only picked up...
	var files = fs.readdirSync( photoDir );
	var nextFilePath = path.join( photoDir, files[ reqIndex ] );

	var newHeight; 
	sharp('input.jpg')
		.metadata( function( data ) {
			var ratio = data.width / data.height;
			newHeight = ratio * newWidth;
		} )
		.resize(newWidth, newHeight)
		.webp()
		.toBuffer()
		.then( function( data ) {
			// var type = path.extname( nextFilePath );
			// if ( type[0] === '.' ) {
				// type = type.substr( 1 );
			// }
			var type = "webp";
			var prefix = "data:image/" + type + ";base64,";
			var base64 = data.toString('base64');
			var photoData = prefix + base64;
			
			var responseData = {
				index: reqIndex,
				data: photoData
			};
			
			res.send( JSON.stringify( responseData ) );
			res.end();
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
