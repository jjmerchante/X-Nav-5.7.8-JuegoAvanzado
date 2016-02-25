// Original game from:
// http://www.lostdecadegames.com/how-to-make-a-simple-html5-canvas-game/
// Slight modifications by Gregorio Robles <grex@gsyc.urjc.es>
// to meet the criteria of a canvas class for DAT @ Univ. Rey Juan Carlos

/*----------------------------- LOAD IMAGES -----------------------------*/
// Create the canvas
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);

// Background image
var bgReady = false;
var bgImage = new Image();
bgImage.onload = function () {
	bgReady = true;
};
bgImage.src = "images/background.png";

// Hero image
var heroReady = false;
var heroImage = new Image();
heroImage.onload = function () {
	heroReady = true;
};
heroImage.src = "images/hero.png";

// princess image
var princessReady = false;
var princessImage = new Image();
princessImage.onload = function () {
	princessReady = true;
};
princessImage.src = "images/princess.png";

// stone image
var stoneReady = false;
var stoneImage = new Image();
stoneImage.onload = function() {
	stoneReady = true;
};
stoneImage.src = "images/stone.png";

// enemy image
var enemyReady = false;
var enemyImage = new Image();
enemyImage.onload = function() {
	enemyReady = true;
};
enemyImage.src = "images/monster.png";


/*---------------------- CREATE OBJECTS AND LISTENERS----------------------*/
// Game objects
hero = {
	speed: 256 // movement in pixels per second
};
princess = {};
princessesCaught = 0;
stones = [];
enemies = [];
/********************
 **  Enemy object  **
 ********************/
function Enemy(x, y, speed, action){
	this.x = x;
	this.y = y;
	this.speed = speed;
	this.actionName = action;
	this.movement(0, hero);
}

Enemy.prototype.movement = function (modifier, hero) {
    switch (this.actionName) {
    case 'follow':
        this.follow(modifier, hero);
        break;
    case 'sideToSide':
        this.sideToSide(modifier);
        break;
    default:
        break;
    }
};

/***************************
 **   Available actions   **
 ***************************/
Enemy.prototype.follow = function(modifier, hero){
	if (hero.x > this.x){
		this.x += this.speed * modifier;
	} else {
		this.x -= this.speed * modifier;
	}
	if (hero.y > this.y){
		this.y += this.speed * modifier;
	} else {
		this.y -= this.speed * modifier;
	}
}

Enemy.prototype.sideToSide = function(modifier){
	var options = ['vert', 'horiz'];
	if (!this.way || !this.option){
		this.option = options[Math.floor(Math.random()*options.length)];
		this.way = 1; // Select between 1 and 2 depending on the direction
	}
	switch (this.option) {
		case 'vert':
			if (this.way == 1){
				this.y += this.speed * modifier;
				if (this.y > canvas.height - 64)
					this.way = 2
			}else{
				this.y -= this.speed * modifier;
				if (this.y < 32)
					this.way = 1
			}
			break;
		case 'horiz':
			if (this.way == 1){
				this.x += this.speed * modifier;
				if (this.x > canvas.width - 64)
					this.way = 2
			}else{
				this.x -= this.speed * modifier;
				if (this.x < 32)
					this.way = 1
			}
			break;
	}
}

/*------------------------------  CONTROLS --------------------------------*/
// Handle keyboard controls
var keysDown = {};

addEventListener("keydown", function (e) {
	keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
	delete keysDown[e.keyCode];
}, false);



// Check the objects are touching
// needs x and y attributes
var objectsTouching = function(obj1, obj2){
			return obj1.x <= (obj2.x + 25) && obj2.x <= (obj1.x + 25) &&
						 obj1.y <= (obj2.y + 32) && obj2.y <= (obj1.y + 32)
};

// Check the objects are together
// needs x and y attributes
var smallDistance = function(obj1, obj2){
	var ydist = canvas.height/5;
	var xdist = canvas.width/5;
	return obj1.x <= (obj2.x + xdist) && obj2.x <= (obj1.x + xdist) &&
				 obj1.y <= (obj2.y + ydist) && obj2.y <= (obj1.y + ydist)
}

/*----------------------------- RESET SIMPLE -----------------------------*/
// Reset the game when the player catches a princess
var reset = function () {
	hero.x = canvas.width / 2;
	hero.y = canvas.height / 2;

	// Throw the princess somewhere on the screen randomly
	princess.x = 32 + (Math.random() * (canvas.width - 96));
	princess.y = 32 + (Math.random() * (canvas.height - 96));

	//Manage stones
	stones = []
	var numStones = (princessesCaught < 20) ? Math.floor(princessesCaught/2) : 10;
	for (var i = 0; i < numStones; i++){
		var stone = {}
		do{
			stone.x = 32 + (Math.random() * (canvas.width - 96));
			stone.y = 32 + (Math.random() * (canvas.height - 96));
		}while (objectsTouching(stone, hero) || objectsTouching(stone, princess));
		stones.push(stone);
	}

	//Manage enemies
	enemies = []
	var numEnemies = Math.floor(princessesCaught/5);
	var actions = ['follow', 'sideToSide'];
	for (var i = 0; i < numEnemies; i++){
		var enemyObj;
		var action = actions[Math.floor(Math.random()*actions.length)];
		if (action == "follow") {
			var speed = 5 + princessesCaught * 2;
		} else if (action == "sideToSide") {
			var speed = 100 + princessesCaught;
		}
		do {
			var x = 32 + (Math.random() * (canvas.width - 96));
			var y = 32 + (Math.random() * (canvas.height - 96));
			enemyObj = new Enemy(x, y, speed, action);
		} while (smallDistance(enemyObj, hero) || objectsTouching(enemyObj, princess));
		enemies.push(enemyObj);
	}
    var state = {
        'hero': hero,
        'princess': princess,
        'princessesCaught': princessesCaught,
        'stones': stones,
        'enemies': enemies
    }
};

