//------------------------------------------IMPORT---------------------------------------------------------------------/
const express = require('express');
const mysql = require('mysql');
const app = express();
const net = require('net');
//const reload = require('reload');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mac = require('getmac');
const bodyParser = require("body-parser");
const Passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');
var router = express.Router();
const EventEmitter = require('events');
const emitter = new EventEmitter()
emitter.setMaxListeners(50)
//----------------------------KHAI BAO BIEN----------------------------------//
var HOST = '203.128.241.216';
var PORT =  3000;
var key ;
var name;
var ThietBiChon = [];
var ThietBiKetnoi = [];
var ToadoA = [];
var ToadoB = [];
var NguoiChoi =[];
var device;
var data1;
//Create app server 
server.listen(3000,function(){
	console.log("Server is listening on port 3000");
});

app.set('view engine','ejs');
app.set('views','./views');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: "mysecret", resave: true, saveUninitialized: true,cookie: { secure: false } }));
app.use(Passport.initialize());
app.use(Passport.session())



//---------------------------------------------------DATABASE-----------------------------------------------------------/
// var con = mysql.createConnection({
  // host: "localhost",
  // user: "root",
  // password: "",
  // database: "battleship"
// });

// con.connect(function(err) {
  // if (err) throw err;
  // con.query("SELECT * FROM player ", function (err, result, fields) {
    // if (err) throw err;
  // });
// });
// Display on website
app.get('/',function(req,res){
	res.render('index');
});

app.route('/login')
.get((req,res)=>res.render('login'))
.post(Passport.authenticate('local', {failureRedirect: '/login',
	                                 successRedirect: '/home'}))
app.get('/home',(req,res)=>{
	if(req.isAuthenticated()){
		res.render('home')
		// res.send("Name:" +req.session.passport.user)
		
	}else{
		res.redirect('login')
	}
});

Passport.use(new LocalStrategy(
	(username, password, done)=> {
		fs.readFile('./userDB.json',(err,data)=>{
			const db = JSON.parse(data)
			const userRecord = db.find(user=> user.username == username);
			if(userRecord && userRecord.password == password ){
				return done(null, userRecord);
			}else{
				return done(null, false);
			}
		})
	}
))
Passport.serializeUser((user,done) => {
	done(null,user.username)
})

Passport.deserializeUser((name,done)=>{
	fs.readFile('./userDB.json',(err, data)=>{
		const db = JSON.parse(data)
		const userRecord = db.find(user => user.username == name)
		if(userRecord){
				return done(null, userRecord)
			}else{
				return done(null, false)
			}
})
})
//---------------------------------------------------XU LY NHận tay cầm---------------------------------------------------/
io.sockets.setMaxListeners(0);
io.on("connection", function(socket){
	console.log(socket.id +" is connected");

	socket.on("disconnect",function(){
		console.log(socket.id + "disconnected");
	console.log("AHIIIIII: " + ToadoA)
	});
	socket.on("Play-now",function(){
		socket.emit("Ban-do-ta", ToadoA);
	})
     // XỬ LÝ CHO DEVICE 01 
	
	socket.on("Xac-thuc-Device01",function(data){
		io.sockets.emit("Selected",data);                                      // Thông báo cho người chơi còn lại thiết bị đã được chọn
		console.log("Nguoi dung chon thiet bi: "+ data);
		
		socket.on("Toa-do",function(data){                                      // Thêm tọa độ người chơi A đã chọn vào mảng
			if(ToadoA.indexOf(data)>=0 || ToadoA.length >=3 ){                  // Cho phép chọn tối đa 3 điểm
				console.log("Không hợp lệ");
			}else{
				ToadoA.push(data);
				console.log("A: " +ToadoA);
				if(ToadoA.length ==3){
					 io.sockets.emit("ReadyA");
				 }
			}
		});
		
		app.post('/name1', function(req, res) {		
			name = req.query.state;				
			if(name=="Device01"){
			console.log("Đã kết nối với thiết bị " + name);
			// Receive value of keypad
			app.post('/key1', function(keyreq, keyres) {	
	
				key = keyreq.query.state;
				keyres.send('Data received: ' + key);
				console.log("key A :" + key);
				socket.emit("Sent-key-from-AAA", key);
				socket.emit("Sent-key-to-Play", key);

	});
		}else{
			console.log("Khong hop le");
		};
		
	});
	});
	  // XỬ LÝ CHO DEVICE 02 
	socket.on("Xac-thuc-Device02",function(data){
		io.sockets.emit("Selected",ThietBiChon);                                      // Thông báo cho người chơi khác thiết bị đã được chọn
		console.log("Nguoi dung chon thiet bi: "+ data);
		socket.on("Toa-do",function(data){                                      // Thêm tọa độ người chơi A đã chọn vào mảng
			if(ToadoB.indexOf(data)>=0 || ToadoB.length >=3){
				console.log("Không hợp lệ");
			}else{
				ToadoB.push(data);
				console.log("B: " +ToadoB);
				 if(ToadoB.length ==3){
					 io.sockets.emit("ReadyB");
				 }
			}
		});
		app.post('/name2', function(req, res) {		
			name = req.query.state;
				
			if(name=="Device02"){
			console.log("Đã kết nối với thiết bị "+ name);
			app.post('/key2', function(keyreq, keyres) {	
	
				key = keyreq.query.state;
				keyres.send('Data received: ' + key);
				console.log("key B:" + key);
				socket.emit("Sent-key-from-AAA", key);
				socket.emit("Sent-key-to-Play", key);
	});
		}else{
			console.log("Khong hop le");
		};
		
	});
	});
	//---------------------------------------------------XU LY CHƠI---------------------------------------------------/
	
		// Receive name of keypad2er
		// socket.on("Xac-thuc",function(data){
				// device = data;
				// console.log("Thiet bi da chon: "+device);
				// io.sockets.emit("Da-chon",device);             // Thong bao voi nguoi choi con lai la thiet bi da duoc chon
				// socket.emit("Da-chonx",device);
		// app.post('/name', function(req, res) {		
			// name = req.query.state;
				
			// if((device = "Device01")&& (name=="Device01")){

			// console.log("name=" + name);
			// socket.device = name;
			// io.sockets.emit("List-device", thietbi);
			// io.sockets.emit("Sent-name", name);
			//Receive value of keypad
			// app.post('/key1', function(keyreq1, keyres1) {	
	
				// key1 = keyreq1.query.state;
				// keyres1.send('Data received: ' + key1);
				// console.log("key-1:" + key1);
				// socket.emit("Sent-key-from-AAA", key1);
	// });
		// }else{
			// console.log("Khong hop le");
		// };
		
	// });
// });
});


