import { c } from './constants.js';
import { Point, projection } from './utils.js';

// Explosions, smoke and other sprite sheets.

export class SpriteSheet
{
  static ticksPerImg = 100;
  static firstTime = true;

  static sSheets = 
  {
    Explosion1  : { path : "images/explosions/Explosion1.gif",  sw : 64, sh :  64, hs :  5, vs : 5 },
    Explosion2  : { path : "images/explosions/Explosion2.gif",  sw : 64, sh :  64, hs :  5, vs : 5 },
    Bomb        : { path : "images/explosions/Bomb.png",        sw : 82, sh :  96, hs :  7, vs : 2 },
    SmokeA      : { path : "images/explosions/SmokeA.gif",      sw : 64, sh :  64, hs :  8, vs : 4 },
    SmokeB      : { path : "images/explosions/SmokeB.gif",      sw : 64, sh :  64, hs :  8, vs : 5 },
    SmokeV      : { path : "images/explosions/SmokeV.gif",      sw : 37, sh : 227, hs : 10, vs : 1 },
  }

  constructor( e, p, sheet )
  {
    this.e = e;
    this.oType = c.OBJECT_TYPE_NONE;
    this.p = new Point( p.x, p.y, p.z );
    this.time = 0;
    this.sheet = sheet;

    if( SpriteSheet.firstTime )
    {
      SpriteSheet.firstTime = false;
      for( const[ k, o ] of Object.entries( SpriteSheet.sSheets ) )
      {
        o.image = new Image();
        o.image.src = o.path;
        o.lifeTime = o.hs * o.vs * SpriteSheet.ticksPerImg; // Calc once here.
      }
    }
  }

  processMessage( message ) { }

  update( timestamp )
  {
    this.time += timestamp;
    if( this.time > SpriteSheet.lifeTime )
      return false;
    
    return true;
  }

  draw( p )
  {
    var imgIx = Math.floor( this.time / SpriteSheet.ticksPerImg );
    var xOff = ( imgIx % SpriteSheet.sSheets[ this.sheet ].hs ) * SpriteSheet.sSheets[ this.sheet ].sw;
    var yOff = ( imgIx / SpriteSheet.sSheets[ this.sheet ].vs ) * SpriteSheet.sSheets[ this.sheet ].sh;

    this.e.ctx.drawImage( SpriteSheet.sSheets[ this.sheet ].image,
                          xOff, yOff, // top left of sprite sheet.
                          SpriteSheet.sSheets[ this.sheet ].sw, SpriteSheet.sSheets[ this.sheet ].sh,
                          p.x, p.y,
                          SpriteSheet.sSheets[ this.sheet ].sw, SpriteSheet.sSheets[ this.sheet ].sh );
  }
}