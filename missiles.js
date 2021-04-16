import { c } from './constants.js';
import { Explosion } from './explosions.js';
import { projection, Point, Vector, dirFromAngle, angleDiff, randInt } from './utils.js';

export class Missile
{
  static firstTime = true;
  static types = [];

  static missiles = 
  {
    Bullet :    { image : undefined, path : undefined,
                  damage: c.WEAPON_DAMAGE_BULLET,
                  lifetime : 2000,
                  spd : c.MAX_BULLET_VEL,
                  imgFactor : 1,
                  colRect : [ -.5, .5, .5, -.5 ],
                  falltime : 0
                },
    MissileA :  { image : undefined, path : "images/chopper/missileA.gif", // smaller, faster
                  damage: c.WEAPON_DAMAGE_MISSLE_A,
                  lifetime : 3000,
                  spd : c.MAX_MISSILE_A_VEL,
                  imgFactor : 1,
                  colRect : [ -.5, .5, .5, -.5 ],
                  falltime : 200
                },
    MissileB :  { image : undefined, path : "images/chopper/missileB.gif", // larger
                  damage: c.WEAPON_DAMAGE_MISSLE_B,
                  lifetime : 6000,
                  spd : c.MAX_MISSILE_B_VEL,
                  imgFactor : 1,
                  colRect : [ -1.5, .5, .5, -.5 ],
                  falltime : 400
                },
    Bomb :      { image : undefined, path : "images/chopper/bomb.gif",
                  damage: c.WEAPON_DAMAGE_BOMB,
                  lifetime : 0, // just drops.
                  spd : c.GRAVITY_TERM_VEL,
                  imgFactor : .15,
                  colRect : [ -.25, 1, .25, -1 ],
                  falltime : 0
                },
  }

  constructor( e, type, p, bodyAngle, v, owner=undefined, level=false )
  {
    this.e = e; // engine
    this.oType = type;
    this.p = p; // point
    this.bodyAngle = bodyAngle;
    this.v = v ? new Vector( v.xc, v.yc ) : new Vector( Missile.missiles[ type ].spd * Math.cos( bodyAngle ),
                                                        Missile.missiles[ type ].spd * Math.sin( bodyAngle ) );
    this.owner = owner;
    this.active = true;
    this.thrust = false; 
    this.level = level; // Do we want the missle to "level out" or go in the body direction.

    this.damage = Missile.missiles[ type ].damage;
    this.lifetime = Missile.missiles[ type ].lifetime;
    this.spd = Missile.missiles[ type ].spd;
    this.colRect = Missile.missiles[ type ].colRect;
    this.fallTime = Missile.missiles[ type ].falltime; // ms to drop before thrust comes on
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
        if( ( param != this.owner ) && ( param.oType != this.oType ) && ( param.oType != "Homebase" ) ) // ignore this collision
        {
          this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
                             p: new Explosion( this.e, this.p, this.oType == "Bullet" ? "SmokeA" : "Explosion1" ) } );
          this.active = false;
        }
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
      this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Explosion( this.e, this.p, "Bomb" ) } );
      return false;
    }

    this.v.yc -= deltaMs / 10; // tbd, fix. Only increase yc if < terminal velocity
    var vp = this.v.getPolar();

    if( vp.m > c.GRAVITY_TERM_VEL ) // terminal velocity
      vp.m *= .9; // decelerate
    this.bodyAngle = vp.a; // += this.bodyAngle < vp.ang ? .01 : -.01;
    this.v.setPolar( vp.a, vp.m );

    return true;
  }

  updateBullet( deltaMs )
  {
    if( this.ticks > this.lifetime )
      return false;
    
    if( this.p.y < 0 )
    {
      this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Explosion( this.e, this.p, "SmokeA" ) } );
      return false;
    }

    return true;
  }

  updateMissle( deltaMs )
  {
    if( this.p.y < 0 )
    {
      this.e.qMessage( { m: c.MSG_CREATE_OBJECT, p: new Explosion( this.e, this.p, "Bomb" ) } );
      return false;
    }

    if( this.ticks < this.fallTime ) // Fall for a bit
    {
      this.v.yc -= deltaMs / 50; // Gravity
  
      // Get to level as falling.
      if( this.level )
      {
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
    }
    else if( this.ticks < this.lifetime ) // normal operation
    {
      var delta = deltaMs / 20;
      this.thrust = true;

      let velPolar = this.v.getPolar();
      // let aD = angleDiff( velPolar.a, this.bodyAngle );
      if( velPolar.m < this.spd )
        velPolar.m += delta;
      velPolar.a = this.bodyAngle; // += aD > 0 ? .01 : -.01;
      this.v.setPolar( velPolar.a, velPolar.m );

      if( this.level )
      {
        this.v.yc += this.v.yc < 0 ? delta / 5 : -delta / 5;
        if( Math.abs( this.v.yc ) < delta * 1.1 )
          this.v.yc = 0;
      }
    }
    else // Out of gas, fall to the ground.
    {
      this.thrust = false;
      this.v.yc -= deltaMs / 100;
      let vp = this.v.getPolar();
      if( vp.mag > c.GRAVITY_TERM_VEL )
        vp.mag *= .99; // decelerate
      // set body to velocity direction
      this.bodyAngle = vp.a; // += this.bodyAngle < vp.ang ? .01 : -.01;
      this.v.setPolar( vp.a, vp.m );
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

      if( this.thrust )
      {
        // Exhaust. An oval looks pretty good, don't need a sprite.
        this.e.ctx.fillStyle = 'red';
        this.e.ctx.beginPath();
        let offset = this.oType == "MissileA" ? -30 : -40;
        offset += randInt( -2, 2 );
        this.e.ctx.ellipse( offset, randInt( -1, 1 ), 10, 2, 0, 0, 2 * c.PI )
        this.e.ctx.fill();

        // Looks cool to make the above red and add this oval. Comment if CPU gets excessive.
        this.e.ctx.fillStyle = 'orange';
        this.e.ctx.beginPath();
        offset = this.oType == "MissileA" ? -35 : -45;
        offset += randInt( -2, 2 );
        this.e.ctx.ellipse( offset, 0, 5, 2, 0, 0, 2 * c.PI );
        this.e.ctx.fill();
      }

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