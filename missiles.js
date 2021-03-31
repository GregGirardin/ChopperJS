import { c } from './constants.js';
import { Explosion } from './explosions.js';
import { projection, Point, Vector, getRelTheta, dirFromAngle, setRelTheta } from './utils.js';

export class Missile
{
  static firstTime = true;
  static types = [];

  static missiles = 
  {
    Bullet    : { image : undefined, path : undefined,
                  damage: c.WEAPON_DAMAGE_BULLET,
                  lifetime : 2000,
                  spd : c.MAX_BULLET_VEL,
                  imgFactor : 1,
                  colRect : [ -.5, .5, .5, -.5 ],
                  },
    MissileA  : { image : undefined, path : "images/chopper/missileA.gif",
                  damage: c.WEAPON_DAMAGE_MISSLE_A,
                  lifetime : 2000,
                  spd : c.MAX_MISSILEA_VEL,
                  imgFactor : 1,
                  colRect : [ -.5, .5, -.5, -.5 ],
                  },
    MissileB  : { image : undefined, path : "images/chopper/missileB.gif",
                  damage: c.WEAPON_DAMAGE_MISSLE_B,
                  lifetime : 4000,
                  spd : c.MAX_MISSILEB_VEL,
                  imgFactor : 1,
                  colRect : [ -.5, .5, -.5, -.5 ],
                  },
    Bomb      : { image : undefined, path : "images/chopper/bomb.gif",
                  damage: c.WEAPON_DAMAGE_MISSLE_B,
                  lifetime : 0, // just drops.
                  spd : c.GRAVITY_TERM_VEL,
                  imgFactor : .15,
                  colRect : [ -.5, 1, .5, -1 ],
                  },
  }

  constructor( e, type, p, bodyAngle, v, owner=undefined )
  {
    this.e = e; // engine
    this.oType = type;
    this.p = p; // point
    this.bodyAngle = bodyAngle;
    this.v = new Vector( v.xc, v.yc );
    this.owner = owner;
    this.active = true;

    this.damage = Missile.missiles[ type ].damage;
    this.lifetime = Missile.missiles[ type ].lifetime;
    this.spd = Missile.missiles[ type ].spd;
    this.colRect = Missile.missiles[ type ].colRect;
    this.fallTime = 500; // ms to drop before thrust comes on
    this.ticks = 0;

    if( type == "Bullet" ) // Bullets don't have to accellerate.
      this.v.setPolar( bodyAngle, this.spd );

    if( Missile.firstTime )
    {
      Missile.firstTime = false;
      for( const[ k, o ] of Object.entries( Missile.missiles ) )
      {
        Missile.types.push( k );
        if( o.path )
        {
          o.image = new Image();
          o.image.src = o.path;
        }
      }
    }
  }

  processMessage( e, msg, param=undefined )
  {
    switch( msg )
    {
      case c.MSG_COLLISION_DET:
        // param is the object that collided with it.
        e.addObject( new Explosion( this.p ) );
        this.active = false;
        break;
    }

  }

  update( deltaMs )
  {
    if( !this.active )
      return false;

    this.ticks += deltaMs;

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
    if( this.p.y < 0 )
    {
      this.e.addObject( new Explosion( this.e, this.p, "Bomb" ) );
      return false;
    }

    var vp = this.v.getPolar();

    this.v.yc -= deltaMs / 10; // tbd, fix. Only increase yc if < terminal velocity

    if( vp.mag > c.GRAVITY_TERM_VEL ) // terminal velocity
      vp.mag *= .9; // decelerate
    this.bodyAngle = vp.ang; // += this.bodyAngle < vp.ang ? .01 : -.01;
    
    this.v.setPolar( vp.ang, vp.mag );

    return true;
  }

  updateBullet( deltaMs )
  {
    if( this.ticks > this.lifetime )
      return false;
    
    if( this.p.y < 0 )
    {
      this.e.addObject( new Explosion( this.e, this.p, "SmokeA" ) );
      return false;
    }

    return true;
  }

  updateMissle( deltaMs )
  {
    if( this.p.y < 0 )
    {
      this.e.addObject( new Explosion( this.e, this.p, "Explosion1" ) );
      return false;
    }

    if( this.ticks < this.fallTime ) // Fall for a bit
    {
      this.v.yc -= deltaMs / 50; // Gravity
  
      // Get to level as falling.
      if( dirFromAngle( this.bodyAngle ) == c.DIR_RIGHT )
      {
        this.bodyAngle += this.bodyAngle > 0 ? -.01 : .01;
        if( Math.abs( this.bodyAngle ) < .02 )
          this.bodyAngle = 0;
      }
      else if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
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
      if( vp.mag > c.GRAVITY_TERM_VEL )
        vp.mag *= .99; // decelerate
      // set body to velocity direction
      this.bodyAngle = vp.ang; // += this.bodyAngle < vp.ang ? .01 : -.01;
      this.v.setPolar( vp.ang, vp.mag );
    }
    else  // normal operation
    {
      var delta = deltaMs / 20;

      if( dirFromAngle( this.bodyAngle ) == c.DIR_RIGHT )
      {
        if( this.v.xc < this.spd )
          this.v.xc += delta;
      }
      else if( this.v.xc > -this.spd )
        this.v.xc -= delta;

      this.v.yc += this.v.yc < 0 ? delta / 5 : -delta / 5;
      if( Math.abs( this.v.yc ) < delta * 1.1 )
        this.v.yc = 0;
    }

    return true;
  }

  draw( p )
  {
    if( ( !this.w || this.w == 0 ) && this.oType != "Bullet" )
    {
      this.i = Missile.missiles[ this.oType ].image;
      this.w = this.i.width * Missile.missiles[ this.oType ].imgFactor;
      this.h = this.i.height * Missile.missiles[ this.oType ].imgFactor;
      return;
    }

    this.e.ctx.translate( p.x, p.y );
  
    let theta = this.bodyAngle;
    dirFromAngle( this.bodyAngle ) == c.DIR_LEFT ? this.e.ctx.scale( 1, -1 ) : theta *= -1;

    this.e.ctx.rotate( theta );
  
    if( this.oType == "Bullet" )
    {
      this.e.ctx.strokeStyle = 'black';
      this.e.ctx.beginPath();
      this.e.ctx.moveTo( 0, 0 );
      this.e.ctx.lineTo( 15 * Math.cos( theta ), 15 * Math.sin( theta ) );
      this.e.ctx.stroke();
      this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );
    }
    else
    {
      this.e.ctx.drawImage( this.i, -this.w / 2, -this.h / 2, this.w, this.h );
      this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

      // shadow
      const ps = projection( this.e.camera, new Point( p.x, 0, p.z ) );
      this.e.ctx.fillStyle = 'black';
      this.e.ctx.beginPath();
      this.e.ctx.ellipse( p.x - this.w / 6, ps.y - this.h / 2, this.w / 3, 2, 0, 0, 2 * c.PI )
      this.e.ctx.fill();
    }
  }
}