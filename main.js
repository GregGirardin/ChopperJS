import { c } from './constants.js';
import { SkyGround, MountainImg, HillImg, Cloud, Rock, Grass, Tree, Base, buildCity, buildEBase, Rectangle } from './background.js';
import { Point, projection } from './utils.js';
import { Helicopter } from './helicopter.js';

/*
import * as ai from './enemyAI.js';
import * as ex from './explosions.js';
import * as helo from './helicopter.js';
import * as jeep from './jeep.js';
import * as missiles from './missiles.js';
import * as planes from './planes.js';
import * as tank from './tank.js';
*/

window.onload = gameInit;

function randInt( min, max )
{
  return Math.floor( Math.random() * ( max - min ) ) + min;
}

class gameEngine
{
  constructor()
  {
    this.canvas = document.getElementById( "myCanvas" );
    this.ctx = this.canvas.getContext( "2d" );

    this.x = this.canvas.width / 2;
    this.y = this.canvas.height - 30;
    this.dx = 2;
    this.dy = -2;

    this.debugCoords = true; // Show x,y and collision box
    this.chopper = undefined;
    this.highScore = 0;
    this.statusMessages = [];
    this.statusMsgTime = 0;
    this.statusMsgCurrent = undefined;
    this.msgQ = []; // Q of messages to loosely couple messaging
    this.newGameTimer = 0;
    this.currentCamOff = -20; // Start from the left initially to show the City
    this.showDirections = true;
    this.newGame();
  }

  newGame()
  {
    this.camera = new Point( 0, 15, c.CAM_Z );
    this.level = 1;
    this.score = 0;
    this.numChoppers = c.NUM_CHOPPERS;
    this.fadeInCount = 0;
    this.newLevel();
  }

  qMessage( m )
  {
    this.msgQ.push( m );
  }

  processMessage( m, param )
  {

    switch( m )
    {
      case c.MSG_UI: // currently all UI messages are for the chopper.
        this.chopper.processMessage( c.MSG_UI, param );
        break;

      case c.MSG_BUILDING_DESTROYED:
        break;

      case c.MSG_E_BUILDING_DESTROYED:
        break;

      case c.MSG_ENEMY_LEFT_BATTLEFIELD:
        break;

      case c.MSG_CHOPPER_DESTROYED:
        break;

      case c.MSG_SPAWNING_COMPLETE:
        break;

      case c.MSG_SOLDIERS_TO_CITY:
        break;

      case c.MSG_MISSION_COMPLETE:
        break;

      case c.MSG_CHOPPER_AT_BASE:
        break;
    }
  }

  modScore( points ) 
  {
    this.score += points;
    if( this.score < 0 )
      this.score = 0;
    if( this.score > this.highScore )
      this.highScore = this.score;
  }

