'use strict';

var viewport = $( "#viewport" );
var viewimg = $( "#viewimg" );
var canvas = viewimg[0];
var photoIndex = -1;
var rotation = 0;
var photoImg = new Image();


function setPhotoData( data ) {
	photoImg.onload = function() {		
		var flipHorz = false;
		var flipVert = false;
		var imgRotation = 0;
		switch ( data.orientation ) {
			case 2:
				flipHorz = true;
				break;
			case 3: // upside down
				imgRotation = 2;
				break;
			case 4:
				imgRotation = 2;
				flipHorz = true;
				break;
			case 5:
				imgRotation = 1;  // 90* anticlockwise
				flipVert = true;
				break;
			case 6:
				imgRotation = 1;
				break;
			case 7:
				imgRotation = 3; // 90* clockwise - needs to be rotated 270* to correct
				flipVert = true;
				break;
			case 8:
				imgRotation = 3;
				break;
		}
		var sideways = ( imgRotation % 2 ) === 1;
		canvas.height = sideways ? photoImg.width : photoImg.height;
		canvas.width = sideways ? photoImg.height : photoImg.width;
		
		var ctx = canvas.getContext("2d");
		ctx.save();
		ctx.translate(canvas.width/2, canvas.height/2);
		if ( flipHorz || flipVert ) {
			ctx.scale( flipHorz ? -1 : 1, flipVert ? -1 : 1 );
		}
		if ( imgRotation > 0 ) {
			ctx.rotate( imgRotation * ( Math.PI / 2 ) );
		}
		ctx.drawImage(photoImg, -photoImg.width/2, -photoImg.height/2);
		ctx.restore();
	};
	photoImg.src = data.data;
}


function loadNextPhoto() {
	var previousPhotoData;
	var nextIndex = photoIndex + 1;
	$.getJSON( '/next', { next: { index: nextIndex }, previous: { index: photoIndex, rotation: rotation } }, function( data ) {
		setPhotoData( data );
		photoIndex = nextIndex;
	} );
}


function set_body_height() { // set body height = window height
	viewport.height($(window).height());
}


function rotate( clockwise ) {
	rotation++;
	if ( rotation > 3 ) {
		rotation = 0;
	}
	var sideways = ( rotation % 2 ) === 1;
	canvas.height = sideways ? photoImg.width : photoImg.height;
	canvas.width = sideways ? photoImg.height : photoImg.width;
	var ctx = canvas.getContext("2d");	
	ctx.save();
	ctx.translate(canvas.width/2, canvas.height/2);
	ctx.rotate( rotation * ( Math.PI / 2 ) );
	ctx.drawImage(photoImg, -photoImg.width/2, -photoImg.height/2);
	ctx.restore();
}


function onKeyPress( evt ) {
	console.log( evt.which );
	switch ( evt.which ) {
		case 37: // left
			loadNextPhoto();
			break;
		case 39: // right
			loadNextPhoto();
			break;
		case 40: // down
			rotate( true );
			break;
		case 38: // up
			rotate( false );
			break;
	}
}


window.onload = function() {
	var win = $(window);
	win.bind('resize', set_body_height);
	win.keydown( onKeyPress );
	loadNextPhoto();
};

