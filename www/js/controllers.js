angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, $timeout, $window) {

  var numTicks = 10;
  var dialDegrees = 45;
  $scope.timer = "Pausad"

  window.addEventListener('load', function(){
    var $tunerViewContainer = $("#tunerView");
    for (var i = 1; i <= numTicks; i++) {
      var $div = $("<div>", {id: "tick_"+i});
      $tunerViewContainer.append($div);
      var $div = $("<div>", {id: "tick_"+(-1)*i});
      $tunerViewContainer.append($div);
    };
  }); 

  var timerInterval;

  function play()
  {
    //var div = document.getElementById("playPause");
    //div.className = "pause";
    startAudio();
    startClock();
    $scope.playing = true;
  }

  function pause()
  {
    var div = document.getElementById("playPause");
    div.className = "play";
    stopAudio();
    $scope.playing = false;
    // var message = $("#message");
    // message.text("Paused: Click Play to continue");
    $scope.timer = "Pausad"
    clearInterval(timerInterval);
  }
  
  $scope.playPause = function ()
  {    
    if($scope.playing == true)
    {
      pause();
    }
    else
    {
      play();
    }
  }

  function startClock()
  {
    var timeoutLengthSeconds = 5*60;
    var start = new Date;
    $scope.updateClock(timeoutLengthSeconds);
      timerInterval = setInterval(function() {
          var secondsPassed = (new Date - start)/1000;
          if(secondsPassed < timeoutLengthSeconds)
          {
            $scope.updateClock(timeoutLengthSeconds-secondsPassed);
          }
          else
          {
            pause();
          }
      }, 1000);
  }

  $scope.updateClock = function(timeoutLengthSeconds)
  {
    function formatNumberLength(num, length) {
        var r = "" + num;
        while (r.length < length) {
            r = "0" + r;
        }
        return r;
    }
    var minutes = Math.floor(timeoutLengthSeconds / 60);
    var seconds = Math.floor(timeoutLengthSeconds%60);
    //Kallar onTimeout för att $scope.timer ska uppdateras i DOM
    $scope.onTimeout = function(){
        mytimeout = $timeout($scope.onTimeout,100);
        $scope.timer = formatNumberLength(minutes,2)+":"+formatNumberLength(seconds,2);
    }
    var mytimeout = $timeout($scope.onTimeout,100);
    
    // var clock = document.getElementById("#message").text("Timeout: "+formatNumberLength(minutes,2)+":"+formatNumberLength(seconds,2));
  }

  function updateTuner(noteInfo, frequency) 
  {
    //TODO: Assert params

    //console.log('freq', frequency);
    
    var error;
    var noteView = document.getElementById("noteView");
    var needle = document.getElementById("needle2");

    if (frequency < 370.975){

        for(var i = 0; i < noteInfo.length; i++){

            // I intervallet
            if(frequency > noteInfo[i].min && frequency < noteInfo[i].max){

                //Sätter vilken not vi vill stämma efter
                noteView.innerHTML = noteInfo[i].string;
                //Skillnaden mot stämnoten, antingen + eller -
                error = frequency - noteInfo[i].freq;
                break;

            }
        }

        //Ändra pilen
        needle.style.webkitTransform = 'rotate('+error+'deg)';
        needle.style.MozTransform = 'rotate('+error+'deg)';

        //console.log("error", error);

        //0.05 från början
        if (Math.abs(error) < 1)
        {
          var tip = document.getElementById("tip");
          var tick = document.getElementById("tick_0");
          tip.className = "tipHighlighted";
          tick.className = "tick_0_highlighted";
        }
        else
        {
          var tip = document.getElementById("tip");
          var tick = document.getElementById("tick_0");
          tip.className = "tipNormal";
          tick.className = "tick_0_normal";
        }
    }
/*
    if(!(noteIndex && noteError) || !(noteIndex > 0 && noteIndex <12) || !(noteError > -50 && noteError < 50))
      return;
    

    var sharpHtml = '<sup class="sharp">#</sup>';
    var notes = ['C','C'+sharpHtml,'D','D'+sharpHtml,'E','F','F'+sharpHtml,'G','G'+sharpHtml,'A','A'+sharpHtml,'B'];
    var needle = document.getElementById("needle2");

    var degrees = noteError*2.0*dialDegrees;
    needle.style.webkitTransform = 'rotate('+degrees+'deg)';
    needle.style.MozTransform = 'rotate('+degrees+'deg)';

    var noteView = document.getElementById("noteView");
    noteView.innerHTML = notes[noteIndex];

    //var body = document.getElementsByTagName("body")[0];

    */
    
  }
    //Copyright Tom Hoddes 2014 http://freetuner.co 
  var audioContext = new AudioContext();
  var inputStreamNode = null,
      gainNode = null;

  function getMaxPeak(inputVector,numFreq)
  {
      numFreq = typeof numFreq !== 'undefined' ? numFreq : 2000;

      var vec1 = inputVector;
      var vec2 = [], vec3 = [], vec4 = [], vec5 = [];
  
      //console.log(vec1);

      for(var i = 0; i < numFreq; i++)
      {
        if(i%2 == 0)
          vec2.push(inputVector[i]);      
        if(i%3 == 0)
          vec3.push(inputVector[i]);
        if(i%4 == 0)
          vec4.push(inputVector[i]);
        if(i%5 == 0)
          vec5.push(inputVector[i]);
      }

      var SumVec = [];
      for(var i = 0; i < numFreq; i++)
      {
        SumVec[i] = vec1[i] + vec2[i] +  vec3[i] + vec4[i] + vec5[i];
      }

      //var peaks = [];
      var peakMax = 0;
      var peakMaxInd = 0;
      var size = inputVector.length * 2;

      


      for(var i=7;i<numFreq;i++)
      {
          var amplitude = SumVec[i];
          if(amplitude>peakMax)
          {
              peakMax=amplitude;
              peakMaxInd=i;
          }
      }
      return {"peakInd":peakMaxInd,"peakAmp":peakMax};
  }

  //MAIN

  var scriptProcessorNode;
  var audioWindowSize = 65536;
  var audioWindow = new Float32Array(audioWindowSize);
  var audioWindowProcessed = new Float32Array(audioWindowSize);
  var hammingWindowFilter = new Float32Array(audioWindowSize);
  var sampleRate;
  for (var i = 0; i < hammingWindowFilter.length; i++) {  //skapar ett hammingfilter (fönsterfunktion) som vi sedan multiplicerar med ljudsignal för att få ut den delen vi är intresserade av
      hammingWindowFilter[i] = 0.54 - 0.46 * Math.cos(2*Math.PI * i/(hammingWindowFilter.length-1));
  };
  var fft;

  function applyHamming(inputVector, outputVector)
  {
      for (var i = 0; i < inputVector.length; i++) {
          outputVector[i] = inputVector[i] * hammingWindowFilter[i];
      };
  }

  function log2(val) 
  {
    return Math.log(val) / Math.LN2;
  }

  function getNoteInfo()
  {

    /*
      var note = (Math.round(57+log2( frequency/440.0 )*12 ))%12;
      var noteFull = Math.round(log2( frequency/440.0 )*12);
      var noteFreq = Math.pow(2,noteFull/12.0)*440.0;

      console.log('note', note, 'notefull', noteFull, 'noteFreq', noteFreq);

      var errorMin = frequency - noteFreq;
      var noteOther = (errorMin > 0) ? noteFull+1 : noteFull-1;
      var freqOther = Math.pow(2,noteOther/12.0)*440.0;
      var cent = errorMin / Math.abs(noteFreq - freqOther);

      console.log('note' ,note , 'cent ' ,cent , 'frekvens ', frequency);
      
      var noteInfo = {
          "noteIndex": note,
          "noteError": cent,
          "noteFreq": frequency
      };

      return noteInfo;*/

      var E = {
          'string': 'E',
          "freq": 82.41,
          "min": 0,
          "max": 93.205
      };

      var A = {
          'string': 'A',
          "freq": 110.00,
          "min": 93.205,
          "max": 128.415
      };

      var D = {
          'string': 'D',
          "freq": 146.83,
          "min": 128.415,
          "max": 171.415
      };

      var G = { 
          'string': 'G',
          "freq": 196.00,
          "min": 171.415,
          "max": 221.47
      };

      var B = {
          'string': 'B',
          "freq": 246.94,
          "min": 221.47,
          "max": 288.285
      };

      var Emax = {
          'string': 'E',
          "freq": 329.63,
          "min": 288.285,
          "max": 370.975
      };

      return [E, A, D, G, B, Emax];

  }
  // Create a stream of the audio input 
  function gotStream(stream) {
      var bufferSize = 2048; // Måste va power of 2, 
      gainNode = audioContext.createGain(); //Skapar GainNode objekt som kan kontrollera volymen
      gainNode.gain.value = 1000.0;
      
      inputStreamNode = audioContext.createMediaStreamSource(stream); //Skapar ett MediaStreamAudioSourceNode objekt som strömmar in ljud från mikrofonen.
      inputStreamNode.connect(gainNode); //Kopplar ihop med ljudkontrollen

      scriptProcessorNode = audioContext.createScriptProcessor(bufferSize, 1, 1); //För ljudanalys, en inkanal och en utkanal
      //console.log('script ', scriptProcessorNode);

      sampleRate = audioContext.sampleRate; //Hämta sample per sekund från audio input, används för alla objekt/noder 
      //console.log('sampleRate ', sampleRate, audioWindowSize);
      fft = new FFT(audioWindowSize, sampleRate); //Skapar fouriertransform. Hitta en balans mellan windowsize och samplerate (65536, 48000 standard?)

      gainNode.connect(scriptProcessorNode); //koppla ihop volym och ljudobjekt 

      // zeroPadding/zeroGain öka  vektorn för att få bättre upplösning i frekvensen. nogrannare. Effektivare
      zeroGain = audioContext.createGain();
      zeroGain.gain.value = 0.0;
      scriptProcessorNode.connect( zeroGain );
      zeroGain.connect( audioContext.destination ); 

      play();
  }

  function stopAudio()
  {
      scriptProcessorNode.onaudioprocess = null;
  }

  function startAudio()
  {
      //onaudioprocess är en eventhandler. 
      scriptProcessorNode.onaudioprocess = function(e){
          var timeVector = e.inputBuffer.getChannelData(0); //Hämta vektorn med audioData
          audioWindow.set(audioWindow.subarray(timeVector.length)); // fixa med hamming
          audioWindow.set(timeVector,audioWindowSize - timeVector.length); // fixa med hamming
          applyHamming(audioWindow,audioWindowProcessed); // lägg hamming
          fft.forward(audioWindowProcessed);  //gör fast fourier transform

          var spectrum = fft.spectrum;    //ta frekvensspektrumet 
          //console.log(spectrum);
          var peakInfo = getMaxPeak(spectrum);  //hämta frekvens där vi har högst amplitud
          if (peakInfo["peakAmp"] > 0.5)    //använd bara peakar över 0.5 för bättre nogrannhet
          {
              var frequency = peakInfo["peakInd"]*sampleRate/audioWindowSize;   //omvandla till frekvens
              var noteInfo = getNoteInfo();      //Hämta info från noter
              //updateTuner(noteInfo["noteIndex"],noteInfo["noteError"]);
              updateTuner(noteInfo, frequency);
          }
      }
  }

  function browserNotSupported()
  {
      alert("Sorry. Your browser is not supported. Please use latest versions of either Chrome or Firefox.")
  }
  //allow audio from user
  $scope.initAudio = function () {
      // console.log('initAudio')
      if (!navigator.getUserMedia)
      {
          navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      }

      if (!navigator.getUserMedia)
      {
          browserNotSupported();
      }

      // which media input is used , 
      navigator.getUserMedia({audio:true}, gotStream, function(e) {
               alert('Error getting audio');
              console.log(e);
        });
  }

  $scope.$on('$viewContentLoaded', function(){
      $scope.initAudio();
  }) ;

})

