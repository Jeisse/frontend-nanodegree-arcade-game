// Global Variables
var NPC_Y = -35; //Coordinates for NPC y-axis
var startPosition = { //Player starting position
    x: 303,
    y: 300,
    row: 4,
    col: 3
};
var enemyPosition = [60, 120, 240, 300, 360];
var chars = [
    'images/char-cat-girl.png',
    'images/char-pink-girl.png',
    'images/char-boy.png',
    'images/char-horn-girl.png',
    'images/char-princess-girl.png'
];
var gem = [ 
    'images/Gem-Green.png',
    'images/Gem-Blue.png',
    'images/Gem-Orange.png'
];
var win = false;
var play = false;
var selector; //Character selector made globally available
var selectedChar; //Used as pointer for the selected sprite URL in array

var level = 1;

// Enemy Class 
var Enemy = function(x,y,speed) {
    this.sprite = 'images/enemy-bug.png';
    this.y = enemyPosition[y];
    this.row = y + 1;
    this.speed = speed;
    this.x = x;
};

Enemy.prototype.update = function(dt) {
    //If they are on screen, they move their speed
    if (this.x < ctx.canvas.width) {
        this.x += (this.speed * dt);
    }
    else { //When bugs leave the screen on the right, they are redrawn off screen left
        this.speed = 100 + Math.floor(Math.random() * 200);
        this.x = randomize(-100, -300);
        this.row = (level === 2) ? randomize(0,3) : randomize(0,2);
        this.y = enemyPosition[this.row];
        this.row++;
    }
};

// Draw this enemy's sprite onscreen
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Return this enemy's right value for collision detection
Enemy.prototype.right = function() {
    var right = this.x + 100;
    return right;
}

// Return this enemy's left value for collision detection
Enemy.prototype.left = function() {
    var left = this.x;
    return left;
}



// Player Class
var Player = function() {
    this.sprite = chars[selectedChar];
    this.dir = '';
    this.x = startPosition.x;
    this.y = startPosition.y;
    this.row = startPosition.row;
    this.col = startPosition.col;
};

// Return the player's right value for collision detection
Player.prototype.right = function() {
    var right = this.x + 70;
    return right;
}

// Return the player's left value for collision detection
Player.prototype.left = function() {
    var left = this.x + 35;
    return left;
}

/* Collision detection method on player; uses row variables
 * to provide abstraction of y-axis.
 */
Player.prototype.collide = function(prev) {
    for (var e = 0; e < allEnemies.length; e++) {
        //When the player contacts an enemy, he is returned to his starting position
        if (allEnemies[e].right() > this.left() && allEnemies[e].left() < this.right()
        && this.row === allEnemies[e].row) {
            this.x = startPosition.x;
            this.y = startPosition.y;
            this.row = startPosition.row;
            this.col = startPosition.col;

            //If the player is carrying an NPC, the NPC is placed in distress
            for (var i = 0; i < npc.length; i++) {
                if (npc[i].rescued) {
                    npc[i].collide();
                }
            }
        }
    }
    //Player and NPC cannot occupy a space, so collision pushes player back
    if (npc.length > 0) {
        for (var np = 0; np < npc.length; np++) {
            if (this.col === npc[np].col && this.row === npc[np].row && !npc[np].rescued) {
                this.x = prev.x;
                this.y = prev.y;
                this.row = prev.row;
                this.col = prev.col;
                this.dir='';
                npc[np].collide();
            }
        }
    }
};

// Player render method
Player.prototype.render = function() {
switch (level) {
        case 1:
            if (!win) {
                ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
            }
            if (win) {
                winning();
            }
            break;
        case 2:
            //In level 2, the sprite may be drawn before map tiles
            if (!win && this.row > 0 && this.row < 5) {
                ctx.drawImage(Resources.get(this.sprite), this.x, this.y + 30);
            }
            if (!win && (this.row === 5 || this.row === 0)) {
                ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
            }
            if (win) {
                winning();
            }
            break;
    }
};

// Updates player position and information
Player.prototype.update = function() {
    // Player's current position, recorded for later use in case of collision
    var prev = {'x': this.x, 'y': this.y, 'row': this.row, 'col': this.col};
    //This switch changes player position values based on keypress, if in canvas
    switch(this.dir) {
        case 'left':
            if (this.x > 100) {
                this.x = this.x - 101;
                this.col--;
            }
            break;
        case 'right':
            if (this.x < ctx.canvas.width - 200) {
                this.x = this.x + 101;
                this.col++;
            }
            break;
        case 'up':
            if (this.y > 10) {
                this.y = this.y - 83;
                this.row--;
            }
            break;
        case 'down':
            if (this.y < 300) {
                this.y = this.y + 83;
                this.row++;
            }
            break;
        default:
            this.x = this.x;
            this.y = this.y;
            break;
        }
    this.collide(prev);
    this.dir = '';
};

