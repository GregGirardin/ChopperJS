import { c } from './constants.js';
import { SkyGround, Mtn, Hill, Cloud, Rock, Grass, Tree, Base, buildCity, buildEBase, Rectangle } from './background.js';
import { Point, projection, collisionCheck, displayColRect, drawCoords, randInt } from './utils.js';
import { Helicopter } from './helicopter.js';
import { Plane } from './planes.js';
import { Vehicle } from './vehicles.js';
import { Tank } from './tank.js';
// import { Missile } from './missiles.js';

window.onload = gameInit;

class gameEngine
{
  constructor()
  {
    this.canvas = document.getElementById( "myCanvas" );
    this.ctx = this.canvas.getContext( "2d" );

    this.canvas.width = c.SCREEN_WIDTH; // widen to check that we're not drawing far off screen
    this.canvas.height = c.SCREEN_HEIGHT;

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
    this.cityDestroyed = false;
    this.newGame();
    // hack delay so sprits have time to load. Fix this tbd
    const date = Date.now();
    let currentDate = null;
    do
    {
      currentDate = Date.now();
    } while ( currentDate - date < 500 );

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
        this.chopper.processMessage( this, c.MSG_UI, param );
        break;

      case c.MSG_BUILDING_DESTROYED: break;
      case c.MSG_E_BUILDING_DESTROYED: break;
      case c.MSG_ENEMY_LEFT_BATTLEFIELD: break;
      case c.MSG_CHOPPER_DESTROYED: break;
      case c.MSG_SPAWNING_COMPLETE: break;
      case c.MSG_SOLDIERS_TO_CITY: break;
      case c.MSG_MISSION_COMPLETE: break;
      case c.MSG_CHOPPER_AT_BASE: break;
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

    // this.objects.push( new Rectangle( this, new Point( 0, 0, 10), new Point( 50, 0) ) );

    // Sky and ground
    this.bg_objects.push( new SkyGround( this ) );

    // Mountain range
    this.bg_objects.push( new Mtn( this, 200, 0, c.HORIZON_DISTANCE / 2 ) );
    this.bg_objects.push( new Hill( this, 200, 0, c.HORIZON_DISTANCE / 4 ) );
    
    // Clouds.. clouds move so they're active.
    for( z = 1;z < 10;z++ )
      this.bg_objects.push( new Cloud( this,
                                       randInt( c.MIN_WORLD_X - 1000, c.MAX_WORLD_X * 2 ),
                                       randInt( 150, 225 ),
                                       randInt( 10, c.HORIZON_DISTANCE / 4 ) ) ); // in front of the mountains
    // Rocks
    for( z = 2;z < 22;z += 1 ) // Z is behind projection plane but the math works.
      this.bg_objects.push( new Rock( this, randInt( 100, c.MAX_WORLD_X ), 0, z ) );

    // Grass
    for( z = 25;z < 50;z++ )
      this.bg_objects.push( new Grass( this, randInt( 100, c.MAX_WORLD_X ), 0, z ) );

    // Trees
    for( z = 20;z < 200;z += 2 )
      this.bg_objects.push( new Tree( this, randInt( 20, c.MAX_WORLD_X ), 0, z ) );

    // Base - active, update nishes resources
    this.objects.push( new Base( this, 0, 0, 2, "Base" ) );

    // Create the Chopper
    this.chopper = new Helicopter( this, 0, 0, 1 );
    this.objects.push( this.chopper );

    buildCity( this, c.MIN_WORLD_X, c.NUM_CITY_BUILDINGS );
    buildEBase( this, c.MAX_WORLD_X / 2, c.NUM_E_BASE_BUILDINGS + this.level * 2 );

    //this.objects.push( new GameManager( this ) )

    this.objects.push( new Plane( this, "Fighter1", 100, 30 ) );
    this.objects.push( new Plane( this, "Fighter2", 0, 30 ) );
    this.objects.push( new Plane( this, "Bomber1", 20, 30 ) );
    this.objects.push( new Vehicle( this, "Jeep", 100, c.DIR_LEFT ) );
    this.objects.push( new Vehicle( this, "Transport1", c.MIN_WORLD_X ) );
    this.objects.push( new Vehicle( this, "Transport2", c.MIN_WORLD_X ) );
    this.objects.push( new Vehicle( this, "Truck", c.MIN_WORLD_X ) );
    this.objects.push( new Tank( this, -10 ) );

    // Sort objects by decreasing Z so closer are drawn on top
    this.bg_objects.sort( function( a, b ){ return b.p.z - a.p.z } );
    this.objects.sort( function( a, b ){ return b.p.z - a.p.z } ) ;
  }

