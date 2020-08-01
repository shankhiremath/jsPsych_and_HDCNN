/**
 * Function to make array starting at low,
 * going to high, stepping by step.
 * Note: the last element is not "high" but high-step
 * @param {Number} low The low bound of the array
 * @param {Number} step the step between two elements of the array
 * @param {Number} high the high bound of the array
 */

function MakeArray(low, step, high) {
	if (step === undefined) {
		step = 1;
	}
	var size = 0
	var array = []
	if (low < high) {
		size = Math.floor((high - low) / step);
		array = new Array(size);
		array[0] = low;
		for (var i = 1; i < array.length; i++) {
			array[i] = array[i - 1] + step;
		}
		return array;
	} else if (low > high) {
		size = Math.floor((low - high) / step);
		array = new Array(size);
		array[0] = low;
		for (var j = 1; j < array.length; j++) {
			array[j] = array[j - 1] - step;
		}
		return array;
	}
	return [low];
}

/**
 * Make a sinusoidal grating. Create a texture that later needs 
 * to be used with CreateTexture. 
 * Note: 0 deg means horizontal grating. 
 * If you want to ramp the grating with 
 * 2D Gaussian, also call function MakeGaussian and average the 
 * results of both functions
 * @param {Number} width: in pixels
 * @param {Number} height: in pixels
 * @param {Number} sf: spatial frequency in number of cycles per degree of visual angle
 * @param {Number} angle: in degrees (of the grating)
 * @param {Number} phase: in degrees (of the sinusoidal waves)
 * @param {Number} pixPerDeg: pixels per degree of visual angle 
 */

function MakeGrating(width, height, sf, angle, phase, pixPerDeg) {

	sfPerPix = sf / pixPerDeg;
	angleInRad = ((angle + 0) * Math.PI) / 180;
	phaseInRad = (phase * Math.PI) * 180;

	// Get x and y coordinates for 2D grating
	xStep = 2 * Math.PI / width;
	yStep = 2 * Math.PI / height;
	x = MakeArray(-Math.PI, xStep, Math.PI + 1);
	y = MakeArray(-Math.PI, yStep, Math.PI + 1);

	// To tilt the 2D grating, we need tilting constants to tilt x and y coordinates.
	xTilt = Math.cos(angleInRad) * sf * 2 * Math.PI;
	yTilt = Math.sin(angleInRad) * sf * 2 * Math.PI;

	//What is width and height? Are these in degrees of visual angle or pixels?
	//See how lines2d and dots work. For example, FillRect(x, y, size, color) uses size in pixels

	//How to compute size in degress of visual angle
	var ixX, ixY; // x and y indices for arrays
	var grating = []; // 2D array
	for (ixX = 0; ixX < x.length; ixX++) {
		currentY = y[ixY];
		grating[ixX] = [];
		for (ixY = 0; ixY < y.length; ixY++) {
			grating[ixX][ixY] = Math.cos(x[ixX] * xTilt + y[ixY] * yTilt);
			grating[ixX][ixY] = Math.round(((grating[ixX][ixY] + 1) / 2) * 255);
		}
	}
	return (grating);
}

function Canvas(id, back_id) {
	this.canvas = document.getElementById(id);
	this.context = this.canvas.getContext("2d"); // main on-screen context
	this.backCanvas = document.getElementById(back_id);
	this.backCtx = this.backCanvas.getContext("2d");
	this.height = $("#canvas").height(); // height of screen
	this.width = $("#canvas").width(); // width of screen
	this.canvas.height = 300
	this.canvas.width = 300
	this.backCtx.height = 300
	this.backCtx.width = 300
}

function CreateTexture(canvas, array, mask, contrast) {

	/* Note on how imageData's work.
	* ImageDatas are returned from createImageData,
	* they have an array called data. The data array is
	* a 1D array with 4 slots per pixel, R,G,B,Alpha. A
	* greyscale texture is created by making all RGB values
	* equals and Alpha = 255. The main job of this function
	* is to translate the given array into this data array.
	*/
	if (!$.isArray(array)) {
		return;
	}
	var image;

	// 2D array passed in
	image = canvas.backCtx.createImageData(array.length, array.length);
	var row = 0;
	var col = 0;
	for (var i = 0; i < image.data.length; i += 4) {
		mask_val = mask[row][col]
		ran_val = Math.random() * 255
		image.data[i + 0] = ran_val * (1 - contrast) + array[row][col] * contrast;
		image.data[i + 1] = ran_val * (1 - contrast) + array[row][col] * contrast;
		image.data[i + 2] = ran_val * (1 - contrast) + array[row][col] * contrast;
		image.data[i + 3] = mask_val;
		col++;
		if (col == array[row].length) {
			col = 0;
			row++;
		}
	}
	return image;
}

