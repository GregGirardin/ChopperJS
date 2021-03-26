import { c } from './constants.js';
import { projection, Point, Vector, getRelTheta, dirFromAngle, setRelTheta } from './utils.js';

// Explosions, smoke and other sprite sheets.

export class Missile
{
  static firstTime = true;

  static missiles = 
  {
    Bullet    : { image : undefined, path : undefined,
                  dmg: c.WEAPON_DAMAGE_BULLET,
                  lifetime : 3000, // milliseconds
                  spd : c.MAX_BULLET_VEL,
                  imgFactor : 1
                  },
    MissileA  : { image : undefined, path : "images/chopper/missileA.gif",
                  dmg: c.WEAPON_DAMAGE_MISSLE_A,
                  lifetime : 5000,
                  spd : c.MAX_MISSILEA_VEL,
                  imgFactor : 1
                  },
    MissileB  : { image : undefined, path : "images/chopper/missileB.gif",
                  dmg: c.WEAPON_DAMAGE_MISSLE_B,
                  lifetime : 7000,
                  spd : c.MAX_MISSILEB_VEL,
                  imgFactor : 1
                  },
    Bomb      : { image : undefined, path : "images/chopper/bomb.gif",
                  dmg: c.WEAPON_DAMAGE_MISSLE_B,
                  lifetime : 10000, // just drops.
                  spd : 5, // tbd, this just drops
                  imgFactor : .15
                  },
  }

  constructor( e, type, p, angle, initVel )
  {
    this.e = e;
    this.oType = type;
    this.p = p;
    this.ticks = 0;
    this.lifetime = Missile.missiles[ type ].lifetime;
    this.spd = Missile.missiles[ type ].spd;
    this.type = type;
    this.fallTime = 500; // ms to drop before thrust comes on so it falls out of the helo.

    if( type == "Bullet" ) // Bullets don't have to accellerate.
      v_mag = Missile.missiles.Bullet.spd;

    this.bodyAngle = angle;

    this.v = new Vector( initVel.xc, initVel.yc );

    if( Missile.firstTime )
    {
      Missile.firstTime = false;
      for( const[ k, o ] of Object.entries( Missile.missiles ) )
        if( o.path )
        {
          o.image = new Image();
          o.image.src = o.path;
        }
    }
  }

  processMessage( message ) { }

  update( deltaMs )
  {
    this.ticks += deltaMs;
    if( this.p.y < 0 )
      return false; // tbd.

    this.p.x += this.v.xc * deltaMs / 1000;
    this.p.y += this.v.yc * deltaMs / 1000;

    switch( this.oType )
    {
      case "Bullet":   return this.updateBullet( deltaMs );
      case "MissileA":
      case "MissileB": return this.updateMissle( deltaMs );
      case "Bomb":     return this.updateBomb( deltaMs );
    }

    return false;
  }

  updateBomb( deltaMs )
  {
    if( this.ticks > this.lifetime )
      return false;

    if( this.v.yc > -20 ) // whatever terminal velocity is    
      this.v.yc -= deltaMs / 100;

    return true;
  }


  updateBullet( deltaMs )
  {
    if( this.ticks > this.lifetime )
      return false;
    
    return true;
  }

  updateMissle( deltaMs )
  {
    if( this.ticks < this.fallTime ) // Fall for a bit
    {
      this.v.yc -= deltaMs / 50; // Gravity
  
      if( dirFromAngle( this.bodyAngle ) == c.DIR_RIGHT )
      {
        this.bodyAngle += this.bodyAngle > 0 ? -.01 : .01;
        if( Math.abs( this.bodyAngle ) < .03 )
          this.bodyAngle = 0;
      }
      else
      {
        this.bodyAngle += this.bodyAngle > 0 ? .01 : -.01;
        if( Math.abs( this.bodyAngle ) > c.PI )
          this.bodyAngle = c.PI;
      }
    }
    else if( this.ticks > this.lifetime ) // Out of gas, fall to the ground.
    {
      this.v.yc -= deltaMs / 100;
      let vp = this.v.getPolar();
      if( vp.mag > this.spd ) // terminal velocity
        vp.mag *= .95; // decelerate
      this.bodyAngle = vp.ang;
      this.v.setPolar( vp.ang, vp.mag );
    }
    else  // normal operation
    {
      if( dirFromAngle( this.bodyAngle ) == c.DIR_RIGHT )
      {
        if( this.v.xc < this.spd )
          this.v.xc += deltaMs;
      }
      else if( this.v.xc > -this.spd )
        this.v.xc -= deltaMs;

      var delta = deltaMs / 20;

      this.v.yc += this.v.yc < 0 ? delta : -delta;
      if( Math.abs( this.v.yc ) < delta * 1.1 )
        this.v.yc = 0;
    }

    return true;
  }

  draw( p )
  {
    this.i = Missile.missiles[ this.oType ].image; // tbd
    this.w = this.i.width * Missile.missiles[ this.oType ].imgFactor;
    this.h = this.i.height * Missile.missiles[ this.oType ].imgFactor;

    this.e.ctx.translate( p.x, p.y );

    let theta = this.bodyAngle;
    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
      this.e.ctx.scale( 1, -1 );
    else
      theta *= -1;

    this.e.ctx.rotate( theta );
    this.e.ctx.drawImage( this.i, -this.w / 2, -this.h / 2, this.w, this.h );

    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    // shadow
    const projShadow = projection( this.e.camera, new Point( p.x, 0, p.z ) );
    this.e.ctx.fillStyle = 'black';
    this.e.ctx.beginPath();
    this.e.ctx.ellipse( p.x - this.w / 6, projShadow.y - this.h / 2, this.w / 3, 2, 0, 0, 2 * c.PI )
    this.e.ctx.fill();
  }
}