// Get canvas context:
var canvas = document.getElementById('mycanvas');
var ctx = canvas.getContext("2d");

var action = 0;

// Image dimensions:
var image_width = 1917.0;
var image_height = 1183.0;
var factor = image_width/image_height;

// Choose best Map size:
var scale = 0.6;

var length = window.innerHeight;
var canvas_height = scale*length;
var canvas_width = scale*length*factor;
if (canvas_width>window.innerWidth) {
  canvas_width = window.innerWidth;
  length = canvas_width;
  canvas_height = canvas_width/factor;
}

// Coordinate system for world map:
var origin_x = scale*length*0.02;
var origin_y = scale*length*0.02;
var map_width = Math.round(canvas_width-2*origin_x);
var map_height = Math.round(canvas_height-2*origin_y);


// Load images:
var init_img = new Image();
var hook_img = new Image();
var bg_img = new Image();


// Slider date:
var slider_date_input = document.getElementById('slider_date');
var slider_date_value = slider_date_input.value;
var slider_hour_input = document.getElementById('slider_hour');
var slider_hour_value = slider_hour_input.value;

// Time value:
var start_date_input = document.getElementById('start_date');
var start_date = new Date(1986,04,28);
var end_date_input = document.getElementById('end_date');
var end_date = new Date(2016,04,28);
var current_date_input = document.getElementById('current_date');

// Time difference in hour:
var timediff = end_date.getTime() - start_date.getTime();

// Time for hook position:
var time = start_date; // millisecond

function Init(){
  // Set canvas dimensions:
  canvas.width = canvas_width;
  canvas.height = canvas_height;


  // Load images:
  bg_img.onload = function(){
    ctx.drawImage(bg_img, 0, 0,canvas_width,canvas_height);
  }
  bg_img.src = "moonhook_src/nice_map.jpg";

  hook_img.onload = function(){
    drawHook();
  }
  hook_img.src = "moonhook_src/hook.png";


  update_current_date();
  update();
};

function drawHook() {
  // Reset content of canvas:
  ctx.clearRect(0,0,canvas_width,canvas_height);
  // Redraw background image:
  ctx.drawImage(bg_img,0,0,canvas_width,canvas_height);
  // Calculate position on the map and pixel coordinates:
  var pos = position(time);
  var coord = coordinates(pos);
  // Add offset for hook picture:
  var h = scale*100;
  var w = scale*50;
  var x = coord[0] - w/2;
  var y = coord[1] -0.9*h;
  ctx.drawImage(hook_img,x,y,w,h);
};

function coordinates(pos) {
  // Calculate the pixel coordinates on the canvas
  // for positions given in latitude and longitude.
  // Latitude from -90 to +90.
  // Longitude from 0 to 360:
  var x = Math.round(origin_x + pos[0]/360*map_width);
  var y = Math.round(origin_y + 0.5*map_height -0.5*pos[1]/90*map_height);
  return [x,y];
};

function position(time) {
  // Calculate position of moon with given time:
  // Values for 01.01.1993;
  var long_0 = 73.2743157412555;  // degree
  var lat_0 = -6.25529; // degree
  var siderial_day = 23 +56.0/60 + 4.0/60/60; // hour
  var period_moon = 27.3216*24; // hour
  var t = time.getTime()/(1000*60*60);  // hour
  var ecc = 0.0549;
  // Calculate angle passed since 01.01.1993, i.e. the argument of pericenter
  // Inclination of moon path to equator:
  var inc = (23.44+5.145)/180*Math.PI;
  var t0 = -0.227726876319*24; // hour
  var omega_m = 2*Math.PI/period_moon; // hour^-1
  var omega_e = 2*Math.PI/siderial_day; // hour^-1
  var M = omega_m*(t+t0);
  var E = calc_eccentric_anomaly(M, ecc, M);
  var f = calc_true_anomaly(E, ecc);
  var lat = Math.asin(Math.sin(inc)*Math.sin(f))/Math.PI*180;
  var phi0 = long_0/180*Math.PI;
  // var phi = Math.atan(Math.sin(alpha)*tan((omega_m-omega_e)*t));
  var phi = phi0 - omega_e*t + Math.atan2(Math.cos(inc)*Math.sin(f), Math.cos(f))  ;
  var long = (phi%(2*Math.PI)/Math.PI*180+360)%360;
  return [long,lat];
};

// Caclulate the true anomaly from the eccentric anomaly.
function calc_true_anomaly(E, e){
	return 2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2), Math.sqrt(1-e)*Math.cos(E/2));
};

