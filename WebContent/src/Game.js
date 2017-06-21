BasicGame.Game = function(game) {

	// When a State is added to Phaser it automatically has the following
	// properties set on it, even if they already exist:

	this.game; // a reference to the currently running game
	this.add; // used to add sprites, text, groups, etc
	this.camera; // a reference to the game camera
	this.cache; // the game cache
	this.input; // the global input manager (you can access this.input.keyboard,
	// this.input.mouse, as well from it)
	this.load; // for preloading assets
	this.math; // lots of useful common math operations
	this.sound; // the sound manager - add a sound, play one, set-up markers,
	// etc
	this.stage; // the game stage
	this.time; // the clock
	this.tweens; // the tween manager
	this.world; // the game world
	this.particles; // the particle manager
	this.physics; // the physics manager
	this.rnd; // the repeatable random number generator

	// You can use any of these from any function within this State.
	// But do consider them as being 'reserved words', i.e. don't create a
	// property for your own game called "world" or you'll over-write the world
	// reference.

};

BasicGame.Game.prototype = {
	claw : null,
	claw_length : 90,
	claw_state : 0,
	claw_speed : 5,
	zero_point : [150,-450],
	gifts : null,
	layer : null,
	sfx_win : null,
	sfx_lose : null,
	bgm : null,
	sfx_claw : [],
	claw_sfx : function(index) {
		for ( var i in this.sfx_claw) {
			var sfx = this.sfx_claw[i];
			if (i == index) {
				sfx.loopFull();
			} else {
				sfx.stop();
			}
		}

	},
	click : function() {
		if (this.claw_state === 0) {
			this.claw_state = 1;
			this.claw_sfx(0);
		}
	},
	release : function() {
		if (this.claw_state === 1) {
			this.claw_state = 2;
			this.claw_sfx(1);
		}
	},
	closeClaw : function(isClose) {
		// this.claw.body.clearShapes();
		if (isClose) {
			this.claw.loadTexture('claw_closed');
			// this.claw.body.loadPolygon('physicsData', "claw_closed");
		} else {
			this.claw.loadTexture('claw');
			// this.claw.body.loadPolygon('physicsData', "claw_open");
		}

	},
	clawHitHandler : function(body1, body2) {
		if (this.claw_state == 2) {
			var dx = Math.abs(body1.x - body2.x);
			var dy = Math.abs(body1.y - body2.y);
			console.log(JSON.stringify([ dx, dy ]));
			// var constraint =
			// this.game.physics.p2.createDistanceConstraint(body1, body2, 50);
			if (dx <= 20 && dy < 695) {
				this.closeClaw(true);
				this.claw_sfx(2);
				this.hitGift = body2;
				body2.static = true;
				body2.immovable = true;
				body2.setZeroVelocity();
				this.claw_state = 3;
			}

		}
	},
	create : function() {
		this.game.stage.backgroundColor = '#2d2d2d';
		this.game.physics.startSystem(Phaser.Physics.P2JS);
		this.game.physics.p2.gravity.y = 1000;
		this.game.physics.p2.setImpactEvents(true);
		
		var giftCollisionGroup = this.game.physics.p2.createCollisionGroup();
		var clawCollisionGroup = this.game.physics.p2.createCollisionGroup();
		var tilesCollisionGroup = this.game.physics.p2.createCollisionGroup();
		var map = this.game.add.tilemap('level1');
		var x = 250;
		var y = 350;
		
		
		
		this.bgm = this.game.add.audio('bgm');
		this.bgm.loopFull();
		this.sfx_claw[0] = this.game.add.audio('sfx_claw_0');
		this.sfx_claw[1] = this.game.add.audio('sfx_claw_1');
		this.sfx_claw[2] = this.game.add.audio('sfx_claw_2');
		map.addTilesetImage('world');
		this.sfx_lose = this.game.add.audio('lose');
		this.sfx_win = this.game.add.audio('win');
		this.layer = map.createLayer('Tile Layer 1');
		this.layer.resizeWorld();
		map.setCollisionBetween(1, 99);
		

		var tileObjects = this.game.physics.p2.convertTilemap(map, this.layer);
		for ( var i in tileObjects) {
			tileObjects[i].setCollisionGroup(tilesCollisionGroup);
			tileObjects[i].collides([ giftCollisionGroup, clawCollisionGroup ]);
		}
		this.layer.debug = false;
		this.claw = this.game.add.sprite(this.zero_point[0], this.zero_point[1],
				'claw');
		this.game.physics.p2.enable(this.claw, false);
		this.claw.body.static = true;
		this.claw.body.setCollisionGroup(clawCollisionGroup);
		this.claw.body.collides([ tilesCollisionGroup, giftCollisionGroup ],
				this.clawHitHandler, this);

		this.gifts = this.game.add.group();
		this.gifts.enableBody = true;
		this.gifts.physicsBodyType = Phaser.Physics.P2JS;
		for (var j = 1; j < 5; j++) {
			var gift = this.gifts.create(x, y, 'sprite_' + j);
			x += 75;
			gift.body.debug = false;
			gift.body.clearShapes();
			gift.body.loadPolygon('physicsData', j);
			gift.body.setCollisionGroup(giftCollisionGroup);
			gift.body.collides([ giftCollisionGroup, clawCollisionGroup,
					tilesCollisionGroup ]);
		}

		// attach pointer events
		this.game.input.onDown.add(this.click, this);
		this.game.input.onUp.add(this.release, this);
		this.game.physics.p2.updateBoundsCollisionGroup();

		console.log("starting play state");
	},

	update : function() {

		this.claw.body.setZeroVelocity();
		for ( var i in this.gifts.children) {
			var gift = this.gifts.children[i];
			if (gift.body.y >= this.game.world.height - 70) {
				this.sfx_win.play();
				gift.destroy();
				if (this.gifts.children.length === 0) {
					this.bgm.stop();
					this.game.state.restart(true, false);
				}
			}
		}
		// this.game.physics.p2.collide(this.gifts, this.layer);
		if (this.claw_state == 1) {
			this.claw.body.x += this.claw_speed;
		} else if (this.claw_state == 2) {
			this.claw.body.y += this.claw_speed;
			if (this.claw.body.y >= this.claw_length) {
				this.claw.loadTexture('claw_closed');
				this.claw_state = 3;
				this.claw_sfx(2);
			}
		} else if (this.claw_state == 3) {
			this.claw.body.y -= this.claw_speed;
			if (this.hitGift) {
				this.hitGift.y -= this.claw_speed;
			}
			if (this.claw.body.y <= this.zero_point[1]) {

				this.claw.body.y = this.zero_point[1];
				this.claw_state = 4;
			}
		} else if (this.claw_state == 4) {
			this.claw.body.x -= this.claw_speed;
			if (this.hitGift) {
				this.hitGift.x -= this.claw_speed;
			}
			if (this.claw.body.x <= this.zero_point[0]) {
				this.claw.body.x = this.zero_point[0];
				this.claw_state = 0;
				this.claw_sfx(-1);
				this.closeClaw(false);
				if (this.hitGift) {
					this.hitGift.static = false;
					this.hitGift = null;
				}
			}
		}
		if (this.hitGift && this.game.time.elapsed % 2 === 0) {
			var seed = parseInt(Math.random() * 100);
			// console.log("SEED:" + seed);
			if (seed >= 50 && seed <= 51) {
				this.hitGift.static = false;
				this.hitGift.immovable = false;
				if(this.claw_state == 4){
					this.hitGift.velocity.x = -this.claw_speed * 20;					
				}
				this.hitGift = null;
				this.sfx_lose.play();
			}
		}

	},

	quitGame : function(pointer) {

		// Here you should destroy anything you no longer need.
		// Stop music, delete sprites, purge caches, free resources, all that
		// good stuff.

		// Then let's go back to the main menu.
		this.state.start('MainMenu');

	}

};
