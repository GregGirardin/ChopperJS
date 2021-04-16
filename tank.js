import { c } from './constants.js';
import { Point, dirFromAngle, showSI, randInt } from './utils.js';
import { Missile } from './missiles.js';
import { Explosion } from './explosions.js';

const maxCannonAngle = .5; // min is 0

export class Tank
{
  static image;
  static cannon;

  constructor( e, x )
  {
    this.e = e;
    this.oType = "Tank";
    this.p = new Point( x, -1, 1 );
    this.colRect = [ -4, 4, 4, 0 ];
    this.cannonAngle = .1; // relative angle 'up' from level (left or right)
    this.tgtCannonAngle = this.cannonAngle;
    this.canonAtTarget = true;
    this.max_si = this.si = c.SI_TANK;
    this.points = c.POINTS_TANK;
    this.showSICount = 0;
    this.state = "Select"; // use a bit of a state machine for tank AI
    this.smTimer = 2000; // run the state machine once in a while
    this.bodyAngle = c.PI;
    this.spd = 0;
    this.f = .9; // image scale factor
    this.target_x = undefined; // Where does the tank want to go?
    this.fireWeapon = false;

    if( !Tank.tankImage )
    {
      Tank.image = new Image();
      Tank.cannon = new Image();

      Tank.image.src = "./images/vehicles/Tank.gif";
      Tank.cannon.src = "./images/vehicles/Cannon.gif";
      e.registerEnemyType( this.oType );
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

/* Tank State Machine
"Select"
  Determine if we should
    Guard a building,
    Attack a town building,
    "Engage" the helo
    "Idle" longer
    do randomly weighted with appropriate parameters

"Guard"
  Move to a base building.
  Wait to engage chopper.

"EngageTown"
  move to town building and destroy.

"EngageHelo"
  Pursuing the helo
*/

  update( deltaMs )
  {
    if( this.si < 0 )
    {
      this.e.qMessage( { m: c.MSG_ENEMY_LEFT_BATTLEFIELD, p : this } );
      return false;
    }

    if( this.showSICount > 0 )
      this.showSICount -= deltaMs;

    this.smTimer -= deltaMs;

    if( this.smTimer < 0 )
    {
      this.smTimer = 1000 + 500 * randInt( 1, 4 );

      // Behavior / AI
      switch( this.state )
      {
        case "Select":

          // decide what to do
          switch( 2 ) // randInt( 0, 2 ) )
          {
            case 0: this.state = "Guard"; break;
            case 1: this.state = "AttackTown"; break;
            case 2: this.state = "EngageHelo"; break;
          }
          break;

        case "Guard":

          var tx = this.e.closestObject( "Base", this.p.x );
          if( !this.target_x )
            this.target_x = tx;
          else if( this.atTargetX() )
          {
            // At target. Make sure it's still there, else find a new one to guard.
            if( tx != this.target_x )
              this.target_x = tx;
            else
            {
              // park and face chopper direction
              this.spd = 0;
              this.bodyAngle = ( this.p.x < this.e.chopper.p.x  ) ? 0 : c.PI;
            }
          }
          else // proceed to target_x
          {
            this.spd = c.MAX_TANK_VEL;
            this.bodyAngle = ( this.p.x < this.target_x ) ? 0 : c.PI;
          }

          // if( Math.abs( this.p.x - this.e.chopper.p.x ) < 20 )
          //   this.state = "EngageHelo";
          break;

        case "AttackTown":
  
          var tx = this.e.closestObject( "Town", this.p.x );
          if( tx != this.target_x ) // do we have a target?
          {
            this.target_x = tx;
            this.tgtCannonAngle = 0;
            this.canonAtTarget = false;
          }
          else if( this.atTargetX( 50 ) ) // within striking distance?
          {
            if( this.canonAtTarget )
            {
              this.fireWeapon = true;
              this.target_x = undefined;
              this.smTimer += 1000; // additional reload time
            }
            this.spd = 0; // stop. Make sure we're facing target.
            this.bodyAngle = ( this.p.x < this.target_x  ) ? 0 : c.PI;
          }
          else // proceed to target.
          {
            this.spd = c.MAX_TANK_VEL;
            this.bodyAngle = ( this.p.x < this.target_x ) ? 0 : c.PI;
          }
          // go to "EngageHelo" if we get shot.
          break;

        case "EngageHelo":

          this.target_x = this.e.chopper.p.x;

          // aim at helo
          this.bodyAngle = ( this.p.x < this.target_x  ) ? 0 : c.PI;
          this.tgtCannonAngle = Math.atan( this.e.chopper.p.y / Math.abs( this.target_x - this.p.x ) );

          this.canonAtTarget = false;

          if( this.atTargetX( 40 ) )
          {
            if( this.tgtCannonAngle > maxCannonAngle )
            {
              this.spd = c.MAX_TANK_VEL;
              this.bodyAngle = randInt( 0, 1 ) ? 0 : c.PI; // randomly move right or left.
            }
            else
            {
              this.spd = 0;
              this.fireWeapon = true;
              this.smTimer += 1000; // additional reload time
            }
          }
          else if( !this.atTargetX( 200 ) )
            this.state = "Select"; // chopper is far away.
          else // go towards helo
          {
            this.spd = c.MAX_TANK_VEL;
            this.bodyAngle = ( this.p.x < this.target_x ) ? 0 : c.PI;
          }

          break;

        default:
          console.log( "Tank: Bad State", this.state );
          return false;
      }
    }
    
    // adjust canon and tank position.
    this.p.x += this.spd * deltaMs / 1000 * Math.cos( this.bodyAngle );
    if( !this.canonAtTarget )
    {
      if( this.cannonAngle < this.tgtCannonAngle )
        this.cannonAngle += deltaMs / 1000;
      else if( this.cannonAngle > this.tgtCannonAngle )
        this.cannonAngle -= deltaMs / 1000;
      if( this.cannonAngle < 0 )
      {
        this.cannonAngle = 0;
        this.canonAtTarget = true;
      }
      else if( this.cannonAngle > maxCannonAngle ) // max angle
      {
        this.cannonAngle = maxCannonAngle;
        this.canonAtTarget = true;
      }
      else if( Math.abs( this.cannonAngle - this.tgtCannonAngle ) < .02 )
      {
        this.cannonAngle = this.tgtCannonAngle;
        this.canonAtTarget = true;
      }
    }

    if( this.fireWeapon )
    {
      this.fireWeapon = false;
      if( dirFromAngle( this.bodyAngle ) == c.DIR_RIGHT )
      {
        const targAngle = this.cannonAngle;
        this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
                          p: new Missile( this.e, "MissileA",
                                          new Point( this.p.x + 5.5 * Math.cos( this.cannonAngle ),
                                                    ( this.p.y + 3.5 ) + 5 * Math.sin( this.cannonAngle ), 1 ),
                                          targAngle, undefined, this ) } );
      }
      else
      {
        const targAngle = c.PI - this.cannonAngle;
        this.e.qMessage( { m: c.MSG_CREATE_OBJECT,
                          p: new Missile( this.e, "MissileA",
                                          new Point( this.p.x - 5.5 * Math.cos( this.cannonAngle ),
                                                    ( this.p.y + 3.5 ) + 5 * Math.sin( this.cannonAngle ), 1 ),
                                          targAngle, undefined, this ) } );
      }
    }


    return true;
  }

