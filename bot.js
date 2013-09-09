/*

1. install https://github.com/superjoe30/mineflayer
and https://github.com/gipsy-king/mineflayer-navigate (or https://github.com/superjoe30/mineflayer-navigate if my PR is accepted)
in the parent directory
1b. if npm is updated, use the npm modules
2. run npm install in those repos
3. configure below near mineflayer.createBot
4. run node bot.js

*/

var mineflayer = require('../mineflayer');
var navigate = require('../mineflayer-navigate')(mineflayer);

var friends = ['GipsyKing', 'Shiul93'];

var foods = [
297, // bread
350, // cooked fish
360, // melon
366, // coked chicken
364, // steak
320, // cooked pork
];

var bot;


function connect() {

	var taskTimeout = -1;
	var fishTimeout = -1;

	function task(f, ms) {
		clearTimeout(taskTimeout);

		taskTimeout = setTimeout(f, ms);
	}


	var bot = mineflayer.createBot({
		/*username: 'bot',
		host: 'localhost',
		viewDistance: 'tiny'
		/*/


		username: 'ste3ls@gmail.com',
		password: 'habababa',
		host: 'mc.civcraft.vg',
		viewDistance: 'tiny'
		/**/
	});

	navigate(bot);

	bot.on('login', function() {

	});

	// check food contiuously, quit if too low
	setInterval(function() {
		if (bot.food < 2) { // 0-20
			tellAnyFriend(bot, friends, 'me muero de hambre! dejo este trabajo!');

			bot.quit();
			process.exit(0);
		}

		if (bot.food < 10) {

			var food = null;
			foods.some(function(id) {
				food = bot.inventory.findInventoryItem(id, null);
				if (food !== null) return true;
			});



			if (food !== null) {
				bot.equip(food, 'hand');

				var healthWas = bot.food;

				task(function() {
					bot.activateItem();
					console.log('eating...');

					task(function() {
						console.log('must stop eat');
						bot.deactivateItem();

						tellAnyFriend(bot, friends, 'he merendao ' + food.name + ', mi hambre: ' + healthWas + ' -> ' + bot.health);
						console.log('ate ' + food.name + ', healt: ' + healthWas + ' -> ' + bot.health);

						task(fish, 500);
					}, 1000);
				}, 500);

			} else {
				tellAnyFriend(bot, friends, 'Por favor señor, deme algo que pegarle un bocao!');
				console.log('dont have any food items');
			}

			
		}

	}, 10000);

	bot.on('spawn', function() {
		tellAnyFriend(bot, friends, 'prefiero la muerte antes que este trabajo. si no fuera por mis niños...');

		setTimeout(function() {
			// with orebfuscator, nearby conatiners are smoothstone obfuscated.
			// lets see first if there is a chest (54)
			findBlock(bot, 54, 8, function(block) {
				if (block === null) {
					console.log('no container around!');

					// orebfuscated? lets try hitting the nearest smoothstone, which should update if it's a container
					findBlock(bot, 1, 8, function(block) {
						if (block !== null) {
							console.log('hit stone');
							bot.dig(block);

							setTimeout(function() {
								console.log('stop hitting stone');
								bot.stopDigging();

								setTimeout(function() {
									findBlock(bot, 54, 8, function(block) {
										console.log('container?', block ? block.name : null); // hopefully found one

									});
								}, 1000);
								
							}, 100);

						} else {
							console.log('no stone around either!');
							tellAnyFriend(bot, friends, 'no veo ningun container!!!');
						}
					});
				} else {
					console.log('container found');
				}
			});
		}, 1000);
		

		task(fish, 1200);


	});

	(function(jump) {
		if (jump) {
			bot.setControlState('jump', true);
			setTimeout(arguments.callee, 100);
		} else {
			bot.setControlState('jump', false);

			setTimeout(arguments.callee.bind(null, true), 60000 * Math.random());
		}
		
	})(false);


	bot.on('chat', function(username, message) {
		if (friends.indexOf(username) !== -1 && message === 'dame') {
			var fishes = bot.inventory.findInventoryItem(349, null);
			if (fishes === null) return tellAnyFriend(bot, friends, 'no tengo naaa');

			bot.tossStack(fishes);
		}
	});

	
	function fish() {
		clearTimeout(fishTimeout);

		var rod = bot.inventory.findInventoryItem(346, null);

		if (!rod) {
			console.log('no rod');
			tellAnyFriend(bot, friends, 'no tengo caña! dame una caña o me quedo aqui sin hacer nada.');

			return task(arguments.callee, 10000);
		}

		bot.equip(rod, 'hand');

		console.log('fishing');
		bot.activateItem();


		fishTimeout = setTimeout(function() {
			console.log('no fish after 2 minutes');

			clearTimeout(taskTimeout);

			bot.activateItem();
			bot.look(Math.PI / (2 * (Math.random() - .5)), 0, true);
			task(fish, 500);
		}, 120000);
	}

	var floater = null;
	var floaterTimestamp = 0;


	bot.on('entitySpawn', function(event) {
		if (event.objectType === 'fishingFloat') {
			var entity = bot.entities[event.id];

			if (!entity) return;

			if (bot.entity.position.distanceTo(entity.position) > 2) return;

			floater = entity;
			floaterTimestamp = Date.now();

			console.log('tracking float');

			task(function() {
				if (bot.blockAt(floater.position).name !== 'waterStationary') {
					console.log('did not land on water');


					bot.activateItem();

					bot.look(Math.PI / (2 * (Math.random() - .5)), 0, true);

					clearTimeout(fishTimeout);
					task(fish, 1000);
				} else {
					console.log('looks like water');
				}
			}, 4000);


		}
	})

	bot.on('entityMoved', function(event) {
		if (!floater) return;

		if (floater.id !== event.id) return;

		if (Date.now() - floaterTimestamp < 3000) return; // assumes floater has rested in 3 seconds

		if (Math.abs(event.pitch) > 1.0) {
			clearTimeout(fishTimeout);

			console.log('bite', event.yaw, event.pitch);

			task(function() {
				bot.activateItem();

				task(function() {
					var fishes = bot.inventory.findInventoryItem(349, null);
					if (fishes === null || !fishes.count) {
						bot.look(Math.PI / (2 * (Math.random() - .5)), 0);

						return task(fish, 500);
					}

					findBlock(bot, 54, 8, function(block) {
						console.log('container: ', block ? block.name : 'null');

						if (block === null) {
							tellAnyFriend(bot, friends, 'no veo ningun baul! me quedo los pescaos de momento.');

							task(fish, 1000);
							return;
						}

						var container = bot.openChest(block);

						var containerOpenTimeout = setTimeout(function() {
							console.log('never opened');

							container.removeAllListeners('open');

							tellAnyFriend(bot, friends, 'tengo ' + fishes.count + ' pescaos, no puedo abrir el baul');
							console.log(fishes.count + ' in inventory');

							bot.look(Math.PI / 2, 0);

							task(fish, 1000);

						}, 1000);

						container.once('open', function() {
							clearTimeout(containerOpenTimeout);

							console.log('opened');

							container.deposit(349, null, fishes.count || 0, function() {

								task(function() {
									var currentFish = container.count(349);

									tellAnyFriend(bot, friends, 'hay ' + currentFish + ' pescaos en el baul. ojala se te atraganten.');
									console.log(currentFish + ' fishes');


									var containerCloseTimeout = setTimeout(function() {
										console.log('never closed');
										container.removeAllListeners('close');

										bot.look(Math.PI / 2, 0);

										task(fish, 1000);

									}, 1000);

									container.once('close', function() {
										clearTimeout(containerCloseTimeout);

										console.log('closed, continue fishing...');

										bot.look(Math.PI / 2, 0);

										task(fish, 1000);
									});
									
									container.close();

								}, 500);
							});
						});
					});
				}, 3000);
			}, Math.random() * 100);

			return;
		}
	});


}

// find given block
function findBlock(bot, type, diameter, callback) {
	var block;

	var x = 0,
	    y = 0,
	    delta = [0, -1],
	    // spiral width
	    width = diameter,
	    // spiral height
	    height = diameter;


	for (i = Math.pow(Math.max(width, height), 2); i>0; i--) {
	    if ((-width/2 < x <= width/2) 
	            && (-height/2 < y <= height/2)) {

	    	block = bot.blockAt(bot.entity.position.clone().translate(x, 0, y));

	    	if (block !== null && block.type === type) {
	    		return callback(block);
	    	} else {
	    		//console.log(block.type);
	    	}
	    }

	    if (x === y 
	            || (x < 0 && x === -y) 
	            || (x > 0 && x === 1-y)){
	        // change direction
	        delta = [-delta[1], delta[0]]            
	    }

	    x += delta[0];
	    y += delta[1];        
	}

	return callback(null);
}

function tellAnyFriend(bot, friends, message) {
	Object.keys(bot.players).some(function(name) {
		if (friends.indexOf(name) !== -1) {
			bot.chat('/tell ' + name + ' ' + message);
			return true;
		}
	})
}

connect();

