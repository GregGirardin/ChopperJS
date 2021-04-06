import { c } from './constants.js';
import { Point, Vector, projection, dirFromAngle, setRelTheta, getRelTheta, showSI, randInt } from './utils.js';
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
              imgFactor : .7,
              points : c.POINTS_BOMBER,
              spd : c.MAX_BOMBER2_VEL,
              adjTimeMs : 3000, 
              turnDelta : undefined,
              maxBodyAngle : .15,
              colRect : [ -8, 0, 7, -3.5 ],
              },

    Fighter1 : {
              image : undefined,
              src : "images/vehicles/Fighter.gif",
              si : c.SI_FIGHTER1,
              bombs : 0,
              imgFactor : .4,
              points : c.POINTS_FIGHTER1,
              spd : c.MAX_FIGHTER1_VEL,
              adjTimeMs : 800, 
              turnDelta : 175,
              maxBodyAngle : .2,
              colRect : [ -3, 1, 3, -1 ],
              },

    Fighter2 : {
              image : undefined,
              src : "images/vehicles/Jet4.png",
              si : c.SI_FIGHTER2,
              bombs : 0,
              imgFactor : .3,
              points : c.POINTS_FIGHTER2,
              spd : c.MAX_FIGHTER2_VEL,
              adjTimeMs : 500, 
              turnDelta : 100, // fast aggressive
              maxBodyAngle : .25,
              colRect : [ -3, 1, 3, -1 ],
              },
  }

  constructor( e, type, x, y, dir=c.DIR_LEFT  )
  {
    this.e = e;
    this.oType = type;
    this.p = new Point( x, y , 1);
    this.target_y = y;
    this.bodyAngle = c.PI;
    this.tgtBodyAngle = c.PI; // what angle do we want to be at, bodyAngle will adjust to this over a short time.
    this.nextAngleAdjustMs = 2000;

    let p = Plane.planes[ type ];
    this.turnDelta = p.turnDelta; // for fighers, when do they turn around.
    this.maxBodyAngle = p.maxBodyAngle;
    this.adjTimeMs = p.adjTimeMs;
    this.bombs = p.bombs;
    this.colRect = p.colRect;
    this.spd = p.spd;
    this.tgtspd = p.spd;
    this.max_si = this.si = p.si;
    this.points = p.points;
    this.v = new Vector();
    this.v.setPolar( this.bodyAngle, p.spd );
    this.showSICount = 0;
    this.state = undefined; // give planes some intelligence with a state machine.

    if( !Plane.planes.Bomber1.image )
      for( const[ k, o ] of Object.entries( Plane.planes ) )
      {
        o.image = new Image();
        o.image.src = o.src;
        e.registerEnemyType( k );
      }
  }

  processMessage( e, msg, param=undefined )
  {
    switch( msg )
    {
      case c.MSG_COLLISION_DET:
        if( Missile.types.includes( param.oType ) && ( param.owner.oType != this.oType ) ) // it's a missle and not ours
        {
          this.showSICount = c.SHOW_SI_TIME;
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

    // Adjust body angle to approach target body angle.
    const tgtRel = getRelTheta( this.tgtBodyAngle );
    const actRel = getRelTheta( this.bodyAngle );

    if( ( dirFromAngle( this.bodyAngle ) != dirFromAngle( this.tgtBodyAngle ) ) ||
          Math.abs( tgtRel - actRel ) < .02 )
      this.bodyAngle = this.tgtBodyAngle; // changed direction, or quite close to tgt. Just set it
    else // tbd: incorporate deltaMs, should be plane specific too.
      this.bodyAngle = setRelTheta( this.bodyAngle, actRel < tgtRel ? actRel + .003 : actRel - .003 );

    // plane specific update
    var value = true;
    switch( this.oType )
    {
      case "Bomber1":
      case "Bomber2":
        value = this.bomberUpdate( deltaMs );
        break;
      case "Fighter1":
      case "Fighter2":
        value = this.fighterUpdate( deltaMs );
        break;
    }

    // translate
    this.spd += ( this.spd < this.tgtspd ) ? .1 : -.1; // tbd, adjust for deltaMs
    this.v.setPolar( this.bodyAngle, this.spd );
    this.p.x += this.v.xc * deltaMs / 1000;
    this.p.y += this.v.yc * deltaMs / 1000;

    return value;
  }

  /* /////////////////////////////////////////////////
    Bomber state machine
    APPROACHING
      Choose target.
      Go towards target.
      Adjust altutude down if close to garget.
      drop bomb if target is close
      turn around after passed the last building

    DEPARTING
      go to random highish altitude
      turn around after reload location MIN/MAX_WORLD_X

  ///////////////////////////////////////////////// */
  bomberUpdate( deltaMs )
  {
    if( !this.state )
      this.state = "APPROACHING";

    if( this.p.x < c.MIN_WORLD_X - 50 )  // To the left of the theater, turn around.
    {
      this.target_y = randInt( 75, 100 );
      this.tgtBodyAngle = 0; // go right
      this.bodyAngle = this.tgtBodyAngle;
    }
    else if( this.p.x > c.MAX_WORLD_X + 50 )
    {
      this.target_y = randInt( 10, 30 );
      this.tgtBodyAngle = c.PI; // go left
      this.bodyAngle = this.tgtBodyAngle;
      this.bombs = 1;
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
          this.tgtBodyAngle = setRelTheta( this.tgtBodyAngle, this.p.y < this.target_y ? this.maxBodyAngle : -this.maxBodyAngle );
          this.nextAngleAdjustMs = 500; // check often until at target y
        }
        else
          this.tgtBodyAngle = setRelTheta( this.tgtBodyAngle, 0 ); // level off
        
        if( this.bombs )  // See if there's a target
        {
          let index;
          for( index = 0;index < this.e.objects.length;index++ )
            if( this.e.objects[ index ].oType == "CityBuilding" )
              if( Math.abs( this.e.objects[ index ].p.x - this.p.x ) < 10 )
              {
                this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
                                   p: new Missile( this.e, "Bomb", new Point( this.p.x, this.p.y, 1 ), this.bodyAngle, this.v, this ) } );
                this.bombs -= 1;
                this.nextAngleAdjustMs = 2500;
                break;
              }
        }
      }
    }

    return( true );
  }
  
  /* /////////////////////////////////////////////////
    Fighter state machine
    APPROACHING
      Slow down
      Go towards helo altitude +/-
      Adjust altitude to match helo periodically.
      Shoot missiles if close enough

    DEPARTING
      Accellerate away
      go to random altitude
      turn around after turnDelta distance from Helo and enter APPROACHING

  ///////////////////////////////////////////////// */
  fighterUpdate( deltaMs )
  {
    if( !this.state )
      this.state = "APPROACHING";

    if( ( Math.abs( this.p.x - this.e.chopper.p.x ) > this.turnDelta ) &&
        ( this.state == "DEPARTING" ) )// Need to turn around.
    {
      // console.log( "APPROACHING" );

      this.state = "APPROACHING";
      this.target_y = randInt( -2, 4 ); // Offset from Helo Y to use. 
      this.tgtBodyAngle = ( this.p.x > this.e.chopper.p.x ) ? c.PI : 0;
      this.tgtspd = Plane.planes[ this.oType ].spd * .8;
    }
    const planeDir = dirFromAngle( this.tgtBodyAngle );

    if( ( ( ( planeDir == c.DIR_RIGHT ) && ( this.p.x > this.e.chopper.p.x ) ) ||
          ( ( planeDir == c.DIR_LEFT ) && ( this.p.x < this.e.chopper.p.x ) ) ) &&
          this.state == "APPROACHING" )
    {
      // console.log( "DEPARTING to ", this.target_y );

      this.state = "DEPARTING";
      this.target_y = randInt( 30, 70 ); // target altitude.
      this.tgtspd = Plane.planes[ this.oType ].spd * 1.2;
    }

    switch( this.state )
    {
      case "APPROACHING":

        this.nextAngleAdjustMs -= deltaMs;
        if( this.nextAngleAdjustMs < 0 )
        {
          this.nextAngleAdjustMs = this.adjTimeMs;
          const targY = this.e.chopper.p.y + this.target_y;
          if( Math.abs( this.p.y - targY ) < 5 )
            this.tgtBodyAngle = setRelTheta( this.bodyAngle, 0 );
          else if( this.p.y > targY ) // we're higher, descend.
            this.tgtBodyAngle = setRelTheta( this.bodyAngle, -this.maxBodyAngle );
          else // we're lower, ascend.
            this.tgtBodyAngle = setRelTheta( this.bodyAngle, this.maxBodyAngle );
        }
        if( this.p.y < 5 )
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, .05 );

        if( this.nextMissile > 0 )
          this.nextMissile -= deltaMs;
        else // time to shoot a missile when we can
        {
          // only shoot if we're going towards the chopper and are reasonably close
          if( Math.abs( this.e.chopper.p.x - this.p.x ) < 25 )
          {
            this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
                              p: new Missile( this.e, "MissileA", new Point( this.p.x, this.p.y, 1 ),
                                              this.bodyAngle, this.v, this ) } );
            this.nextMissile = randInt( 500, 2000 );
            this.tgtspd = Plane.planes[ this.oType ].spd * .8; // slow down to attack
          }
          else
            this.tgtspd = Plane.planes[ this.oType ].spd; // catch up to helo.
        }

        break;

      case "DEPARTING":

        if( Math.abs( this.p.y - this.target_y ) < 4 )
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, 0 );
        else if( this.p.y > this.target_y ) // we're higher, descend.
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, -this.maxBodyAngle );
        else // we're lower, ascend.
          this.tgtBodyAngle = setRelTheta( this.bodyAngle, this.maxBodyAngle );

        break;

      default:
        break;
    }

    return true;
  }

  draw( p )
  {
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
    this.e.ctx.ellipse( p.x, projShadow.y, this.w / 3, 2, 0, 0, 2 * c.PI );
    this.e.ctx.fill();

    if( this.showSICount > 0 )
      showSI( this.e, p, this.si / this.max_si );
  }
}