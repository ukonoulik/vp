const express = require('express');
const dateTimeET = require('./src/dateTimeET.js');
const fs = require('fs').promises; 
const bodyparser = require('body-parser');
//moodul andmebaasiga suhtlemiseks, koos async 
const mysql = require('mysql2/promise')
//moodul keskkonnamuutujate lugemiseks 
require('dotenv').config();

const textRef = 'public/txt/vanasonad.txt';
const regTextRef = 'public/txt/visits.txt';

//käivitan express() funktsiooni ja tähistan töötava asja nimega "app"
const app = express();
//määrame veebilehe mallide järgi renderdamise mootori (EJS)
app.set('view engine', 'ejs');
//muudan "public" veebiserverile kättesaadavaks
app.use(express.static('public'));

//hakkame päringuid parsima 
app.use(bodyparser.urlencoded({extended: false}));

//avaleht
app.get('/', (req, res)=>{
	//res.send('Express.js veeb käivitus!');
	const day = dateTimeET.dayET();
	const date = dateTimeET.dateET();
	const time = dateTimeET.timeET();
	res.render('index', {day: day, date: date, time: time});
});

//eelmise kodutöö leht
app.get('/miks-tlu', (req, res)=>{
	res.render('miks-tlu');
});

//vanasõnade leht
app.get('/vanasona', async (req, res)=>{
	try {
		const data = await fs.readFile(textRef, 'utf8');
		let folkWisdom = data.split (';');
		let wisdom = folkWisdom[Math.round(Math.random() * (folkWisdom.length - 1))];
		res.render('wisdom', {wisdom: wisdom});
	}
	catch (err){
		conosle.log(err);
		res.render('wisdom', {wisdom: 'Vanasõna ei leitud'});
	}
});

//külastuse leht
app.get('/regvisit', (req, res)=>{
	res.render('regvisit');
});

//külastuse salvestamine
app.post('/regvisit', async (req, res)=>{
	console.log(req.body);
	try {
		const name = req.body.nameInput;
		const date = dateTimeET.dateET();
		const time = dateTimeET.timeET();
		await fs.open(regTextRef, 'a');
		await fs.appendFile(regTextRef, name + ', ' + date + ', ' + time + ';');
		res.render('regvisit');
	}
	catch (err){
		console.log(err);
		res.render('regvisit');
	}
});

//viimase registreeritud külastuse leht
app.get('/lastvisit', async (req, res)=>{
	try {
		const data = await fs.readFile(regTextRef, 'utf8');
		const visits = data.split(';');

		//Failis on iga kirje lõpus semikoolon, seega viimane element on tühi.
		const lastVisit = visits[visits.length - 2];

		if (!lastVisit) {
			return res.render('lastvisit', {message: 'Ühtegi külastust ei ole veel registreeritud.'});
		}

		const lastVisitParts = lastVisit.split(',');
		const name = lastVisitParts[0].trim();
		const date = lastVisitParts[1].trim();
		const time = lastVisitParts[2].trim();

		const message = 'Viimati registreeriti külastus ' + date + ', kell ' + time + ' kui seda tegi ' + name + '.';
		res.render('lastvisit', {message: message});
	}
	catch (err){
		console.log(err);
		res.render('lastvisit', {message: 'Külastuste faili ei õnnestunud lugeda.'});
	}
});

//eesti filmi leht
app.get('/eestifilm', (req, res)=>{
	res.render('eestifilm');
});

//eesti film alaleht
app.get('/eestifilm/film_inimesed', async (req, res)=>{
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		//defineerime SQL päringuid
		let sqlReq = 'SELECT * FROM person';
		//käivitame päringu
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render('film_inimesed', {personList: sqlRes});
	}
	catch (err) {
		console.log('Andmebaasiga suhtlemise viga. ' + err);
		res.render('film_inimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.get('/eestifilm/lisa_film_inimesed', (req, res)=>{
	res.render('lisa_film_inimesed', {notice: 'Ootan sisestust!'});
});

app.post('/eestifilm/lisa_film_inimesed', async (req, res)=>{
	console.log(req.body);
	//kontrollime andmeid, kõige lahjem kontroll 
	let deceasedDate = null;
	if(req.body.deceasedInput != ''){
		deceasedDate = req.body.deceasedInput;
	}
	const bornDate = new Date(req.body.bornInput);
	const timeNow = new Date();
	
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.bornInput ||isNaN(bornDate.getTime()) || bornDate > timeNow){
		console.log("Andmed pole korreksted!");
		return res.render('lisa_film_inimesed', {notice: 'Sisestatud andmed pole korreksted!'});
	}
	let conn; 
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		let sqlReq = 'INSERT INTO person (first_name, last_name, born, deceased) VALUES (?,?,?,?)';
		await conn.execute(sqlReq, [
			req.body.firstNameInput,
			req.body.lastNameInput,
			req.body.bornInput,
			req.body.deceasedInput
		]);
		res.render('lisa_film_inimesed', {notice: req.body.firstNameInput + ' ' + req.body.lastNameInput + 'Andmebaasi salvestatud!'});
	}
	catch (err) {
		console.log('Andmebaasiga suhtlemise viga: ' + err);
		res.render('lisa_film_inimesed', {notice: 'Tekkis viga, andmeid ei salvestatud!'});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
});

app.listen(5312);