  atTargetX( distance=2 )
  {
    return Math.abs( this.p.x - this.target_x ) < distance ? true : false;
  }

  drawWheel( x, y, radius, angle )
  {
    // outer black / rubber, inner silver, inner white
    this.e.ctx.beginPath();
    this.e.ctx.fillStyle = 'black';
    this.e.ctx.ellipse( x, y, radius, radius, 0, 0, 2 * c.PI );
    this.e.ctx.fill();

    this.e.ctx.beginPath();
    this.e.ctx.fillStyle = 'grey';
    this.e.ctx.ellipse( x, y, radius *.65, radius * .65, 0, 0, 2 * c.PI );
    this.e.ctx.fill();

    this.e.ctx.beginPath();
    this.e.ctx.fillStyle = 'white';
    this.e.ctx.ellipse( x, y, radius * .33, radius * .33, 0, 0, 2 * c.PI );
    this.e.ctx.fill();

    // Draw lug nuts to indicate rotation
    var theta = 0;
    radius *= .5;
    while( theta < 2 * c.PI )
    {
      let lnx = x + radius * Math.cos( theta - angle );
      let lny = y - radius * Math.sin( theta - angle );
      this.e.ctx.beginPath();
      this.e.ctx.fillStyle = 'black';
      this.e.ctx.ellipse( lnx, lny, 2, 2, 0,0, 2 * c.PI );
      this.e.ctx.fill();

      theta += ( 2 * c.PI ) / 4;
    }
  }

