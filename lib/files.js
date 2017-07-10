var fs = require( 'fs-extra' );
var path = require( 'path' );
var walkSync = require('walk-sync');
var convertImage = require('./convertImage.js');
let imageCache = require( './imageCache.js' );
var consts = require( './consts.js' );


export default class Files {
	constructor() {
		this._files = [];
	}
	

	commitChanges() {
		for ( let i=0; i<this._files.length; ++i ) {
			let file = this._files[i];
			if ( file.deleted ) {
				imageCache.removeFromCache( file.path );
				// TODO: move to another folder, don't delete
				let dest;
				let attempts = 0;
				do {
					const ext = path.extname( file.path );
					const basename = path.basename( file.path, ext ) + ( attempts > 0 ? '_' + attempts.toString() : '' ) + ext;
					dest = path.join( this._moveDir, basename );
					attempts++;
				} while ( fs.existsSync( dest ) );
				fs.renameSync( file.path, dest );
				console.log( "Moved", file.path, "to", dest );
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
			// if ( file.group && file.group.length > 0 ) {
				// // move to specific folder with group name
				// // TODO: move specific on where to move to
				// let newfolder = path.normalize( path.join( this._rootFilePath, file.group ) );
				// fs.ensureDirSync( newfolder );
				// let newpath = path.normalize( path.join( newfolder, path.basename( file.path ) ) );
				// // make sure the new filename is unique
				// let ext = path.extname( file.path );
				// let count = 0;
				// while ( fs.existsSync( newpath ) ) {
					// newpath = path.normalize( path.join( newfolder, path.basename( file.path, ext ) + "_" + count + ext ) );
					// count++;
				// }
				// console.log( "Moving '" + file.path + "' to '" + newpath + "'" );
				// fs.renameSync( file.path, newpath );
				// imageCache.removeFromCache( file.path );
				// file.path = newpath;
				// file.group = '';
			// }
		}
	}

	
	_createFileObject( filePath ) {
		// work out group name from file path
		let rootPath = path.normalize( this._rootFilePath );
		let dir = path.normalize( path.dirname( filePath ) );
		let group = '';
		if ( dir.length > rootPath.length ) {
			group = dir.substr( rootPath.length + 1 );
		}
		return new Promise( function( resolve, reject ) {
			resolve( {
				path: filePath,
				rotation: 0,
				group: group,
				deleted: false
			} );
		} );
	}
	
	
	async init( rootFilePath, moveDir ) {
		this._rootFilePath = rootFilePath;
		this._moveDir = moveDir;
		
		// analyse directory given to find all files there
		const fullImagePath = path.normalize( path.resolve( consts.imageRootDir ) );
		this._files.length = 0;
		let paths = walkSync( rootFilePath, { directories: false } );
		for ( let i=0; i<paths.length; ++i ) {
			let filePath = path.normalize( path.join( rootFilePath, paths[i] ) );
			try {
				let dir = path.resolve( path.dirname( filePath ) );
				// ignore any images that are cached by us
				if ( dir !== fullImagePath ) {
					let ext = path.extname( filePath ).toLowerCase();
					if ( ext === '.jpg' || ext === '.jpeg' ) {
						let obj = await this._createFileObject( filePath );
						this._files.push( obj );
					}
				}
			}
			catch ( err ) {
				console.error( "Couldn't process file '" + filePath + "'" );
				console.error( err );
			}
		}
	}
	
	
	normaliseIndex( index ) {
		if ( this._files.length > 0 ) {
			while ( index < 0 ) {
				index += this._files.length;
			}
			return index % this._files.length;
		}
		return index;
	}
	
	
	getImage( index ) {
		if ( this._files.length > 0 ) {
			return this._files[ this.normaliseIndex( index ) ];
		}
		return null;
	}
	
	
	get length() {
		return this._files.length;
	}
}

