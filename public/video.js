//var socket = io.connect("localhost:3000");
var socket = io.connect("https://teams-q8mr.onrender.com/");
var divvidcall = document.getElementById("videocall");
var joinButton = document.getElementById("join");
var userVideo = document.getElementById("user"); 
let peerVideo = document.getElementById("peer");
var roomInput = document.getElementById("roomName");
var thankyou=document.getElementById("thankyou");
var mute = document.getElementById("mute");
var leave = document.getElementById("leave");
var hide = document.getElementById("hide");
var divbtns = document.getElementById("btns");
var chatBox=document.getElementById("chat-box");
var message = document.getElementById("message");
var button = document.getElementById("send");
var output = document.getElementById("output");
var username = document.getElementById("username").innerText;
var start = document.getElementById("start");
var joining = document.getElementById("joining");
var texts=document.getElementsByClassName("texts");
var mutevalue=false;
var hidevalue=false;
var chatvalue=false;

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

//room entered
socket.on("enter",function(){
  for(var i=0; i<texts.length;i++ ){
    if(texts[i].id==roomName)
    texts[i].style="display:flex";               //display previous messages of the roomname entered
  }
  start.style="display:flex";
  joining.style="display:flex";
  divvidcall.style = "display:none";
  chatBox.style="display:flex";
});

//starting meet
start.addEventListener("click",function(){
  start.style="display:none";
  joining.style="display:none";
  socket.emit("start");
});

//joining meet
joining.addEventListener("click",function(){
  start.style="display:none"; 
  joining.style="display:none";
  socket.emit("joining");
});

mute.addEventListener("click", function () {
  mutevalue=!mutevalue;
  if(mutevalue){
  userStream.getTracks()[0].enabled=false;
  mute.textContent="Unmute";
  }
  else{
  userStream.getTracks()[0].enabled=false;
  mute.textContent="Mute";
  }
});

hide.addEventListener("click", function () {
  hidevalue=!hidevalue;
  if(hidevalue){
  userStream.getTracks()[1].enabled=false;
  hide.textContent="Unhide";
  }
  else{
  userStream.getTracks()[1].enabled=true;
  hide.textContent="Hide";
  }
});

leave.addEventListener("click", function () {
  socket.emit("leave",roomName);
  userVideo.style="display:none";
  peerVideo.style="display:none";
  divbtns.style="display:none";
  chatBox.style="display:none";
  thankyou.style="display:flex";
  if(userVideo.srcObject){
    userVideo.srcObject.getTracks()[0].stop();
    userVideo.srcObject.getTracks()[1].stop();
  }
  if(peerVideo.srcObject){
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  if(rtcPeerConnection){
    rtcPeerConnection.ontrack=null;
    rtcPeerConnection.onicecandidate=null;
    rtcPeerConnection.close();
    rtcPeerConnection=null;
  }
  
});

socket.on("leave", function () {
  
  if(rtcPeerConnection){
    rtcPeerConnection.ontrack=null;
    rtcPeerConnection.onicecandidate=null;
    rtcPeerConnection.close();
    rtcPeerConnection=null;
  }
  if(peerVideo.srcObject){
    peerVideo.srcObject.getTracks()[0].stop();
    peerVideo.srcObject.getTracks()[1].stop();
  }
  peerVideo.style="display:none";
 
});

//room is full
socket.on("full", function () {
  alert("Room is Full, Can't Join");
});

// meeting started
socket.on("created", function () {
  creator = true;
   navigator.mediaDevices
    .getUserMedia({
      audio: {echoCancellation: true,
        noiseSuppression: true },
      video: { width: 550, height: 450 },
    })
    .then(function (stream) {
      userStream = stream;
      divbtns.style="display:flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    })
    .catch(function (err) {
      alert("Couldn't Access User Media");
    });
});

//meeting joined
socket.on("joined", function () {
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: {echoCancellation: true,
        noiseSuppression: true },
      video: { width: 550, height: 450 },
    })
    .then(function (stream) {
      userStream = stream;
      divvidcall.style = "display:none";
      divbtns.style="display:flex";
      chatBox.style="display:flex";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit("ready", roomName);
    })
    .catch(function (err) {
      alert("Couldn't Access User Media");
    });
});



//ready to communicate
socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

//receiving an ice candidate from the peer
socket.on("candidate", function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});

//receiving an offer from the person who created the room
socket.on("offer", function (offer) {
  if (!creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomName);
      })
      .catch((error) => {
        console.log(error);
      });
  }
});

//receiving an answer from the person who joined the room
socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

//RTCPeerConnection functions defined

function OnIceCandidateFunction(event) {
  console.log("Candidate");
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}
function OnTrackFunction(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function (e) {
    peerVideo.play();
  };
}

//chat in meet
button.addEventListener("click", function () {
  socket.emit("Chat", {
    message: message.value,
    user: username,
    roomName:roomName
  });
});

//display message in chat
socket.on("Message",  function (data) {
  if(data.message!=''){
  output.innerHTML +=
  "<p><strong>"+ data.user + ": </strong>" +data.message + "</p>";
  message.value='';}
  });
