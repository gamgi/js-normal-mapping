// Helper for loading scripts dynamically
// originally from:	http://unixpapa.com/js/dyna.html
function loadScript(fileName){
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = fileName;
	head.appendChild(script);
	//document.writeln('<script src="'+fileName+'" type="text/javascript"></script>');
}
// FETCH CANVAS
var canvas = document.getElementById("screen");

// LOAD FILES
var flx = flox.namespace;
loadScript('functions.js');

// WINDOW WATCH
var fullScreenEnabled = false;
function fullscreenCheck( event ) {
    fullScreenEnabled = (fullScreenEnabled?false:true);
    console.log(fullScreenEnabled);
    //if ( document.fullscreenEnabled || document.mozFullScreenEnabled) {
    //until mozilla bug has been fixed
    if (fullScreenEnabled == true){
        GAME.screenExpand();
    }else{
        GAME.screenContract();
    }
};

document.addEventListener("fullscreenchange", fullscreenCheck, false);
document.addEventListener("mozfullscreenchange", fullscreenCheck, false);

function toggleFullScreen() {
    if (!document.mozFullScreen && !document.webkitFullScreen) {
        if (canvas.mozRequestFullScreen) {
            canvas.mozRequestFullScreen();
        } else {
            canvas.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    }
}