/*----------------------------- RESET GAME -----------------------------*/
var resetGame = function(){
	princessesCaught = 0;
	reset();
    saveData();
    alert("You lose, I WIN :P");
}

/*------------------------------- UPDATE -------------------------------*/
// Update game objects
var update = function (modifier) {
	var stoneTouched = false;
	var enemyTouched = false;
	var difPosHero = {x:0, y:0};
	if (38 in keysDown) { // Player holding up
		difPosHero.y -= hero.speed * modifier;
	}
	if (40 in keysDown) { // Player holding down
		difPosHero.y += hero.speed * modifier;
	}
	if (37 in keysDown) { // Player holding left
		difPosHero.x -= hero.speed * modifier;
	}
	if (39 in keysDown) { // Player holding right
		difPosHero.x += hero.speed * modifier;
	}
	// Check do not cross stones
	var newPosHero = {
		x: hero.x + difPosHero.x,
		y: hero.y + difPosHero.y
	}
	stones.forEach(function(stone){
		if (objectsTouching(stone, newPosHero)){
			stoneTouched = true;
		}
	});
	if (!stoneTouched){
		hero.x = newPosHero.x;
		hero.y = newPosHero.y
	};

	// Do not go away
	if (hero.y < 31)
		hero.y = 32
	if (hero.y > canvas.height - 63)
		hero.y = canvas.height - 64
	if (hero.x < 31)
		hero.x = 32
	if (hero.x > canvas.width - 63)
		hero.x = canvas.width - 64

	// Move enemies
	enemies.forEach(function(enemy){
		enemy.movement(modifier, hero)
	});


	enemies.forEach(function(enemy){
		if (objectsTouching(enemy, newPosHero)){
			enemyTouched = true;
		};
	});
	if (enemyTouched){
		// Are hero and enemy touching?
		resetGame();
	} else if (objectsTouching(hero, princess)){
		// Are hero and princess touching?
		++princessesCaught;
		reset();
        saveData();
	};
};

/*-------------------------------- STATE --------------------------------*/

var saveData = function() {
	var state = {
		'hero': hero,
		'princess': princess,
		'princessesCaught': princessesCaught,
		'stones': stones,
		'enemies': enemies
	}
	localStorage['gameState'] = JSON.stringify(state);
}

var loadData = function(){
    var dataLoaded = false;
	if (localStorage['gameState']){
        state = JSON.parse(localStorage['gameState'])
        hero = state.hero;
		princess = state.princess;
		princessesCaught = state.princessesCaught;
		stones = state.stones;
        state.enemies.forEach(function(enemy){
            var newEnemy = new Enemy();
            for (attribute in enemy){
                newEnemy[attribute] = enemy[attribute]
            }
            enemies.push(newEnemy);
        });
        dataLoaded = true;
    }
    return dataLoaded;
}

/*-------------------------------- RENDER --------------------------------*/

// Draw everything
var render = function () {
	if (bgReady) {
		ctx.drawImage(bgImage, 0, 0);
	}

	if (heroReady) {
		ctx.drawImage(heroImage, hero.x, hero.y);
	}

	if (princessReady) {
		ctx.drawImage(princessImage, princess.x, princess.y);
	}
	if (stoneReady) {
		stones.forEach(function(stone){
			ctx.drawImage(stoneImage, stone.x, stone.y);
		});
	}
	if (enemyReady) {
		enemies.forEach(function(enemy){
			ctx.drawImage(enemyImage, enemy.x, enemy.y);
		});
	}

	// Score and level
	ctx.fillStyle = "rgb(250, 250, 250)";
	ctx.font = "24px Helvetica";
	ctx.textAlign = "left";
	ctx.textBaseline = "top";
	ctx.fillText("Princesses caught: " + princessesCaught, 32, 32);
    // Level
    ctx.fillText("Level: " + parseInt(princessesCaught/5), 280, 32);
};

// The main game loop
var main = function () {
	var now = Date.now();
	var delta = now - then;

	update(delta / 1000);
	render();

	then = now;
};

// Let's play this game!
if (!loadData()){
    reset();
}
var then = Date.now();
//The setInterval() method will wait a specified number of milliseconds, and then execute a specified function, and it will continue to execute the function, once at every given time-interval.
//Syntax: setInterval("javascript function",milliseconds);
setInterval(main, 1); // Execute as fast as possible
