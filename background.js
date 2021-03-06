import { c } from './constants.js';
import { Point, projection } from './utils.js';

function randInt( min, max )
{
  return Math.floor( Math.random() * ( max - min ) ) + min;
}

// background stuff
export class SkyGround
{
  static img;
  static hWidth = 4000;
  static hHeight = 500;

  constructor( e )
  {
    this.p = new Point( 0, 0, c.HORIZON_DISTANCE );
    this.oType = c.OBJECT_TYPE_NONE;
    this.e = e; // game engine

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
    
    // sky
    this.e.ctx.drawImage( SkyGround.img,
                          p.x - SkyGround.hWidth / 2,
                          p.y - SkyGround.hHeight,
                          SkyGround.hWidth,
                          SkyGround.hHeight );

    // ground
    this.e.ctx.fillStyle = 'green';
    this.e.ctx.fillRect( 0, hProj.y, c.SCREEN_WIDTH, c.SCREEN_HEIGHT );
  }
}

export class MountainImg
{
  static img;
  static hWidth = 3000;
  static hHeight = 250;

  constructor( e, x, y, z )
  {
    this.e = e; // game engine
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_NONE;

    if( !MountainImg.img )
    {
      MountainImg.img = new Image();
      MountainImg.img.src = "./images/backgrounds/Mountains1.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( MountainImg.img,
                          p.x - MountainImg.hWidth / 2,
                          p.y - MountainImg.hHeight,
                          MountainImg.hWidth,
                          MountainImg.hHeight );
  }
}

export class HillImg
{
  static img;
  static hWidth = 4000;
  static hHeight = 150;

  constructor( e, x, y, z )
  {
    this.e = e; // game engine
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_NONE;

    if( !HillImg.img )
    {
      HillImg.img = new Image();
      HillImg.img.src = "./images/backgrounds/Mountains2.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( HillImg.img,
                          p.x - HillImg.hWidth / 2,
                          p.y - HillImg.hHeight,
                          HillImg.hWidth,
                          HillImg.hHeight );
  }
}

export class Cloud
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e; // game engine
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_NONE;

    this.imgFactor = 2;
    if( z > 5000 )
      this.imgFactor = .2;
    else if( z > 2000 )
      this.imgFactor = .5;
    else if ( z > 1000 )
      this.imgFactor = 1;

    if( !Cloud.img )
    {
      Cloud.img = new Image();
      Cloud.img.src = "./images/backgrounds/cloud.gif";
    }
  }

  update( delta ) 
  {
    this.p.x -= 2/delta;
    // tbd. Check for wrap
    return true;
  }

  draw( p )
  {
    this.e.ctx.drawImage( Cloud.img,
                          p.x - Cloud.img.width * this.imgFactor / 2,
                          p.y - Cloud.img.height * this.imgFactor,
                          Cloud.img.width * this.imgFactor,
                          Cloud.img.height * this.imgFactor );
  }
}

export class Rock
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e; // game engine
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_NONE;
    this.imgFactor = .5;

    if( !Rock.img )
    {
      Rock.img = new Image();
      Rock.img.src = "./images/backgrounds/rock1.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Rock.img,
                          p.x - Rock.img.width * this.imgFactor / 2,
                          p.y - Rock.img.height * this.imgFactor,
                          Rock.img.width * this.imgFactor,
                          Rock.img.height * this.imgFactor );
  }
}

export class Grass
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_NONE;
    this.imgFactor = .5;

    if( !Grass.img )
    {
      Grass.img = new Image();
      Grass.img.src = "./images/backgrounds/grass1.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Grass.img,
                          p.x - Grass.img.width * this.imgFactor / 2,
                          p.y - Grass.img.height * this.imgFactor,
                          Grass.img.width * this.imgFactor,
                          Grass.img.height * this.imgFactor );
  }
}

export class Tree
{
  static img;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_NONE;
    this.imgFactor = .5;
    if( z > 1000 )
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
    this.e.ctx.drawImage( Tree.img,
                          p.x - Tree.img.width * this.imgFactor / 2,
                          p.y - Tree.img.height * this.imgFactor,
                          Tree.img.width * this.imgFactor,
                          Tree.img.height * this.imgFactor );
  }
}

export class Base
{
  static img;
  static imgFactor = .75;

  constructor( e, x, y, z, label=undefined )
  {
    this.e = e;
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_BASE;
    this.label = label;

    if( !Base.image )
    {
      Base.img = new Image();
      Base.img.src = "./images/backgrounds/base.gif";
    }
  }

  update( )
  {
    return true;
  }

  draw( p )
  {
    this.e.ctx.drawImage( Base.img,
                          p.x - Base.img.width * Base.imgFactor / 2,
                          p.y - Base.img.height * Base.imgFactor,
                          Base.img.width * Base.imgFactor,
                          Base.img.height * Base.imgFactor );
  }
}


class CityBuilding
{
  static img;

