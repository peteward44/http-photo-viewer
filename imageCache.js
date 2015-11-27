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
		console.log( "Loading " + loadRequest.path );
		let loadedImage;
		let prom = convertImage.clientView( loadRequest.path, { noConvert: true } );
		prom.then( ( img ) => {
			console.log( "Resolving" );
			that._images[ loadRequest.path ] = img;
			if ( loadRequest.resolve ) {
				loadRequest.resolve( that._images[ loadRequest.path ] );
			}
			console.log( "Post resolve" );
			that._loading = false;
			console.log( "Processing next in queue" );
			setImmediate( () => { that._checkQueue(); } );
		} );
		prom.catch( ( err ) => {
			console.error( "Error loading image" );
			console.error( err );
		} );
	}

	
	loadImage( filePath, callback ) {
		let that = this;
		console.log( "Requesting " + filePath );
		if ( that._images.hasOwnProperty( filePath ) ) {
			callback( that._images[ filePath ] );
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
