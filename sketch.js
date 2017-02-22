// This is the URL of our message-passing server
var SOCKET_URL = 'wss://fierce-plains-17880.herokuapp.com/';

// This is a special code word unique to your project.
// You must get this from an instructor!
var CODE_WORD  = 'kale';

// The socket is how you send/receive messages.
var socket;

// --------------------------------------------------------------------
var resources = {};
var res_names = ['v_bg','h_bg','lf1','lf2','lf3','t1','t2','t3','t4','ft1','ft2','ft3','ft4','snow','m1','m2','m3'];

var deviceMode; // horizontal or vertinal
var num_leafs; // number of leafs that fall when shaked

var leafs_fall_toggle = false;
var leafs = [];

var snows = [];

var turtle_move_toggle = false;
var turtle;
var turtle_dir = "l";

var moon_toggle = false;
var moon;

var siri;


class Leaf {
  constructor(){
    this.typeID = Math.floor((Math.random() * 3) + 1); // randomly choose from three types of leaf
    this.typeName = "lf"+this.typeID;
    this.x = Math.floor((Math.random() * windowWidth) + 1);
    this.y = Math.floor((Math.random() * windowHeight) + 1);
    this.degree = (Math.random() * 360) + 1; // init rotation degree
    this.width = (Math.random() * 35) + 25;
    this.height = (Math.random() * 35) + 25;

    this.timeCounter = 0; // this is the frame counter for the animation
    this.speed = (Math.random() * 3) + 1; // the speed of falling
  }

  reset(){
    // used to reset the position and rotation of the leaf
    this.x = Math.floor((Math.random() * windowWidth) + 1);
    this.y = Math.floor((Math.random() * windowHeight) + 1);
    this.degree = (Math.random() * 360) + 1; // init rotation degree

    this.timeCounter = 0; // this is the frame counter for the animation
  }

  display(canvas_h){
    rotate(2*PI/this.degree);
    var shifty = this.speed*this.timeCounter; // distance the leaf falls in y axis
    var newy = (this.y+shifty)%canvas_h;
    image(resources[this.typeName],this.x,newy,this.width,this.height);
    this.timeCounter++;
  }

}

class Snow {
  constructor(){
    this.typeName = "snow";
    this.x = Math.floor((Math.random() * windowWidth) + 1);
    this.y = Math.floor((Math.random() * windowHeight) + 1);
    this.degree = (Math.random() * 360) + 1; // init rotation degree
    this.width = (Math.random() * 15) + 10;
    this.height = (Math.random() * 15) + 10;

    this.timeCounter = 0; // this is the frame counter for the animation
    this.speed = (Math.random() * 3) + 1; // the speed of falling
  }

  reset(){
    // used to reset the position and rotation of the leaf
    this.x = Math.floor((Math.random() * windowWidth) + 1);
    this.y = Math.floor((Math.random() * windowHeight) + 1);
    this.degree = (Math.random() * 360) + 1; // init rotation degree

    this.timeCounter = 0; // this is the frame counter for the animation
  }

  display(canvas_h){
    rotate(2*PI/this.degree);
    var shifty = this.speed*this.timeCounter; // distance the leaf falls in y axis
    var newy = (this.y+shifty)%canvas_h;
    image(resources[this.typeName],this.x,newy,this.width,this.height);
    this.timeCounter++;
  }

}


class Moon {
  constructor(x,y){
    this.x = x;
    this.y = y;
    this.timeCounter = 0;
  }

  display(){
    var id = 1+Math.floor(this.timeCounter/30)%3;
    image(resources['m'+id],this.x,this.y,110,110);
    if (moon_toggle){
      this.timeCounter++;
    }
  }

}


class Turtle {
  constructor(x,y){
    this.timeCounter = 0; // animation frame
    this.x = x;
    this.y = y;
  }

  display(max_x_distance){
    
    var animiIndex = 1+Math.floor(this.timeCounter/10)%4;
    var shiftx_raw = (this.timeCounter%max_x_distance-max_x_distance/2);
    var shiftx = abs(shiftx_raw);// movement along x axis

    resetMatrix();
    var pref;
    var current_dir;
    if (shiftx_raw>0){
      pref = "t"; // right
      current_dir = "right";
    }else{
      pref = "ft"; // left
      current_dir = "left";
    }
    image(resources[pref+animiIndex],this.x+shiftx ,this.y,200,200);
    if (turtle_move_toggle && turtle_dir===current_dir){
      this.timeCounter++;
    }

  }
}



// --------------------------------------------------------------------

