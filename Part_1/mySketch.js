// This is the code for the second part of the first project in mapping
// Done by the Hurricane Group: Brittany, Chelsea, Indrajeet and Jennifer

// clear console - there was some bug later on
console.clear();
//First - for convenience I shall make some classes like points and lines
// the class on points
class point{
    constructor(xpos, ypos, pressure){
        // This stores the basic xy position
        this.xpos = xpos;
        this.ypos = ypos;
        // this is the pressure variable
        this.pressure = pressure;
        // this stores the previous position values
        // at spawn this is the same
        this.prvXpos = 0;
        this.prvYpos = 0;
        // this stores the velocity
        // spawns with v = 0 (Seems resnonable)
        this.velocity = 0;
        // Direction --- ?? maybe we want to do something with this later?
        // stored as an angle w.r.t to the last point.
        this.direction = 0;
    }
}

// The class on lines i.e the path
class path{
    // zs are the time value
    // pressure are the pressure value
    constructor(xs, ys, zs, pressure){
        this.x = xs;
        this.y = ys;
        this.z = zs;
        this.pressure = pressure;
    }

    // plot the curve of the path
    DrawCurve() {
        noFill();
        beginShape();
        for (let i = 0; i < this.x.length; i++) {
            const xi = this.x[i];
            const yi = this.y[i];
            vertex(xi, yi);
        }
        endShape();
    }

    // query the current position
    GetCurrentXY(currentTime) {
        var i=this.z.findIndex(function(number) {
            return number > currentTime;
        });

        // This was a hellish off by one error
        // print(i-1)
        
        let lowerX = this.x[i-1];
        let lowerY = this.y[i-1];
        let lowerZ = this.z[i-1];
        let lowerP = this.pressure[i-1];

        let upperX = this.x[i];
        let upperY = this.y[i];
        let upperZ = this.z[i];
        let upperP = this.pressure[i];

        let DeltaLowerX = (currentTime - lowerZ)/(upperZ - lowerZ);

        // Interpolate these values 
        // This stupid thing was reversed 
        let interX = upperX*DeltaLowerX + lowerX*(1-DeltaLowerX);
        let interY = upperY*DeltaLowerX + lowerY*(1-DeltaLowerX);
        let interP = upperP*DeltaLowerX + lowerP*(1-DeltaLowerX);

        // Send the value out 
        var obj = {
            x : interX,
            y : interY, 
            pressure : interP
        }
        // return the current state from the database 
        // as an object
        return obj;
    }

    // get the begining
    GetBeginning() {
        let Bx = this.x[0];
        let By = this.y[0];
        let Bz = this.z[0];
        let BPress = this.pressure[0];

        let obj = {
            x : Bx,
            y : By,
            z : Bz,
            pressure : BPress 
        }

        return obj;
    } 
}

//These are the two variables OSC and FFT that are responsible 
//For the audio and are global variables
var osc, fft;

// Declaring a dummy path (going to replace this later)
// TODO - replace this badboi with the real values that I get
// This should plot the path of the hurricane from left to right
_xs = [1280, 1214, 1104, 1000, 949, 892, 872, 775, 724, 711, 662, 543, 436, 341, 268, 200, 173, 155, 157, 168, 209, 267];
_ys = [ 553,  555,  557,  551, 543, 545, 542, 533, 525, 524, 514, 494, 455, 416, 363, 315, 254, 198, 163, 128,  69,  24];
_zs = [   0, 0.05,  0.1, 0.15, 0.2,0.25, 0.3,0.35, 0.4,0.45, 0.5,0.55, 0.6,0.65, 0.7,0.75, 0.8,0.85, 0.9,0.95,0.97, 1];
_p  = [   0 , 1.2,  1.4,  1.8, 1.9, 3.4, 4.5, 7.8, 8.2, 10,  11,   12,  13,  12,  11,  10, 8.2, 7.8, 4.5, 3.4, 1.9, 0];


// These are all the global parameters for the hurricane system
var psystem;

var Strength = 99999999;
var U = 10;
var a = 10;
var Distance;
var d;

var pg;

// This is the time stamp for which we are simulating time 
var Time = 0.001;
var PrevTime = 0;
// This is the time after which it repeats
var SimulationInterval = 48000;

// Create the path object 
var HurricanePath = new path(_xs, _ys, _zs, _p);
// The hurricane's points
var Xpos = HurricanePath.GetBeginning.x;
var Ypos = HurricanePath.GetBeginning.y;
var Zpos = HurricanePath.GetBeginning.z;
var Press = HurricanePath.GetBeginning.pressure;

