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
	convertImage.rotate( p.path, { rotation: rotation, writeExif: true }, function( err, data, newOrientation ) {
		g_files.updateOrientation( p.path, newOrientation );
		let newp = p.path;
		// let ext = path.extname( p.path );
		// let fileNoExt = path.basename( p.path, ext );
		// let newp = path.join( path.dirname( p.path ), fileNoExt + ".new" + ext );
		fs.writeFile( newp, data, 'binary', function() {
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
			rotateAndSave( parseInt( req.query.previous.index, 10 ), rot );
		}
	}
	
	// then load next image
	var reqIndex = parseInt( req.query.next.index, 10 );
	let image = g_files.getImage( reqIndex );
	convertImage.clientView( image.path, { noConvert: true }, function( err, str ) {
		console.log( image );
		res.send( JSON.stringify( {
			index: reqIndex,
			path: image.path,
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

