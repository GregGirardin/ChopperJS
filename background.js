import { c } from './constants.js';
import { Point, projection } from './utils.js';

// background stuff

export class SkyGround
{
  static img;

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
    this.e.ctx.drawImage( SkyGround.img, p.x - 2000, p.y - 500, 4000, 500 );

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
    this.e.ctx.drawImage( MountainImg.img, p.x - MountainImg.hWidth / 2, p.y - MountainImg.hHeight, MountainImg.hWidth, MountainImg.hHeight );
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
    this.e.ctx.drawImage( HillImg.img, p.x - HillImg.hWidth / 2, p.y - HillImg.hHeight, HillImg.hWidth, HillImg.hHeight );
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

    if( !Cloud.img )
    {
      Cloud.img = new Image();
      Cloud.img.src = "./images/backgrounds/cloud.gif";
    }
  }

  update( )
  {
    self.p.x -= 1;
    // tbd. Check for wrap
    return True;
  }

  draw( p )
  {
    this.e.ctx.drawImage( Cloud.img, p.x - Cloud.img.width / 2, p.y - Cloud.img.height ); // tbd, scale based on distance
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

    if( !Rock.img )
    {
      Rock.img = new Image();
      Rock.img.src = "./images/backgrounds/rock1.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Rock.img, p.x - Rock.img.width / 2, p.y - Rock.img.height );
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

    if( !Grass.img )
    {
      Grass.img = new Image();
      Grass.img.src = "./images/backgrounds/grass1.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Grass.img, p.x - Grass.img.width / 2, p.y - Grass.img.height );
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

    if( !Tree.image )
    {
      Tree.img = new Image();
      Tree.img.src = "images/backgrounds/tree.gif";
    }
  }

  draw()
  {
    this.e.ctx.drawImage( Tree.img, p.x - Tree.img.width / 2, p.y - Tree.img.height );
  }
}

export class Base
{
  static img;

  constructor( e, x, y, z, label=undefined )
  {
    this.e = e;
    this.p = new Point( x, y, z );
    this.oType = c.OBJECT_TYPE_BASE;
    this.label = label;

    if( !Base.image )
    {
      Base.img = new Image();
      Base.img.src = "images/backgrounds/base.gif";
    }
  }

  draw( p )
  {
    this.e.ctx.drawImage( Base.img, p.x - Base.img.width / 2, p.y - Base.img.height );
  }
}
