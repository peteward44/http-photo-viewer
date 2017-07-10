let fs = require( 'fs-extra' );
let path = require( 'path' );
let express = require('express');
let yargs = require( 'yargs' );
let convertImage = require('./convertImage.js');
let Files = require( './files.js' );
let imageCache = require( './imageCache.js' );
let piexifjs = require( 'piexifjs' );
let exifParse = require( './exifParse.js' );

const staticDir = path.join( __dirname, '..', 'static' );
let g_files = new Files();

const imagesToCache = 2; // caches 2 images ahead of where user is


function nextRequestProcess( req, res ) {
	// for some reason every JSON property comes through as strings. Is this something to do with express?
	
	//console.log( "req", req.query );
	let forwards = true;
	let reqIndex = parseInt( req.query.next.index, 10 );
	console.log( "reqIndex", reqIndex );
	
	// save previous image if modified
	let rotation;
	if ( req.query.previous ) {
		let index = parseInt( req.query.previous.index, 10 );
		let file = g_files.getImage( index );
		if ( req.query.previous.deleted !== undefined ) {
			file.deleted = req.query.previous.deleted === "true";
		} else {
			if ( req.query.previous.rotationChange !== undefined ) {
				file.rotation += parseInt( req.query.previous.rotationChange, 10 );
			}
			if ( typeof req.query.previous.group === 'string' && req.query.previous.group.length > 0 )  {
				console.log( "Setting file group to " + req.query.previous.group );
				file.group = req.query.previous.group;
			}
		}
		
		console.log( "file", JSON.stringify( file, null, 2 ) );
		
		forwards = index <= reqIndex;
	}
	
	// then load next image
	let imageMeta = g_files.getImage( reqIndex );
	imageCache.loadImage( imageMeta.path, function( image ) {
		console.log( "Returning ", imageMeta.path );
		res.send( JSON.stringify( {
			index: reqIndex,
			image: image,
			rootPath: g_files._rootFilePath,
			imageMeta: imageMeta,
			imageIndex: g_files.normaliseIndex( reqIndex ),
			imageTotal: g_files.length
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


function pad( i ) {
	i = i.toString();
	while ( i.length < 2 ) {
		i = '0' + i;
	}
	return i;
}


// async function doSortDate( options ) {

	// function copyFile( src, outputDir ) {
		// fs.ensureDirSync( outputDir );
		// const outFile = path.normalize( path.resolve( path.join( outputDir, path.basename( src ) ) ) );
		// if ( outFile !== src ) {
			// if ( options.move ) {
				// fs.renameSync( src, outFile );
			// } else {
				// fs.copySync( src, outFile, { clobber: true } );
			// }
		// }
	// }
	
	// for ( let i=0; i<g_files.length; ++i ) {
		// let file = g_files.getImage( i );
		// const imageFilename = file.path;
		// let data = fs.readFileSync( imageFilename ).toString( 'binary' );
		// let exif = piexifjs.load( data );
		// try {
			// let copied = false;
			// let rawDate = exifParse.getDateTime( exif );
			// if ( rawDate ) {
				// let match = rawDate.match( /(\d+):(\d+):(\d+)\s*(\d+):(\d+):(\d+)/ );
				// if ( match ) {
					// // year, month, day, hours, minutes, seconds, milliseconds
					// let dt = new Date( match[1], match[2], match[3], match[4], match[5], match[6] );
					// const outputDir = path.join( options.outputdir, pad( 1900 + dt.getYear() ) + "-" + pad( 1 + dt.getMonth() ) + "-" + pad( dt.getDate() ) );
					// copyFile( file.path, outputDir );
					// copied = true;
				// }
			// }
			// if ( !copied ) {
				// const outputDir = path.join( options.outputdir, 'unknown' );
				// copyFile( file.path, outputDir );
			// }
		// }
		// catch ( err ) {
			// console.error( err );
		// }
	// }
// }


async function start() {

	let options = yargs
		.usage('Usage: http-photo-viewer [options]')
		.example('http-photo-viewer --dir /my/photos', 'Serves pictures from /my/photos directory')
		.help( 'help' )
		.version(function() {
			return require( '../package' ).version;
		})
		.option( 'dir', {
			describe: "Directory containing photos to view",
			default: process.cwd()
		} )
		.option( 'move', {
			describe: "Moves files to this directory instead of copies them",
			default: path.join( process.cwd(), 'deleted' ),
			string: true
		} )
		.argv;

	fs.ensureDirSync( options.move );
	await g_files.init( options.dir, options.move );

	// serve via http
	let app = express();
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

	let server = app.listen(3000, function () {
		let host = server.address().address || '127.0.0.1'; // TODO: get default external IP
		let port = server.address().port;

		console.log('Listening at http://%s:%s', host, port);
	});
}

export default start;
