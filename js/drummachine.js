window.onload = init;

var timerWorker = null; // Worker thread to send us scheduling messages.
var context;
var convolver;
var compressor;
var masterGainNode;
var effectLevelNode;
var filterNode;
var mixGain = 1.0;

// Each effect impulse response has a specific overall desired dry and wet volume.
// For example in the telephone filter, it's necessary to make the dry volume 0 to correctly hear the effect.
var effectDryMix = 1.0;
var effectWetMix = 1.0;

var timeoutId;
var tempo = 120;
var stateReady = false;

var startTime;
var lastDrawTime = -1;

var kits;

var kNumInstruments = 6;
var kInitialKitIndex = 0;
var kMaxSwing = .08;

var currentKit;

var beatReset = {"kitIndex":0,"effectIndex":0,"tempo":120,"swingFactor":0,"effectMix":0.25,"kickPitchVal":0.5,"genPitchVal":0.5,"hihatPitchVal":0.5,"tom1PitchVal":0.5,"tom2PitchVal":0.5,"tom3PitchVal":0.5,"rhythm1":[0,0,0,0],"rhythm2":[0,0,0,0],"rhythm3":[0,0,0,0],"rhythm4":[0,0,0,0],"rhythm5":[0,0,0,0],"rhythm6":[0,0,0,0]};

function cloneBeat(source) {
    var beat = new Object();

    beat.kitIndex = source.kitIndex;
    beat.effectIndex = source.effectIndex;
    beat.tempo = source.tempo;
    beat.swingFactor = source.swingFactor;
    beat.effectMix = source.effectMix;
    beat.mixGain = source.mixGain;
    beat.kickPitchVal = source.genPitchVal;
    beat.genPitchVal = source.genPitchVal;
    beat.hihatPitchVal = source.genPitchVal;
    beat.tom1PitchVal = source.genPitchVal;
    beat.tom2PitchVal = source.genPitchVal;
    beat.tom3PitchVal = source.genPitchVal;
    beat.rhythm1 = source.rhythm1.slice(0);        // slice(0) is an easy way to copy the full array
    beat.rhythm2 = source.rhythm2.slice(0);
    beat.rhythm3 = source.rhythm3.slice(0);
    beat.rhythm4 = source.rhythm4.slice(0);
    beat.rhythm5 = source.rhythm5.slice(0);
    beat.rhythm6 = source.rhythm6.slice(0);
    return beat;
}

// theBeat is the object representing the current beat/groove
// ... it is saved/loaded via JSON
var theBeat = cloneBeat(beatReset);

kickPitch = genPitch = hihatPitch = tom1Pitch = tom2Pitch = tom3Pitch = 0;

var mouseCapture = null;
var mouseCaptureOffset = 0;

var loopLength = 4;
var rhythmIndex = 0;
var kMinTempo = 53;
var kMaxTempo = 180;
var noteTime = 0.0;

var instruments = ['Kick', 'Snare', 'HiHat', 'Tom1', 'Tom2', 'Tom3'];

var volumes = [0, 0.3, 1];

var kitCount = 0;
var kitRockCount = 0;

var kitName = ["tambora","bunde","chande","cumbia","porroc"];

var kitNameRock = [
    "tech"
    ];

function Kit(name) {
    this.name = name;

    this.pathName = function() {
        var pathName = "sounds/loops/" + this.name + "/";
        return pathName;
    };
    this.pathNameM = function() {
        var pathNameM = "sounds/loops/" + this.name + "M/";
        return pathNameM;
    };

    this.a1 = 0;
    this.a2 = 0;
    this.a3 = 0;
    this.a4 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.c1 = 0;
    this.c2 = 0;
    this.c3 = 0;
    this.c4 = 0;

    this.m1 = 0;
    this.m2 = 0;
    this.m3 = 0;
    this.m4 = 0;
    this.n1 = 0;
    this.n2 = 0;
    this.n3 = 0;
    this.n4 = 0;
    this.l1 = 0;
    this.l2 = 0;
    this.l3 = 0;
    this.l4 = 0;

    this.instrumentCount = 6;
    this.instrumentLoadCount = 0;

    this.startedLoading = false;
    this.isLoaded = false;
}

