/*  
    FLOX.js a barebones javascript library mainly for game developers
    22.1.2015 v010 - Developed by P.R.
    MIT license

    Work in Progress
*/

//----- Namespace ----//
if (typeof flox == 'undefined')
	flox = {};
if (typeof flox.namespace == 'undefined')
	flox.namespace = {};

(function() { //starts namepsace
//----- private ------//
	//----- variables ----//
	var updateFunction = undefined;
	var display = {
		canvas: undefined,
		ctx: undefined,
		width: 0,
		height: 0,
        originalWidth: 0,
        originalHeight: 0,
		inited: false,
        // helloWorld colors the screen black
		helloWorld:function(){
			try{
				display.ctx.rect(0,0,display.width,display.height);
				display.ctx.fillStyle = 'black';
				display.ctx.fill();
			}catch (e){
				console.error(e.message);
			}
		},
		init: function( canvasId, width, height){
			display.canvas = document.getElementById(canvasId);
			if (display.canvas == undefined)
				return false;
			display.ctx = display.canvas.getContext('2d');
            //Disable smoothing
            display.ctx.imageSmoothingEnabled = false;
            display.ctx.mozImageSmoothingEnabled = false;
            display.ctx.webkitImageSmoothingEnabled = false;

			display.canvas.width = width; // this sets pixel amount to correct
			display.canvas.height = height; // no blurring
			display.width = display.canvas.width;
			display.height = display.canvas.height;
			display.originalWidth = display.canvas.width;
			display.originalHeight = display.canvas.height;
			display.inited = true;
			display.helloWorld();
		},
        resize: function( width, height) {
			//display.canvas.width = width; // this sets pixel amount to correct
			//display.canvas.height = height; // no blurring
			display.width = display.canvas.width;
			display.height = display.canvas.height;
        },
        resizeToOriginal: function() {
			display.canvas.width = display.originalWidth
			display.canvas.height = display.originalHeight;
			display.width = display.canvas.width;
			display.height = display.canvas.height;
		}
	}
    var requestHandler = function( ) { //EXTRA: pass argument? i removed "timestamp"-argument because it seems to consuem resources
		requestAnimationFrame( requestHandler);
		updateFunction.call();
	}

	
	//----- classes ------//
//----- public -------//
	//----- variables ----//
	//----- functions ----//
	this.init = function( canvasId, width, height){
		display.init( canvasId, width, height);
		return true;
	}
	//----- classes ------//
	//time Handler
	this.timer = function( origFPS, newUpdateFunction){
		//PUBLIC
		this.logicFrames = 0;
		this.runTimer = 0;
		this.intervalId = undefined;
		this.requestId = undefined;
		this.intervallId = undefined;
		this.FPS = 0;
		this.logicFPS = 0;
		//PRIVATE
		updateFunction = newUpdateFunction;
		var timeNow = 0;
		var timeLast = 0;//performance.navigationStart;
		var tLogic = 0;
		var tRender = 0;
		var tPassed = 0;
		var runStart = new Date().getTime();
		var leftover = 0;
        var tCheckLogicFPS = 0;
        var tCheckRenderFPS = 0;
		var logicTotFrames = 0;
		var renderTotFrames = 0;
		var tLogicTotFrames = 1000;
		var tRenderTotFrames = 50;
        var tLogicAvg = 0;
        var tRenderAvg = 0;
        var targetFPS = origFPS
        var tLogicFrame = 1050 / targetFPS;
        var targetTimePerFrame = tLogicFrame;
		//METHODS
        //Logic end = start of render
		this.endLogicFrames = function() { 
			timeNow = performance.now();
            //Rendering can't really have any leftover frames
			tRender = timeNow - timeLast;
            renderTotFrames++; //One frame
            tRenderTotFrames += tRender;
            //Sample every 1000ms for performance and FPS
			if (timeNow > tCheckRenderFPS ){
                this.FPS = renderTotFrames; 
				tCheckRenderFPS = performance.now()+1000; //sample every 1000 ms
                tRenderAvg = tRenderTotFrames / renderTotFrames;
                renderTotFrames = 0;
                tRenderTotFrames = 0;
            }
        }
		this.getLogicFrames = function() {
            timeNow = performance.now();
            //if (typeof(leftover) == 'object')
            if (leftover == undefined)
				leftover = 0;
			tLogic = timeNow - timeLast - tRender;
			tPassed = timeNow - timeLast + leftover ;
            // How many frames should be calculated this pass?
			this.logicFrames = Math.floor(tPassed / tLogicFrame);
            if (this.logicFrames > targetFPS)
                this.logicFrames = targetFPS;
			//FPS
			logicTotFrames += this.logicFrames;
			tLogicTotFrames += tLogic;
			//LEFTOVER (due to fractional amoutn of frames to be calculated)
			leftover = tPassed - this.logicFrames*tLogicFrame;

            //Sample every 1000ms for fps and performance (could be improved)
			if (timeNow > tCheckLogicFPS ){
                this.logicFPS = logicTotFrames; 
                if (logicTotFrames != 0){
                    tLogicAvg = tLogicTotFrames / logicTotFrames;
                }else if( tLogicTotFrames == 0) {
                    tLogicTotFrames = 1000;
                }
                // Here comes the balancing act
                if (this.FPS < 5) {
                    targetFPS = Math.ceil(0.5*targetFPS);
                    tLogicFrame = (1000+tRenderAvg) / targetFPS;
                }else if (this.FPS < 30) {
                    targetFPS--;
                    tLogicFrame = (1000+tRenderAvg) / targetFPS;
                }else if (this.FPS > 60) {
                    targetFPS++;
                    tLogicFrame = (1000+tRenderAvg) / targetFPS;
                }else if (this.logicFPS < 45) {
                    targetFPS++;
                    tLogicFrame = (1000+tRenderAvg) / targetFPS;
                }
                /*}else if (this.FPS > 45) {
                    targetFPS++;
                    var tNew = (1000+tRenderAvg) / targetFPS;
                    tLogicFrame = 0.7 * tLogicFrame + (1.0-0.7) * tNew;
                }else if( this.FPS < 35){
                    targetFPS--;
                    var tNew = (1000+tRenderAvg) / targetFPS;
                    tLogicFrame = 0.7 * tLogicFrame + (1.0-0.7) * tNew;
                    //tLogicFrame = (1000+tRenderAvg) / targetFPS; //tLogic??
                //}else if( this.FPS < 38 ||this.FPS > 42){*/
                    //var tNew = (1000+tRenderAvg) / targetFPS;
                    //tLogicFrame = 0.7 * tLogicFrame + (1.0-0.7) * tNew;
                //}
                if (tLogicFrame < 5)
                    tLogicFrame = 5;
                //For next sample, reset framecounter
                logicTotFrames = 0;
                tLogicTotFrames = 0;
				tCheckLogicFPS = performance.now()+1000; //sample every 1000 ms
			}
                this.fpsTXT = this.FPS+"/"+this.logicFPS;
                //this.fpsTXT = this.FPS+"/"+this.logicFPS+" "+targetFPS+" t:"+tLogicAvg.toFixed(1)+"/"+tRenderAvg.toFixed(1)+" "+tLogicFrame.toFixed(2)+" --> "+this.logicFrames+" (leftover "+leftover.toFixed(2)+") "+(1000/tLogic).toFixed(2);
                //"+avgTimePerFrame.toFixed(3)+"/"+tLogicFrame.toFixed(3)+" L:"+leftover.toFixed(3)+" ("+Math.ceil(1000/tLogic)+") tR:"+tRender.toFixed(2)+"-->"+this.logicFrames;
			timeLast = performance.now();
		}
		
		this.start = function() {
			timeLast = performance.now();
			this.requestId = requestAnimationFrame( requestHandler);
		}
	}
	//visual Handler
	this.visuals = function() {
		this.update = function(){

		};
		this.clear = function() {
			display.ctx.clearRect( 0, 0, display.width, display.height);
		};
		this.circle = function( x, y, radius, centered) {
			if (centered == undefined || centered == false){
				x -= radius;
				y -= radius;
			}
			display.ctx.beginPath();
			display.ctx.arc( x, y, radius, 0, 2 * Math.PI);
			display.ctx.fill();
		};
		this.polygon = function( vertexArray) {
			if (vertexArray.length <3)
				return;
			
			display.ctx.beginPath();
			display.ctx.moveTo(vertexArray[0][0], vertexArray[0][1]);
			for (var i=1; i<vertexArray.length; i++){
				display.ctx.lineTo(vertexArray[i][0], vertexArray[i][1]);
			
			}
			
			display.ctx.closePath();
			display.ctx.fill();
		}
		this.line = function ( x1, y1, x2, y2) {
			display.ctx.beginPath();
			display.ctx.moveTo( x1, y1);
			display.ctx.lineTo(x2,y2);
			display.ctx.stroke();
		};
		this.setFillStyle = function( fillstyle){
			display.ctx.fillStyle = fillstyle;
		};
        this.setStrokeStyle = function( strokestyle){
			display.ctx.strokeStyle = strokestyle;
		};
		this.setFont = function( font){
			display.ctx.font = font;
		};
        this.text = function( text, x, y) {
            display.ctx.fillText( text, x, y+15);
        };
		this.debugText = function( x, y, text) {
			display.ctx.font = 'bold 14px Arial';
			display.ctx.strokeStyle = 'black';
			display.ctx.fillStyle = 'white';
			display.ctx.lineWidth = 2;
			text = text.split("\n");
			for (n in text){
				line = text[n];
				display.ctx.strokeText(line, x, y+15*n);
				display.ctx.fillText(line, x, y+15*n);
			}
		};
        //CANVAS MANIPULATIOn
        this.scale = function( x, y) {
            //display.ctx.scale( x,y);
            display.ctx.drawImage( display.canvas, 0, 0, 2*display.width, 2*display.height);
        }

		this.screenWidth = function(){return display.width;};
		this.screenHeight = function(){return display.height;};
        this.screenExpand = function() { display.resize(window.screen.width, window.screen.height)};
        this.screenContract = function() { display.resizeToOriginal()};
	}
	//image Handler
    this.image = function(){
        //PUBLIC
        this.image = [];
        this.loaded = true;
        //PRIVATE
        var imagesLoaded = 0;
        var imagesToLoad = 0;
        //METHODS
        this.loadImage = function( key, source) {
            this.image[key] = new Image();
            imagesToLoad++;
            this.image[key].onload = function(){ imagesLoaded++;this.loaded = true;}.bind(this);
            this.image[key].onerror = function(){ console.log("FLOX: unable to load "+source);};
            this.image[key].src = source;
            this.loaded = false;
        }.bind(this);
        this.preLoad = function( callBack) {
            var loadStart = new Date().getTime();
            var imageHandle = this;
            var loadInterval = setInterval( function() {
                timeNow = new Date().getTime();
                if (imageHandle.loaded == true){
                    clearInterval( loadInterval);
                    callBack();
                }else if (timeNow - loadStart > 4000){
                    clearInterval( loadInterval);
                    console.log("FLOX: unable to load images");
                }
            }, 200);
        };
        //IMAGE DRAWING
        this.drawImage = function( key, x, y){
            display.ctx.drawImage(this.image[key], x, y);
        };
        this.drawImageFrame = function( key, x, y, framew, frameh, frame) {
			display.ctx.drawImage(this.image[key],  framew * frame, 0,framew,frameh,x,y,framew,frameh);

        }
		this.drawImageStretch = function ( key, x, y, w, h) {
			display.ctx.drawImage(this.image[key], 0, 0, this.image[key].width, this.image[key].height, x,y, w, h);
		};
        this.putImageData = function( imageData, x, y, target) {
            display.ctx.putImageData( imageData, x, y);
        }
        /*this.createImageData = function( imageDataOrWidth, height) {
            if ( height == undefined) {
                return display.ctx.createImageData( imageDataOrWidth);
            }else {
                return display.ctx.createImageData( imageDataOrWidth, height);
            }
        }*/

    }
	//obj Handler
	/*this.objects = function() {
		var objectAmount = 0;
		
	}*/
	//input Handler
	this.input = function(){
		var accX = 0;
		var accY = 0;
		var accZ = 0;
		this.isDEM = window.ondevicemotion != undefined;
		this.listenDEM = function(){ // listen devide motion
			window.ondevicemotion = handleDEM;		
		};
		function handleDEM( event){ //DEM = device motion
			debvar('event',true);
			accX = event.accelerationIncludingGravity.x;
			accY = event.accelerationIncludingGravity.y;
			accZ = event.accelerationIncludingGravity.z;
		}
		this.getAcc = function( axis){
			if (axis == 0)
				return accX;
			if (axis == 1)
				return accY;
			if (axis == 3)
				return accZ;
		}
	}
    this.mouse = function() {
        this.x = 0;
        this.y = 0;
        var hasMoved = false;
        this.hasMoved = function() {
            if (hasMoved){
                hasMoved = false;
                return true;
            }
            return false;
        };
        /*this.bindMove = function( moveCallback) {
            if (moveCallback !== undefined)
                display.canvas.addEventListener("mousemove", moveCallback, false);
        };*/
        function mouseMove(event) {
            this.x = event.clientX + document.body.scrollLeft;
            this.y = event.clientY + document.body.scrollTop;
            this.x -= display.canvas.offsetLeft;
            this.y -= display.canvas.offsetTop;
            hasMoved = true;
        }
        //Constructor
        display.canvas.addEventListener("mousemove", mouseMove.bind(this), false);
    }
    this.keys = function() {
        //INPUT FOR KEYS
        var _pressed= {};
        var _released= {};
        var _pressTime= {};
        this.LEFT = 37;
        this.UP = 38;
        this.RIGHT = 39;
        this.DOWN = 40;
        this.SPACE = 32;

        this.keyDown = function(keyCode) {
			if (_pressed[keyCode] != undefined)
				return _pressed[keyCode];
			else
				return false;
        };
        this.keyUp = function(keyCode) {
			if (_released[keyCode] != undefined)
				return _released[keyCode];
			else
				return false;
        };
        this.onKeydown = function(event) {
            if (_pressed[event.keyCode] != true)
                _pressTime[event.keyCode] = performance.now();
            _pressed[event.keyCode] = true;
        };

        this.onKeyup = function(event) {
            _released[event.keyCode] = true;
            _pressTime[event.keyCode] = 0;
            delete _pressed[event.keyCode];
        };
        this.flush = function() {
            _released = {};
        };
        this.downTime = function(keyCode){
            if (_pressTime[keyCode] == 0)
                return 0;
            else
                return performance.now() - _pressTime[keyCode] 
        };
        this.lastTime = function( keyCode){
            if (_pressTime[keyCode] == NaN)
                _pressTime[keyCode] = 0;
            return (new Date().getTime())-_pressTime[keyCode];
        }
        var keyEventListener = this;
        window.addEventListener('keyup', function(event) { keyEventListener.onKeyup(event); }, false);
        window.addEventListener('keydown', function(event) { keyEventListener.onKeydown(event); }, false);
    };
}).call(flox.namespace); // bind this to flx.namespace