  static imgInfo =
  [
    // Row 1
    [   32,  13,  55, 265 ],  // x,y,w,h of buildings in this sprite sheet.
    [  116,   7, 135, 296 ],
    [  259,  10,  77, 126 ],
    [  343,   2,  45, 196 ],
    [  399,  15,  52, 504 ],
    [  462,   6, 107, 279 ],
    [  585,  11,  54, 249 ],
    [  640,  11, 120, 193 ],
    [  882,   6,  51, 328 ],
    // Row 2
    [   20, 291,  77, 396 ],
    [  137, 334,  96, 393 ],
    [  284, 268, 100, 427 ],
    [  556, 289, 86,  397 ],
  ];

  static numBuildings = CityBuilding.imgInfo.length;

  constructor( e, xPos, buildIx, label=undefined )
  {
    this.e = e;
    this.p = new Point( xPos, 0, 2 );
    this.label = label;
    this.buildIx = buildIx;
    this.oType = c.OBJECT_TYPE_BUILDING;
    this.si = c.SI_BUILDING;
    this.colRect = undefined; // tbd
    this.imgFactor = 1.0;

    const { x, y, w, h } = CityBuilding.imgInfo[ this.buildIx ];
    this.ix *= x; 
    this.iy *= y;
    this.iw *= w;
    this.ih *= h;

    if( !CityBuilding.img )
    {
      CityBuilding.img = new Image();
      CityBuilding.img.src = "./images/backgrounds/miscCity.gif";
    }
  }

  processMessage( e, message, param=None )
  {
    if( message == c.MSG_COLLISION_DET )
    {
      //if param.oType == OBJECT_TYPE_E_WEAPON:
      this.si -= param.wDamage;
      if( this.si < 0 )
        e.addObject( new Explosion( this.p ) );
    }
  }

  update( e )
  {
    if( this.si < 0.0 )
    {
      e.qMessage( c.MSG_BUILDING_DESTROYED );
      return false;
    }
    return true
  }

  draw( p )
  {
    this.e.ctx.drawImage( CityBuilding.img,
                          this.ix, this.iy, this.w, this.h, // source rectangle
                          p.x - this.w * this.imgFactor / 2, p.y - this.h * this.imgFactor, // x, y
                          this.w * this.imgFactor, this.h * this.imgFactor ); // w, h
  }
}

export function buildCity( e, x, bCount, label=undefined )
{
  let buildIx, b, building;

  for( b=0;b < bCount;b++ )
  {
    buildIx = randInt( 0, CityBuilding.numBuildings - 1 );
    building = new CityBuilding( e, x, buildIx, label=label );
    e.addObject( building );
    x += building.iw * 1.5;
  }
}

class EBuilding // from miscBuildings.gif
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

  static numBuildings = EBuilding.imgInfo.length;

  constructor( e, xPos, buildIx, label=undefined )
  {
    this.e = e;
    this.oType = c.OBJECT_TYPE_E_BUILDING;
    this.p = new Point( xPos, 0, 3 );
    this.colRect = undefined; // tbd
    this.label = label;
    this.buildIx = buildIx;
    this.si = this.siMax = c.SI_E_BUILDING;
    this.points = c.POINTS_E_BUILDING;
    this.showSICount = 0;
    this.imgFactor = 1.0;

    const { x, y, w, h } = EBuilding.imgInfo[ this.buildIx ];
    this.ix *= x; 
    this.iy *= y;
    this.iw *= w; //EBuilding.imgInfo[ this.buildIx ][ 2 ] ;
    this.ih *= h; // EBuilding.imgInfo[ this.buildIx ][ 3 ] * this.imgFactor;

    if( !EBuilding.img )
    {
      EBuilding.img = new Image();
      EBuilding.img.src = "./images/backgrounds/miscBuildings.gif";
    }
  }

  processMessage( e, message, param=None )
  {
    if( message == c.MSG_COLLISION_DET )
    {
      this.showSICount = c.SHOW_SI_COUNT;
      if( param.oType == c.OBJECT_TYPE_WEAPON )
        this.si -= param.wDamage;
        //if this.si < 0:
        //  e.addObject( Explosion( this.p ) )
    }
  }

  update( e )
  {
    if( this.si < 0.0 )
    {
      e.qMessage( c.MSG_E_BUILDING_DESTROYED, this );
      return false;
    }
    return true;
  }

  draw( p )
  {
    this.e.ctx.drawImage( EBuilding.img,
                          this.ix, this.iy, this.w, this.h, // source rectangle
                          p.x - this.w * this.imgFactor / 2, p.y - this.h * this.imgFactor, // x, y
                          this.w * this.imgFactor, this.h * this.imgFactor ); // w, h
  }
}

export function buildEBase( e, x, bCount, label=undefined )
{
  var b, buildIx, buildObj;

  for( b = 0;b < bCount;b++ )
  {
    buildIx = randInt( 0, EBuilding.numBuildings - 1 );
    buildObj = new EBuilding( e, x, buildIx, label="Enemy" )
    e.addObject( buildObj  );
    x += buildObj.iw * 1.5; // adjust pixels to world coors.
  }
}