Kit.prototype.load = function() {
    if (this.startedLoading)
        return;

    this.startedLoading = true;

    var pathName = this.pathName();
    var pathNameM = this.pathNameM();

    var f1Path = pathNameM + "a1.wav";
    var f2Path = pathNameM + "a2.wav";
    var f3Path = pathNameM + "a3.wav";
    var f4Path = pathNameM + "a4.wav";
    var f5Path = pathNameM + "b1.wav";
    var f6Path = pathNameM + "b2.wav";
    var f7Path = pathNameM + "b3.wav";
    var f8Path = pathNameM + "b4.wav";
    var f9Path = pathNameM + "c1.wav";
    var f10Path = pathNameM + "c2.wav";
    var f11Path = pathNameM + "c3.wav";
    var f12Path = pathNameM + "c4.wav";

    var m1Path = pathName + "a1.wav";
    var m2Path = pathName + "a2.wav";
    var m3Path = pathName + "a3.wav";
    var m4Path = pathName + "a4.wav";
    var m5Path = pathName + "b1.wav";
    var m6Path = pathName + "b2.wav";
    var m7Path = pathName + "b3.wav";
    var m8Path = pathName + "b4.wav";
    var m9Path = pathName + "c1.wav";
    var m10Path = pathName + "c2.wav";
    var m11Path = pathName + "c3.wav";
    var m12Path = pathName + "c4.wav";

    this.loadSample(0, f1Path, false);
    this.loadSample(1, f2Path, false);
    this.loadSample(2, f3Path, false);
    this.loadSample(3, f4Path, false);
    this.loadSample(4, f5Path, false);
    this.loadSample(5, f6Path, false);
    this.loadSample(6, f7Path, false);
    this.loadSample(7, f8Path, false);
    this.loadSample(8, f9Path, false);
    this.loadSample(9, f10Path, false);
    this.loadSample(10, f11Path, false);
    this.loadSample(11, f12Path, false);

    this.loadSample(12, m1Path, false);
    this.loadSample(13, m2Path, false);
    this.loadSample(14, m3Path, false);
    this.loadSample(15, m4Path, false);
    this.loadSample(16, m5Path, false);
    this.loadSample(17, m6Path, false);
    this.loadSample(18, m7Path, false);
    this.loadSample(19, m8Path, false);
    this.loadSample(20, m9Path, false);
    this.loadSample(21, m10Path, false);
    this.loadSample(22, m11Path, false);
    this.loadSample(23, m12Path, false);
}

var decodedFunctions = [
function (buffer) { this.a1 = buffer; },
function (buffer) { this.a2 = buffer; },
function (buffer) { this.a3 = buffer; },
function (buffer) { this.a4 = buffer; },
function (buffer) { this.b1 = buffer; },
function (buffer) { this.b2 = buffer; },
function (buffer) { this.b3 = buffer; },
function (buffer) { this.b4 = buffer; },
function (buffer) { this.c1 = buffer; },
function (buffer) { this.c2 = buffer; },
function (buffer) { this.c3 = buffer; },
function (buffer) { this.c4 = buffer; },

function (buffer) { this.m1 = buffer; },
function (buffer) { this.m2 = buffer; },
function (buffer) { this.m3 = buffer; },
function (buffer) { this.m4 = buffer; },
function (buffer) { this.n1 = buffer; },
function (buffer) { this.n2 = buffer; },
function (buffer) { this.n3 = buffer; },
function (buffer) { this.n4 = buffer; },
function (buffer) { this.l1 = buffer; },
function (buffer) { this.l2 = buffer; },
function (buffer) { this.l3 = buffer; },
function (buffer) { this.l4 = buffer; },];

Kit.prototype.loadSample = function(sampleID, url, mixToMono) {

    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var kit = this;

    request.onload = function() {
        context.decodeAudioData(request.response, decodedFunctions[sampleID].bind(kit));

        kit.instrumentLoadCount++;
        if (kit.instrumentLoadCount == kit.instrumentCount) {
            kit.isLoaded = true;
        }
    }
    request.send();
}

