var express= require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var mysql = require('mysql');
var crypto = require("crypto");
app.use(express.static('public'));
//Spel Deel
//Aantal spelers met namen en punten
var nSpelers = 27;
var spelersNamen = ['Lauri', 'Luna', 'Mara', 'Karlijn', 'Jasmijn', 'Sara', 'Gwen', 'Jimmy', 'Jop', 'Kevin', 'Milan', 'Mano', 'Bram', 'Jelle', 'Loek', 'Sam', 'Joep', 'Mick', 'Bryan', 'Yvan', 'Bart', 'Desley', 'Kay', 'Max', 'Jesse', 'Ewout', 'Shalom'];
var spelersPunten = [[], [], [], [], []]; //Puntentelling voor ingeleverde voorraad speler (per ingredient)
var maxDrank = 2000;
var ingredienten = ['Limoncella','Grappa', 'Citroenen', 'Druiven', 'Water', 'Suiker', 'Ethanol']; //Verschillende voorraden 

var voorraad = []; //voorraad van verschillende ingredienten
var countdownTimer1 = []; //Bijhouden mogelijkheid randomInvloed
var countdownTimer2 = []; //Bijhouden mogelijkheid wisselInvloed
var laatstGebrouwen = 0;

//client sides

app.get('/punten', function(req, res){
  res.sendFile(__dirname + '/punten.html');
});


//Overzichts scherm
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

//admin side voor x0 en betaalde invloed
app.get('/admin', function(req, res){
  res.sendFile(__dirname + '/admin.html');
});

io.on('connection', function(socket){
	clientIp = socket.request.connection.remoteAddress;
	console.log('a user connected ' + clientIp);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  //Ingeleverd aan staflid
 socket.on('adminIngredient message', function(msg){
		var code = msg; 
    var codeHoeveelheid = code.charAt(0) 
    var ingredient = code.charAt(1); 
		var codeSpeler = code.slice(2);
    var hoeveelheid;
    var speler = spelersNamen.indexOf(codeSpeler);
    
    if (ingredient == 2){
    	hoeveelheid = codeHoeveelheid * 10;  	
    }
    if (ingredient == 3){
    	hoeveelheid = codeHoeveelheid * 10;
    }
    if (ingredient == 4){
    	hoeveelheid = codeHoeveelheid * 5;
    }
    if (ingredient == 5){
    	hoeveelheid = codeHoeveelheid * 5;  	
    }
    if (ingredient == 6){
    	hoeveelheid = codeHoeveelheid; 	
    } 
        
    updateVoorraad(hoeveelheid, ingredient, speler);
		io.emit("voorraadVerandering", voorraad)
    io.emit("voorraadVerandering", spelersPunten)
  });
  
 socket.on('adminOphaal message', function(msg){
    
    if (msg == 0){
    	ophalenDrank(0, false)
    }
    if (msg == 1){
    	ophalenDrank(0, true)
    } 
    if (msg == 2){
    	ophalenDrank(1, false)
    } 
    if (msg == 3){
    	ophalenDrank(1, true)
    } 
    if (msg == 4){
    	ophalenDrank(2, false)
    } 
    if (msg == 5){
    	ophalenDrank(2, true)
    }   
		io.emit("voorraadVerandering", voorraad)
    io.emit("voorraadVerandering", spelersPunten)
  });
 socket.on('adminSet message', function(msg){ 
 	var waarde = msg;
  var ingredientveranderen = waarde.charAt(0);
  var hoeveelheidveranderen = waarde.slice(1);
  voorraad[ingredientveranderen] = hoeveelheidveranderen;
 });
  
  //Random ingredient mag
  socket.on('random message', function(msg){
		io.emit('random message', randomIngredient(msg));
		io.emit("voorraadVerandering", voorraad)
    io.emit("voorraadVerandering", spelersPunten)
	});
  
  socket.on('wissel message', function(msg){
      var code = msg; 
      var ingredient1 = code.charAt(0);
      var ingredient2 = code.charAt(1);
      var codeSpeler = code.slice(2);
      var speler = spelersNamen.indexOf(codeSpeler);
			
      io.emit('wissel message', wisselVoorraad(speler, ingredient1, ingredient2));
      io.emit("voorraadVerandering", voorraad)
      io.emit("voorraadVerandering", spelersPunten)
    });
    
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});





//Initiatie van voorraad en spelersPunten
voorraad[0] = 100;
voorraad[1] = 100;

for (i = 2; i < ingredienten.length; i++){
	voorraad[i] = 0;
  for (j = 0; j < nSpelers; j++){
		spelersPunten[i - 2][j] = 0;
		}
}

