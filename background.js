import { c } from './constants.js';
import { Point, projection, randInt, showSI } from './utils.js';
import { Missile } from './missiles.js';
import { Explosion } from './explosions.js';
import { Helicopter } from './helicopter.js';

// background stuff
export class SkyGround
{
  static img;
  static hWidth = 4000;
  static hHeight = 500;

  constructor( e )
  {
    this.e = e; // game engine
    this.oType = "SkyGround";
    this.p = new Point( 0, 0, c.HORIZON_DISTANCE );
  
    if( !SkyGround.img )
    {
      SkyGround.img = new Image();
      SkyGround.img.src = "./images/backgrounds/cloud2.png";
    }
  }
  
  draw( p )
  {
    var hProj;

    hProj = projection( this.e.camera, this.p );
    
    this.e.ctx.drawImage( SkyGround.img,
                          p.x - SkyGround.hWidth / 2, p.y - SkyGround.hHeight,
                          SkyGround.hWidth, SkyGround.hHeight );

    this.e.ctx.fillStyle = 'green'; // ground
    this.e.ctx.fillRect( 0, hProj.y, c.SCREEN_WIDTH, c.SCREEN_HEIGHT );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Mtn
{
  static i;
  static w = 3000;
  static h = 250;

  constructor( e, x, y, z )
  {
    this.e = e; // game engine
    this.oType = "Mountain";
    this.p = new Point( x, y, z );

    if( !Mtn.i )
    {
      Mtn.i = new Image();
      Mtn.i.src = "./images/backgrounds/Mountains1.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Mtn.i, p.x - Mtn.w / 2, p.y - Mtn.h, Mtn.w, Mtn.h );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Hill
{
  static i;
  static w = 4000;
  static h = 150;

  constructor( e, x, y, z )
  {
    this.e = e; // game engine
    this.oType = "Hill";
    this.p = new Point( x, y, z );

    if( !Hill.i )
    {
      Hill.i = new Image();
      Hill.i.src = "./images/backgrounds/Mountains2.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Hill.i, p.x - Hill.w / 2, p.y - Hill.h, Hill.w, Hill.h );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Cloud
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.oType = "Cloud";
    this.p = new Point( x, y, z );
    this.w = 0;
    this.h = 0;

    this.imgFactor = 1;
    if( z > 5000 )
      this.imgFactor = .1;
    else if( z > 2000 )
      this.imgFactor = .25;
    else if( z > 1000 )
      this.imgFactor = .5;

    this.checkPosTimer = 1000 + x; // check to see if this cloud is off the screen and move back right
                                   // use x to randomize so we don't do all checks at once.
    if( !Cloud.img )
    {
      Cloud.img = new Image();
      Cloud.img.src = "./images/backgrounds/cloud.gif";
    }
  }

  update( deltaMs ) 
  {
    this.p.x -= 2/deltaMs;

    this.checkPosTimer -= deltaMs;
    if( this.checkPosTimer < 0 )
    {
      this.checkPosTimer = 5000;
      if( this.p.x < c.MIN_WORLD_X )
      {
        this.checkPosTimer = 1000;

        let p = projection( this.e.camera, this.p );
        if( p.x < -this.w / 2 )
        {
          this.p.x = c.MAX_WORLD_X;
          while( 1 )
          {
            p = projection( this.e.camera, this.p );
            if( p.x > c.SCREEN_WIDTH + this.w / 2 )
              break;
            this.p.x += 1000;
          }
        }
      }
    }
    return true;
  }

  draw( p )
  {
    if( this.w == 0 )
    {
      this.w = Cloud.img.width * this.imgFactor;
      this.h = Cloud.img.height * this.imgFactor;
      return;
    }
    this.e.ctx.drawImage( Cloud.img, p.x - this.w / 2, p.y - this.h / 2, this.w, this.h );

    // If we want the clouds to have shadows.
    const projShadow = projection( this.e.camera, new Point( this.p.x, 0, this.p.z ) );
    this.e.ctx.fillStyle = 'black';
    this.e.ctx.beginPath();
    this.e.ctx.ellipse( p.x, projShadow.y, this.w / 4, 2, 0, 0, 2 * c.PI )
    this.e.ctx.fill();
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Rock
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.oType = "Rock";
    this.p = new Point( x, y, z );
    if( z > 200 )
      this.imgFactor = .25;
    else if( z > 50 )
      this.imgFactor = .5;
    else
      this.imgFactor = 1;

    if( !Rock.img )
    {
      Rock.img = new Image();
      Rock.img.src = "./images/backgrounds/rock1.gif";
    }
  }

  draw( p )
  {
    if( !this.w || this.w == 0 )
    {
      this.w = Rock.img.width * this.imgFactor;
      this.h = Rock.img.height * this.imgFactor;
    }
    this.e.ctx.drawImage( Rock.img, p.x - this.w / 2, p.y - this.h, this.w, this.h );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Grass
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.oType = "Grass";
    this.p = new Point( x, y, z );
    this.imgFactor = randInt( 1, 2 ) / 2;

    if( !Grass.img )
    {
      Grass.img = new Image();
      Grass.img.src = "./images/backgrounds/grass1.gif";
    }
  }

  draw( p )
  {
    if( !this.w || this.w == 0 )
    {
      this.w = Grass.img.width * this.imgFactor;
      this.h = Grass.img.height * this.imgFactor;
    }
    else
      this.e.ctx.drawImage( Grass.img, p.x - this.w / 2, p.y - this.h, this.w, this.h );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Tree
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.oType = "Tree";
    this.p = new Point( x, y, z );

    this.imgFactor = .5;
    if( z > 500 )
      this.imgFactor = .05;
    else if( z > 250 )
      this.imgFactor = .1;
    else if ( z > 50 )
      this.imgFactor = .25;

    if( !Tree.image )
    {
      Tree.img = new Image();
      Tree.img.src = "./images/backgrounds/tree.gif";
    }
  }

  draw( p )
  {
    if( !this.w || this.w == 0 )
    {
      this.w = Tree.img.width * this.imgFactor;
      this.h = Tree.img.height * this.imgFactor;
      return;
    }

    this.e.ctx.drawImage( Tree.img, p.x - this.w / 2, p.y - this.h, this.w, this.h );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export class Base
{
  static img;
  static BASE_RESUP_INTERVAL = 10 * 1000; // doesn't really need to be in constants.

  constructor( e, x, label=undefined )
  {
    this.e = e;
    this.oType = "Homebase";
    this.p = new Point( x, 0, 2 );
    this.label = label;
    this.imgFactor = .6;
    this.colRect = [ -12, 1, 12, 0 ];

    this.resupTimer = Base.BASE_RESUP_INTERVAL; // increase our resources
    // Base has resources that the Chopper can take when it lands.
    let r = Helicopter.resourceMaxAmount;
    this.curAmount = { fuel     : r.fuel,
                       StructI  : r.StructI,
                       bullets  : r.bullets,
                       missileA : r.missileA,
                       missileB : r.missileB,
                       bombs    : r.bombs };
              
    if( !Base.image )
    {
      Base.img = new Image();
      Base.img.src = "./images/backgrounds/base.gif";
    }
  }

  processMessage( e, msg, param=undefined )
  {
    switch( msg )
    {
      case c.MSG_COLLISION_DET:
        break;
    }
  }

  update( deltaMs )
  {
    this.resupTimer -= deltaMs;
    if( this.resupTimer < 0 )
    {
      // right now we replenish 10% of all resources every 10 seconds.
      // Chopper takes them when it lands here.
      this.resupTimer = Base.BASE_RESUP_INTERVAL;
  
      for( const[ k, o ] of Object.entries( Helicopter.resourceMaxAmount ) )
        if( this.curAmount[ k ] < Helicopter.resourceMaxAmount[ k ] )
          this.curAmount[ k ] += Helicopter.resourceMaxAmount[ k ] / 10;
    }

    return true;
  }

  draw( p )
  {
    if( !this.w || this.w == 0 )
    {
      this.w = Base.img.width * this.imgFactor;
      this.h = Base.img.height * this.imgFactor;
      return;
    }

    this.e.ctx.drawImage( Base.img, p.x - this.w / 2, p.y - this.h + 50, this.w, this.h );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
class Building // from miscBuildings.gif
{
  static imgInfo =
  [
    // This gif is a sprite sheet. Need to cut out individual images.
    // First row
    [    4,   3, 153, 94 ],  // x,y,w,h
    [  164,   3, 151, 93 ],
    [  322,   9,  84, 88 ],
    [  413,   9,  85, 88 ],
    [  506,  10, 128, 38 ],
    [  637,  10, 127, 38 ],
    [  507,  51, 173, 63 ],
    [  687,  50,  86, 64 ],

    // Row 2
    [    3, 104, 126, 85 ],
    [    3, 104, 126, 85 ],
    [  363, 103,  96, 85 ],
    [  463, 118,  54, 77 ],
    [  523, 121,  54, 74 ],
    [  580, 118,  98, 77 ],
    [  681, 118,  96, 77 ],

    // Row 3
    [    3, 193,  90, 67 ],
    [    3, 193,  90, 67 ],
    [  189, 189,  67, 71 ],
    [  328, 198,  46, 62 ],
    [  424, 197,  93, 62 ],
    [  518, 197,  93, 62 ],
    [  619, 208,  95, 51 ],
    [  715, 208,  68, 51 ],
  
    // Row 6
    [    4, 427, 120, 47 ],
    [  128, 429, 122, 45 ],
  ];
  
  static img;
  static numBuildings = Building.imgInfo.length;

  constructor( e, type, xPos, buildIx, label=undefined )
  {
    this.e = e;
    this.oType = type;
    this.p = new Point( xPos, 0, 3 );
    this.label = label;
    this.buildIx = buildIx;
    this.si = c.SI_BUILDING;
    this.max_si = this.si;
    this.points = c.POINTS_E_BUILDING;
    this.showSICount = 0;
    this.imgFactor = 1.5;

    this.ix = Building.imgInfo[ this.buildIx ][ 0 ];
    this.iy = Building.imgInfo[ this.buildIx ][ 1 ];
    this.iw = Building.imgInfo[ this.buildIx ][ 2 ];
    this.ih = Building.imgInfo[ this.buildIx ][ 3 ];
    this.w = this.iw * this.imgFactor;
    this.h = this.ih * this.imgFactor;
  
    this.colRect = [ -this.w / 50, this.h / 17, this.w / 50, 0 ];

    if( !Building.img )
    {
      Building.img = new Image();
      Building.img.src = "./images/backgrounds/miscBuildings.gif";
    }
  }

  processMessage( e, msg, param=undefined )
  {
    switch( msg )
    {
      case c.MSG_COLLISION_DET:

        if( Missile.types.includes( param.oType ) && ( param.owner.oType != this.oType ) ) // it's a missle and not ours
        {
          this.showSICount = c.SHOW_SI_TIME;
          this.si -= param.damage;
          // if( this.si < 0 )
          //   this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
          //                      p: new Explosion( this.e, this.p, "Explosion1" ) } );
        }
    }
  }

  update( deltaMs )
  {
    if( this.si < 0.0 )
    {
      if( this.oType == "Base" )
        this.e.qMessage( { m: c.MSG_E_BUILDING_DESTROYED, p : this } );
      return false;
    }

    if( this.showSICount > 0 )
      this.showSICount -= deltaMs;

    return true;
  }

  draw( p )
  {
    this.e.ctx.drawImage( Building.img,
                          this.ix, this.iy, this.iw, this.ih, // source rectangle
                          p.x - this.w / 2, p.y - this.h, // x, y
                          this.w, this.h ); // w, h
    if( this.showSICount > 0 )
      showSI( this.e, p, this.si / this.max_si );
  }
}

///////////////////////////////////////////////
// builds in -X direction
///////////////////////////////////////////////
export function buildTown( e, type, x, maxX, bCount, label=undefined )
{
  var b, buildIx;

  for( b = 0;b < bCount;b++ )
  {
    buildIx = randInt( 0, Building.numBuildings - 1 );
    e.objects.push( new Building( e, type, x, buildIx ) );
    x += randInt( 3, 7 );
    if( x > maxX )
      break;
  }
}

///////////////////////////////////////////////
// Use these for Military Base
///////////////////////////////////////////////
class MilBuilding // from MilitaryBuildings.gif
{
  static imgInfo =
  [
    // This gif is a sprite sheet. Need to cut out individual images.
    // First row
    [  26, 88, 422, 153 ],  // x,y,w,h
    [ 531,  1, 250, 239 ],

    // Row 2
    [   5, 348, 206, 130 ],
    [ 236, 298, 617, 180 ],

    // Row 3
    [  33, 572, 542, 279 ],
    [ 661, 509, 113, 345 ],
  ];
  
  static img;
  static numBuildings = MilBuilding.imgInfo.length;

  constructor( e, type, xPos, buildIx, label=undefined )
  {
    this.e = e;
    this.oType = type;
    this.p = new Point( xPos, 0, 3 );
    this.label = label;
    this.buildIx = buildIx;
    this.si = c.SI_BUILDING;
    this.max_si = this.si;
    this.points = c.POINTS_E_BUILDING;
    this.showSICount = 0;
    this.imgFactor = .75;

    this.ix = MilBuilding.imgInfo[ this.buildIx ][ 0 ];
    this.iy = MilBuilding.imgInfo[ this.buildIx ][ 1 ];
    this.iw = MilBuilding.imgInfo[ this.buildIx ][ 2 ];
    this.ih = MilBuilding.imgInfo[ this.buildIx ][ 3 ];
    this.w = this.iw * this.imgFactor;
    this.h = this.ih * this.imgFactor;
  
    this.colRect = [ -this.w / 50, this.h / 17, this.w / 50, 0 ];

    if( !MilBuilding.img )
    {
      MilBuilding.img = new Image();
      MilBuilding.img.src = "./images/backgrounds/MilitaryBuildings.gif";
    }
  }

  processMessage( e, msg, param=undefined )
  {
    switch( msg )
    {
      case c.MSG_COLLISION_DET:

        if( Missile.types.includes( param.oType ) && ( param.owner.oType != this.oType ) ) // it's a missle and not ours
        {
          this.showSICount = c.SHOW_SI_TIME;
          this.si -= param.damage;
          // if( this.si < 0 )
          //   this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
          //                      p: new Explosion( this.e, this.p, "Explosion1" ) } );
        }
    }
  }

  update( deltaMs )
  {
    if( this.si < 0.0 )
    {
      if( this.oType == "Base" )
        this.e.qMessage( { m: c.MSG_E_BUILDING_DESTROYED, p : this } );
      return false;
    }

    if( this.showSICount > 0 )
      this.showSICount -= deltaMs;

    return true;
  }

  draw( p )
  {
    this.e.ctx.drawImage( MilBuilding.img,
                          this.ix, this.iy, this.iw, this.ih, // source rectangle
                          p.x - this.w / 2, p.y - this.h, // x, y
                          this.w, this.h ); // w, h
    if( this.showSICount > 0 )
      showSI( this.e, p, this.si / this.max_si );
  }
}

///////////////////////////////////////////////
///////////////////////////////////////////////
export function buildBase( e, type, x, bCount, label=undefined )
{
  var b, buildIx;

  for( b = 0;b < bCount;b++ )
  {
    buildIx = randInt( 0, MilBuilding.numBuildings - 1 );
    e.objects.push( new MilBuilding( e, type, x, buildIx ) );
    x += randInt( 4, 10 );
  }
}

// export class Rectangle
// {
//   constructor( e, p, v, w=200, h=100 )
//   {
//     this.e = e;
//     this.p = p;
//     this.v = v; // the vertex we wish to rotate around. (0,0) is the center
//     this.oType = "Rectangle";
//     this.imgFactor = 1;
//     this.w = w;
//     this.h = h;
//     this.angle = 0;
//   }

//   draw( p )
//   {
//     this.e.ctx.strokeStyle = 'red';
//     this.e.ctx.translate( p.x + this.v.x, p.y - this.v.y );
//     this.e.ctx.rotate( this.angle );

//     this.e.ctx.beginPath();
//     this.e.ctx.rect( -this.w/2 - this.v.x, -this.w/2 + this.v.y, this.w, this.h );
//     this.e.ctx.stroke();

//     // draw vertex that we want to rotate around, 0,0 is the center of the object.
//     this.e.ctx.beginPath();
//     this.e.ctx.arc( 0, 0, 5, 0, 2 * Math.PI );
//     this.e.ctx.fillStyle = '#000000';
//     this.e.ctx.fill();
//     this.e.ctx.stroke();

//     // Reset transformation matrix
//     this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );
//   }
// }