var impulseResponseInfoList = [
    // Impulse responses - each one represents a unique linear effect.
    {"name":"No Effect", "url":"undefined", "dryMix":1, "wetMix":0},
    {"name":"Spreader 2", "url":"impulse-responses/noise-spreader1.wav",        "dryMix":1, "wetMix":1},
    {"name":"Spring Reverb", "url":"impulse-responses/feedback-spring.wav",     "dryMix":1, "wetMix":1},
    {"name":"Space Oddity", "url":"impulse-responses/filter-rhythm3.wav",       "dryMix":1, "wetMix":0.7},
    {"name":"Huge Reverse", "url":"impulse-responses/matrix6-backwards.wav",    "dryMix":0, "wetMix":0.7},
    {"name":"Telephone Filter", "url":"impulse-responses/filter-telephone.wav", "dryMix":0, "wetMix":1.2},
    {"name":"Lopass Filter", "url":"impulse-responses/filter-lopass160.wav",    "dryMix":0, "wetMix":0.5},
    {"name":"Hipass Filter", "url":"impulse-responses/filter-hipass5000.wav",   "dryMix":0, "wetMix":4.0},
    {"name":"Comb 1", "url":"impulse-responses/comb-saw1.wav",                  "dryMix":0, "wetMix":0.7},
    {"name":"Comb 2", "url":"impulse-responses/comb-saw2.wav",                  "dryMix":0, "wetMix":1.0},
    {"name":"Cosmic Ping", "url":"impulse-responses/cosmic-ping-long.wav",      "dryMix":0, "wetMix":0.9},
    {"name":"Kitchen", "url":"impulse-responses/house-impulses/kitchen-true-stereo.wav", "dryMix":1, "wetMix":1},
    {"name":"Living Room", "url":"impulse-responses/house-impulses/dining-living-true-stereo.wav", "dryMix":1, "wetMix":1},
    {"name":"Living-Bedroom", "url":"impulse-responses/house-impulses/living-bedroom-leveled.wav", "dryMix":1, "wetMix":1},
    {"name":"Dining-Far-Kitchen", "url":"impulse-responses/house-impulses/dining-far-kitchen.wav", "dryMix":1, "wetMix":1},
    {"name":"Medium Hall 1", "url":"impulse-responses/matrix-reverb2.wav",      "dryMix":1, "wetMix":1},
    {"name":"Medium Hall 2", "url":"impulse-responses/matrix-reverb3.wav",      "dryMix":1, "wetMix":1},
    {"name":"Peculiar", "url":"impulse-responses/peculiar-backwards.wav",       "dryMix":1, "wetMix":1},
    {"name":"Backslap", "url":"impulse-responses/backslap1.wav",                "dryMix":1, "wetMix":1},
    {"name":"Diffusor", "url":"impulse-responses/diffusor3.wav",                "dryMix":1, "wetMix":1},
    {"name":"Huge", "url":"impulse-responses/matrix-reverb6.wav",               "dryMix":1, "wetMix":0.7},
]

var impulseResponseList = 0;

function ImpulseResponse(url, index) {
    this.url = url;
    this.index = index;
    this.startedLoading = false;
    this.isLoaded_ = false;
    this.buffer = 0;
}

ImpulseResponse.prototype.isLoaded = function() {
    return this.isLoaded_;
}

function loadedImpulseResponse(buffer) {
    this.buffer = buffer;
    this.isLoaded_ = true;
}

ImpulseResponse.prototype.load = function() {
    if (this.startedLoading) {
        return;
    }

    this.startedLoading = true;

    // Load asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", this.url, true);
    request.responseType = "arraybuffer";
    this.request = request;

    var asset = this;

    request.onload = function() {
        context.decodeAudioData(request.response, loadedImpulseResponse.bind(asset) );
    }

    request.send();
}

function startLoadingAssets() {
    impulseResponseList = new Array();

    for (i = 0; i < impulseResponseInfoList.length; i++) {
        impulseResponseList[i] = new ImpulseResponse(impulseResponseInfoList[i].url, i);
    }

    // Initialize drum kits
    var numKits = kitName.length;
    kits = new Array(numKits);

    for (var i  = 0; i < numKits; i++) {
        kits[i] = new Kit(kitName[i]);
    }
    // Then load the remaining assets.
    // Note that any assets which have previously started loading will be skipped over.
    for (var i = 0; i < numKits; i++) {
        kits[i].load();
    }
    // Start at 1 to skip "No Effect"
    for (i = 1; i < impulseResponseInfoList.length; i++) {
        impulseResponseList[i].load();
    }
    // Setup initial drumkit
    currentKit = kits[kInitialKitIndex];
}

function showPlayAvailable() {
    var play = document.getElementById("play");
    play.src = "images/btn_play.png";
}

