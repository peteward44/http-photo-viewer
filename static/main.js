'use strict';

var viewport = $( "#viewport" );
var viewimg = $( "#viewimg" );
var filenameDiv = $( "#filename" );
var canvas = viewimg[0];
var photoIndex = 0;
var rotation = 0;
var rotationChange = 0;
var photoImg = new Image();
var flipHorz = false;
var flipVert = false;
var modalOn = false;


function render() {
	var sideways = ( rotation % 2 ) === 1;
	canvas.height = sideways ? photoImg.width : photoImg.height;
	canvas.width = sideways ? photoImg.height : photoImg.width;
	var ctx = canvas.getContext("2d");	
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	if ( flipHorz || flipVert ) {
		ctx.scale( flipHorz ? -1 : 1, flipVert ? -1 : 1 );
	}
	ctx.rotate( rotation * ( Math.PI / 2 ) );
	ctx.drawImage(photoImg, -photoImg.width/2, -photoImg.height/2);
	ctx.restore();
	viewimg.show();
}


function setPhotoData( data ) {
	photoImg.onload = function() {
		rotation = 0;
		rotationChange = 0;
		flipHorz = false;
		flipVert = false;
		switch ( data.orientation ) {
			case 2:
				flipHorz = true;
				break;
			case 3: // upside down
				rotation = 2;
				break;
			case 4:
				rotation = 2;
				flipHorz = true;
				break;
			case 5:
				rotation = 3;  // 90* anticlockwise
				flipVert = true;
				break;
			case 6:
				rotation = 3;
				break;
			case 7:
				rotation = 1; // 90* clockwise - needs to be rotated 270* to correct
				flipVert = true;
				break;
			case 8:
				rotation = 1;
				break;
		}
		render();
		$( "#dialog-loading" ).dialog( "close" );
	};
	photoImg.src = data.data;
}


function setFilename( data ) {
	filenameDiv[0].innerHTML = data.path;
}


function loadNextPhoto( next, deleted ) {
	var previousPhotoData;
	var nextIndex = 0;
	if ( next !== undefined ) {
		nextIndex = photoIndex + ( next ? 1 : -1 );
	}
	$.getJSON( '/next', { next: { index: nextIndex }, previous: { index: photoIndex, rotation: rotationChange, deleted: deleted } }, function( data ) {
		setPhotoData( data );
		setFilename( data );
		photoIndex = nextIndex;
	} );
	viewimg.hide();
	// var ctx = canvas.getContext( "2d" );
	// ctx.save();
	// ctx.fillStyle = "#C4C4C4";
	// ctx.fillRect( 0, 0, canvas.width, canvas.height );
	// ctx.restore();
	
	$( "#dialog-loading" ).dialog( {
		closeOnEscape: false,
		height: 95,
		open: function(event, ui) {
			$(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
			$( "#progressbar" ).progressbar({
				value: false
			});
		}
	} );
}


function set_body_height() { // set body height = window height
	viewport.height($(window).height());
}


function inc( base, diff ) {
	base += diff;
	if ( base > 3 ) {
		base = 0;
	}
	if ( base < 0 ) {
		base = 3;
	}
	return base;
}


function rotate( clockwise ) {
	var diff = clockwise ? 1 : -1;
	rotation = inc( rotation, diff );
	rotationChange = inc( rotationChange, diff );
	render();
}


function deletePicture() {
	modalOn = true;
	$( "#dialog-confirm" ).dialog({
		resizable: false,
		height: 200,
		modal: true,
		buttons: {
			"Delete picture": function() {
				modalOn = false;
				loadNextPhoto( true, true );
				$( this ).dialog( "close" );
			},
			Cancel: function() {
				modalOn = false;
				$( this ).dialog( "close" );
			}
		}
	});
}


function onKeyPress( evt ) {
	console.log( evt.which );
	if ( !modalOn ) {
		// key presses only allowed when a modal dialog is not displayed
		switch ( evt.which ) {
			case 37: // left
				loadNextPhoto( false );
				break;
			case 13: // enter
			case 39: // right
				loadNextPhoto( true );
				break;
			case 40: // down
				rotate( true );
				break;
			case 38: // up
				rotate( false );
				break;
			case 46: // delete
				deletePicture();
				break;
		}
	}
	return true;
}


window.onload = function() {
	var win = $(window);
	win.bind('resize', set_body_height);
	win.keydown( onKeyPress );	
	loadNextPhoto();
	set_body_height();
};

