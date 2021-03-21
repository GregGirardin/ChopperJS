import { c } from './constants.js';
import { Point, Vector, projection, addAngle, dirFromAngle, setRelTheta } from './utils.js';

// Okabes

export class Plane
{
  static ticksPerImg = 100;

  static Planes = // properties are planeTypes
  {
    Bomber1 : {
              image : undefined,
              src : "images/vehicles/Bomber1.png",
              si : c.SI_BOMBER1,
              siMax : c.SI_BOMBER1,
              bombs : 2,
              damage : 0,
              imgFactor : .75,
              points : c.POINTS_BOMBER,
              spd : 1
              },
    Bomber2 : {
              image : undefined,
              src : "images/vehicles/Bomber2.gif",
              si : c.SI_BOMBER2,
              siMax : c.SI_BOMBER2,
              bombs : 3,
              damage : 0,
              imgFactor : .6,
              points : c.POINTS_BOMBER,
              spd : 1

              },
    Fighter : {
              image : undefined,
              src : "images/vehicles/Fighter.gif",
              si : c.SI_FIGHTER,
              siMax : c.SI_FIGHTER,
              bombs : 0,
              damage : 0,
              imgFactor : .3,
              points : c.POINTS_FIGHTER,
              spd : 1.5
              },
  }


  constructor( e, planeType, x, y, dir=c.DIRECTION_LEFT  )
  {
    this.e = e;
    this.planeType = planeType;
    this.oType = Plane.Planes[ planeType ].si;
    this.spd = Plane.Planes[ planeType ].spd;
    this.p = new Point( x, y, 0 );
    this.time = 0;
    this.showSICount = 0;
    this.bodyAngle = c.PI;
    this.tgtBodyAngle = c.PI; // tbd
    this.nextAngleAdjustMs = 2000;
    this.turnDelta = 300; // for fighers, when do they turn around.

    if( !Plane.Planes.Bomber1.image )
    {
      for( const[ k, o ] of Object.entries( Plane.Planes ) )
      {
        o.image = new Image();
        o.image.src = o.src;
      }
    }

    // tbd, wait for load.
    // this.image = Plane.Planes[ this.planeType ].image;
    // this.width = this.image.width * Plane.Planes[ this.planeType ].imgFactor;
    // this.height = this.image.height * Plane.Planes[ this.planeType ].imgFactor;
  }

  processMessage( message, param=undefined )
  {
    if( message == c.MSG_COLLISION_DET )
    {
      if( param.oType == c.OBJECT_TYPE_WEAPON )
      {
        this.showSICount = c.SHOW_SI_COUNT;
        this.si -= param.wDamage;
        if( this.si < 0 )
          this.e.addObject( new SpriteSheet( this.e, "Explosion1", this.p ) );
       }
    }
  }

  update( deltaMs )
  {
    // common update() functionality for all planes
    if( this.si < 0.0 )
    {
      this.e.qMessage( c.MSG_ENEMY_LEFT_BATTLEFIELD, this );
      return false;
    }

    if( this.showSICount > 0 )
      this.showSICount -= timestamp;

    if( dirFromAngle( this.bodyAngle ) != dirFromAngle( this.tgtBodyAngle )  )
      this.bodyAngle = this.tgtBodyAngle; // changed direction
    else if( dirFromAngle( this.bodyAngle ) == c.DIRECTION_RIGHT )
      this.bodyAngle += ( this.bodyAngle < this.tgtBodyAngle ) ? .01 : -.01;
    else
    {
      if( ( ( this.bodyAngle > 0 ) && ( this.tgtBodyAngle > 0 ) ) ||
          ( ( this.bodyAngle < 0 ) && ( this.tgtBodyAngle < 0 ) ) )
        this.bodyAngle = addAngle( this.bodyAngle, ( this.bodyAngle < this.tgtBodyAngle ) ? .01 : -.01 );
      else if( ( this.bodyAngle < 0 ) && ( this.tgtBodyAngle > 0 ) )
        this.bodyAngle = addAngle( this.bodyAngle, -.01 );
      else if( ( this.bodyAngle > 0 ) && ( this.tgtBodyAngle < 0 ) )
        this.bodyAngle = addAngle( this.bodyAngle, .01 );
      else
        console.assert( 0 );
    }

    let delta = ( this.spd * deltaMs ) / 50;
    this.p.x += delta * Math.cos( this.bodyAngle );
    this.p.y += delta * Math.sin( this.bodyAngle );

    if( this.p.y < 1 )
      this.p.y = 1;

    // specific update stuff for the particular plane
    switch( this.oType )
    {
      case c.SI_BOMBER1:
      case c.SI_BOMBER2:
        return this.bomber_update( deltaMs );
      case c.SI_FIGHTER:
        return this.fighter_update( deltaMs );
    }

  }
  // specific updates for different types of planes.
  bomber_update( deltaMs )
  {
    return true;

    if( Math.abs( this.p.y - this.target_y ) > .2 )
    {
      if( this.p.y < this.target_y )
        this.p.y += .1;
      else if( this.p.y > this.target_y )
        this.p.y -= .1;
    }
  
    if( this.p.x < c.MIN_WORLD_X - 50 )
    {
      this.target_y = randInt( 50, 100 );
      this.dir = DIRECTION_RIGHT;
    }
    else if( this.p.x > c.MAX_WORLD_X + 50 )
    {
      if( e.cityDestroyed )
      {
        e.addStatusMessage( "Bomber Left Theater" );
        e.qMessage( c.MSG_ENEMY_LEFT_BATTLEFIELD, this );
        return false;
      }
      this.target_y = randInt( 15, 25 );
      this.dir = DIRECTION_LEFT;
      this.bombs = 1;

      if( !e.time % 10 ) // don't need to do this every cycle.
        if( this.bombs )  // See if there's a target
        {
          let o, index;
          for( index = 0;index < this.e.objects.length;index++ )
          {
            o = this.e.objects[ index ];
            if( o.oType == c.OBJECT_TYPE_BUILDING )
              if( Math.abs( o.p.x - this.p.x ) < 10 )
              {
                e.addObject( new Bomb( this.p, this.v, oType = c.OBJECT_TYPE_E_WEAPON ) );
                this.bombs -= 1;
                break;
              }
          }
        }
      
      this.p.move( this.v )

      return(true );
    }
  }