var HurricanePoint = new point(Xpos, Ypos, Zpos, Press);
HurricanePoint.prvXpos = Xpos;
HurricanePoint.prvYpos = Ypos;
HurricanePoint.pressure = Press;

// This is the part where we load the maps in
// D:\CloudStorage\OneDrive - Harvard University\SCI6322 Mapping Project 1\Map 2 (Hurricane Andrew)\Code Stuff\Actual\PathImage_1.jpg
const filePath = "BlurryMap.jpg";

// this bit is to get google chrome to start running the code
// This runs when the screen is touched/clicked on the first time
function touchStarted() {
    getAudioContext().resume();
}

// This bit loads the font for the computer
let myFont;
function preload() {
  myFont = loadFont('Futura Medium.otf');
}

// this bit sets up the thing to start
function setup() {
    // Create the p5 js canvas
    createCanvas(1280, 720);
    background(255);

    // These are the audio bits 
    // set frequency and type
    
    osc = new p5.TriOsc();
    osc.amp(.5);
    
    fft = new p5.FFT();
    osc.start();

    // the secon one that plays base notes
    osc_2 = new p5.TriOsc();
    osc_2.amp(.5);

    fft_2 = new p5.FFT();
    osc_2.start();

    psystem = new ParticleSystem(createVector(random(-width,width),random(-height,height)));
    smooth();
	
	pg = createGraphics(1280, 720);
	pg.clear();

    img_1 = loadImage(filePath);

    // set the current font
    textFont(myFont);
}


function draw() {
    // draw out the background 
    image(img_1, 0, 0);
    // That this was done by us
    textSize(16);
    fill(0);
    text('Sonifying Hurricanes : Brittany, Chelsea, Indrajeet and Jennifer', 20, 40);

    //background(200);
    // Set the time value
    // This line gets the time in mod Interval val and then maps it 0 - 1
    // So basically how we want it WRT to Z
    Time = (((millis()%SimulationInterval)/SimulationInterval)*0.99)+0.009;
    // Draw the curve out
    fill(255, 204, 0);
    stroke(128);
    HurricanePath.DrawCurve();

    // Get the current simulation frame from the dataset
    let CurrentFame = HurricanePath.GetCurrentXY(Time);

    // Set the values for new X and Y
    HurricanePoint.prvXpos = HurricanePoint.xpos;
    HurricanePoint.xpos = CurrentFame.x;
    HurricanePoint.prvYpos = HurricanePoint.ypos;
    HurricanePoint.ypos = CurrentFame.y;
    // This calculates the velocity by which we are moving
    var distanceTravelled = ((HurricanePoint.xpos - HurricanePoint.prvXpos)**2 + (HurricanePoint.ypos- HurricanePoint.prvYpos)**2)**0.5;
    var deltaTime = Time - PrevTime;
    // Reset the Prev Time to the current time
    PrevTime = Time;
    HurricanePoint.velocity = distanceTravelled/deltaTime;
    HurricanePoint.pressure = CurrentFame.pressure;

    // Draw a tiny ellipse at this point for location
    // OR maybe not
    stroke(0,0,0);
    fill(192,253,255);
    ellipse(722, 476, 10, 10);

    // the sliders that control the layout of the thing 
    textSize(12);
    stroke(255);
    fill(255);
    rect(1185 ,660, 75, 2);
    rect(1185 ,700, 75, 2);
    text('Pressure', 1185, 650);
    text('Wind Speed', 1185, 690);

    // draw ellipses at the relevant location
    stroke(0,0,0);
    fill(192,253,255);
    var epos_1 = map(HurricanePoint.pressure, 0, 13, 0, 75);
    ellipse(1185+epos_1, 661, 5, 5);

    var epos_1 = map(HurricanePoint.velocity, 0, 4000, 0, 75);
    ellipse(1185+epos_1, 701, 5, 5);

    textSize(8);
    stroke(255, 255, 255, 50);
    fill(255, 255, 255, 50);
    // Data sources 
    // - Natural earth data (graticules 5, country boundaries)
    // - NASA Earth Observations (NEO) (August 1992: SEA SURFACE TEMPERATURE (1 MONTH - AVHRR, 1981-2006)) 
    // - Jennifer's, Hurricane Andrew Path (see bibliography)
    // - Jennifer's, Counties (see bibliography)
    // - Jeniffer's, Shelter layer (see bibliography)
    text('Natural earth data (graticules 5, country boundaries)', 20, 660);
    text('NASA Earth Observations (NEO) (August 1992: SEA SURFACE TEMPERATURE (1 MONTH - AVHRR, 1981-2006))', 20, 670);
    text('NOAA Hurricane Shapefiles (Provided by ESRI, May 27, 2016)', 20, 680);
    text('Natural Earth » 1:110m Physical Vectors - Vector and Raster Map Data at 1:10m, 1:50m, and 1:110m Scales', 20, 690);
    text('National Shelter System Facilities (From the Homeland Infrastructure Foundation-Level Data (HIFLD))', 20, 700);
    
    // Draw an ellipse where the mouse is 
    // ellipse(mouseX, mouseY, 25, 25);
    var AmpDistance = (dist(722, 476, HurricanePoint.xpos, HurricanePoint.ypos));
    var amp = map(AmpDistance, 0, 1000, 1, 0.01);

    // Simulate the points
    Distance = 0;
    translate(HurricanePoint.xpos, HurricanePoint.ypos);

    // This iteratively cleans the BG
    //background(255, 8);
    
    psystem.addParticle();
    psystem.run();

    // This bit plays the sounds
    // Play around with these values
    var freq = map(HurricanePoint.velocity, 0, 4000, 146, 293);
    osc.freq(freq);

    // var amp = map(AmpDistance);
    osc.amp(amp/2);

    // the second amp
    var freq2 = map(HurricanePoint.pressure, 0, 13, 36, 73);
    osc_2.freq(freq2);

    osc_2.amp(1.2);
}