function twoDGaussian(amplitude, x0, y0, sigmaX, sigmaY, x, y) {
	var exponent = -((Math.pow(x - x0, 2) / (2 * Math.pow(sigmaX, 2))) + (Math.pow(y - y0, 2) / (2 *
		Math.pow(sigmaY, 2))));
	return amplitude * Math.pow(Math.E, exponent);
}

function make2dMask(arr, amp, s) {
	var midX = Math.floor(arr.length / 2)
	var midY = Math.floor(arr[0].length / 2)
	var mask = []
	for (var i = 0; i < arr.length; i++) {
		var col = []
		for (var j = 0; j < arr[0].length; j++) {
			col.push(twoDGaussian(amp * 255, midX, midY, s, s, i, j))
		}
		mask.push(col)
	}
	return mask
}

function applyCircleMask(arr) {
	var masked_arr = arr
	x = arr.length
	y = arr[0].length
	x_center = Math.floor(x / 2)
	y_center = Math.floor(y / 2)
	for (var i = 0; i < x; i++) {
		var col = []
		for (var j = 0; j < y; j++) {
			if(Math.pow((x_center - i), 2) + Math.pow((y_center - j), 2) > Math.pow(x_center, 2)) {
				masked_arr[i][j] = 8
			}
		}
	}
	return masked_arr
}

function makeStim(canvas, backcanvas, angle, contrast) {
	var grating_canvas = new Canvas(canvas, backcanvas)
	var arr = MakeGrating(250, 250, 2, angle, 0, 0)
	var mask = make2dMask(arr, 1.2, 100)
	var mask_with_circle = applyCircleMask(mask)
	var drawing = CreateTexture(grating_canvas, arr, mask_with_circle, contrast)
	grating_canvas.context.putImageData(drawing, 0, 0)
}

var angle1 = Math.random() * 180
var angle2 = Math.random() * 180
var angle3 = Math.random() * 180
var angle4 = Math.random() * 180
var angles = [angle1, angle2, angle3, angle4]
var sides = ['topleft', 'topright', 'bottomright','bottomleft', 'none']

function showStim() {

	var cuenum = Math.floor(Math.random() * 5)
	var cuedirection = sides[cuenum]

	var stim = '<div class = "centerbox"><div class = "fixation">+</div></div>' +
		'<div class = "topleftbox"><canvas id = "canvas1" height="300px" width="300px"><canvas id = "backCanvas1" height="300px" width="300px"></canvas></canvas></div>' +
		'<div class = "toprightbox"><canvas id = "canvas2" height="300px" width="300px"><canvas id = "backCanvas2" height="300px" width="300px"></canvas></canvas></div>' +
		'<div class = "bottomrightbox"><canvas id = "canvas3" height="300px" width="300px"><canvas id = "backCanvas3" height="300px" width="300px"></canvas></canvas></div>' +
		'<div class = "bottomleftbox"><canvas id = "canvas4" height="300px" width="300px"><canvas id = "backCanvas4" height="300px" width="300px"></canvas></canvas></div>'
	
	var display_el = jsPsych.getDisplayElement()
	var newElement = document.createElement('div');
	newElement.setAttribute('id', 'jspsych-html-keyboard-response-stimulus');
	newElement.innerHTML = stim
	display_el.appendChild(newElement)
	contrast = 0.2

	makeStim('canvas1', 'backCanvas1', angles[0], contrast)
	makeStim('canvas2', 'backCanvas2', angles[1], contrast)
	makeStim('canvas3', 'backCanvas3', angles[2], contrast)
	makeStim('canvas4', 'backCanvas4', angles[3], contrast)

	setTimeout(function(){

		if(cuenum < 4) {
			var cuestim = '<div class = "' + cuedirection + 'cue"><img src = "cue.png" style="width:180px; height:180px;"></div>'
			var display_el = jsPsych.getDisplayElement()
			var cueElement = document.createElement('div');
			cueElement.setAttribute('id', 'cuestimulus');
			cueElement.innerHTML = cuestim
			display_el.appendChild(cueElement)
			curr_data.cue = true
			curr_data.cuedirection = cuedirection
		} else {
			var cuestim = '<div class = "topleftcue"><img src = "cue.png" style="width:180px; height:180px;"></div>' +
				'<div class = "toprightcue"><img src = "cue.png" style="width:180px; height:180px;"></div>' +
				'<div class = "bottomrightcue"><img src = "cue.png" style="width:180px; height:180px;"></div>' +
				'<div class = "bottomleftcue"><img src = "cue.png" style="width:180px; height:180px;"></div>'
			var display_el = jsPsych.getDisplayElement()
			var cueElement = document.createElement('div');
			cueElement.setAttribute('id', 'cuestimulus');
			cueElement.innerHTML = cuestim
			display_el.appendChild(cueElement)
			curr_data.cue = false
		}
		
	}, 200);
}