  draw( p )
  {
    if( !this.w || this.w == 0 )
    {
      this.i = Tank.image;
      this.ci = Tank.cannon;
      this.w = this.i.width * this.f;
      this.h = this.i.height * this.f;

      this.cw = this.ci.width * this.f;
      this.ch = this.ci.height * this.f;      

      this.d2p = 72 * this.f; // distance from p to cannon pivot vertex
      return;
    }

    // The cannon.
    // translate to the pivot point.
    // We're using rotate() to rotate the image, so we need to translate to the
    // rotated vertex point if the tank is rotated.
    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
    {
      var a2p = this.bodyAngle - .85; // angle from p to pivot of cannon
      this.e.ctx.translate( p.x + this.d2p * Math.cos( a2p ), p.y - this.d2p * Math.sin( a2p ) );
      this.e.ctx.scale( 1, -1 );
      theta = this.bodyAngle - this.cannonAngle;
    }
    else
    {
      var a2p = .85 + this.bodyAngle; // angle from p to pivot of cannon
      this.e.ctx.translate( p.x + this.d2p * Math.cos( a2p ), p.y - this.d2p * Math.sin( a2p ) );
      theta = -( this.bodyAngle + this.cannonAngle );
    }
    this.e.ctx.rotate( theta );
    this.e.ctx.drawImage( this.ci, 0, -10, this.cw, this.ch );
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    this.e.ctx.translate( p.x, p.y );
    var theta = this.bodyAngle;

    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
      this.e.ctx.scale( 1, -1 );
    else
      theta = -theta;
    this.e.ctx.rotate( theta );

    // the 'wheels'
    let wheelRot = this.p.x * 1.4;
    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
      wheelRot *= -1;

    const wheelX = [ -57 * this.f, -37 * this.f, -17 * this.f, 1 * this.f, 20 * this.f, 40 * this.f, 60 * this.f ];
    var index;
    for( index = 0;index < wheelX.length;index++ )
      this.drawWheel( wheelX[ index ], -8 * this.f, 9 * this.f, wheelRot );
    this.drawWheel( -75 * this.f, -20 * this.f, 12 * this.f, wheelRot * .7 );

    // The track.
    const rLen = 80 * Math.cos( this.rotorTheta );
    this.e.ctx.strokeStyle = 'black';
    this.e.ctx.beginPath();
    this.e.ctx.moveTo( -85 * this.f, -20 * this.f );
    this.e.ctx.lineTo( -60 * this.f,   0 * this.f );
    this.e.ctx.lineTo(  63 * this.f,   0 * this.f );
    this.e.ctx.lineTo(  75 * this.f, -20 * this.f );
    this.e.ctx.stroke();

    // the tank body
    this.e.ctx.drawImage( this.i, -this.w / 2, -this.h, this.w, this.h );
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    if( this.showSICount > 0 )
      showSI( this.e, p, this.si / this.max_si );
    if( this.e.debugMode )
    {
      this.e.ctx.font = "10px Arial";
      this.e.ctx.fillText( "State:" + this.state + " X:" + this.target_x, p.x - this.w / 4, p.y - 20 );
    }
  }

}