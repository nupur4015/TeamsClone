//let socket = io.connect("http://localhost:3000");
var socket = io.connect("https://teams-q8mr.onrender.com/");
var username = document.getElementById("username").innerText;
var message = document.getElementById("message");
var button = document.getElementById("send");
var output = document.getElementById("output");
var ppl=document.getElementById("ppl");
var image=document.getElementById("i");
var people=[];


button.addEventListener("click", function () {
  socket.emit("sendingMessage", {
    message: message.value,
    user: username  
  });
});

socket.on("broadcastMessage", function (data) {
  if(data.message!=''){
  image.style="display:flex";                                         //to display names of people who were chatting
  if(people.includes(' ' +data.user)==false)
  people.push(' ' +data.user);
  ppl.innerHTML=people;
  output.innerHTML +=
  "<p><strong>"+ data.user + ": </strong>" +data.message + "</p>";
  message.value='';}
});
