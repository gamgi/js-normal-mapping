// Fix modulo negative number bug
// http://javascript.about.com/od/problemsolving/a/modulobug.htm
Number.prototype.mod = function(n) {
    return ((this%n)+n)%n;
}

// Vector functions, dot product
function dot( v1, v2){
    var sum = 0;
    for (var i = 0; i<v1.length; i++) {
        sum += v1[i]*v2[i]; 
    }
    return sum
}
// Vector functions, normalizing a vector
function normalize( v) {
    var sum = 0;
    for (var i = 0; i<v.length; i++) {
        sum += v[i]*v[i];
    }
    var length =  Math.sqrt( sum);
    for (var i = 0; i<v.length; i++) {
        v[i] /= length;
    }
    return v;
}



var GAME = (function(){
	if (!flx.init('screen', 800, 600))
		console.error('failed init');
	else
		console.log('inited');
	//--- private of game---//
    // The bump handler does all bumpmapping
    function bumpHandler() {
        //--- public of bumpHandler ---//
        // Initializes the bump handler
        this.init = function() {
            //Specify source image
            sourceImage = imgH.image['bg']
            width = sourceImage.width;
            height = sourceImage.height;
            //Initialize imageData (original) and outData (what is rendered on screen)
            imageData = getImgData( sourceImage);
            outData = getImgData( sourceImage);

            //Create an arraybuffer same size as image data, and additional 8 and 32 bit arrays pointing to same buffer
            //See README.md for ref. to how typed arrays speed up pixel manipulation
            imageBuffer = new ArrayBuffer( imageData.data.length);
            imageBuffer8 = new Uint8ClampedArray( imageBuffer);
            imageBuffer32 = new Uint32Array( imageBuffer);
            //Caluclate normal map
            this.calculateNormals();
            this.calculateBumpMap(); 
        }
        this.calculateNormals = function() {
            var w = 20; //bevel width
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    //Calculate normal N by Ui x Uv cross product
                    //See README.md for ref.
                    var Ui = convolve( x, y, 'x');
                    var Uv = convolve( x, y, 'y');
                    var N = normalize([-Ui, -Uv, 6*255 / w]);
                    imageNormal[x + y * width] = N;
                }
            }
        };
        this.calculateBumpMap = function calculateBumpMap( ) {
            //imageBuffer = new ArrayBuffer( imageData.data.length);
            //var imageData = imgH.createImageData( imgH.getImageimageHandle);
            //var ang = -Math.atan2(300-mouseH.y, 400-mouseH.x);
            //console.log(ang+"   "+mouseH.y+" "+mouseH.x);
            //var mx = Math.cos(ang);
            //var my = Math.sin(ang);
            var mx = mouseH.x;
            var my = mouseH.y;
            if (lightX == mx && lightY == my) //skip calculations if already calculated
                return;
            lightX = mx;
            lightY = my;
            //Calculate intensity at each pixel
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    var L = normalize([ lightX-x, lightY-y,10]);
                    var N = imageNormal[ x + y*width];
                    var i = Math.max(0,dot( N, L) );
                    i = i * 44.0 / (4 + Math.sqrt( (mx-x)*(mx-x) + (my-y)*(my-y))) + 0.1;
                    var i = Math.min(i,1);
                    var r = imageData.data[( x + y*imageData.width)*4] * i;
                    var g = imageData.data[( x + y*imageData.width)*4+1] * i;
                    var b = imageData.data[( x + y*imageData.width)*4+2] * i;
                    //r &= 0xff; // clamp to 255
                    //g &= 0xff;
                    //b &= 0xff;
                    imageBuffer32[x + y*width] = 
                        (255 << 24) |
                        (b << 16)   |
                        (g << 8)    |
                         r;
                }
            }
            //Put calculations in outData
            outData.data.set( imageBuffer8);
        }
        this.render = function() {
            imgH.putImageData( outData, 0, 0);
        };
        //--- private of bumpHandler ---//
        //Calculates convolution at px py with kernel specified by k
        function convolve( px, py, k) {
            var kernel;
            if (k == 'x'){
                kernel =[[-1, 0, 1],
                        [ -1, 0, 1],
                        [ -1, 0, 1]];
            }else if(k == 'y') {
                kernel =[[-1, -1, -1],
                        [  0,  0,  0],
                        [  1,  1,  1]];
            }
            var w = kernel.length;
            var h = kernel[0].length;
            var sum = 0;
            //convolute
            for (var x = 0; x<w; x++) {
                for (var y = 0; y<h; y++) {
                    var rx = (Math.floor(px - w / 2) + x).mod(width);
                    var ry = (Math.floor(py - h / 2) + y).mod(height);
                    sum += imageData.data[ (rx + ry*imageData.width) * 4] * kernel[y][x]; 
                    if (rx == 10 && ry == 15)
                        sum += 0;
                }
            }
            return sum ;
        }
        var imageNormal = [];
        var width;
        var height;
        var imageData;
        var outData;
        var sourceImage;
        //Buffers
        var imageBuffer;
        var imageBuffer8;
        var imageBuffer32;
        // Light
        var lightX = 0;
        var lightY = 0;
        // Returns imageData for an image
        function getImgData( imgHandle) {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = imgHandle.width;
            canvas.height = imgHandle.height;
            ctx.drawImage( imgHandle, 0, 0);
            var data = ctx.getImageData( 0, 0, imgHandle.width, imgHandle.height);
            //Needs to be cloned, otherwise only a reference
            //var result = ctx.createImageData( data);
            canvas.remove();
            return data;
        }
    }
	// screen properties
	var screenW;
	var screenH;
	/* constructor */
	var tiH = new flx.timer( 1000/60, run); // time Handler
	var viH = new flx.visuals(); // visual handler
	var keyH = new flx.keys();
	var mouseH = new flx.mouse();
	var imgH = new flx.image();
    var bumpH = new bumpHandler();
	function run(){
		viH.clear();
		tiH.update();
		for (var f = 0;f<tiH.updateFrames;f++){
            bumpH.calculateBumpMap();
        }
        render();
        viH.update();

	};
	function render() {
        //Draw bumpmap
        bumpH.render();
        //Draw FPS
        viH.setFillStyle( "white");
        viH.text( "FPS: "+tiH.fps, 0, 0);
	};
	
		

	//--- public of game---//	
	return {
		init: function(){
            viH.setFillStyle( "white");
            viH.text("Loading", viH.screenWidth()/2, viH.screenHeight()/2 );
            viH.update();
            imgH.loadImage('bg', './image.jpg');
			//screenW = viH.screenWidth();
			//screenH = viH.screenHeight();
            //Start timer
            var tiHhandle = tiH; 
            imgH.preLoad( function(){
                bumpH.init();
                tiH.start();
            });
			
		},
        screenExpand: viH.screenExpand,
        screenContract: viH.screenContract,
	}
}());

window.onload = GAME.init();