function getStim() {

	var stim = '<div class = "centerbox"><div class = "fixation">+</div></div>' +
		'<div class = "topleftbox"><canvas id = "canvas1" height="300px" width="300px"><canvas id = "backCanvas1" height="300px" width="300px"></canvas></canvas></div>' +
		'<div class = "toprightbox"><canvas id = "canvas2" height="300px" width="300px"><canvas id = "backCanvas2" height="300px" width="300px"></canvas></canvas></div>' +
		'<div class = "bottomrightbox"><canvas id = "canvas3" height="300px" width="300px"><canvas id = "backCanvas3" height="300px" width="300px"></canvas></canvas></div>' +
		'<div class = "bottomleftbox"><canvas id = "canvas4" height="300px" width="300px"><canvas id = "backCanvas4" height="300px" width="300px"></canvas></canvas></div>'
	var display_el = jsPsych.getDisplayElement()
	var newElement = document.createElement('div');
	newElement.setAttribute('id', 'jspsych-html-keyboard-response-stimulus');
	newElement.innerHTML = stim
	display_el.appendChild(newElement)
	contrast = 0.2

	//Check with sir if we need to impute a fixed probability to each index
	var randomIndex = Math.floor(Math.random() * 5)
	var oldangle = angles[randomIndex]

	if(randomIndex < 4) {
		while(true){
			angles[randomIndex] = Math.random() * 180
			if(Math.abs(angles[randomIndex] - oldangle) < 30){
				continue;
			} else{
				break;
			}
		}
	}
	
	//Change one of the angles:
	//REMEMBER TO INCORPORATE NO CHANGE IN ANGLE
	//angles[index] = new rand if not equal to temp or if the difference is 30deg or some other defined value (check this)
	//draw new stimuli using same old makeStim down below
	//Define correct response using appropriate dictionary between index and letters
	//JS Char Codes:
	//'r' is 82
	//'i' is 73
	//'c' is 67
	//'m' is 77
	//'g' is 71, 'h' is 72

	makeStim('canvas1', 'backCanvas1', angles[0], contrast)
	makeStim('canvas2', 'backCanvas2', angles[1], contrast)
	makeStim('canvas3', 'backCanvas3', angles[2], contrast)
	makeStim('canvas4', 'backCanvas4', angles[3], contrast)

	//Define dictionary
	curr_data[0] = 82
	curr_data[1] = 73
	curr_data[2] = 77
	curr_data[3] = 67
	curr_data[4] = 72
	
	curr_data.correct_direction = sides[randomIndex]
	curr_data.correct_response = curr_data[randomIndex]
	curr_data.angles = angles

	angle1 = Math.random() * 180
	angle2 = Math.random() * 180
	angle3 = Math.random() * 180
	angle4 = Math.random() * 180
	angles = [angle1, angle2, angle3, angle4]
}