// This is the code for the particle system
function VF(t, x, y)
{
  return Strength*U*(1/(2*PI))*( -(y-0)/pow((x-(-Distance))*(x-(-Distance))+(y-0)*(y-0),3/2) -(y-0)/pow((x-Distance)*(x-Distance)+(y-0)*(y-0),3/2) );
}

function VG(t, x, y)
{
  return Strength*U*(1/(2*PI))*(  (x-(-Distance))/pow((x-(-Distance))*(x-(-Distance))+(y-0)*(y-0),3/2) +  (x-Distance)/pow((x-Distance)*(x-Distance)+(y-0)*(y-0),3/2) );
}

function Particle(lvector) {
    this.location = createVector(random(-width,width),random(-height,height));
    this.time = 0;
    this.radius = 0.75;
    this.h = 0.001;

    this.lifespan = 24000;
}

Particle.prototype.run = function() {
    this.update();
    this.display();
}

Particle.prototype.update = function() {
    this.k1 = VF(this.time, this.location.x, this.location.y);
    this.j1 = VG(this.time, this.location.x, this.location.y);
    this.k2 = VF(this.time + 1/2 * this.h, this.location.x + 1/2 * this.h * this.k1, this.location.y + 1/2 * this.h * this.j1);
    this.j2 = VG(this.time + 1/2 * this.h, this.location.x + 1/2 * this.h * this.k1, this.location.y + 1/2 * this.h * this.j1);
    this.k3 = VF(this.time + 1/2 * this.h, this.location.x + 1/2 * this.h * this.k2, this.location.y + 1/2 * this.h * this.j2);
    this.j3 = VG(this.time + 1/2 * this.h, this.location.x + 1/2 * this.h * this.k2, this.location.y + 1/2 * this.h * this.j2);
    this.k4 = VF(this.time + this.h, this.location.x + this.h * this.k3, this.location.y + this.h * this.j3);
    this.j4 = VG(this.time + this.h, this.location.x + this.h * this.k3, this.location.y + this.h * this.j3);
    //this.location.x = this.location.x + this.h/6 *(this.k1 + 2 * this.k2 + 2 * this.k3 + this.k4); 
    //this.location.y = this.location.y + this.h/6 *(this.j1 + 2 * this.j2 + 2 * this.j3 + this.j4);
    this.location.set(this.location.x + this.h/6 *(this.k1 + 2 * this.k2 + 2 * this.k3 + this.k4),this.location.y + this.h/6 *(this.j1 + 2 * this.j2 + 2 * this.j3 + this.j4));
    //this.time += this.h;
    this.lifespan -= 1.0;
}

Particle.prototype.display = function() {
    fill(255, 203, 242,this.lifespan);
    stroke(255, 203, 242,this.lifespan);
    ellipse(-this.location.x, this.location.y, 2*this.radius, 2*this.radius);    
}

Particle.prototype.isDead = function() {
    return (this.lifespan < 0);
}

function ParticleSystem(location) {
    this.origin = location.copy();
    this.particles = [];
}

ParticleSystem.prototype.addParticle = function() {
    this.particles.push(new Particle(this.origin));
}

ParticleSystem.prototype.run = function() {
    var p;
    for (var i = this.particles.length - 1; i >= 0; i--) {
        p = this.particles[i];
        p.run();
        if (p.isDead() || p.x > 250 ||  p.y > 250 || p.x < -250 ||  p.y < -250 ) {
            this.particles.splice(i, 1);
        }
    }
}