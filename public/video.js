var socket = io.connect("localhost:3000");
//var socket = io.connect("https://lower-worms-70452.herokuapp.com");
var divvidcall = document.getElementById("videocall");
var joinButton = document.getElementById("join");
var userVideo = document.getElementById("user"); 
//var peerVideo = document.getElementById("peer");
var p=[];
var roomInput = document.getElementById("roomName");
var useremail = document.getElementById("useremail").innerText;
var mirrorMode;
var mute = document.getElementById("mute");
var leave = document.getElementById("leave");
var hide = document.getElementById("hide");
var divbtns = document.getElementById("btns");
var mutevalue=false;
var hidevalue=false;


var roomName;
var creator = false;
var rtcPeerConnection;
var userStream;

// contains stun server
var iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

joinButton.addEventListener("click", function () {
  if (roomInput.value == "") {
    alert("Please enter a room name");
  } else {
    roomName = roomInput.value;
    socket.emit("join", roomName);
  }
});

mute.addEventListener("click", function () {
  mutevalue=!mutevalue;
  if(mutevalue){
  mute.textContent="Unmute";
  }
  else{
  mute.textContent="Mute";
  }
});

hide.addEventListener("click", function () {
  hidevalue=!hidevalue;
  if(hidevalue){
  hide.textContent="Unhide";
  }
  else{
  hide.textContent="Hide";
  }
});

// room created

socket.on("created", function () {
  creator = true;

  navigator.mediaDevices
    .getUserMedia({
      audio:  {echoCancellation: true,
      noiseSuppression: true },
      video: { width: 600, height: 450 },
    })
    .then(function (stream) {
      userStream = stream;
      divvidcall.style = "display:none";
      divbtns.style="display:flex";
      //userVideo.id=`${ partnerName }-video`;
      mirrorMode=true;
      userVideo.srcObject = stream;
      mirrorMode ? userVideo.classList.add( 'mirror-mode' ) : userVideo.classList.remove( 'mirror-mode' );
     
      //document.getElementById("videocallroom").appendChild(userVideo);

    })
    .catch(function (err) {
      alert("Couldn't Access User Media");
    });
});

// room joined

socket.on("joined", function () {
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: {echoCancellation: true,
        noiseSuppression: true },
      video: { width: 600, height: 450 },
    })
    .then(function (stream) {
      userStream = stream;
      divvidcall.style = "display:none";
      divbtns.style="display:flex";
      
      mirrorMode=true;
      userVideo.srcObject = stream;
      mirrorMode ? userVideo.classList.add( 'mirror-mode' ) : userVideo.classList.remove( 'mirror-mode' );
      
      socket.emit("ready", roomName);
    })
    .catch(function (err) {
      alert("Couldn't Access User Media");
    });
});

// room is full

socket.on("full", function () {
  alert("Room is Full, Can't Join");
});

// ready to communicate

socket.on("ready", function () {
  if (creator) {
    p[useremail] = new RTCPeerConnection(iceServers);
    p[useremail].onicecandidate = OnIceCandidateFunction;
    p[useremail].ontrack = OnTrackFunction;
    p[useremail].addTrack(userStream.getTracks()[0], userStream);
    p[useremail].addTrack(userStream.getTracks()[1], userStream);
    p[useremail]
      .createOffer()
      .then((offer) => {
        p[useremail].setLocalDescription(offer);
        socket.emit("offer", offer, roomName);  
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

// receiving an ice candidate from the peer

socket.on("candidate", function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  p[useremail].addIceCandidate(icecandidate);
});

// receiving an offer from the person who created the room

socket.on("offer", function (offer) {
  if (!creator) {
    p[useremail] = new RTCPeerConnection(iceServers);
    p[useremail].onicecandidate = OnIceCandidateFunction;
    p[useremail].ontrack = OnTrackFunction;
    p[useremail].addTrack(userStream.getTracks()[0], userStream);
    p[useremail].addTrack(userStream.getTracks()[1], userStream);
    p[useremail].setRemoteDescription(offer);
    p[useremail]
      .createAnswer()
      .then((answer) => {
        p[useremail].setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

// receiving an answer from the person who joined the room

socket.on("answer", function (answer) {
  p[useremail].setRemoteDescription(answer);
});

//RTCPeerConnection functions defined

function OnIceCandidateFunction(event) {
  console.log("Candidate");
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

function OnTrackFunction(event) {
  if ( document.getElementById(useremail+"-video") ) {
    document.getElementById(useremail+"-video").srcObject=event.streams[0];
  
  }
  else{
  
  let newVid = document.createElement( 'video' );
  newVid.id = useremail+"-video";
  newVid.srcObject = event.streams[0];
  newVid.autoplay=true;
  document.getElementById("videocallroom").appendChild(newVid);
 
}
/*
peerVideo.srcObject = event.streams[0];
peerVideo.onloadedmetadata = function (e) {
  peerVideo.play();
}; */
}