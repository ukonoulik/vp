const express = require('express');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
//moodul andmebaasiga suhtlemiseks, koos async võimalustega
const mysql = require('mysql2/promise');
//sessiooni moodul
const session= require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const dateET = require('./src/dateTimeET');
//sisselogimise kontrolli vahevara
const checkLogin = require('./src/checkLogin');
//moodul keskkonnamuutujate lugemiseks
require('dotenv').config();

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//käivitan express() funktsiooni ja tähistan töötava asja nimega "app"
const app = express();
//määrame sessioonihalduse
//esimene variant kasutas default memorystore'i ja säilitas vaid ühe sessiooni korraga
//app.use(session({secret: process.env.SES_SECRET, saveUninitialized: false, resave: true}));
const sessionStore = new MySQLStore({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
app.use(session({
	secret: process.env.SES_SECRET,
	store: sessionStore,
	saveUninitialized: false,
	resave: false,
	cookie: {
		maxAge: 1000 * 60 * 60 * 1 //sessioon aegub tunniga
	}
}));
//määrame veebilehe mallide järgi renderdamise mootori (EJS)
app.set('view engine', 'ejs');
//muudan "public" veebiserverile kättesaadavaks
app.use(express.static('public'));
//hakkame päringuid parsima, kui on ainult tekst, siis "false"
app.use(bodyparser.urlencoded({extended: true}));

app.get('/', async (req, res)=>{
	//res.send('Express.js veeb käivitus!');
	const day = dateET.dayET();
	const date = dateET.dateET(0);
	const time = dateET.timeET();
	let conn;
	try {
		let sqlReq = "SELECT filename, alttext FROM galleryphotos WHERE id=(SELECT MAX(id) FROM galleryphotos WHERE privacy=? AND deleted IS NULL)";
		const privacy = 3;
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		const [rows, fields] = await conn.execute(sqlReq, [privacy]);
		let imgAlt = "Avalik foto";
		if(rows[0].alttext != ""){
			imgAlt = rows[0].alttext;
		}
		res.render('index', {day: day, date: date, time: time, imgFile: process.env.GALLERY_NORMAL + rows[0].filename, imgAlt: imgAlt});
	}
	catch (err) {
		console.log(err);
		res.render('index', {day: day, date: date, time: time, imgFile: 'pic/vp_logo_small.png', imgAlt: 'VP logo'});
	}
	finally {
		if(conn){
			await conn.end();
			//console.log("Andmebaasiühendus suletud!");
		}
	}
});

app.get('/home', checkLogin.isLogin, (req, res) => {
	res.render('home');
});

app.get('/logout', (req, res) => {
	//hävitame sessiooni
	req.session.destroy();
	res.redirect('/');
});

app.get('/vanasona', async (req, res)=>{
	try {
		const data = await fs.readFile(textRef, 'utf8');
		let folkWisdom = data.split(';');
		let wisdom = folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))];
		res.render('wisdom', {wisdom: wisdom});
	}
	catch (err){
		console.log(err);
		res.render('wisdom', {wisdom: 'Kahjuks Ã¼htegi vanasÃµna ei leitud!'});
	}
});

app.get('/regvisit', (req, res)=>{
	res.render('regvisit');
});

app.post('/regvisit', async (req, res)=>{
	console.log(req.body);
	try {
		await fs.open(regTextRef, 'a');
		await fs.appendFile(regTextRef, req.body.nameInput + ';');
		res.render('regvisit');
	}
	catch (err) {
		console.log(err);
		res.render('regvisit');
	}	
});

//eraldi marsruudifailiga marsruudid
const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);

const galleryPhotoUploadRouter = require('./routes/galleryPhotoUploadRoutes');
app.use('/galleryphotoupload', galleryPhotoUploadRouter);

const galleryRouter = require('./routes/galleryRoutes');
app.use('/gallery', galleryRouter);

const signupRouter = require('./routes/signupRoutes');
app.use('/signup', signupRouter);

const signinRouter = require('./routes/signinRoutes');
app.use('/signin', signinRouter);

app.listen(5312);