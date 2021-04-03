import { c } from './constants.js';
import { Point, projection, addAngle, dirFromAngle, setRelTheta, getRelTheta, showSI, randInt } from './utils.js';
import { Missile } from './missiles.js';
import { Explosion } from './explosions.js';

export class Plane
{
  static ticksPerImg = 100;

  static planes = // properties are planeTypes
  {
    Bomber1 : {
              image : undefined,
              src : "images/vehicles/Bomber1.png",
              si : c.SI_BOMBER1,
              bombs : 2,
              damage : 0,
              imgFactor : .8,
              points : c.POINTS_BOMBER,
              spd : c.MAX_BOMBER1_VEL,
              adjTimeMs : 3000, // average time to recalculate ideal trajectory 
              turnDelta : undefined, // How far from chopper do we get before we turn round (if this plane does that)
              maxBodyAngle : .15,
              colRect : [ -7, 0, 7, -2 ],
              },

    Bomber2 : {
              image : undefined,
              src : "images/vehicles/Bomber2.gif",
              si : c.SI_BOMBER2,
              bombs : 3,
              damage : 0,
              imgFactor : .7,
              points : c.POINTS_BOMBER,
              spd : c.MAX_BOMBER2_VEL,
              adjTimeMs : 3000, 
              turnDelta : undefined,
              maxBodyAngle : .15,
              colRect : [ -7, 0, 7, -2 ],
              },

    Fighter1 : {
              image : undefined,
              src : "images/vehicles/Fighter.gif",
              si : c.SI_FIGHTER1,
              bombs : 0,
              damage : 0,
              imgFactor : .4,
              points : c.POINTS_FIGHTER1,
              spd : c.MAX_FIGHTER1_VEL,
              adjTimeMs : 1500, 
              turnDelta : 250,
              maxBodyAngle : .2,
              colRect : [ -3, 1, 3, -1 ],
              },

    Fighter2 : {
              image : undefined,
              src : "images/vehicles/Jet4.png",
              si : c.SI_FIGHTER2,
              bombs : 0,
              damage : 0,
              imgFactor : .3,
              points : c.POINTS_FIGHTER2,
              spd : c.MAX_FIGHTER2_VEL,
              adjTimeMs : 1000, 
              turnDelta : 100, // fast aggressive
              maxBodyAngle : .25,
              colRect : [ -3, 1, 3, -1 ],
              },
  }

  constructor( e, type, x, y, dir=c.DIR_LEFT  )
  {
    this.e = e;
    this.oType = type;
 
    this.p = new Point();
    this.p.x = x;
    this.p.y = y;
    this.p.z = 1

    this.target_y = y;
    this.time = 0;
    this.bodyAngle = c.PI;
    this.tgtBodyAngle = c.PI; // what angle do we want to be at, bodyAngle will adjust to this over a short time.
    this.nextAngleAdjustMs = 2000;

    let p = Plane.planes[ type ];

    this.turnDelta = p.turnDelta; // for fighers, when do they turn around.
    this.maxBodyAngle = p.maxBodyAngle;
    this.adjTimeMs = p.adjTimeMs;
    this.colRect = p.colRect;
    this.spd = p.spd;
    this.max_si = this.si = p.si;
    this.points = p.points;
    this.showSICount = 0;

    if( !Plane.planes.Bomber1.image )
      for( const[ k, o ] of Object.entries( Plane.planes ) )
      {
        o.image = new Image();
        o.image.src = o.src;
      }
  }

  processMessage( e, msg, param=undefined )
  {
    switch( msg )
    {
      case c.MSG_COLLISION_DET:
        if( Missile.types.includes( param.oType ) && ( param.owner.oType != this.oType ) ) // it's a missle and not ours
        {
          this.showSICount = c.SHOW_SI_COUNT;
          this.si -= param.damage;
          if( this.si < 0 )
            e.addObject( new Explosion( this.e, this.p, "Explosion1" ) );
        }
    }
  }

  update( deltaMs )
  {
    // common update() functionality for all planes
    if( this.si < 0.0 )
    {
      this.e.qMessage( { m: c.MSG_ENEMY_LEFT_BATTLEFIELD, p : this } );
      return false;
    }

    if( dirFromAngle( this.bodyAngle ) != dirFromAngle( this.tgtBodyAngle )  )
      this.bodyAngle = this.tgtBodyAngle; // changed direction, just set it.
    else if( dirFromAngle( this.bodyAngle ) == c.DIR_RIGHT )
    {
      if( Math.abs( this.bodyAngle - this.tgtBodyAngle ) < .1 )
        this.bodyAngle = this.tgtBodyAngle; // close enough, set exactly.
      else
        this.bodyAngle += ( this.bodyAngle < this.tgtBodyAngle ) ? .02 : -.02;
    }
    else // facing left
    {
      const tgtRel = getRelTheta( this.tgtBodyAngle );
      const actRel = getRelTheta( this.bodyAngle );

      if( Math.abs( tgtRel - actRel ) < .1 )
        this.bodyAngle = this.tgtBodyAngle; // close, just set it.
      else
        this.bodyAngle = setRelTheta( this.bodyAngle, ( actRel < tgtRel ) ? actRel + .02 : actRel - .02 );
    }

    let delta = this.spd * deltaMs / 1000;
    this.p.x += delta * Math.cos( this.bodyAngle );
    this.p.y += delta * Math.sin( this.bodyAngle );

    // plane specific update
    switch( this.oType )
    {
      case "Bomber1":
      case "Bomber2":
        return this.bomberUpdate( deltaMs );
      case "Fighter1":
      case "Fighter2":
        return this.fighterUpdate( deltaMs );
    }
  }