function setup() {
  setShakeThreshold(15);

  createCanvas(windowWidth, windowHeight);
  socket = io(SOCKET_URL + CODE_WORD);

  // To perform accelerometer sensing, you need to emit a message named "sense"
  // with an object payload. The keys of this object should correspond to which
  // acceleration events you wish to listen for.
  // The supported event types are deviceMoved, deviceShaken, deviceTurned.
  // For example:
  socket.emit('sense', {deviceShaken: true, deviceMoved: true});

  // Next, register corresponding event handlers.
  socket.on('deviceShaken', deviceShaken);

  // Finally, if you wish to set the move or shake threshold, simply emit it
  // as a message. The defaults correspond to p5js' defaults:
  // a shakeThreshold of 30, and moveThreshold of 0.5
  socket.emit('shakeThreshold', 100);
  socket.emit('moveThreshold', 0.75);

  // ---------------------------------------------------------------------
  // load resources
  for (i=0;i<res_names.length;i++){
    res_name = res_names[i];
    res_path = "assets/"+res_name+".png";
    resources[res_name] = loadImage(res_path);
    console.log("load resource ",res_path);
  }
  resources['sound'] = loadSound('assets/sound.mp4');

  // init global variables
  deviceMode = "h";
  num_leafs = 150;

  siri = new p5.SpeechRec();
  siri.continuous = true;
  // siri.interimResults = true;
  siri.onResult = parseResult;
  siri.start();
  


  for (i=0;i<num_leafs;i++){
    var lf = new Leaf();
    leafs.push(lf);

    var sn = new Snow();
    snows.push(sn);
  }
  turtle = new Turtle(windowWidth/2-100,windowHeight-200);
  moon = new Moon(windowWidth-100,50);

}

function draw() {
  if (deviceMode=="h"){
    image(resources["h_bg"],0,0,windowWidth,windowHeight);
  }else if (deviceMode=="v"){
    image(resources["v_bg"],0,0,windowWidth,windowHeight);
  }

  if (leafs_fall_toggle){
    if (deviceMode==="v"){
      for (i=0;i<leafs.length;i++){
        leafs[i].display(windowHeight);
      }
    }else{
      for (i=0;i<leafs.length;i++){
        snows[i].display(windowHeight);
      }
    }

  }

  turtle.display(windowWidth);
  moon.display();

}

// The acceleration data is then passed to your socket handlers. This data
// corresponds to p5js' acceleration data, so you can continue to use that
// as a reference. For example, data.deviceOrientation or data.acceleration.x
// are the same as the deviceOrientation and accelerationX variables in p5.
// function deviceShaken(data) {
//   console.log(data);
// }


// in dev mode, mouseClicked is an alias of deviceShaken()
function mouseClicked(){
  console.log("leafs will fall");
  if (!leafs_fall_toggle){
    for (i=0;i<leafs.length;i++){
      leafs[i].reset();
    }
  }
  leafs_fall_toggle = !leafs_fall_toggle;
  resources['sound'].setVolume(1);
  resources['sound'].play();
} 

// in dev mode, keyPressed is to simulate deviceTurned()
// deviceMoved()
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    deviceMode = "h";
  } else if (keyCode === RIGHT_ARROW) {
    deviceMode = "v";
  } 
  if (keyCode === DOWN_ARROW){
    turtle_move_toggle = true;
  }
}


function keyReleased() {
  turtle_move_toggle = false;
}

function deviceTurned(data){
  if (deviceMode==="v"){
    deviceMode = "h";
  }else{
    deviceMode = "v";
  }
  leafs_fall_toggle = false;
}


function deviceShaken(){
  if (!leafs_fall_toggle){
    for (i=0;i<leafs.length;i++){
      leafs[i].reset();
    }
  }
  leafs_fall_toggle = true;
  resources['sound'].setVolume(1);
  resources['sound'].play();
}

function parseResult()
//https://github.com/IDMNYU/p5.js-speech/blob/master/examples/05continuousrecognition.html
{
  // recognition system will often append words into phrases.
  // so hack here is to only use the last word:
  var mostrecentword = siri.resultString.split(' ').pop();
  if(mostrecentword.indexOf("left")!==-1) {
    turtle_move_toggle = true;
    turtle_dir = "left";
  }
  else if(mostrecentword.indexOf("right")!==-1) { 
    turtle_move_toggle = true;
    turtle_dir = "right";
  }
  //
  else if(mostrecentword.indexOf("moon")!==-1) { 
    moon_toggle = true;
  }
  else if(mostrecentword.indexOf("Moen")!==-1) { 
    moon_toggle = true;
  }
  else if(mostrecentword.indexOf("ruin")!==-1) { 
    moon_toggle = true;
  }
  //
  else if(mostrecentword.indexOf("Stop")!==-1) { 
    turtle_move_toggle = false;
    moon_toggle = false;
    turtle_dir = "right";
  }
  // else if(mostrecentword.indexOf("up")!==-1) { dx=0;dy=-1; }
  // else if(mostrecentword.indexOf("down")!==-1) { dx=0;dy=1; }
  // else if(mostrecentword.indexOf("clear")!==-1) { background(255); }
  console.log(mostrecentword);
}