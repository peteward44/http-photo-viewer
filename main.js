'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var convertImage = require('./convertImage.js');
let Files = require( './files.js' );

var photoDir = path.join( __dirname, 'testphotos' );
var staticDir = path.join( __dirname, 'static' );
let g_files = new Files();


function rotateAndSave( index, rotation ) {
	var p = g_files.getImage( index );
	convertImage.rotate( p.path, { rotation: rotation }, function( err, data ) {
		fs.writeFile( p, data, 'binary', function() {
			console.log( "Written image " + p );
		} );
	} );
}


function onNextRequest( req, res ) {
	//console.log( "req", req.query );
	
	// save previous image if modified
	if ( req.query.previous && req.query.previous.rotation !== undefined ) {
		var rot = parseInt( req.query.previous.rotation, 10 );
		if ( rot !== 0 ) {
		//	rotateAndSave( req.query.previous.index, rot );
		}
	}
	
	// then load next image
	var reqIndex = req.query.next.index;
	let image = g_files.getImage( reqIndex );
	convertImage.clientView( image.path, {}, function( err, str ) {
		console.log( image );
		res.send( JSON.stringify( {
			index: reqIndex,
			data: str,
			orientation: image.orientation
		} ) );
	} );
}


export default async function start() {

	await g_files.init( photoDir );
	var app = express();
	app.use( express.static( staticDir ) );
	app.get('/next', onNextRequest );

	var server = app.listen(3000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Listening at http://%s:%s', host, port);
	});
}

