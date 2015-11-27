'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var express = require('express');
var convertImage = require('./convertImage.js');
let Files = require( './files.js' );
let imageCache = require( './imageCache.js' );

var photoDir = path.join( __dirname, 'testphotos' );
var staticDir = path.join( __dirname, 'static' );
let g_files = new Files();

const imagesToCache = 2; // caches 2 images ahead of where user is


function nextRequestProcess( req, res ) {
	//console.log( "req", req.query );
	let forwards = true;
	var reqIndex = parseInt( req.query.next.index, 10 );
	console.log( "reqIndex", reqIndex );
	
	// save previous image if modified
	let rotation;
	if ( req.query.previous ) {
		let index = parseInt( req.query.previous.index, 10 );
		let file = g_files.getImage( index );
		if ( req.query.previous.deleted !== undefined ) {
			file.deleted = Boolean( req.query.previous.deleted );
		} else if ( req.query.previous.rotationChange !== undefined ) {
			file.rotation += parseInt( req.query.previous.rotationChange, 10 );
		}
		
		forwards = index <= reqIndex;
	}
	
	// then load next image
	let imageMeta = g_files.getImage( reqIndex );
	imageCache.loadImage( imageMeta.path, function( image ) {
		console.log( "Returning ", imageMeta.path );
		res.send( JSON.stringify( {
			index: reqIndex,
			image: image,
			imageMeta: imageMeta
		} ) );
	} );

	// then order to cache the next 2 images in the direction we are travelling in
	for ( let i=1; i<=imagesToCache; ++i ) {
		let cacheIndex = reqIndex + ( forwards ? i : -i );
		console.log( "Caching", cacheIndex );
		let cacheData = g_files.getImage( cacheIndex );
		imageCache.loadImage( cacheData.path );
	}
}


function commitProcess( req, res ) {
	console.log( "Commiting..." );
	g_files.commitChanges();
	res.send( JSON.stringify( {} ) );
}


export default async function start() {

	await g_files.init( photoDir );
	var app = express();
	app.use( express.static( staticDir ) );
	app.get('/next', nextRequestProcess );
	app.get('/commit', commitProcess );
	
	// cache first images
	for ( let i=-imagesToCache; i<=imagesToCache; ++i ) {
		let cacheIndex = i;
		console.log( "Caching", cacheIndex );
		let cacheData = g_files.getImage( cacheIndex );
		imageCache.loadImage( cacheData.path );
	}

	var server = app.listen(3000, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Listening at http://%s:%s', host, port);
	});
}

