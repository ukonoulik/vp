const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const validator = require('validator');
const argon = require('argon2');

//@desc page creating user account
//@route GET /signup
//@access public

const signupPage = (req, res) => {
	res.render('signup', {notice: 'Ootan andmeid!'});
};

//@desc page creating user account
//@route POST /signup
//@access public

const signupPagePost = async (req, res) => {
	let conn; 
	//puhastame andmeid ja valideerime
	const firstName = validator.escape(req.body.firstNameInput.trim());
	const lastName = validator.escape(req.body.lastNameInput.trim()); 
	const birthDate = req.body.birthDateInput;
	const gender = req.body.genderInput; 
	const email = req.body.emailInput.trim();
	const password = req.body.passwordInput;
	const confirmPassword = req.body.confirmPasswordInput;
	
	//kas andmed on olemas
	if(!firstName || !lastName || !birthDate || !gender || !email || !password || !confirmPassword){
		let notice = 'Andmeid on puudu!';
		return res.render('signup', {notice: notice});
	}
	
	//kas e-mail on korrektne 
	if(!validator.isEmail(email)){
		notice = 'E-mail address pole korrektne!';
		return res.render('signup', {notice:notice});
	}
	
	//kas password on tugev
	const passwordOptions = {minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0};
	if(!validator.isStrongPassword(password, passwordOptions)){
		notice = 'Salasõna pole piisaalt tugev!'
		return res.render('signup', {notice: notice});
	}
	
	//kas passwordid klapivad 
	if(password !== confirmPassword){
		notice = 'Sisestatud salasõnad pole ühesugused'
		return res.render('signup', {notice: notice});
	}
	
	//kas sünnikuupäev on korrektne 
	if(!validator.isDate(birthDate) || validator.isAfter(birthDate))
		{
		notice = 'Sünnikuupäev pole korrektne!'
		return res.render('signup', {notice: notice});
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
		const [users] = await conn.execute(sqlReq, [email]);
		if(users.length > 0){
			notice = 'Kasutaja on juba olemas!' 
			return res.render('signup', {notice: notice});
		}
		//kui pole olemas, siis salvestame 
		sqlReq = 'INSERT INTO users (firstname, lastname, birthdate, gender, email, password) VAlUES (?,?,?,?,?,?)';
		//krüpteerin parooli 
		const pwdHash = await argon.hash(password);
		
		const [result] = await conn.execute(sqlReq, [
			firstName, 
			lastName, 
			birthDate,
			gender, 
			email,
			pwdHash
		]);
		notice = 'Loodi kasutajakonto: ' + result.insertId
		
 		res.render('signup', {notice: notice});
    }
    catch (err) {
        console.log('Viga' + err);
        res.render('signup',{notice: 'Kasutajakonto loomine ebaõnnestus!'});
    }
    finally {
        if (conn) 
			await conn.end();
    }
};

module.exports = {
	signupPage,
	signupPagePost
}