function init() {

    startLoadingAssets();

    // NOTE: THIS NOW RELIES ON THE MONKEYPATCH LIBRARY TO LOAD
    // IN CHROME AND SAFARI (until they release unprefixed)
    context = new AudioContext();

    var finalMixNode;
    if (context.createDynamicsCompressor) {
        // Create a dynamics compressor to sweeten the overall mix.
        compressor = context.createDynamicsCompressor();
        compressor.connect(context.destination);
        finalMixNode = compressor;
    } else {
        // No compressor available in this implementation.
        finalMixNode = context.destination;
    }

    // create master filter node
    filterNode = context.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.value = 0.5 * context.sampleRate;
    filterNode.Q.value = 1;
    filterNode.connect(finalMixNode);

    // Create master volume.
    masterGainNode = context.createGain();
    masterGainNode.gain.value = 0.8; // reduce overall volume to avoid clipping
    masterGainNode.connect(filterNode);

    // Create effect volume.
    effectLevelNode = context.createGain();
    effectLevelNode.gain.value = 1.0; // effect level slider controls this
    effectLevelNode.connect(masterGainNode);

    // Create convolver for effect
    convolver = context.createConvolver();
    convolver.connect(effectLevelNode);

    document.body.addEventListener("mousedown", handleBodyMouseDown, true);

    initControls();
    updateControls();

    var timerWorkerBlob = new Blob([
        "var timeoutID=0;function schedule(){timeoutID=setTimeout(function(){postMessage('schedule'); schedule();},100);} onmessage = function(e) { if (e.data == 'start') { if (!timeoutID) schedule();} else if (e.data == 'stop') {if (timeoutID) clearTimeout(timeoutID); timeoutID=0;};}"]);

    // Obtain a blob URL reference to our worker 'file'.
    var timerWorkerBlobURL = window.URL.createObjectURL(timerWorkerBlob);

    timerWorker = new Worker(timerWorkerBlobURL);
    timerWorker.onmessage = function(e) {
      schedule();
    };
    timerWorker.postMessage('init'); // Start the worker.
    loadBeat(beatReset);
}

function initControls() {

    // Initialize note buttons
    initButtons();
    // sliders
    document.getElementById('cross_thumb').addEventListener('mousedown', handleSliderMouseDown, true);
    document.getElementById('pitch_thumb').addEventListener('mousedown', handleSliderMouseDown, true);

    document.getElementById('cross_thumb').addEventListener('dblclick', handleSliderDoubleClick, true);
    document.getElementById('pitch_thumb').addEventListener('dblclick', handleSliderDoubleClick, true);

    // tool buttons
    document.getElementById('play').addEventListener('mousedown', handlePlay, true);
    document.getElementById('stop').addEventListener('mousedown', handleStop, true);
    document.getElementById('save').addEventListener('mousedown', handleSave, true);
    document.getElementById('save_ok').addEventListener('mousedown', handleSaveOk, true);
    document.getElementById('load').addEventListener('mousedown', handleLoad, true);
    document.getElementById('load_ok').addEventListener('mousedown', handleLoadOk, true);
    document.getElementById('load_cancel').addEventListener('mousedown', handleLoadCancel, true);
    document.getElementById('reset').addEventListener('mousedown', handleReset, true);

    var elBody = document.getElementById('body');
    elBody.addEventListener('mousemove', handleMouseMove, true);
    elBody.addEventListener('mouseup', handleMouseUp, true);

    theBeat.tempo = 120;
    document.getElementById('tempo').innerHTML = theBeat.tempo;
}

function initButtons() {
    var elButton;
    for (i = 0; i < loopLength; ++i) {
        for (j = 0; j < kNumInstruments; j++) {
                elButton = document.getElementById(instruments[j]+"_"+i);
                elButton.addEventListener("mousedown", handleButtonMouseDown, true);
        }
    }
    if(stateReady)
      showPlayAvailable();
}

function advanceNote() {

    var secondsPerBeat = (60.0 / theBeat.tempo)*8;

    rhythmIndex++;
    if (rhythmIndex == loopLength) {
        rhythmIndex = 0;
    }

    if (rhythmIndex % 2) {
        noteTime += (0.25 + kMaxSwing * theBeat.swingFactor) * secondsPerBeat;
    } else {
        noteTime += (0.25 - kMaxSwing * theBeat.swingFactor) * secondsPerBeat;
    }
}