var sides2num = {'topleft':82, 'topright':73, 'bottomleft':67, 'bottomright':77}
var left = [82, 67]
var	right = [73, 77]
var sides2table = {'cued':0, 'opp':1, 'ipsi':2, 'contra':3, 'none':4}

//Contingency table
var contingencytable = [];
for(var i=0; i<5; i++) {
    contingencytable[i] = [];
    for(var j=0; j<5; j++) {
        contingencytable[i][j] = 0;
    }
}

if(Object.seal) { 
	Object.seal(contingencytable);
	// now contingencytable is a fixed-size array with mutable entries
  }

function cueblock() {

	var options = [82, 73, 77, 67, 71, 72]
	var responseside = options.indexOf(curr_data.response)
	var changeside = options.indexOf(curr_data.correct_response)
	var cueside = options.indexOf(sides2num[curr_data.cuedirection])
	var rcondn = (left.includes(sides2num[curr_data.cuedirection]) && left.includes(curr_data.response)) || (right.includes(sides2num[curr_data.cuedirection]) && right.includes(curr_data.response))
	var response = 10
	var change = 10
	
	if(responseside == 4 || responseside == 5) {
		response = 4
	} else {
		if(rcondn) {
			if(Math.abs(cueside - responseside) == 0) {
				response = 0
			} else if (Math.abs(cueside - responseside) == 1 || Math.abs(cueside - responseside) == 3) {
				response = 2
			}
		} else {
			if(Math.abs(cueside - responseside) == 1) {
				response = 3
			} else if (Math.abs(cueside - responseside) == 2) {
				response = 1
			}
		}
	}

	var ccondn = (left.includes(sides2num[curr_data.cuedirection]) && left.includes(curr_data.correct_response)) || (right.includes(sides2num[curr_data.cuedirection]) && right.includes(curr_data.correct_response))
	if((changeside == 4) || (changeside == 5)) {
		change = 4
	} else {
		if(ccondn) {
			if(Math.abs(cueside - changeside) == 0) {
				change = 0
			} else if (Math.abs(cueside - changeside) == 1 || Math.abs(cueside - changeside) == 3) {
				change = 2
			}
		} else {
			if(Math.abs(cueside - changeside) == 1) {
				change = 3
			} else if (Math.abs(cueside - changeside) == 2) {
				change = 1
			}
		}
	}
	contingencytable[change][response] += 1
}

var afterTrialUpdate = function(data) {
	correct = false
	if (data.key_press == curr_data.correct_response) {
		correct = true
	}
	if (data.key_press == 71 && curr_data.correct_direction == 'none') {
		correct = true
		curr_data.correct_response = 71
	}
	curr_data.response = data.key_press
	curr_data.trial_num = current_trial
	curr_data.correct = correct

	if(curr_data.cue){
		cueblock()
	}
	jsPsych.data.addDataToLastTrial(curr_data)
	curr_data = {}
	current_trial = current_trial + 1
}

function assessPerformance() {

	var trials = jsPsych.data.get().filter({
		screen_id: 'getstim'
	});
	var correct_trials = trials.filter({
		correct: true
	});
	var accuracy = Math.round(correct_trials.count() / trials.count() * 100);
	var resultrt = Math.round(trials.select('rt').mean());
	var performance = {
		accuracy: accuracy,
		resultrt: resultrt
	}
	jsPsych.data.addDataToLastTrial({"performance": performance})
}

var post_task_block = {
	type: 'survey-text',
	data: {
		screen_id: "post_task_questions"
	},
	questions: [ {prompt: "<p>Kindly enter your age.</p>", rows: 2, columns: 60},
		{prompt: "<p>Please summarize what you were asked to do in this task.</p>", rows: 15, columns: 60},
		{prompt: "<p>Do you have any comments about this task?</p>", rows: 15, columns: 60}
	],	
	on_finish: assessPerformance
 };

var end_block = {
	type: 'html-keyboard-response',
	data: {
		screen_id: "end",
	},
	response_ends_trial: true,
	stimulus: "<div class = 'centerbox'><p></p><p></p><p style='font-size:42px; margin-top:200px;'>Thank you for completing the task!</p><p></p><p style='font-size:42px; width:800px;'>Press <strong>enter</strong> to complete the experiment.</p></div>",
	cont_key: [13],
	post_trial_gap: 0,
};