// Renders a portion of the player sprite to simulate being in the water
Player.prototype.halfRender = function() {
    var sprite = Resources.get(this.sprite);
    var face = level === 1 ? 50 : 80; // The render position varies by level
    switch (level) {
        //This switch provides the render method based on level
        case 1:
            if(!win && this.row === 0) {
                ctx.drawImage(Resources.get(this.sprite), 0, face, sprite.width, 60, this.x, this.y + face, sprite.width, 60);
            }
            break;
        case 2:
            if (!win && this.row > 0 && this.row < 5) {
                ctx.drawImage(Resources.get(this.sprite), 0, 50, sprite.width, 60, this.x, this.y + face, 101, 60);
            }
            break;
    }
}

// Takes in user input and converts to directions for player
Player.prototype.handleInput = function(dir) {
    if (win === true && level === 1) {
        level++;
        gameReset();
    }
    if (win === true && level === 2) {
        play = false;
        initLoad();
        level--;
        gameReset();
    }
    else {
        this.dir = dir;
    }
};

// Selector Class

/* Selector used for character selection
 * col Selector column
 * realx Vertical coordinate at which to draw selector
 * y Vertical coordinate
 * alpha Transparency value for the sprite
 * throbdir Direction of visual throb: down for transparent, up for opaque
 */
var Selector = function() {
    this.col = 0;
    this.x = this.col * 101 + 101;
    this.y = 208;
    this.sprite = 'images/Selector.png';
    this.alpha = 1;
    this.throbdir = 'down';
};

//Choose character
Selector.prototype.handleInput = function(key) {
    switch(key) {
        case 'left':
            this.col > 0 ? (this.col--, this.x = this.col * 101 + 101) : this.col;
            break;
        case 'right':
            this.col < 4 ? (this.col++, this.x = this.col * 101 + 101) : this.col;
            break;
        case 'enter':
            selectedChar = this.col;
            play = true;
            gameReset();
            break;
        default:
            break;
    }
};

// Selector render function
Selector.prototype.render = function() {
    ctx.save();
    this.throb();
    ctx.globalAlpha = this.alpha;
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    ctx.restore();
};

// Helper for Selector.render that uses alpha transparency to "throb" the selector
Selector.prototype.throb = function() {
    if (this.alpha > 0.5 && this.throbdir === 'down') {
        this.alpha -= 0.0075;
    }
    else {
        this.throbdir = 'up';
        this.alpha += 0.0075;
        if (this.alpha > 1 && this.throbdir === 'up') {
            this.throbdir = 'down';
        }
    }
}

//Nonplayer, Nonenemy Class
/* col The column the NPC is in
 * row The row the NPC is in
 * sprite The selected sprite for the NPC
 */
var Nonplayer = function(col, row, sprite) {
    this.row = row;
    this.col = col;
    this.x = this.col * 101;
    this.y = NPC_Y;
    this.rescued = false; 
    this.distress = false; 
    this.sprite = gem[sprite];
    this.bob = { 
        top: NPC_Y, 
        dir: 'down',
        bottom: NPC_Y + 10, 
        move: 0.10 // Pixels to move per tick
    };

};

// NPC update method
Nonplayer.prototype.update = function() {
    //If the character has not been rescued yet
    if (this.distress) {
        if (level === 1) {
            this.swim();
        }
    }
    /* If the character is currently being rescued, they are rendered as
     * "carried" by the player, so we update based on player position
     */
    if (this.rescued) {
        this.row = player.row;
        this.col = player.col;
        var count = 0;
        /* If the player has reached the next-to-last row, and moves down,
         * we check if there are any other NPCs occupying that spot
         */
        if (player.row === 4 && player.dir === 'down') {
            for (var i = 0; i < npc.length; i++) {
                if (this.col === npc[i].col) {
                    count++;
                }
            }
            //If no NPCs occupy that spot, the NPC is placed there
            if (count === 1) {
                this.x = player.x;
                this.y = 390;
                this.row = 5;
                this.col = player.col;
                this.rescued = false;
                player.dir = '';
                count = 0;
               
                if (npc.length === gem.length) {
                    win = true;
                }
                npcGenerate(1); // Generates a new
            }
        }
    }
};

// NPC render function
Nonplayer.prototype.render = function() {
    //If being rescued, the NPC is rendered as "carried" by player
    if (this.rescued) {
        ctx.drawImage(Resources.get(this.sprite), 0, 0, 101, 171, player.x, player.y + 20, 50, 85);
    }
    else {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }
};

/* A helper function for the NPC update for the bob motion
 * If we are at the bottom of the bob, we switch directions and move up
 * At the top of the bob, we switch directions and move down
 */
