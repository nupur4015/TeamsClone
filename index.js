const express = require("express");
const socket = require("socket.io");
const mongoose=require("mongoose");
const app = express();
const authRoutes = require('./routes/authRoutes');
const cookieParser = require('cookie-parser');
const { requireAuth, checkUser } = require('./middleware/authMiddleware');
const Msg = require("./models/Msg");
let port = process.env.PORT;

if (port == null || port == "") {
  port = 3000;
}

let server = app.listen(port);

// connects to mongodb 
const dbURI = "mongodb+srv://nwuser:harry1234@cluster0.qfuae.mongodb.net/web-app?retryWrites=true&w=majority";
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(result => console.log('connected to mogodb'))
  .catch(err => console.log(err));


//view engine
app.set('view engine', 'ejs');


//middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

//routes
app.get('*', checkUser);
app.get('/', (req, res) => {
  res.render('home');
});


app.get('/video',requireAuth,(req,res)=>{
  Msg.find()
 .then(result => {
   res.render('video', { msgs: result});        //getting messages from database
 })
 .catch(err => {
   console.log(err);
 });
});
app.get('/chat',requireAuth,(req,res)=>{
  res.render('chat');
});
app.use(authRoutes);

//server upgraded
let io = socket(server);

//client connected
io.on("connection", function (socket) {
  console.log("User Connected :" + socket.id);

  //join room button hit
  socket.on("join", function (roomName) {
    let rooms = io.sockets.adapter.rooms;
    let room = rooms.get(roomName);
    
    
    if (room == undefined) {
      socket.join(roomName);
      socket.emit("enter");
    } else if (room.size ==1) {
      //one person is inside the room
      socket.join(roomName);
      socket.emit("enter");
    } else {
      //two people inside the room
      socket.emit("full");
    }
  });

  //start meeting button hit
  socket.on("start",function(){
    socket.emit("created");
  });
  
  //join meeting button hit
  socket.on("joining",function(){ 
    socket.emit("joined");  
  });
    

  //ready to communicate
  socket.on("ready", function (roomName) {
    socket.broadcast.to(roomName).emit("ready");    //other person in the room informed
  });

  
  //gets an icecandidate from a person in the room
  socket.on("candidate", function (candidate, roomName) {
    console.log(candidate);
    socket.broadcast.to(roomName).emit("candidate", candidate);   //sends candidate to the other peer in the room
  });

  //gets an offer from a person in the room
  socket.on("offer", function (offer, roomName) {
    socket.broadcast.to(roomName).emit("offer", offer);    //sends Offer to the other person in the room
  });


  //answer recieved from a person in the room
  socket.on("answer", function (answer, roomName) {
    socket.broadcast.to(roomName).emit("answer", answer);   //sends answer to the other person in the room
  });

  //real-time chat broadcast message
  socket.on("sendingMessage", function (data) {
    io.emit("broadcastMessage", data);
  });
  
  //chat in meet
  socket.on("Chat", async function (data) {
    const msg = await Msg.create({ roomName:data.roomName,user:data.user, message:data.message });
    io.to(data.roomName).emit("Message", data);
  });

  //leave room
  socket.on("leave",function(roomName){
    socket.leave(roomName);
    socket.broadcast.to(roomName).emit("leave");
  });
});