//Initiatie van countdownTimer1 en 2
for (i = 0; i < spelersNamen.length; i++){
	countdownTimer1[i] = 0;
  countdownTimer2[i] = 0;
}
function ophalenDrank(drank, gelukt){
	var limoncella = voorraad[0];
  var grappa = voorraad[1];

  if (gelukt){
    if (drank == 0){
      voorraad[0] = 0;
      voorraad[1] = 0;
      for (i = 2; i < ingredienten.length; i++){
        for (j = 0; j < nSpelers; j++){
          if (spelersPunten[i - 2][j] > 0) {
						spelersPunten[i - 2][j] = spelersPunten[i - 2][j] * (1.5+((limoncella+grappa)/1000));
          }
        }
      }
    }
    if (drank == 1){
      voorraad[0] = 0;
      for (i = 2; i < ingredienten.length; i++){
        for (j = 0; j < nSpelers; j++){
          if (spelersPunten[i - 2][j] > 0) {
						spelersPunten[i - 2][j] = spelersPunten[i - 2][j] * (1+(limoncella/1000));
          }
        }
      }      
    }
    if (drank == 2){
      voorraad[1] = 0;
      for (i = 2; i < ingredienten.length; i++){
        for (j = 0; j < nSpelers; j++){
          if (spelersPunten[i - 2][j] > 0) {
						spelersPunten[i - 2][j] = spelersPunten[i - 2][j] * (1+(grappa/1000));
          }
        }
      }      
    }
 	} else {      
  		voorraad[0] = 0;
      voorraad[1] = 0;
      for (i = 2; i < ingredienten.length; i++){
        for (j = 0; j < nSpelers; j++){
          if (spelersPunten[i - 2][j] > 0) {
						spelersPunten[i - 2][j] = spelersPunten[i - 2][j] * 0.8;
          }
        }
      } 
    }
 
 }

function updateVoorraad(hoeveelheid, ingredient, speler) {

  voorraad[ingredient] += hoeveelheid;
  spelersPunten[ingredient - 2][speler] += hoeveelheid;

  while (brouwen(laatstGebrouwen)){
    if (laatstGebrouwen == 0){
      voorraad[1] += 10;
      voorraad[3] -= 10;
    }
    if (laatstGebrouwen == 1){
      voorraad[0] += 10;
      voorraad[2] -= 10;
    }
    voorraad [4] -= 5;
    voorraad [5] -= 5;
    voorraad [6] -= 1;
  }
}

function brouwen(brouwsel) {
  if (((voorraad[0] + voorraad [1]) < (maxDrank - 10)) && (voorraad[4] >= 5) && (voorraad[5] >= 5) && (voorraad[6] >= 1)) {
    if ((brouwsel == 0) && voorraad[2] >= 10) {
    	laatstGebrouwen = 1;
      return true
    }	else if ((brouwsel == 1) && voorraad[3] >= 10) {
    	laatstGebrouwen = 0;
      return true
    } else return false
  } else return false
}



function randomIngredient(speler){
	var huidigeSpeler = spelersNamen.indexOf(speler);
	var huidigIngredient = Math.floor(Math.random() * 5) + 2;
  var hoeveelheid = Math.floor(Math.random() * 10) + 1;
  var d = new Date();
 
 	//Elke 3 minuten mag je random hoeveelheid van random ingredient ontvangen
  if ((countdownTimer1[huidigeSpeler] == 0) || ((countdownTimer1[huidigeSpeler] + 180000) < d.getTime())) {	
    countdownTimer1[huidigeSpeler] = d.getTime();
    updateVoorraad(hoeveelheid, huidigIngredient, huidigeSpeler);
    return huidigIngredient;
    } else return "0";
   
} 

function wisselVoorraad(speler, ingredient1, ingredient2){
  var hoeveelheid;
  var d = new Date();

  if (((countdownTimer2[speler] == 0)  || ((countdownTimer2[speler] + 180000) < d.getTime()))) {  			

  if ((spelersPunten[ingredient2 - 2][speler] > 0)){	
      countdownTimer2[speler] = d.getTime();

      hoeveelheid = Math.floor(spelersPunten[ingredient2 - 2][speler] * 0.25);
      spelersPunten[ingredient2 - 2][speler] *= 0.5
      updateVoorraad(hoeveelheid, ingredient1, speler);
      return ingredient1;
     } else return "1";
   } else return "0";
 }

/*console.log(voorraad);
console.log(spelersPunten);
for (i = 0; i < 50; i++){
randomIngredient('MF');
randomIngredient('JE');
randomIngredient('JR');
}
console.log(voorraad); */
