//Initial variables and important task parameters.
//Add question block for age and gender if necessary.
//Take cued, uncued, ipso, etc. into account
//Modify grating task accordingly

var curr_data = {}
var current_trial = 0
var timeline = []
var practice_len = 6
var test_len = 100

timeline.push({
	type: 'fullscreen',
	fullscreen_mode: true
});

var instruct_block = {
	type: 'html-keyboard-response',
	stimulus: "<div class = 'centerbox'><p></p><p></p><p style='font-size:42px; margin-top:200px;'>Welcome to the Grating Task.</p><p></p><p style='font-size:42px;'>Press <strong>enter</strong> to begin.</p></div>",
	post_trial_gap: 0,
	choices: [13]
};

timeline.push(instruct_block)

var instruction = {
	data: {
		screen_id: 'instruction'
	},
	type: 'instructions',
	pages: [
		"<div style='text-align:left; margin-top: 80px; line-height:1.4; width:1100px; font-size:32px; color:white;'><p></p><p>In this experiment you will see four Gabor patches with striped gratings during each trial as shown below:" + 
		" </p><p></p><div class='img'><img src='grating_4.png' style='width:640px; height:360px;'></div>" +
		"<p>Each trial begins with a fixation stimulus (the + sign) on the screen. This is followed by the gratings. There may be a change in the angle of only one of the four gratings or they may be no change in angle at all. " +
		"You may or may not be cued to the direction of the grating whose angle has changed." +
		"Your task is to press the key corresponding to the direction of the grating in which the angle has changed, or the key corresponding to no change in angle." + 
		" It is important that you respond as quickly and accurately as possible. After reading the above instructions carefully, please press 'Next' to view the response keys to be pressed.</p>",

		"<div style='text-align:left; margin-top: 80px; line-height:1.4; width:1100px; font-size:32px; color:white;'><p></p><p>The response keys for the grating stimuli are as follows:" + 
		"<ul><li>Change in the angle of the top-left grating: <strong>'R' key</strong></li>" +
		"<li>Change in the angle of the top-right grating: <strong>'I' key</strong></li>" +
		"<li>Change in the angle of the bottom-left grating: <strong>'C' key</strong></li>" +
		"<li>Change in the angle of the bottom-right grating: <strong>'M' key</strong></li>" +
		"<li>No change in the angle of any of the gratings: <strong>'G' key or 'H' key</strong></li></ul>" +
		"<p></p><p>Place your fingers over the response keys comfortably to ensure quick responses from your side.</p>" +
		"<p><strong>Keep your attention fixed on the fixation cross (+ sign) at all times during the experiment.</strong></p>" +
		"<p>It's time for some practice trials. Get ready.<p></div>"
	],
	show_clickable_nav: true,
	post_trial_gap: 2000
};
timeline.push(instruction)

var fixation_block = {
	type: 'html-keyboard-response',
	stimulus: '<div class = "centerbox"><div class = "fixation">+</div></div>',
	choices: jsPsych.NO_KEYS,
	trial_duration: 500,
	post_trial_gap: 0,
	data: {
		screen_id: 'fixation'
	}
};

var showstim_block = {
	type: 'shank-html-keyboard-response',
	stimulus: showStim,
	trial_duration: function () {
        return jsPsych.randomization.sampleWithReplacement([800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400],1)[0];
	},
	is_html: true,
	data: {
		screen_id: "showstim"
	},
	choices: jsPsych.NO_KEYS,
	post_trial_gap: 0
};

var fixation_block2 = {
	type: 'html-keyboard-response',
	stimulus: '<div class = "centerbox"><div class = "fixation">+</div></div>',
	choices: jsPsych.NO_KEYS,
	trial_duration: 100,
	data: {
		screen_id: 'fixation'
	}
};

var getstim_block = {
	type: 'shank-html-keyboard-response',
	stimulus: getStim,
	response_ends_trial: true,
	is_html: true,
	data: {
		screen_id: "getstim"
	},
	choices: [82, 73, 67, 77, 72, 71],
	post_trial_gap: 200,
	on_finish: function(data) {
		afterTrialUpdate(data)
	}
};

var getstim_block_prac = {
	type: 'shank-html-keyboard-response',
	stimulus: getStim,
	response_ends_trial: true,
	is_html: true,
	data: {
		screen_id: "getstim_prac"
	},
	choices: [82, 73, 67, 77, 72, 71],
	post_trial_gap: 200,
	on_finish: function(data) {
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
		console.log(curr_data)
	}
};

var feedback= {
	type: 'html-keyboard-response',
	stimulus: function() {
		if(curr_data.correct) {
			return 	'<p style="font-size:60px;">Correct!</p>'
		} else {
			return '<p style="font-size:60px;">Incorrect</p>'
		}
	},
	choices: jsPsych.NO_KEYS,
	trial_duration: 500,
	data: {
		screen_id: 'feedback'
	},
	on_finish: function() {
		curr_data = {}
	}
};

//Trial block order:
// 1. fixation_block
// 2. showstim_block
// 3. fixation_block2
// 4. getstim_block (200 ms)
// 5. Get response

for(var i = 0; i < practice_len; i++) {
	timeline.push(fixation_block)
	timeline.push(showstim_block)
	timeline.push(fixation_block2)
	timeline.push(getstim_block_prac)
	timeline.push(feedback)
}

var readyfortest = {
	data: {
		screen_id: 'readyfortest'
	},
	type: 'html-keyboard-response',
	stimulus: "<div class = 'centerbox' style='height:600px;'><p></p><p></p><p style='font-size:42px; margin-top:200px;'>Get ready for the test.</p><p></p><p style='font-size:42px; margin-top: 10px;'>Press <strong>enter</strong> to begin.</p></div>",
	post_trial_gap: 2500,
	choices: [13]
};
timeline.push(readyfortest)

for(var i = 0; i < test_len; i++) {
	timeline.push(fixation_block)
	timeline.push(showstim_block)
	timeline.push(fixation_block2)
	timeline.push(getstim_block)
}

timeline.push(post_task_block)
timeline.push(end_block)
