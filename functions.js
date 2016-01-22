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
    var len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    len = 1 / len;
    var result = [];
    result[0] = v[0] * len;
    result[1] = v[1] * len;
    result[2] = v[2] * len;
    return result;
}
// Uses a herper variable to minimize garbage
function normalize2( v, dest) {
    var len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    len = 1 / len;
    dest[0] = v[0] * len;
    dest[1] = v[1] * len;
    dest[2] = v[2] * len;
    return dest;
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
            //Calculate light angle lookup table (LUT)
            var lightX = width;
            var lightY = height;
            var lightX2 = width;
            var lightY2 = height;
            for (var y = 0; y < height*2; y++) {
                for (var x = 0; x < width*2; x++) {
                    var L = [0,0,0,0];
                    normalize2([ lightX-x, lightY-y,10], L); //normalize and store in L
                    //distance falloff stored as 4th parameter (neat)
                    //0.1 is ambient component
                    L[3] = Math.min(1,0.1 + 84.0 / (4 + 2* Math.sqrt( (lightX-x)*(lightX-x) + (lightY-y)*(lightY-y))));
                    //Light-normal calculation
                    if (lightLUT[y] == undefined)
                        lightLUT[y] = [];
                    lightLUT[y][x] = L;
                }
            }
            //Caluclate normal map
            this.calculateNormals();
            this.calculateBumpMap(); 
        }
        this.calculateNormals = function() {
            var w = 20; //bevel width
            var T = [0,0,0];
            var Ui, Uv;
            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    //Calculate normal N by Ui x Uv cross product
                    //See README.md for ref.
                    Ui = convolve( x, y, 'x');
                    Uv = convolve( x, y, 'y');
                    T = normalize([-Ui, -Uv, 6*255 / w] );
                    imageNormal[x + y * width] = T;
                }
            }
        };
        this.calculateBumpMap = function calculateBumpMap( ) {
            //Light Location
            //lightX = mouseH.x;
            //lightY = mouseH.y;
            var t = performance.now() / (2048);
            lightY = height/2+Math.sin(t)*height/4 + height/8*Math.cos(t/3+1);
            lightX = width/2+Math.sin(t*3)*width/4 + width/8*Math.cos(t*5);
            lightY2 = height/2+Math.sin(t*0.1+0.8)*height/4 + height/8*Math.cos(t/3.1);
            lightX2 = width/2+Math.sin(t*2+1.3)*width/4 + width/8*Math.cos(t*5);

            lightX = Math.max(0,Math.min( Math.round(lightX), width));
            lightY = Math.max(0,Math.min( Math.round(lightY), height));
            lightX2 = Math.max(0,Math.min( Math.round(lightX2), width));
            lightY2 = Math.max(0,Math.min( Math.round(lightY2), height));
            //Variables defined for GC optimiation
            var L=[0,0,0];//a temp stored outside for loop for GC optimization
            var L2=[0,0,0];//a temp stored outside for loop for GC optimization
            var i2;
            var r,g,b,i,x,y;
            var calcVec = [0,0,0]; 
            //Calculate intensity at each pixel
            //Optimization note: The condition x < width is more heavy to calculate than x != width.
            for (x = 0; x != width; ++x) {
                for (y = 0; y != height; ++y) {
                    L = lightLUT[height-lightY+y][width-lightX+x];
                    L2 = lightLUT[height-lightY2+y][width-lightX2+x];
                    //Light-normal calculation
                    i = Math.max(0,dot( imageNormal[ x + y*width], L) );
                    i2 = Math.max(0,dot( imageNormal[ x + y*width], L2) ) *L[3];
                    i *= L[3]; //using distance falloff intensity from LUT
                    //Store in rgb channels
                    r = imageData.data[( x + y*imageData.width)*4] * i;
                    g = imageData.data[( x + y*imageData.width)*4+1] * i2;
                    b = imageData.data[( x + y*imageData.width)*4+2] * i;
                    //r &= 0xff; // clamp to 255
                    //g &= 0xff;
                    //b &= 0xff;
                    //Write to buffer
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
            viH.scale(2,2);
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
                }
            }
            return sum ;
        }
        var imageNormal = [];
        var width;
        var height;
        var imageData;
        var imageData32;
        var outData;
        var sourceImage;
        //Buffers
        var imageBuffer;
        var imageBuffer8;
        var imageBuffer32;
        // Light
        var lightX = 0;
        var lightY = 0;
        var lightLUT = [];
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
	// Screen properties
	var screenW;
	var screenH;
	/* constructor */
	var tiH = new flx.timer( 60, run); // time Handler at 60 fps
	var viH = new flx.visuals(); // visual handler
	var keyH = new flx.keys();
	var mouseH = new flx.mouse();
	var imgH = new flx.image();
    var bumpH = new bumpHandler();
    // Main loop
	function run(){
		viH.clear();
		tiH.getLogicFrames();
		for (var f = 0;f<tiH.logicFrames;f++){
            bumpH.calculateBumpMap();
        }
		tiH.endLogicFrames();
        render();
        viH.update();
	};
	function render() {
        //Draw bumpmap
        bumpH.render();
        //Draw FPS
        viH.setFillStyle( "white");
        viH.text( "FPS: "+tiH.fpsTXT, 0, 0);
	};
	
		

	//--- public of game---//	
	return {
		init: function(){
            viH.setFillStyle( "white");
            viH.text("Loading", viH.screenWidth()/2, viH.screenHeight()/2 );
            viH.update();
            imgH.loadImage('bg', './t.jpg');
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
