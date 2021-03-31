import { c } from './constants.js';
import { Point, projection } from './utils.js';

// Explosions, smoke and other sprite sheets.

export class Explosion
{
  static firstTime = true;

  static sSheets = // use sprite sheets.
  {
    Explosion1  : { yOff : 0,   loops : 1, tpi :  50, path : "images/explosions/Explosion1.gif",
                    sw : 64, sh :  64, hs :  5, vs : 5 },
    Bomb        : { yOff : 76,   loops : 1, tpi :  75, path : "images/explosions/Bomb.png",
                    sw : 128, sh : 152, hs :  7, vs : 2 },
    SmokeA      : { yOff : 0,   loops : 1, tpi :  50, path : "images/explosions/SmokeA.gif",
                    sw : 64, sh :  64, hs :  8, vs : 4 },
    SmokeB      : { yOff : 0,   loops : 1, tpi :  50, path : "images/explosions/SmokeB.gif",
                    sw : 64, sh :  64, hs :  8, vs : 5 },
    SmokeV      : { yOff : 110, loops : 5, tpi :  50, path : "images/explosions/SmokeV.gif",
                    sw : 37, sh : 227, hs : 10, vs : 1 },
  }

  constructor( e, p, name )
  {
    this.e = e;
    this.oType = name;
    this.p = new Point( p.x, p.y, -1 ); // for now, make sure explosions are in front with -1 z
    this.time = 0;
    const o = Explosion.sSheets[ name ];
    this.sw = o.sw; // sprite width
    this.sh = o.sh;
    this.hs = o.hs; // horizontal sprite count
    this.vs = o.vs;
    this.tpi = o.tpi; // ticks per image
    this.yOff = o.yOff; 
    this.loops = o.loops; 

    if( Explosion.firstTime )
    {
      Explosion.firstTime = false;
  
      for( const[ k, o ] of Object.entries( Explosion.sSheets ) )
      {
        o.image = new Image();
        o.image.src = o.path;
        o.lifetime = o.hs * o.vs * o.tpi;
      }
    }

    this.lifetime = Explosion.sSheets[ name ].lifetime;
  }

  update( deltaMs )
  {
    this.time += deltaMs;
    if( this.time > this.lifetime )
    {
      this.loops -= 1;
      if( !this.loops )
        return false;
      else
        this.time = 0;
    }
    return true;
  }

  draw( p )
  {
    var imgIx = Math.floor( this.time / this.tpi );
    var xOff = ( imgIx % this.hs ) * this.sw;
    var yOff = Math.floor( imgIx / this.hs ) * this.sh;
    var img = Explosion.sSheets[ this.oType ].image;

    this.e.ctx.drawImage( img,
                         xOff, yOff, // top left of sprite sheet.
                         this.sw, this.sh,
                         p.x - this.sw / 2, p.y - this.sh / 2 - this.yOff,
                         this.sw, this.sh );
  }
}