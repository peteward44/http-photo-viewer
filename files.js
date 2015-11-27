'use strict';

var fs = require( 'fs' );
var path = require( 'path' );
var walkSync = require('walk-sync');
var convertImage = require('./convertImage.js');
let imageCache = require( './imageCache.js' );


export default class Files {
	constructor() {
		this._files = [];
	}
	

	commitChanges() {
		for ( let i=0; i<this._files.length; ++i ) {
			let file = this._files[i];
			if ( file.deleted ) {
				fs.remove( file.path );
				console.log( "Deleted", file.path );
				imageCache.removeFromCache( file.path );
				continue;
			}
			if ( file.rotation > 0 ) {
				let image = fs.readFileSync( file.path ).toString( 'binary' );
				let rotatedImage = convertImage.rotateExif( image, file.rotation );
				fs.writeFileSync( file.path, rotatedImage, 'binary' );
				console.log( "Rotated", file.path );
				file.rotation = 0;
				imageCache.removeFromCache( file.path );
			}
		}
	}

	
	_createFileObject( filePath ) {
		return new Promise( function( resolve, reject ) {
			resolve( {
				path: filePath,
				rotation: 0
			} );
		} );
	}
	
	
	async init( rootFilePath ) {
		// analyse directory given to find all files there
		this._files.length = 0;
		let paths = walkSync( rootFilePath, { directories: false } );
		for ( let i=0; i<paths.length; ++i ) {
			let filePath = path.join( rootFilePath, paths[i] );
			try {
				let ext = path.extname( filePath ).toLowerCase();
				if ( ext === '.jpg' || ext === '.jpeg' ) {
					let obj = await this._createFileObject( filePath );
					this._files.push( obj );
				}
			}
			catch ( err ) {
				console.error( "Couldn't process file '" + filePath + "'" );
				console.error( err );
			}
		}
	}
	
	
	getImage( index ) {
		if ( this._files.length > 0 ) {
			while ( index < 0 ) {
				index += this._files.length;
			}
			return this._files[ index % this._files.length ];
		}
		return null;
	}
}