.controller('MetronomoCtrl', function($scope, $ionicModal, $sce) {
	
	
	$scope.event = { 'audios': [
        $sce.trustAsResourceUrl('audio/4d.wav'),
        $sce.trustAsResourceUrl('audio/lata.wav'),
        $sce.trustAsResourceUrl('audio/ping.wav')
    ]};
	
	$ionicModal.fromTemplateUrl('setup.html', {
		scope: $scope,
		animation: 'slide-in-up'
	  }).then(function(modal) {
		$scope.modal = modal;
	  });	  
	  
	   $scope.setupMetronomo = function() {
		$scope.modal.show();
	  };
	  $scope.openModal = function() {
		$scope.modal.show();
	  };
	  $scope.closeModal = function() {
		$scope.modal.hide();
	  };
	  
	  $scope.setAudio = function(audio, m) {
		/*
		//var audio_file = "audio/" + audio + ".wav?raw=true";
		var audio_file = "audio/ping.wav?raw=true";
		
		m = metronome({
			len: 200,
			angle: 20,
			tick: tick,
			complete: done,
			audio: audio_file
		});
		*/
		
		$scope.modal.hide();
	  };
	  
	  
})
.filter('trustedAudioUrl', function($sce) {
	return function(path, audioFile) {
		return $sce.trustAsResourceUrl(path + audioFile);
	};
})
.controller('AudioTestCtrl', function($scope) {
	$scope.event = { 'audios': ['4d', 'lata','ping']};
})

.controller('AccountCtrl', function($scope) {

});

