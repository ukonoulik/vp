const mysql = require('mysql2/promise');

//@desc home page for Estonian Film section
//@route GET /eestifilm
//@access public

//app.get('/eestifilm', (req, res)=>{
const eestifilm = (req, res) => {
	res.render('eestifilm');
};

//@desc page for people involved in Estonian Film industry
//@route GET /eestifilm/film_inimesed
//@access public

//app.get('/eestifilm/film_inimesed', async (req, res)=>{
const eestifilmInimesed = async (req, res) => {
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		//defineerime SQL pÃ¤ringu
		let sqlReq = 'SELECT * FROM person';
		//kÃ¤ivitame pÃ¤ringu
		const [sqlRes] = await conn.execute(sqlReq);
		console.log(sqlRes);
		res.render('film_inimesed', {personList: sqlRes});
	}
	catch (err) {
		console.log('Andmebaasiga suhtlemise viga: ' + err);
		res.render('film_inimesed', {personList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

//@desc page for adding people involved in Estonian Film industry
//@route GET /eestifilm/lisa_film_inimesed
//@access public

//app.get('/eestifilm/lisa_film_inimesed', (req, res)=>{
const eestifilmInimesedLisa = (req, res) => {	
	res.render('lisa_film_inimesed', {notice: 'Ootan sisestust!'});
};

//@desc page for adding people involved in Estonian Film industry
//@route POST /eestifilm/lisa_film_inimesed
//@access public

//app.post('/eestifilm/lisa_film_inimesed', async (req, res)=>{
const eestifilmInimesedLisaPost = async (req, res) => {
	console.log(req.body);
	//kontrollime andmeid, teeme kÃµige lahjema kontrolli
	let deceasedDate = null;
	if(req.body.deceasedInput != ''){
		deceasedDate = req.body.deceasedInput;
	}
	
	//sÃ¼nnikuupÃ¤eva vÃµrdlemine
	const bornDate = new Date(req.body.bornInput);
	const timeNow = new Date();
	
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.bornInput || isNaN(bornDate.getTime()) || bornDate > timeNow){
		console.log("Andmed pole korrektsed!");
		return res.render('lisa_film_inimesed', {notice: 'Sisestud andmed pole korrektsed!'});
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
			deceasedDate
		]);
		res.render('lisa_film_inimesed', {notice: req.body.firstNameInput + ' ' + req.body.lastNameInput + ' andmebaasi salvestatud.'});
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
};


//@desc page for list Estonian Films
//@route GET /eestifilm/filmid
//@access public

//app.get('/eestifilm/filmid', async (req, res)=>{
const filmid = async (req, res) => {
	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		const sqlReq = 'SELECT * FROM movie ORDER BY title';
		const [sqlRes] = await conn.execute(sqlReq);
		res.render('eestifilmfilmid', {movieList: sqlRes});
	}
	catch(err){
		console.log('Viga andmebaasist lugemisel: ' + err);
		res.render('eestifilmfilmid', {movieList: []});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

//@desc page for adding Estonian Films
//@route GET /eestifilm/filmid_add
//@access public

//app.get('/eestifilm/filmid_add', (req, res)=>{
const filmidLisa = (req, res) => {
	res.render('eestifilmfilmid_add', {notice: 'Ootan sisestust', 
	movieTitle: null, 
	releaseYear: null, 
	duration: null, 
	description: null});
};

//@desc page for adding Estonian Films
//@route POST /eestifilm/filmid_add
//@access public

//app.post('/eestifilm/filmid_add', async (req, res)=>{
const filmidLisaPost = async (req, res) => {
	const now = new Date();
	const year = Number(req.body.yearInput);
	const duration = Number(req.body.durationInput);

	if(!req.body.titleInput){
		return res.render('eestifilmfilmid_add', {notice: 'Filmi pealkiri puudub', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}
	if(!Number.isInteger(year) || year < 1880 || year > now.getFullYear()){
		return res.render('eestifilmfilmid_add', {notice: 'Valmimisaasta on vigane', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}
	if(!Number.isInteger(duration) || duration <= 0){
		return res.render('eestifilmfilmid_add', {notice: 'Kestus on vigane', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}

	let conn;
	try {
		conn = await mysql.createConnection({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE
		});
		let sqlReq = 'INSERT INTO movie (title, release_year, duration_minutes, description) VALUES (?,?,?,?)';
		await conn.execute(sqlReq, [req.body.titleInput, year, duration, req.body.descriptionInput || null]);
		res.render('eestifilmfilmid_add', {notice: 'Andmed salvestati', 
		movieTitle: null, 
		releaseYear: null, 
		duration: null, 
		description: null});
	}
	catch (err){
		console.log('viga andmebaasiga suhtlemisel: ' + err);
		res.render('eestifilmfilmid_add', {notice: 'andmebaasi suhtlus nurjus', movieTitle: req.body.titleInput, releaseYear: req.body.yearInput, duration: req.body.durationInput, description: req.body.descriptionInput});
	}
	finally {
		if(conn){
			await conn.end();
		}
	}
};

//@desc ametite nimekirja leht
//@route GET /eestifilm/ametid
//@access public

const ametid = async (req, res)=>{
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });
        const sqlReq = 'SELECT * FROM profession ORDER by id';
        const [sqlRes] = await conn.execute(sqlReq);
        console.log(sqlRes);
        res.render('eestifilmametid', {professionList: sqlRes});
    }
    catch (err){
        console.log('Viga andmebaasist lugemisel:' + err);
        res.render('eestifilmametid', {professionList: []})
    }
    finally {
        if(conn) {
            await conn.end();
        }
    }

};

//@desc ametite lisamiseks leht
//@route GET /eestifilm/lisa_ametid
//@access public

const ametidLisa = (req, res)=>{
    res.render('eestifilmametid_add', {
        notice: 'Ootan sisestust!',
        title: null,
        description: null,

    });
};

//@desc ametite lisamiseks leht
//@route POST /eestifilm/lisa_ametid
//@access public

const ametidLisaPost = async (req, res) => {
    const { title, description} = req.body;
	
    const showForm = (notice, clear = false) => {
        res.render('eestifilmametid_add', {
            notice: notice,
            title: clear ? null : title,
            description: clear ? null : description

        });
    };
    if (
        !title?.trim() ||
        !description?.trim()

    ) {
        return showForm('Ootan sisestust!');
    }
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });

        const sqlReq = 'INSERT INTO profession (title, description) VALUES (?, ?)';

        await conn.execute(sqlReq, [
            title.trim(),
            description.trim()
        ]);
        showForm('Andmed salvestati! Ootan uut sisestust!', true);

    } catch (err) {
        console.log('Viga andmebaasiga suhtlemisel: ' + err);
        showForm('Tekkis viga, andmeid ei salvestatud!');
    } finally {
        if (conn) {
            await conn.end();
        }
    }
};

module.exports = {
	eestifilm,
	eestifilmInimesed,
	eestifilmInimesedLisa,
	eestifilmInimesedLisaPost,
	filmid,
	filmidLisa,
	filmidLisaPost,
	ametid,
	ametidLisa,
	ametidLisaPost
}