  fighter_update( deltaMs )
  {
    let dir = dirFromAngle( this.bodyAngle );
    if( ( this.p.x - this.e.chopper.p.x ) > this.turnDelta && ( dir == c.DIRECTION_RIGHT ) )
      this.tgtBodyAngle = c.PI;
    else if( ( this.p.x - this.e.chopper.p.x ) < -this.turnDelta && ( dir == c.DIRECTION_LEFT ) )
      this.tgtBodyAngle = 0;
    else
    {
      this.nextAngleAdjustMs -= deltaMs;
      if( this.nextAngleAdjustMs < 0 )
      {
        this.nextAngleAdjustMs = 1000;
        if( this.p.y > this.e.chopper.p.y )
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, -.2 );
        else if( this.p.y < this.e.chopper.p.y )
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, .2 );
        else
        {
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, 0 );
          this.nextAngleAdjustMs = 3000;
        }
        if( this.p.y < 10 )
          this.tgtBodyAngle = .2;
      }
    }

    return( true );

    if( this.nextMissile > 0 )
      this.nextMissile -= 1;
    else if( this.p.y >= this.target_y ) // time to shoot a missile. Don't shoot while ascending.
      if( ( this.v.dx() > 0 && e.chopper.p.x > this.p.x ) ||
          ( this.v.dx() < 0 && e.chopper.p.x < this.p.x ) ) // only shoot if we're going towards the chopper
      {
        e.addObject( new MissileSmall( this.p, this.v, this.bodyAngle, oType = c.OBJECT_TYPE_E_WEAPON ) );
        this.nextMissile = 50 + randInt( 0, 100 );
      }
    if( ( ( this.v.dx() > 0 && e.chopper.p.x > this.p.x ) ||
          ( this.v.dx() < 0 && e.chopper.p.x < this.p.x ) )
        && randInt( 0, 10 ) == 0 ) // If jet is behind sometimes try to level with chopper
      this.target_y = e.chopper.p.y + 2;

    if( Math.abs( this.p.y - this.target_y ) > .2 )
    {
      if( this.p.y < this.target_y )
      {
        this.p.y += .15;
      }
      else if( this.p.y > this.target_y )
        this.p.y -= .15;
    }

    return true;
  }

  draw( p )
  {
    // tbd, this should be done once to save time.
    const i = Plane.Planes[ this.planeType ].image;
    const w = i.width * Plane.Planes[ this.planeType ].imgFactor;
    const h = i.height * Plane.Planes[ this.planeType ].imgFactor;

    this.e.ctx.translate( p.x, p.y );
    let theta = this.bodyAngle;

    if( dirFromAngle( this.bodyAngle ) == c.DIRECTION_LEFT )
      this.e.ctx.scale( 1, -1 );
    else
      theta = -theta;

    this.e.ctx.rotate( theta );

    this.e.ctx.drawImage( i, -w / 2, -h / 2, w, h );
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    const projShadow = projection( this.e.camera, new Point( p.x, 0, p.z ) );
    this.e.ctx.beginPath();
    this.e.ctx.ellipse( p.x, projShadow.y, w/3, 2, 0, 0, 2 * c.PI )
    this.e.ctx.fill();
  }
}