  // tbd. put new objects in temp list and add all later.
  // so we don't add while processing the list in this.update()
  addObject( newobj )
  {
    this.objects.push( newobj );
    this.objects.sort( function( a, b ){ return b.p.z - a.p.z } );
  }

  addBgObject( newobj )
  {
    this.bg_objects.push( newobj );
    this.bg_objects.sort( function( a, b ){ return b.p.z - a.p.z } );
  }

  update( deltaMs )
  {
    var index1, index2;

    // new game timer

    // Collision detection for objects with a colRect
    // Background objects don't and some active foreground objects don't.
    // 
    for( index1 = 0;index1 < this.objects.length - 1;index1++ )
      for( index2 = index1 + 1;index2 < this.objects.length;index2++ )
      {
        let obj1 = this.objects[ index1 ];
        let obj2 = this.objects[ index2 ];

        if( ( typeof obj1.colRect === 'array' ) && ( typeof obj2.colRect === 'array' ) )
          if( collisionCheck( obj1, obj2 ) )
          {
            obj1.processMessage( this, c.MSG_COLLISION_DET, obj2 );
            obj2.processMessage( this, c.MSG_COLLISION_DET, obj1 );
          }
      }

    // for( index1 = 0;index1 < this.bg_objects.length;index1++ )
    //   if( typeof this.bg_objects[ index1 ].update === 'function' )
    //     if( this.bg_objects[ index1 ].update( deltaMs ) == false )
    //     {
    //       // Not all background objects have an update
    //       this.bg_objects.splice( index1, 1 );
    //       index1--;
    //     }
      
    for( index1 = 0;index1 < this.objects.length;index1++ )
      if( typeof this.objects[ index1 ].update === 'function' )
        if( this.objects[ index1 ].update( deltaMs ) == false )
        {
          this.objects.splice( index1, 1 );
          index1--;
        }
    // move the camera
    var tgtCamXOff;
    switch( this.chopper.chopperDir )
    {
      case c.DIR_FWD:   tgtCamXOff =   0; break;
      case c.DIR_LEFT:  tgtCamXOff = -20; break;
      case c.DIR_RIGHT: tgtCamXOff =  20; break;
    }

    if( Math.abs( this.currentCamOff - tgtCamXOff ) < 1 )
    {
      this.currentCamOff = tgtCamXOff;
      this.cameraOnHelo = true;
    }
    else
      this.currentCamOff += ( this.currentCamOff < tgtCamXOff ) ? .5 : -.5;
    // else if( this.currentCamOff < tgtCamXOff )
    //   this.currentCamOff += .5;
    // else if( this.currentCamOff > tgtCamXOff )
    //   this.currentCamOff -= .5;

    this.camera.x = this.chopper.p.x + this.currentCamOff;
    if( this.camera.x < c.MIN_WORLD_X )
      this.camera.x = c.MIN_WORLD_X;
    else if( this.camera.x > c.MAX_WORLD_X )
      this.camera.x = c.MAX_WORLD_X;

    this.camera.y = this.chopper.p.y > 40 ? this.chopper.p.y - 20 : 20;
  }

  draw()
  {
    var index, o, p;

    this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );

    for( index = 0;index < this.bg_objects.length;index++ )
    {
      o = this.bg_objects[ index ];
      p = projection( this.camera, o.p );
      if( p.x < c.SCREEN_WIDTH + c.SCREEN_PAD && p.x > -c.SCREEN_PAD )
      {
        o.draw( p );
        if( this.debugCoords )
          drawCoords( this, p );
      }
    }

    for( index = 0;index < this.objects.length;index++ )
    {
      o = this.objects[ index ];
      p = projection( this.camera, o.p );
      if( p.x < c.SCREEN_WIDTH + c.SCREEN_PAD && p.x > -c.SCREEN_PAD )
      {
        o.draw( p );
        if( this.debugCoords )
        {
         if( typeof o.colRect === 'array' )
            displayColRect( this, o );
          drawCoords( this, p );
        }
      }
    }

    // scores
  }

  displayDirections()
  {

  }

  loop( tDeltams ) // the game loop
  {
    this.update( tDeltams );
    this.draw();
  }

}

let gEngine;
let lastTimestamp = 0;
function gameLoop( timeStamp )
{
  var delta = timeStamp - lastTimestamp;
  lastTimestamp = timeStamp;
  gEngine.loop( delta );
  window.requestAnimationFrame( gameLoop );
}

function keyDownHandler( e )
{
  //logCollisions();
  gEngine.processMessage( c.MSG_UI, e );
}

function gameInit()
{
  gEngine = new gameEngine();

  document.addEventListener( "keydown", keyDownHandler, false );
  // document.addEventListener( "keyup", keyUpHandler, false );

  window.requestAnimationFrame( gameLoop );
}