  newLevel()
  {
    var z;

    this.cameraOnHelo = false;
    this.enemyBaseDestroyed = false;
    this.spawningComplete = false;
    this.allEnemiesDestroyed = false;
    this.fadeInCount = 0;

    this.levelComplete = false;
    this.time = 0;
    this.bg_objects = []; // Background objects that don't interact with anything.. no collisions or update
    this.objects = []; // buildings / vehicles / smoke / bullets. Things that require updates and collisions
    // Two lists to speed up collision detection and other interactions of objects that can interact.
    // We call update() and check for collisions for objects[]

    //this.objects.push( new Rectangle( this, new Point( 0, 0, 10), new Point( 50, 0) ) );

    // Sky and ground
    this.bg_objects.push( new SkyGround( this ) );

    // Mountain range
    this.bg_objects.push( new MountainImg( this, 200, 0, c.HORIZON_DISTANCE / 2 ) );
    this.bg_objects.push( new HillImg( this, 200, 0, c.HORIZON_DISTANCE / 4 ) );
    
    // Clouds.. clouds move so they're active.
    for( z = 1;z < 10;z++ )
      this.objects.push( new Cloud( this,
                                    randInt( c.MIN_WORLD_X - 1000, c.MAX_WORLD_X * 2 ),
                                    randInt( 150, 225 ),
                                    randInt( c.HORIZON_DISTANCE / 20,
                                             c.HORIZON_DISTANCE / 2 ) ) ); // in front of the mountains

    // Rocks
    for( z = -3;z < 12;z += 2 ) // Z is behind projection plane but the math works.
      this.bg_objects.push( new Rock( this, randInt( 30, c.MAX_WORLD_X ), 0, z ) );

    // Grass
    for( z = 25;z < 40;z++ )
      this.bg_objects.push( new Grass( this, randInt( 20, c.MAX_WORLD_X ), 0, z ) );

    // Trees
    for( z = 40;z < 500;z += 20 )
      this.bg_objects.push( new Tree( this, randInt( 20, c.MAX_WORLD_X ), 0, z ) );

    // Base - active, update replenishes resources
    //this.objects.push( new Base( this, 0, 0, 2, "Base" ) );

    // Create the Chopper
    this.chopper = new Helicopter( this, 0, 0, 1 );
    this.objects.push( this.chopper );

    buildCity( this, c.MIN_WORLD_X, c.NUM_CITY_BUILDINGS );
    buildEBase( this, c.MAX_WORLD_X / 2, c.NUM_E_BASE_BUILDINGS + this.level * 2 );

  //  this.objects.push( new GameManager( this ) )

   // Sort objects by decreasing Z so closer are drawn on top
    this.bg_objects.sort( function( a, b ){ return b.p.z - a.p.z } );
    this.objects.sort( function( a, b ){ return b.p.z - a.p.z } ) ;
    
  }

  addObject( newobj )
  {
    this.objects.push( newobj );
  }

  update( deltaMs )
  {
    var index;

    for( index=0;index < this.objects.length;index++ )
      this.objects[ index ].update( deltaMs );
  }

  draw()
  {
    var index, o, p;

    this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );

    for( index=0;index < this.bg_objects.length;index++ )
    {
      o = this.bg_objects[ index ];
      p = projection( this.camera, o.p );
      if( p.x < c.SCREEN_WIDTH + c.SCREEN_PAD && p.x > -c.SCREEN_PAD )
      {
        o.draw( p );
        if( this.debugCoords )
        {
          this.ctx.strokeStyle = 'red';
          this.ctx.beginPath();
          this.ctx.moveTo( p.x - 5, p.y );
          this.ctx.lineTo( p.x + 5, p.y );
          this.ctx.moveTo( p.x, p.y - 5 );
          this.ctx.lineTo( p.x, p.y + 5 );
          this.ctx.stroke();
        }
      }
    }

    for( index=0;index < this.objects.length;index++ )
    {
      o = this.objects[ index ];
      p = projection( this.camera, o.p );
      if( p.x < c.SCREEN_WIDTH + c.SCREEN_PAD && p.x > -c.SCREEN_PAD )
      {
        o.draw( p );
        if( this.debugCoords )
        {
          this.ctx.strokeStyle = 'red';
          this.ctx.beginPath();
          this.ctx.moveTo( p.x - 5, p.y );
          this.ctx.lineTo( p.x + 5, p.y );
          this.ctx.moveTo( p.x, p.y - 5 );
          this.ctx.lineTo( p.x, p.y + 5 );
          this.ctx.stroke();
        }
      }
    }

    // scores
  }

  displayDirections()
  {

  }

  loop( milliSeconds ) // the game loop
  {
    this.update( milliSeconds );
    this.draw();
  }

}

let gEngine;
let frameCount = 1000; // temp, just run for a couple seconds.
let lastTimestamp = 0;
function gameLoop( timeStamp )
{
  var delta = timeStamp - lastTimestamp;
  lastTimestamp = timeStamp;
  gEngine.loop( delta );
  // if( frameCount-- > 0 )
    window.requestAnimationFrame( gameLoop );
}

function keyDownHandler( e )
{
  gEngine.processMessage( c.MSG_UI, e );
}

function gameInit()
{
  gEngine = new gameEngine();

  document.addEventListener( "keydown", keyDownHandler, false );
  // document.addEventListener( "keyup", keyUpHandler, false );

  window.requestAnimationFrame( gameLoop );
}