Nonplayer.prototype.swim = function() {
    if (this.bob.dir === 'down' && this.y < this.bob.bottom) {
        this.y += this.bob.move;
    }
    else {
        this.bob.dir = 'up';
        this.y -= this.bob.move;
        if (this.bob.dir === 'up' && this.y < this.bob.top) {
            this.bob.dir = 'down';
        }
    }
}

//Renders the above water portion of NPC for bob motion
Nonplayer.prototype.halfRender = function() {
    if (level === 1 && this.row === 0) {
        bobY = this.y - NPC_Y; // The above-water portion changes during the bob
        ctx.drawImage(Resources.get(this.sprite), 0, 50, 101, 70 - bobY, this.x, this.y + 50, 101, 70 - bobY);
    }
};

// Nonplayer collide
Nonplayer.prototype.collide = function() {
    if (this.distress === true) {
        this.rescued = true;
        this.distress = false;
    }
    else if (this.rescued) {
        this.row = 0;
        this.col = randomize(0,6);
        this.x = this.col * 101;
        this.y = NPC_Y;
        this.distress = true;
        this.rescued = false;
    }
};


//Instantiation 
var player;
var selector;
var allEnemies = [];
var npc = [];

//Helper Functions

// Resets all variables to factory settings
function gameReset() {
    allEnemies = [];
    npc = [];
    enemyMax = (level === 2) ? 8 : 5;
    for (i=0; i < enemyMax; i++) {
        var x = 0;
        var y = (level === 2) ? randomize(0,3) : randomize(0,2);
        var speed = 100 + randomize(0, 200);
        allEnemies.push(new Enemy(x, y, speed));
    }
    player = new Player;
    player.sprite = chars[selectedChar];
    gems = gem.slice(0);
    //gems.splice(gens.indexOf(player.sprite),1);
    npcGenerate(1);
    win = false;
}

/* Generates a new NPC; utilizing the switch within can allow level-specific
 * NPC generation methods, or unique NPCs, currently unutilized
 */
function npcGenerate(lvl) {
    switch(lvl) {
        case 1:
            /* We create an array containing all of the char sprites,
             * and pop() them off as we use them until we reach end of array
             */
            if (npc.length < gem.length) {
                newGem = gems.pop();
                npc.push(new Nonplayer(randomize(0,6),0,gem.indexOf(newGem)));
                npc[npc.length-1].distress = true;
            }
            break;
    }
}


function randomize(from, to) {
    var num = Math.floor(Math.random() * (to - from + 1) + from);
    return num;
}

//Win animation
function winning() {
    allEnemies=[];
    win = true;

    if (level === 1) {
        //Player jumps for joy
        var time = new Date().getTime() * 0.008;
        var x =  500;
        var y = Math.cos( time * 0.9 ) * 96 + 200;

        ctx.drawImage(Resources.get(player.sprite), x, y);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 34pt Helvetica';
        ctx.textAlign = 'center';
        ctx.fillText('Congrats!', ctx.canvas.width/2, 303);
        ctx.strokeStyle = 'black';
        ctx.strokeText('Congrats!', ctx.canvas.width/2, 303);
        ctx.font = 'bold 30pt Helvetica';
        ctx.fillText('You found the first set of Gems', ctx.canvas.width/2, 400);
        ctx.lineWidth = 1;
        ctx.strokeText('You found the first set of Gems', ctx.canvas.width/2, 400);
        ctx.font = 'bold 30pt Helvetica';
        ctx.fillText('Please, press any button to Continue', ctx.canvas.width/2, 450);
        ctx.lineWidth = 1;
        ctx.strokeText('Please, press any button to Continue', ctx.canvas.width/2, 450);
        ctx.stroke();
    } 
    if (level === 2) {
        //Player jumps for joy again
        var time = new Date().getTime() * 0.01;
        var x =  Math.sin( time * 0.9 ) * 80 + 300;
        var y = Math.cos( time * 0.9 ) * 80 + 200;

        ctx.drawImage(Resources.get(player.sprite), x, y);
        ctx.fillStyle = 'red';
        ctx.font = 'bold 34pt Helvetica';
        ctx.textAlign = 'center';
        ctx.fillText('Congrats, You Won all levels!', ctx.canvas.width/2, 303);
        ctx.stroke();
    }
}

function initLoad() {
    selector = new Selector;
}

/* This listens for key presses and sends the keys to your
 * Player.handleInput() method. You don't need to modify this.
 */
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        13: 'enter',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };
    if (play === false) {
        selector.handleInput(allowedKeys[e.keyCode]);
    }
    else {
        player.handleInput(allowedKeys[e.keyCode]);
    }
});
