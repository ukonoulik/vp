const mysql = require('mysql2/promise');
const validator = require('validator');
const argon = require('argon2');

//@desc page for signing in
//@route GET /signin
//@access public

const signinPage = (req, res) => {
	res.render('signin', {notice: 'Ootan andmeid!'});
};

//@desc page for signing in 
//@route POST /signin
//@access public

const signinPagePost = async (req, res) => {
	let conn; 
	let notice = '';
	
	//kontrollime kas kõik on olemas 
	if(!req.body.emailInput || !req.body.passwordInput){
		notice = 'Andmeid on puudu!'; 
		return res.render('signin', {notice: notice});
	}
	
	
	try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE
        });
		//äkki selline kasutaja on juba olemas 
		let sqlReq = 'SELECT id FROM users WHERE email = ?'
		const [users] = await conn.execute(sqlReq, [req.body.emailInput]);
		//kui pole
		if(users.length === 0){
			notice = 'Kasutajatunnus või salasõna on vale!'
			return res.render('signin', {notice: notice});
		}
		const match = await argon.verify(users[0].password, req.body.passwordInput);
		if (match){
			console.log('Oled sisse loginud kasutaja' + users[0].id);
			return res.redirect('/home');
		} else {
			notice = 'Kasutajatunnus ja/või salasõna on vale!';
			return res.render('signin',{notice: notice});
		}
	}
    catch (err) {
        console.log('Viga: ' + err);
        res.render('signin',{notice: 'Sisselogimine ebaõnnestus!'});
    }
    finally {
        if (conn) 
			await conn.end();
    }
};

module.exports = {
	signinPage,
	signinPagePost
}