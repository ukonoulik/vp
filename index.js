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
		conosle.log('Vanasõna lugemise viga: ' + err);
		res.render('wisdom', {wisdom: 'Vanasõna ei leitud'});
	}
});

app.use('/eestifilm', require('./routes/eestifilmRoutes'));
app.use('/visits', require('./routes/visitsRoutes'));

app.get('/regvisit', (req, res) => res.redirect('/visits/regvisit'));
app.post('/regvisit', (req, res) => res.redirect(307, '/visits/regvisit'));
app.get('/lastvisit', (req, res) => res.redirect('/visits'));

module.exports = app;

/*
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

const eestifilmRouter = require('./routes/eestifilmRoutes');
app.use('/eestifilm', eestifilmRouter);

const filmid = require('./routes/eestifilmRoutes');
app.use('/eestifilm/filmid', eestifilmRouter);

const ametid = require('./routes/eestifilmRoutes');
app.use('/eestifilm/ametid', eestifilmRouter);


//eesti filmi leht
/* app.get('/eestifilm', (req, res)=>{
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

//kas kuupäev on olemas 
function kontrolliKuupaev(vaartus) {
    if (typeof vaartus !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(vaartus)) {
        return null;
    }
    const kuupaev = new Date(vaartus + 'T00:00:00');
    const [aasta, kuu, paev] = vaartus.split('-').map(Number);
    if (isNaN(kuupaev.getTime()) || kuupaev.getFullYear() !== aasta ||
        kuupaev.getMonth() + 1 !== kuu || kuupaev.getDate() !== paev) {
        return null;
    }
    return kuupaev;
}

//filmiga seotud inimesed
app.get('/eestifilm/lisa_film_inimesed', (req, res)=>{
	res.render('lisa_film_inimesed', {
		notice: 'Ootan sisestust!'
	});
});

app.post('/eestifilm/lisa_film_inimesed', async (req, res)=>{
	const firstNameInput = req.body.firstNameInput || '';
    const lastNameInput = req.body.lastNameInput || '';
    const bornInput = req.body.bornInput || '';
    const deceasedInput = req.body.deceasedInput || '';

    // kui sisestuses on viga, saadab algsed väärtused.
    const sisendid = { firstNameInput, lastNameInput, bornInput, deceasedInput };
    const vead = [];
    const bornDate = kontrolliKuupaev(bornInput);
    const timeNow = new Date();
    timeNow.setHours(0, 0, 0, 0);
    let deceasedDate = null;

    if (!firstNameInput.trim()) {
        vead.push('Eesnimi on kohustuslik.');
    }
    if (!lastNameInput.trim()) {
        vead.push('Perekonnanimi on kohustuslik.');
    }
    if (!bornInput) {
        vead.push('Sünnikuupäev on kohustuslik.');
    } else if (!bornDate) {
        vead.push('Sünnikuupäev ei ole reaalne kuupäev.');
    } else if (bornDate > timeNow) {
        vead.push('Sünnikuupäev ei tohi olla tulevikus.');
    } 

    // surmakuupäev on valikuline, kuid peab õige olema
    if (deceasedInput != '') {
        deceasedDate = kontrolliKuupaev(deceasedInput);
        if (!deceasedDate) {
            vead.push('Surmakuupäev ei ole reaalne kuupäev.');
        } else if (deceasedDate > timeNow) {
            vead.push('Surmakuupäev ei tohi olla tulevikus.');
        } else if (bornDate && deceasedDate < bornDate) {
            vead.push('Surmakuupäev ei tohi olla sünnikuupäevast varasem.');
        } 
    }

    if (vead.length > 0) {
        return res.render('lisa_film_inimesed', {
            notice: vead.join(' '), ...sisendid
        });
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
			deceasedDate ? deceasedInput : null
		]);
		res.render('lisa_film_inimesed', {notice: req.body.firstNameInput + ' ' + req.body.lastNameInput + 'Andmebaasi salvestatud!'});
		// pärast edukat salvestamist tühjendame sisendid (null).
        res.render('lisa_film_inimesed', {
            notice: firstNameInput.trim() + ' ' + lastNameInput.trim() + ' on andmebaasi salvestatud!',
            firstNameInput: null,
            lastNameInput: null,
            bornInput: null,
            deceasedInput: null
        });
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

//filmi lisamise leht
app.get('/eestifilm/lisa_filmid', (req, res)=>{
	res.render('lisa_filmid', {
		notice: 'Ootan sisestust!'
	});
});

app.post('/eestifilm/lisa_filmid', async (req, res)=>{
	const titleInput = req.body.titleInput ||'';
	const yearInput = req.body.yearInput ||'';
	const durationInput = req.body.durationInput ||'';
	const sisendid = { titleInput, yearInput, durationInput };
	const year = Number(yearInput);
	
	if (!titleInput.trim() || year < 1888 || year > 2100 || !durationInput.trim()) {
        return res.render('lisa_filmid', {
            notice: 'Sisesta filmi pealkiri, korrektne väljalaskeaasta (1888–2100) ja kestvus', ...sisendid
        });
    }
	
	let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });
        await conn.execute('INSERT INTO movie (title, release_year, duration_minutes) VALUES (?,?,?)',
            [titleInput.trim(), year, duration]);
        res.render('lisa_filmid', {
            notice: 'Film on salvestatud!', titleInput: null, yearInput: null
        });
    }
    catch (err) {
        console.log('Filmi lisamise viga: ' + err);
        res.render('lisa_filmid', {
            notice: 'Filmi ei õnnestunud salvestada. Kontrolli andmebaasi tabeli olemasolu ja veerunimesid.',
            ...sisendid
        });
    }
    finally {
        if (conn) await conn.end();
    }
});

//filmiameti lisamise leht
app.get('/eestifilm/lisa_ametid', (req, res)=>{
    res.render('lisa_ametid', { notice: 'Ootan sisestust!', professionInput: null });
});

app.post('/eestifilm/lisa_ametid', async (req, res)=>{
    const professionInput = req.body.professionInput || '';
    if (!professionInput.trim()) {
        return res.render('lisa_ametid', {
            notice: 'Ameti nimetus on kohustuslik.', professionInput
        });
    }

    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });
        await conn.execute('INSERT INTO profession (name) VALUES (?)', [professionInput.trim()]);
        res.render('lisa_ametid', {
            notice: 'Amet on salvestatud!', professionInput: null
        });
    }
    catch (err) {
        console.log('Filmiameti lisamise viga: ' + err);
        res.render('lisa_ametid', {
            notice: 'Ametit ei õnnestunud salvestada. Kontrolli andmebaasi tabeli olemasolu ja veerunimesid.',
            professionInput
        });
    }
    finally {
        if (conn) await conn.end();
    }
}); */

app.listen(5312);
