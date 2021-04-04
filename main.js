import { c } from './constants.js';
import { SkyGround, Mtn, Hill, Cloud, Rock, Grass, Tree, Base, buildCity, buildEBase } from './background.js';
import { Point, projection, collisionCheck, displayColRect, drawCoords, randInt } from './utils.js';
import { Helicopter } from './helicopter.js';
import { Plane } from './planes.js';
import { Vehicle } from './vehicles.js';
import { Tank } from './tank.js';

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
    this.msgQ = []; // Q of messages send to Engine to loosely couple messaging
    this.statusMsgQ = []; // Status message Q.
    this.newGameTimer = 0;
    this.currentCamOff = 0; // -20; // Start from the left initially to show the City
    this.showDirections = false;
    this.cityDestroyed = false;
    this.currentMessage = undefined;
    this.currentMessageTime = 0;
    this.enemyTypes = [];

    this.newGame();
    // tbd hack delay so sprites have time to load. Fix this.
    const date = Date.now();
    let currentDate = null;
    do
    {
      currentDate = Date.now();
    } while ( currentDate - date < 100 );
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

  newLevel()
  {
    var z;

    this.cameraOnHelo = false;
    //this.enemyBaseDestroyed = false;
    this.spawningComplete = false;
    this.allEnemiesDestroyed = false;
    this.fadeInCount = 0;
    this.missionInProgress = true;

    this.levelComplete = false;
    this.objects = []; // world objects

    // Create all initial objects for the level. GameManager spawns things during play.

    // Sky and ground
    this.addObject( new SkyGround( this ) );

    // Mountain range
    this.addObject( new Mtn( this, 200, 0, c.HORIZON_DISTANCE / 2 ) );
    this.addObject( new Hill( this, 200, 0, c.HORIZON_DISTANCE / 4 ) );
    
    // Clouds
    for( z = 1;z < 10;z++ )
      this.addObject( new Cloud( this,
                                 randInt( c.MIN_WORLD_X - 1000, c.MAX_WORLD_X * 2 ),
                                 randInt( 150, 225 ),
                                 randInt( 50, c.HORIZON_DISTANCE / 4 ) ) ); // in front of the mountains
    // Rocks
    for( z = 2;z < 22;z += 1 ) // Z is behind projection plane but the math works.
      this.addObject( new Rock( this, randInt( 100, c.MAX_WORLD_X ), 0, z ) );

    // Grass
    for( z = 25;z < 50;z++ )
      this.addObject( new Grass( this, randInt( 100, c.MAX_WORLD_X ), 0, z ) );

    // Trees
    for( z = 20;z < 500;z += 5 )
      this.addObject( new Tree( this, randInt( 40, c.MAX_WORLD_X ), 0, z ) );

    // Base - active, update nishes resources
    this.addObject( new Base( this, 0, 0, 2, "Base" ) );

    // Create the Chopper
    this.chopper = new Helicopter( this, 0, 0, 1 );
    this.addObject( this.chopper );

    buildCity( this, c.MIN_WORLD_X, c.NUM_CITY_BUILDINGS );
    buildEBase( this, c.MAX_WORLD_X / 2, c.NUM_E_BASE_BUILDINGS + this.level * 2 );

    this.addObject( new GameManager( this, this.level ) );
  }

  processMessage( m, param )
  {
    var index;

    switch( m )
    {
      case c.MSG_UI: // currently all UI messages are for the chopper.
        this.chopper.processMessage( this, c.MSG_UI, param );
        break;

      case c.MSG_BUILDING_DESTROYED:
        var anyBuildings = false;
        for( index = 0;index < this.objects.length;index++ )
          if( this.objects[ index ].oType == "CityBuilding" )
          {
            anyBuildings = true;
            break;
          }
        if( !anyBuildings )
        {
          this.addStatusMessage( { m : "City Destroyed!", t : 2000 } );
          this.gameOver();
        }
        else
          this.addStatusMessage( { m : "City Bombed", t : 1000 } );

        break;

      case c.MSG_E_BUILDING_DESTROYED:
        var anyBuildings = false;
        for( index = 0;index < this.objects.length;index++ )
          if( this.objects[ index ].oType == "EnemyBuilding" )
          {
            anyBuildings = true;
            break;
          }
        if( !anyBuildings )
        {
          // this.enemyBaseDestroyed = true;
          this.addStatusMessage( { m : "Enemy Base Destroyed!", t : 1000 } );
        }

      case c.MSG_ENEMY_LEFT_BATTLEFIELD:
        this.modScore( param.points );
        var anyEnemies = false;
        for( index = 0;index < this.objects.length;index++ )
          if( this.enemyTypes.includes( this.objects[ index ].oType ) )
          {
            anyEnemies = true;
            break;
          }
        if( !anyEnemies && this.spawningComplete )
        {
          this.allEnemiesDestroyed = true;
          this.addStatusMessage( { m : "All Enemies Destroyed, return to Base", t : 1000 } );
        }
        break;

      case c.MSG_CHOPPER_DESTROYED:
        break;

      case c.MSG_SOLDIERS_TO_CITY: break;

      case c.MSG_MISSION_COMPLETE:
        this.addStatusMessage( { m: "Level Complete.", t : 1000 } );
        var cityBonus = 0;
        for( index = 0;index < this.objects.length;index++ )
          if( this.objects[ index ].oType == "CityBuilding" )
            cityBonus += c.POINTS_BUILDING;
        if( cityBonus )
          this.addStatusMessage( { m : "City bonus " + cityBonus, t : 1000 } )
          this.modScore( cityBonus )

        this.level += 1;
        if( this.level > c.NUM_LEVELS )
        {
          this.addStatusMessage( { m :"All levels complete!", t : 1000 } );
          this.gameOver();
        }
        else
          this.newLevel();

        break;

      case c.MSG_CHOPPER_AT_BASE:
        if( this.allEnemiesDestroyed && this.missionInProgress )
        {
          this.missionInProgress = false;
          this.qMessage( { m : c.MSG_MISSION_COMPLETE, p : undefined } );
        }
        break;

      case c.MSG_CREATE_OBJECT:
        this.objects.push( param );
        this.objects.sort( function( a, b ){ return b.p.z - a.p.z } );
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

  // Deprecate. don't use after newLevel() so we don't risk conflicts modifying objects[].
  addObject( newobj )
  {
    this.objects.push( newobj );
    this.objects.sort( function( a, b ){ return b.p.z - a.p.z } );
  }

 // Don't call processMessage directly to avoid circular callbacks / loosely couple.
  qMessage( m ) { this.msgQ.push( m ); }
  // Enemy types need to register with us so we know when they are all destroyed.
  registerEnemyType( type ) { this.enemyTypes.push( type ); }
  addStatusMessage( msg ) { this.statusMsgQ.push( msg ); }

  gameOver()
  {
    this.addStatusMessage( { m : "Game Over Man", t : 2000 } );
    this.newGameTimer = 4000;
  }

  //////////////////////////////////////
  //////////////////////////////////////
  //////////////////////////////////////
  update( deltaMs )
  {
    var index1, index2;

    // new game timer
    if( this.newGameTimer > 0 )
    {
      this.newGameTimer -= deltaMs;
      if( this.newGameTimer < 0 )
      {
        this.newGameTimer = 0;
        this.newGame();
        return
      }
    }

    // The msg Q.
    while( this.msgQ.length )
    {
      var msg = this.msgQ.shift();
      this.processMessage( msg.m, msg.p );
    }

    // Collision detection. Applies to objects with a colRect[].
    for( index1 = 0;index1 < this.objects.length - 1;index1++ )
      for( index2 = index1 + 1;index2 < this.objects.length;index2++ )
      {
        let obj1 = this.objects[ index1 ];
        let obj2 = this.objects[ index2 ];

        if( ( typeof obj1.colRect === 'object' ) && ( typeof obj2.colRect === 'object' ) )
          if( collisionCheck( obj1, obj2 ) )
          {
            obj1.processMessage( this, c.MSG_COLLISION_DET, obj2 );
            obj2.processMessage( this, c.MSG_COLLISION_DET, obj1 );
          }
      }
      
    for( index1 = 0;index1 < this.objects.length;index1++ )
      if( typeof this.objects[ index1 ].update === 'function' )
        if( this.objects[ index1 ].update( deltaMs ) == false )
        {
          this.objects.splice( index1, 1 );
          index1--;
        }
  
    // Move the camera
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

    this.camera.x = this.chopper.p.x + this.currentCamOff;
    if( this.camera.x < c.MIN_WORLD_X )
      this.camera.x = c.MIN_WORLD_X;
    else if( this.camera.x > c.MAX_WORLD_X )
      this.camera.x = c.MAX_WORLD_X;

    this.camera.y = this.chopper.p.y > 40 ? this.chopper.p.y - 20 : 20;

    // The status message Q.
    if( this.currentMessageTime > 0 )
      this.currentMessageTime -= deltaMs;
    else if( this.currentMessageTime <= 0 )
      if( this.statusMsgQ.length )
      {
        var msg = this.statusMsgQ.shift();
        this.currentMessageTime = msg.t;
        this.currentMessage = msg.m;
      }
      else
        this.currentMessage = undefined;
  }
  //////////////////////////////////////
  //////////////////////////////////////
  //////////////////////////////////////
  draw()
  {
    var index, o, p;

    for( index = 0;index < this.objects.length;index++ )
    {
      o = this.objects[ index ];
      // Only objects with a position are drawn
      // Some objects may just be AIs, timers, etc.
      if ( typeof o.draw === 'function' ) 
      {
        p = projection( this.camera, o.p );
        if( p.x < c.SCREEN_WIDTH + c.SCREEN_PAD && p.x > -c.SCREEN_PAD )
        {
          o.draw( p );
          if( this.debugCoords )
          {
            if( typeof o.colRect === 'object' )
              displayColRect( this, o );
            drawCoords( this, p );
          }
        }
      }
    }

    // scores
    this.ctx.font = "20px Arial";
    this.ctx.fillText( "Score:" + this.score, c.SCREEN_WIDTH / 2 - 30, 20 );
    this.ctx.font = "12px Arial";
    this.ctx.fillText( "High:" + this.highScore, c.SCREEN_WIDTH / 2 - 15, 30 );
    if( this.showDirections )
      this.displayDirections();
    if( this.currentMessage )
    {
      this.ctx.font = "40px Arial";
      this.ctx.fillText( this.currentMessage,
                         c.SCREEN_WIDTH / 2 - this.currentMessage.length * 8, c.SCREEN_HEIGHT / 2 );
    }
  }

  displayDirections()
  {
    const d = [ "Chopper", "",
                "up/down/left/right - move chopper",
                "a : Small Missile",
                "s : Large Missile",
                "z : Bomb",
                "sp : Bullet",
                "? : This screen", "",
                "Finish level by destroying all enemies and returning to base.",
                "Refuel by landing at base",
                "Game ends if you lose all choppers, finish all levels, or the city is destroyed" ];

    this.ctx.font = "20px Arial";
    this.ctx.fillStyle = "##000000";
    let index;
    for( index = 0;index < d.length;index++ )
      this.ctx.fillText( d[ index ], c.SCREEN_WIDTH / 3, 50 + index * 20 );
  }

  loop( deltaMs ) // The game loop
  {
    this.update( deltaMs );
    this.draw();
  }
}

/* Game manager.
   Provides status updates
   Spawns enemies
   track game progress
*/
class GameManager
{
  constructor( e, level )
  {
    this.e = e;
    this.gameTime = 0;
    this.gameLevel = level;
    this.numEnemies = 1; // level * 2;
    this.timeToNextSpawn = 100;
    this.p = new Point( 0, 0, 0 );
    this.newEnemy = 7;
  }

  update( deltaMs )
  { 
    if( this.gameTime == 0 )
    {
      if( this.gameLevel == 1 )
      {
        this.e.addStatusMessage( { m : "Defend the city", t : 2000 } );
        this.e.addStatusMessage( { m : "Destroy enemy buildings ->", t :2000 } );
        this.e.addStatusMessage( { m : "Press ? for directions", t :2000 } );
      } 
      let msg = "Level " + this.gameLevel;
      this.e.addStatusMessage( { m : msg, t : 2000 } );
    }

    this.gameTime += deltaMs;
    this.timeToNextSpawn -= deltaMs;
    if( ( this.timeToNextSpawn < 0 ) && ( this.numEnemies > 0 ) )
    {
      this.numEnemies -= 1;
      if( !this.numEnemies )
        this.e.spawningComplete = true;
      this.timeToNextSpawn = 100;
      let spX = this.e.chopper.p.x + randInt( 20, 100 );
      let spY = randInt( 10, 30 );
 
      // Possible enemies.
      // "Jeep", "Transport1", "Transport2", "Truck", "Tank", // "Bomber1", "Bomber2", "Fighter1", "Fighter2"
      // const newEnemy = randInt( 0, 9);
      switch( this.newEnemy )
      {
        case 0: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Vehicle( this.e, "Jeep",        spX ) } ); break;
        case 1: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Vehicle( this.e, "Transport1",  spX ) } ); break;
        case 2: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Vehicle( this.e, "Transport2",  spX ) } ); break;
        case 3: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Vehicle( this.e, "Truck",       spX ) } ); break;
        case 4: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Tank(    this.e,                spX ) } ); break;
        case 5: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Plane(   this.e, "Bomber1",     spX, spY ) } ); break;
        case 6: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Plane(   this.e, "Bomber2",     spX, spY ) } ); break;
        case 7: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Plane(   this.e, "Fighter1",    spX, spY ) } ); break;
        case 8: this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Plane(   this.e, "Fighter2",    spX, spY ) } ); break;
        default:
          break;
      }

      this.newEnemy++;
      // if( this.newEnemy > 8 )
      //   this.newEnemy = 0;
    }

    return true;
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
  gEngine.processMessage( c.MSG_UI, e );
}

function gameInit()
{
  gEngine = new gameEngine();

  document.addEventListener( "keydown", keyDownHandler, false );
  // document.addEventListener( "keyup", keyUpHandler, false );

  window.requestAnimationFrame( gameLoop );
}