// Calculate the eccentric anomaly solving the equation
// M = E - e sin(E) using Newton-Halley method.
function calc_eccentric_anomaly(M, e, Eguess){
	E = Eguess;
	eps = 1e-14;
	f = fp = fpp = 1.0;
	// Repeat Newton-Halley step
	for (i=0; i<10; i++) {
		if (Math.abs(f)<eps) {
			break;
		}
		f = E - e*Math.sin(E) - M;
		fp = 1.0 - e*Math.cos(E);
		fpp = e*Math.sin(E);
		E = E - 2.0*f*fp/(2.0*fp*fp-fpp*f);
	}
	E = E % (2.0*Math.PI);
	return E;
};

function update() {
  update_time_diff();
  // update_hour_slider();
  // update_current_date();
  // update_date_slider();
  drawHook();
};

function update_current_date() {
  // Update the time display:
  // Slider values (time) range from 0 to 1.
  update_date(document.getElementById('current_date') ,time);
};

function update_date(element,d) {
  var year = d.getFullYear().toString();
  var month = (d.getMonth()+1).toString();
  month = (month.length < 2) ? "0" + month : month;
  var date = d.getDate().toString();
  date = (date.length < 2) ? "0" + date : date;
  element.value = year + "-" + month + "-" + date;
  update_time_diff();
}

function update_time_by_slider() {
  time = start_date().getTime() + slider_date_value*timediff + slider_hour_value*24*60*60*1000; // millisecond;
  time = new Date(start_date.getTime() + time);
};

function update_time_by_date(d) {
  time.setYear(d.getFullYear());
  time.setMonth(d.getMonth());
  time.setDate(d.getDate());
};

function update_time_diff() {
  timediff = end_date.getTime() - start_date.getTime(); // millisecond;
};

function update_date_slider() {
  slider_date_value = (time.getTime() - start_date.getTime())/timediff;
  // Check if slidervalue is smaller 0;
  if (slider_date_value < 0) slider_date_value = 0;
  // Check if slidervalue is greater 1. Then addjust end date:
  if (slider_date_value > 1) {
    end_date = time;
    update_date(end_date_input,end_date);
    slider_date_value = 1;
  }
  update_time_diff();
  slider_date_input.value = slider_date_value;
}

function update_hour_slider() {
  // Set to hour of the day:
  var x = (time.getHours()+time.getMinutes()/60+time.getSeconds()/60/60+time.getMilliseconds()/60/60/1000)/24;
  slider_hour_input.value = x;
}

// Event handlers:
function registerSliderEvents(elem,func) {
  elem.addEventListener('mousemove', func, false);
  // elem.addEventListener('mouseover', func, false);
  elem.addEventListener('mousedown', func, false);
  elem.addEventListener('mouseup', func, false);
  elem.addEventListener('change', func, false);
  elem.addEventListener('click', func, false);
}

registerSliderEvents(slider_date_input, slider_date_input_event);
function slider_date_input_event(e) {
  slider_date_value = e.target.value;
  time = new Date(start_date.getTime() + slider_date_value*timediff);
  update_hour_slider();
  update_current_date();
  update();
};

registerSliderEvents(slider_hour_input, slider_hour_input_event);
function slider_hour_input_event(e) {
  slider_hour_value = e.target.value;
  if (slider_hour_value <=1) {
    var x = slider_hour_value*24;
    var hours = x - x%24;
    var y = (x%24)*60;
    var minutes = y - y%60;
    var z = (y%60)*60;
    var seconds = z - z%60;
    var q = (z%60)*1000;
    var milliseconds = q - q%1000;
    time.setHours(hours);
    time.setMinutes(minutes);
    time.setSeconds(seconds);
    time.setMilliseconds(milliseconds);
    update_date_slider();
    update_current_date();
    update();
  }
};

start_date_input.addEventListener('input', function(e) {
  start_date = new Date(e.target.value);
  update();
}, false
);

end_date_input.addEventListener('input', function(e) {
  end_date = new Date(e.target.value);
  update();
}, false
);

current_date_input.addEventListener('input', function(e) {
  d = new Date(e.target.value);
  update_time_by_date(d);
  update_date_slider();
  update_hour_slider();
  update();
}, false
);

function for_mouse_enter(){
  // alert("bla");
  clearInterval(action);
    action = setInterval(function(){
      time = new Date(time.getTime()+1000*60*5);
      update_date_slider();
      update_hour_slider();
      update_current_date();
      update();
    }, 10);
};

function for_mouse_leave(){
  clearInterval(action);
};

canvas.addEventListener('mouseenter',for_mouse_enter,false);

canvas.addEventListener('mouseleave', for_mouse_leave,false);
