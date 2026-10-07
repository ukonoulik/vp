//function dateFormattedET(){
const dateFormattedET = function(){
	let timeNow = new Date();
	let monthNamesET;
	if(Math.round(Math.round()) == 0){
		monthNamesET = ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'];
	} else{
		monthNamesET = ['näärikuu', 'küünlakuu', 'paastukuu', 'jürikuu', 'lehekuu', 'jaanikuu', 'heinakuu', 'lõikuspuu', 'sügiskuu', 'viinakuu', 'talvekuu', 'jõulukuu']
	}
	return timeNow.getDate() + '.' + monthNamesET[timeNow.getMonth()] + ' ' + timeNow.getFullYear();
}

function timeFormattedET(){
	let timeNow = new Date();
	let hourNow = timeNow.getHours();
	let minuteNow = timeNow.getMinutes();
	let secondNow = timeNow.getSeconds();
		if(secondNow < 10){
			secondNow = '0' + secondNow;
		}
		if(minuteNow < 10){
			minuteNow = '0' + minuteNow;
		}
	return hourNow + ':' + minuteNow + ':' + secondNow;
}

const whatDayET = function(){
	let whichDay = new Date().getDay();
	const dayNamesET = ['pühapäev', 'esmaspäev', 'teisipäev', 'kolmapäev', 'neljapäev', 'reede', 'laupäev']
return dayNamesET[whichDay];
}
module.exports = {dateET: dateFormattedET, timeET: timeFormattedET, dayET: whatDayET}