  // specific updates for different types of planes.
  bomberUpdate( deltaMs )
  {
    if( this.p.x < c.MIN_WORLD_X - 50 ) // To the left of the theater, turn around.
    {
      this.target_y = randInt( 75, 100 );
      this.tgtBodyAngle = 0; // go right
      this.bodyAngle = this.tgtBodyAngle;
    }
    else if( this.p.x > c.MAX_WORLD_X + 100 )
    {
      if( this.e.cityDestroyed )
      {
        this.e.addStatusMessage( "Bomber Left Theater" );
        this.e.qMessage( { m: c.MSG_ENEMY_LEFT_BATTLEFIELD, p : this } );
        return false;
      }
      this.target_y = randInt( 10, 30 );
      this.tgtBodyAngle = c.PI; // go left
      this.bodyAngle = this.tgtBodyAngle;
    }
    else
    {
      this.nextAngleAdjustMs -= deltaMs;
      if( this.nextAngleAdjustMs < 0 )
      {
        this.nextAngleAdjustMs = this.adjTimeMs;

        // adjust angle to reach target y
        if( Math.abs( this.p.y - this.target_y ) > .5 ) // not at target y
        {
          this.tgtBodyAngle = setRelTheta( this.tgtBodyAngle,
                                           this.p.y < this.target_y ? this.maxBodyAngle : -this.maxBodyAngle );
          this.nextAngleAdjustMs = 200; // check often until at target y
        }
        else
          this.tgtBodyAngle = setRelTheta( this.tgtBodyAngle, 0 ); // level off
        
        this.bombs = 0;

        if( this.bombs )  // See if there's a target
        {
          let o, index;
          for( index = 0;index < this.e.objects.length;index++ )
          {
            o = this.e.objects[ index ];
            if( o.oType == "CityBuilding" )
              if( Math.abs( o.p.x - this.p.x ) < 10 )
              {
                this.e.addObject( new Missile( this.e, "Bomb", new Point( this.p.x, this.p.y, 1 ),
                                               this.bodyAngle, this.v, this ) );
                this.bombs -= 1;
                break;
              }
          }
        }
      }
    }
    return(true );
  }

  fighterUpdate( deltaMs )
  {
    if( Math.abs( this.p.x - this.e.chopper.p.x ) > this.turnDelta ) // Need to turn around.
      this.tgtBodyAngle = ( this.p.x > this.e.chopper.p.x ) ? c.PI : 0;
    else
    {
      this.nextAngleAdjustMs -= deltaMs;
      if( this.nextAngleAdjustMs < 0 )
      {
        this.nextAngleAdjustMs = this.adjTimeMs;
        if( this.p.y > this.e.chopper.p.y )
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, -this.maxBodyAngle );
        else if( this.p.y < this.e.chopper.p.y )
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, this.maxBodyAngle );
        else
        {
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, 0 );
          this.nextAngleAdjustMs = 3000;
        }
      }
      if( this.p.y < 10 )
        this.tgtBodyAngle = setRelTheta( this.bodyAngle, .05 );
    }

    return( true );

    if( this.nextMissile > 0 )
      this.nextMissile -= 1;
    else if( this.p.y >= this.target_y ) // time to shoot a missile. 
      if( ( this.v.dx() > 0 && e.chopper.p.x > this.p.x ) ||
          ( this.v.dx() < 0 && e.chopper.p.x < this.p.x ) ) // only shoot if we're going towards the chopper
      {
        this.e.addObject( new Missile( this.e, "MissileA", new Point( this.p.x, this.p.y, 1 ),
                                       this.bodyAngle, this.v, this ) );
        this.nextMissile = 50 + randInt( 0, 100 );
      }

    return true;
  }

  draw( p )
  {
    // tbd, this should be done once to save time.

    if( !this.w || this.w == 0 )
    {
      this.i = Plane.planes[ this.oType ].image;
      this.w = this.i.width * Plane.planes[ this.oType ].imgFactor;
      this.h = this.i.height * Plane.planes[ this.oType ].imgFactor;
    }

    this.e.ctx.translate( p.x, p.y );
    let theta = this.bodyAngle;

    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
      this.e.ctx.scale( 1, -1 );
    else
      theta = -theta;

    this.e.ctx.rotate( theta );

    this.e.ctx.drawImage( this.i, -this.w / 2, -this.h / 2, this.w, this.h );
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    const projShadow = projection( this.e.camera, new Point( p.x, 0, 0 ) );
    this.e.ctx.fillStyle = 'black';
    this.e.ctx.beginPath();
    this.e.ctx.ellipse( p.x, projShadow.y, this.w/3, 2, 0, 0, 2 * c.PI );
    this.e.ctx.fill();

    if( this.showSICount > 0 )
      showSI( this.e, p, this.si / this.max_si );
  }
}