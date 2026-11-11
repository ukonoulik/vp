exports.isLogin = function(req, res, next){
	if(req.session != null){
		if(req.session.userId){
			console.log('Sisseloginud on kasutaja: ' + req.session.userId);
			next();
		} else {
			console.log('pole sisseloginud, pole sessioonimuutujat');
			return res.redirect('/signin');
		}
	} else {
		console.log('Sessiooni pole!');
		return res.redirect('/signin');
	}
}