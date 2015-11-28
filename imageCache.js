'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var walkSync = require('walk-sync');
var piexifjs = require( 'piexifjs' );
var convertImage = require('./convertImage.js');


class ImageCache {
	constructor() {
		this._loadQueue = [];
		this._images = {};
		this._loading = false;
	}
	
	
	removeFromCache( imageFilename ) {
		if ( this._images.hasOwnProperty( imageFilename ) ) {
			delete this._images[ imageFilename ];
		}
	}
	
	
	_loadComplete( imageFilename, callback ) {
		let that = this;
		console.log( "_loadCOmplete" );	
		if ( imageFilename ) {
			let data = fs.readFileSync( imageFilename ).toString( 'binary' );
			let exif = piexifjs.load( data );
			this._images[ imageFilename ].orientation = exif && exif[ "0th" ] && isFinite( exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] ) ? exif[ "0th" ][ piexifjs.ImageIFD.Orientation ] : 0
		}
		// TODO: on successful load, change it so it looks for any requests for the same image in the queue so they can be satisfied straight away
		// or when adding a new request, check to see if it already exists then add callback to an array
		if ( callback ) {
			callback( this._images[ imageFilename ] );
		}
		this._loading = false;
		setImmediate( () => { that._checkQueue(); } );
	}
	
	
	_checkQueue() {
		let that = this;
		if ( this._loading ) {
			return; // loading already in progress
		}
		if ( this._loadQueue.length <= 0 ) {
			return; // nothing in the queue
		}
		
		this._loading = true;
		let loadRequest = this._loadQueue.pop();	

		if ( this._images.hasOwnProperty( loadRequest.path ) ) {
			// already in cache
			return this._loadComplete( loadRequest.path, loadRequest.resolve );
		}
		console.log( "Loading " + loadRequest.path );
		let prom = convertImage.clientView( loadRequest.path, { noConvert: false } );
		prom.then( ( img ) => {
			that._images[ loadRequest.path ] = {
				src: img
			};
			return this._loadComplete( loadRequest.path, loadRequest.resolve );
		} );
		prom.catch( ( err ) => {
			console.error( "Error loading image" );
			console.error( err );
			return this._loadComplete();
		} );
	}

	
	loadImage( filePath, callback ) {
		let that = this;
		console.log( "Requesting " + filePath );
		if ( that._images.hasOwnProperty( filePath ) ) {
			console.log( "Returning cached version" );
			if ( callback ) {
				setImmediate( function() { callback( that._images[ filePath ] ); } );
			}
		} else {
			that._loadQueue.push( {
				path: filePath,
				resolve: callback
			} );
			that._checkQueue();
		}
	}
}


export default new ImageCache();
