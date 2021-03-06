import { c } from './constants.js';
import { Point, projection } from './utils.js';

// Explosions, smoke and other sprite sheets.

export class Missile
{
  static firstTime = true;

  static missiles = 
  {
    Bullet    : { path : undefined,                       dmg: c.WEAPON_DAMAGE_BULLET },
    MissileA  : { path : "images/chopper/missileA_L.gif", dmg: c.WEAPON_DAMAGE_MISSLE_A },
    MissileB  : { path : "images/chopper/missileB_L.gif", dmg: c.WEAPON_DAMAGE_MISSLE_B },
  }

  constructor( e, type, p )
  {
    this.e = e;
    this.oType = c.OBJECT_TYPE_NONE;
    this.p = new Point( p.x, p.y, p.z );
    this.time = 0;
    this.type = type;

    if( Missile.firstTime )
    {
      Missile.firstTime = false;
      for( const[ k, o ] of Object.entries( Missile.missiles ) )
      {
        if( o.path )
        {
          o.image = new Image();
          o.image.src = o.path;
        }
      }
    }
  }

  processMessage( message ) { }

  update( timestamp )
  {
    return true;
  }

  draw( p )
  {
  }
}