function playNote(buffer, pan, x, y, z, sendGain, mainGain, playbackRate, noteTime) {
    // Create the note
    var voice = context.createBufferSource();
    voice.buffer = buffer;
    voice.playbackRate.value = playbackRate;

    // Optionally, connect to a panner
    var finalNode;
    if (pan) {
        var panner = context.createPanner();
        panner.panningModel = "HRTF";
        panner.setPosition(x, y, z);
        voice.connect(panner);
        finalNode = panner;
    } else {
        finalNode = voice;
    }

    // Connect to dry mix
    var dryGainNode = context.createGain();
    dryGainNode.gain.value = mainGain * effectDryMix;
    finalNode.connect(dryGainNode);
    dryGainNode.connect(masterGainNode);

    // Connect to wet mix
    var wetGainNode = context.createGain();
    wetGainNode.gain.value = sendGain;
    finalNode.connect(wetGainNode);
    wetGainNode.connect(convolver);

    voice.start(noteTime);
}

function schedule() {
    var currentTime = context.currentTime;

    // The sequence starts at startTime, so normalize currentTime so that it's 0 at the start of the sequence.
    currentTime -= startTime;

    while (noteTime < currentTime + 0.120) {
        // Convert noteTime to context time.
        var contextPlayTime = noteTime + startTime;
        if (theBeat.rhythm1[rhythmIndex]) {
          if(noteReg[0][0] == 1){
            playNote(currentKit.a1, false, 0,0,-2, 0.5, volumes[theBeat.rhythm1[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[0][1] == 1){
            playNote(currentKit.a2, false, 0,0,-2, 0.5, volumes[theBeat.rhythm1[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[0][2] == 1){
            playNote(currentKit.a3, false, 0,0,-2, 0.5, volumes[theBeat.rhythm1[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[0][3] == 1){
            playNote(currentKit.a4, false, 0,0,-2, 0.5, volumes[theBeat.rhythm1[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
        }
        if (theBeat.rhythm2[rhythmIndex]) {
          if(noteReg[1][0] == 1){
            playNote(currentKit.b1, false, 0,0,-2, 0.5, volumes[theBeat.rhythm2[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[1][1] == 1){
            playNote(currentKit.b2, false, 0,0,-2, 0.5, volumes[theBeat.rhythm2[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[1][2] == 1){
            playNote(currentKit.b3, false, 0,0,-2, 0.5, volumes[theBeat.rhythm2[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[1][3] == 1){
            playNote(currentKit.b4, false, 0,0,-2, 0.5, volumes[theBeat.rhythm2[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
        }
        if (theBeat.rhythm3[rhythmIndex]) {
          if(noteReg[2][0] == 1){
            playNote(currentKit.c1, false, 0,0,-2, 0.5, volumes[theBeat.rhythm3[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[2][1] == 1){
            playNote(currentKit.c2, false, 0,0,-2, 0.5, volumes[theBeat.rhythm3[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[2][2] == 1){
            playNote(currentKit.c3, false, 0,0,-2, 0.5, volumes[theBeat.rhythm3[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[2][3] == 1){
            playNote(currentKit.c4, false, 0,0,-2, 0.5, volumes[theBeat.rhythm3[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
        }
        if (theBeat.rhythm4[rhythmIndex]) {
            if(noteReg[3][0] == 1){
              playNote(currentKit.m1, false, 0,0,-2, 0.5, volumes[theBeat.rhythm4[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
            }
            if(noteReg[3][1] == 1){
              playNote(currentKit.m2, false, 0,0,-2, 0.5, volumes[theBeat.rhythm4[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
            }
            if(noteReg[3][2] == 1){
              playNote(currentKit.m3, false, 0,0,-2, 0.5, volumes[theBeat.rhythm4[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
            }
            if(noteReg[3][3] == 1){
              playNote(currentKit.m4, false, 0,0,-2, 0.5, volumes[theBeat.rhythm4[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
            }
        }
        if (theBeat.rhythm5[rhythmIndex]) {
          if(noteReg[4][0] == 1){
            playNote(currentKit.n1, false, 0,0,-2, 0.5, volumes[theBeat.rhythm5[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[4][1] == 1){
            playNote(currentKit.n2, false, 0,0,-2, 0.5, volumes[theBeat.rhythm5[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[4][2] == 1){
            playNote(currentKit.n3, false, 0,0,-2, 0.5, volumes[theBeat.rhythm5[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[4][3] == 1){
            playNote(currentKit.n4, false, 0,0,-2, 0.5, volumes[theBeat.rhythm5[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
        }
        if (theBeat.rhythm6[rhythmIndex]) {
          if(noteReg[5][0] == 1){
            playNote(currentKit.l1, false, 0,0,-2, 0.5, volumes[theBeat.rhythm6[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[5][1] == 1){
            playNote(currentKit.l2, false, 0,0,-2, 0.5, volumes[theBeat.rhythm6[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[5][2] == 1){
            playNote(currentKit.l3, false, 0,0,-2, 0.5, volumes[theBeat.rhythm6[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
          if(noteReg[5][3] == 1){
            playNote(currentKit.l4, false, 0,0,-2, 0.5, volumes[theBeat.rhythm6[rhythmIndex]] * 1.0, genPitch, contextPlayTime);
          }
        }
        advanceNote();
    }
}

function handleSliderMouseDown(event) {
    mouseCapture = event.target.id;

    var el = event.target;
    if (mouseCapture == 'swing_thumb') {
        var thumbX = 0;
        do {
            thumbX += el.offsetLeft;
        } while (el = el.offsetParent);

        mouseCaptureOffset = event.pageX - thumbX;
    } else {
        var thumbY = 0;
        do {
            thumbY += el.offsetTop;
        } while (el = el.offsetParent);

        mouseCaptureOffset = event.pageY - thumbY;
    }
}

function handleSliderDoubleClick(event) {
    var id = event.target.id;
    if (id != 'effect_thumb') {
        mouseCapture = null;
        sliderSetValue(event.target.id, 0.5);
        updateControls();
    }
}

function handleMouseMove(event) {
    if (!mouseCapture) return;

    var elThumb = document.getElementById(mouseCapture);
    var elTrack = elThumb.parentNode;

    if (mouseCapture != 'swing_thumb') {
        var thumbH = elThumb.clientHeight;
        var trackH = elTrack.clientHeight;
        var travelH = trackH - thumbH;

        var trackY = 0;
        var el = elTrack;
        do {
            trackY += el.offsetTop;
        } while (el = el.offsetParent);

        var offsetY = Math.max(0, Math.min(travelH, event.pageY - mouseCaptureOffset - trackY));
        var value = 1.0 - offsetY / travelH;
        elThumb.style.top = travelH * (1.0 - value) + 'px';
    } else {
        var thumbW = elThumb.clientWidth;
        var trackW = elTrack.clientWidth;
        var travelW = trackW - thumbW;

        var trackX = 0;
        var el = elTrack;
        do {
            trackX += el.offsetLeft;
        } while (el = el.offsetParent);

        var offsetX = Math.max(0, Math.min(travelW, event.pageX - mouseCaptureOffset - trackX));
        var value = offsetX / travelW;
        elThumb.style.left = travelW * value + 'px';
    }
    sliderSetValue(mouseCapture, value);
}

function handleMouseUp() {
    mouseCapture = null;
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function sliderSetValue(slider, value) {
    var pitchRate = Math.pow(2.0, 2.0 * (value - 0.5));

    switch(slider) {
    case 'pitch_thumb':
        theBeat.genPitchVal = value;
        genPitch = pitchRate;
        console.log(value);
        theBeat.tempo = Math.round(tempo * map_range(value,0,1,0.5,2));
        document.getElementById('tempo').innerHTML = theBeat.tempo;
        break;
    case 'cross_thumb':
        masterGainNode.gain.value = value;
        break;
    }
}

function sliderSetPosition(slider, value) {
    var elThumb = document.getElementById(slider);
    var elTrack = elThumb.parentNode;

    if (slider == 'swing_thumb') {
        var thumbW = elThumb.clientWidth;
        var trackW = elTrack.clientWidth;
        var travelW = trackW - thumbW;

        elThumb.style.left = travelW * value + 'px';
    } else {
        var thumbH = elThumb.clientHeight;
        var trackH = elTrack.clientHeight;
        var travelH = trackH - thumbH;

        elThumb.style.top = travelH * (1.0 - value) + 'px';
    }
}

var noteReg = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

function handleButtonMouseDown(event) {
    var notes = theBeat.rhythm1;

    var instrumentIndex;
    var rhythmIndex;

    var elId = event.target.id;
    rhythmIndex = elId.substr(elId.indexOf('_') + 1, 2);
    instrumentIndex = instruments.indexOf(elId.substr(0, elId.indexOf('_')));

    switch (instrumentIndex) {
        case 0: notes = theBeat.rhythm1; break;
        case 1: notes = theBeat.rhythm2; break;
        case 2: notes = theBeat.rhythm3; break;
        case 3: notes = theBeat.rhythm4; break;
        case 4: notes = theBeat.rhythm5; break;
        case 5: notes = theBeat.rhythm6; break;
    }
    notes[rhythmIndex] = (notes[rhythmIndex] + 1) % 3;

    for (i = 0; i < loopLength; i++) {
        if(i == rhythmIndex){
          noteReg[instrumentIndex][i] = 1;
          drawNote(notes[i], i, instrumentIndex);
        } else {
          noteReg[instrumentIndex][i] = 0;
          notes[i] = 0;
          drawNote(0, i, instrumentIndex);
        }
    }
    //var note = notes[rhythmIndex];
}

function handleBodyMouseDown(event) {
    var elEffectcombo = document.getElementById('effectcombo');
}

function handlePlay(event) {
    noteTime = 0.0;
    startTime = context.currentTime + 0.005;
    if(stateReady){
      schedule();
      timerWorker.postMessage("start");

      document.getElementById('play').classList.add('playing');
      document.getElementById('stop').classList.add('playing');
    }
}

function handleStop(event) {
    timerWorker.postMessage("stop");
    rhythmIndex = 0;

    document.getElementById('play').classList.remove('playing');
    document.getElementById('stop').classList.remove('playing');
}

function writeToFile(text){
  var pom = document.createElement('a');
  var date = new Date();
  date = date + ".txt"
  pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  pom.setAttribute('download', date);

  if (document.createEvent) {
      var event = document.createEvent('MouseEvents');
      event.initEvent('click', true, true);
      pom.dispatchEvent(event);
  }
  else {
      pom.click();
  }
}

function handleSave(event) {
    toggleSaveContainer();
    var elTextarea = document.getElementById('save_textarea');
    elTextarea.value = JSON.stringify(theBeat);
    writeToFile(JSON.stringify(theBeat));
}

function handleSaveOk(event) {
    toggleSaveContainer();
}

function handleLoad(event) {
    toggleLoadContainer();
}

function handleLoadOk(event) {
    var elTextarea = document.getElementById('load_textarea');
    theBeat = JSON.parse(elTextarea.value);

    // Set drumkit
    currentKit = kits[theBeat.kitIndex];
    currentKitRock = kits[theBeat.kitRockIndex];

    // Apply values from sliders
    sliderSetValue('effect_thumb', theBeat.effectMix);
    sliderSetValue('pitch_thumb', theBeat.genPitchVal);
    sliderSetValue('hihat_thumb', theBeat.hihatPitchVal);
    sliderSetValue('tom1_thumb', theBeat.tom1PitchVal);
    sliderSetValue('tom2_thumb', theBeat.tom2PitchVal);
    sliderSetValue('tom3_thumb', theBeat.tom3PitchVal);
    sliderSetValue('swing_thumb', theBeat.swingFactor);
    sliderSetValue('cross_thumb', masterGainNode.gain.value);

    elTextarea.value = '';

    toggleLoadContainer();
    updateControls();
}

function handleLoadCancel(event) {
    toggleLoadContainer();
}

function toggleSaveContainer() {
    document.getElementById('pad').classList.toggle('active');
    document.getElementById('params').classList.toggle('active');
    document.getElementById('tools').classList.toggle('active');
    document.getElementById('save_container').classList.toggle('active');
}

function toggleLoadContainer() {
    document.getElementById('pad').classList.toggle('active');
    document.getElementById('params').classList.toggle('active');
    document.getElementById('tools').classList.toggle('active');
    document.getElementById('load_container').classList.toggle('active');
}

function handleReset(event) {
    changeText("reset");
    handleStop();
    loadBeat(beatReset);
    for (i = 0; i < loopLength; ++i) {
        for (j = 0; j < kNumInstruments; j++) {
            drawNote(0,i,j);
        }
    }
}

function loadBeat(beat) {
    // Check that assets are loaded.
    if (beat != beatReset && !beat.isLoaded())
        return false;

    handleStop();

    theBeat = cloneBeat(beat);
    currentKit = kits[theBeat.kitIndex];

    sliderSetValue('pitch_thumb', theBeat.genPitchVal);
    sliderSetValue('hihat_thumb', theBeat.hihatPitchVal);
    sliderSetValue('tom1_thumb', theBeat.tom1PitchVal);
    sliderSetValue('tom2_thumb', theBeat.tom2PitchVal);
    sliderSetValue('tom3_thumb', theBeat.tom3PitchVal);
    sliderSetValue('swing_thumb', theBeat.swingFactor);
    sliderSetValue('cross_thumb', masterGainNode.gain.value);

    updateControls();

    return true;
}

function updateControls() {
    for (i = 0; i < loopLength; ++i) {
        for (j = 0; j < kNumInstruments; j++) {
            switch (j) {
                case 0: notes = theBeat.rhythm1; break;
                case 1: notes = theBeat.rhythm2; break;
                case 2: notes = theBeat.rhythm3; break;
                case 3: notes = theBeat.rhythm4; break;
                case 4: notes = theBeat.rhythm5; break;
                case 5: notes = theBeat.rhythm6; break;
            }
        }
    }
    document.getElementById('tempo').innerHTML = theBeat.tempo;

    sliderSetPosition('pitch_thumb', theBeat.genPitchVal);
    sliderSetPosition('cross_thumb', masterGainNode.gain.value);

    if(stateReady)
      showPlayAvailable();
}

function drawNote(draw, xindex, yindex) {

    var elButton = document.getElementById(instruments[yindex] + '_' + xindex);
    switch (draw) {
        case 0: elButton.src = 'images/button_off.png'; break;
        case 1: elButton.src = 'images/button_half.png'; break;
        case 2: elButton.src = 'images/button_on.png'; break;
    }
}

// Main CONTROL IU elements

function changeText(value) {

  if(value == "Bunde calle"){
      stateReady = true;
      updateControls();
      document.getElementById('pText').innerHTML = "Seleccionaste " + value;

      document.getElementById('linea1f').innerHTML = "Bombo";
      document.getElementById('linea2f').innerHTML = "Platillo";
      document.getElementById('linea3f').innerHTML = "Redoblante";

      theBeat.tempo = 135;
      document.getElementById('tempo').innerHTML = theBeat.tempo;
   }
   if(value == "Porro chocoano"){
      stateReady = true;
      updateControls();

      document.getElementById('pText').innerHTML = "Seleccionaste " + value;

      document.getElementById('linea1f').innerHTML = "Bombo";
      document.getElementById('linea2f').innerHTML = "Platillo";
      document.getElementById('linea3f').innerHTML = "Redoblante";

      theBeat.tempo = 130;
      document.getElementById('tempo').innerHTML = theBeat.tempo;
    }
   if(value == "Tambora"){
     stateReady = true;
     updateControls();

     document.getElementById('pText').innerHTML = "Seleccionaste " + value;

     document.getElementById('linea1f').innerHTML = "Alegre";
     document.getElementById('linea2f').innerHTML = "Tambora";
     document.getElementById('linea3f').innerHTML = "Maracas";

     theBeat.tempo = 120;
     tempo = 120;
     document.getElementById('tempo').innerHTML = theBeat.tempo;
   }
   if(value == "Chande"){
     stateReady = true;
     updateControls();

     document.getElementById('pText').innerHTML = "Seleccionaste " + value;

     document.getElementById('linea1f').innerHTML = "Alegre";
     document.getElementById('linea2f').innerHTML = "Tambora";
     document.getElementById('linea3f').innerHTML = "Maracas";

     theBeat.tempo = 140;
     document.getElementById('tempo').innerHTML = theBeat.tempo;
   }
   if(value == "Cumbia"){
     stateReady = true;
     updateControls();

     document.getElementById('pText').innerHTML = "Seleccionaste " + value;

     document.getElementById('linea1f').innerHTML = "Alegre";
     document.getElementById('linea2f').innerHTML = "Llamador";
     document.getElementById('linea3f').innerHTML = "Tambora";

     theBeat.tempo = 104;
     document.getElementById('tempo').innerHTML = theBeat.tempo;
   }
   if(value == "reset"){
      stateReady = false;

      document.getElementById('pText').innerHTML = "Selecciona un ritmo folklórico";

      document.getElementById('linea1f').innerHTML = "";
      document.getElementById('linea2f').innerHTML = "";
      document.getElementById('linea3f').innerHTML = "";

      document.getElementById('linea1m').innerHTML = "";
      document.getElementById('linea2m').innerHTML = "";
      document.getElementById('linea3m').innerHTML = "";
    }
  }
