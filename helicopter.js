import { c } from './constants.js';
import { Point, projection } from './utils.js';

export class Helicopter
{
  static heloForward;
  static heloL;
  static missileA;
  static missileB;
  static bomb;

  constructor( e, x, y, z )
  {
    this.debugCounter = 0;

    this.e = e;
    this.oType = c.OBJECT_TYPE_CHOPPER;
    this.colRect = [ -2, 3, 2, 0 ];
    this.p = new Point( x, y, z );
    this.rotVertex = new Point();
    this.logVertex = false;
    this.onGround = false;
    this.rotorTheta = 0.0;
    this.vx = 0.0; // velocity
    this.vy = 0.0;
    this.tgtXVelocity = 0;
    this.tgtYVelocity = 0;
    this.bodyAngle = 0; // + means down, left or right. This does not indicate direction
    this.chopperDir = c.DIRECTION_FORWARD;
    this.weapon = c.WEAPON_NONE; // This gets set and then fired in the next update()
                                 // Trying to keep msg processing loosely coupled.
    // c.RESOURCEs / weapons. See c.RESOURCE_XYZ
    this.maxAmount = [ 100.0, c.MAX_BULLETS, c.MAX_S_MISSILES, c.MAX_L_MISSILES, c.MAX_BOMBS, c.SI_CHOPPER ];
    this.curAmount = [ 100.0, c.MAX_BULLETS, c.MAX_S_MISSILES, c.MAX_L_MISSILES, c.MAX_BOMBS, c.SI_CHOPPER ];

    this.bulletRdyCounter = 0;
    this.displayStickCount = 0;
    this.imgFactor = 1;

    if( !Helicopter.heloForward )
    {
      Helicopter.heloForward  = new Image();
      Helicopter.heloL        = new Image();
      Helicopter.missileA     = new Image(); // to display inventory.
      Helicopter.missileB     = new Image();
      Helicopter.bomb         = new Image();

      Helicopter.heloForward.src  = "./images/chopper/bodyForward.gif";
      Helicopter.heloL.src        = "./images/chopper/bodyLeft.gif";
      Helicopter.missileA.src     = "./images/chopper/missileA_L.gif";
      Helicopter.missileB.src     = "./images/chopper/missileB_L.gif";
      Helicopter.bomb.src         = "./images/chopper/bomb.gif";
    }
  } 

  processMessage( message, param=undefined )
  {
    switch( message )
    {
      case c.MSG_UI:
        this.displayStickCount = c.DISPLAY_CONTROL_TIME;

        switch( param.key )
        {
          case "ArrowRight":
            this.tgtXVelocity++;
            if( this.tgtXVelocity > c.MAX_X_VEL )
              this.tgtXVelocity = c.MAX_X_VEL;
            break;
          
          case "ArrowLeft":
            this.tgtXVelocity--;
            if( this.tgtXVelocity < -c.MAX_X_VEL )
              this.tgtXVelocity = -c.MAX_X_VEL;
  
            break;

          case "ArrowUp":
            this.tgtYVelocity++;
            if( this.tgtYVelocity > c.MAX_Y_VEL )
              this.tgtYVelocity = c.MAX_Y_VEL;
            break;

          case "ArrowDown":
            this.tgtYVelocity--;
            if( this.tgtYVelocity < c.MIN_Y_VEL )
              this.tgtYVelocity = c.MIN_Y_VEL;
            break;

          case "w":
            this.rotVertex.y -= 1; this.logVertex = true; break
          case "s":
            this.rotVertex.y += 1; this.logVertex = true; break
          case "a":
            this.rotVertex.x -= 1; this.logVertex = true; break
          case "d":
            this.rotVertex.x += 1; this.logVertex = true; break
          // // Don't spawn weapons here. Let's keep that loosely coupled. Spawn in update().
          // case "a": // missle A
          //   if( this.curAmount[ c.RESOURCE_SM ] > 0 )
          //   {
          //     this.weapon = c.WEAPON_SMALL_MISSILE;
          //     this.curAmount[ c.RESOURCE_SM ] -= 1;
          //   }

          // case "b": // missle b
          //   if( this.curAmount[ c.RESOURCE_LM ] > 0 )
          //   {
          //     this.curAmount[ c.RESOURCE_LM ] -= 1;
          //     this.weapon = c.WEAPON_LARGE_MISSILE;
          //   }
          // case "c": // bomb
          //   if( this.curAmount[ c.RESOURCE_BOMB ] > 0 )
          //   {
          //     this.curAmount[ c.RESOURCE_BOMB ] -= 1;
          //     this.weapon = c.WEAPON_BOMB;
          //   }
          //   break;

          // case "d": // bullet
          //   if( this.curAmount[ c.RESOURCE_BULLET ] > 0 && this.bulletRdyCounter <= 0 )
          //   {
          //     this.curAmount[ c.RESOURCE_BULLET ] -= 1;
          //     this.weapon = c.WEAPON_BULLET;
          //     this.bulletRdyCounter = c.BULLET_WAIT_TIME;
          //   }
          }
        break;

      case c.MSG_COLLISION_DET:
        // and e.cameraOnHelo:
        // Note that we ignore collisions after we spawn a helo but before the camera
        // has moved to the helo, otherwise we could get destroyed again before we see the helo
        if( param.oType == c.OBJECT_TYPE_E_WEAPON )
          this.curAmount[ c.RESOURCE_SI ] -= param.wDamage;
        break;

      case c.MSG_RESOURCES_AVAIL:
        // param is a list of c.RESOURCE amounts available that we will mutate
        var r;

        for( r = c.RESOURCE_FUEL;r < c.RESOURCE_COUNT;r++ )
        {
          var wantedAmt;

          wantedAmt = this.maxAmount[ r ] - this.curAmount[ r ];
          if( wantedAmt > 0.0 && param[ r ] > 1.0 ) // We want some of this c.RESOURCE
          {
            if( wantedAmt > param[ r ] )
            {
              this.curAmount[ r ] += param[ r ];
              param[ r ] = 0.0; // take it all
            }
            else
            {
              this.curAmount[ r ] += wantedAmt;
              param[ r ] -= wantedAmt;
            }
          }
        }
      break;
    }
  }

  // Get actual desired X velocity from tgtXVelocity
  // tgtXVelocity of -1 0 1 all mean don't move, -1 means face left, 0 fwd, 1 right.
  getTgtXVel()
  {
    let tgtVel = this.tgtXVelocity;
    if( Math.abs( tgtVel ) <= 1 )
      return 0;
    else
      return ( tgtVel > 0 ) ? tgtVel - 1 : tgtVel + 1;
  }

  update( tstamp )
  {
    let rotorSpeed = 1; // default, slow spin

    if( this.curAmount[ c.RESOURCE_SI ] < 0 )
    {
      this.e.qMessage( c.MSG_CHOPPER_DESTROYED, this );
      return False;
    }

    if( this.bulletRdyCounter > 0 )
      this.bulletRdyCounter -= tstamp;

    // Accelerate to target velocities
    // this.vx -1,0,1 mean not moving but facing left, fwd, right
    let tgtX = this.getTgtXVel();

    if( this.vx < tgtX )
      this.vx += tstamp / 1000;
    else if( this.vx > tgtX )
      this.vx -= tstamp / 1000;
    if( Math.abs( this.vx - tgtX ) < .01 )
      this.vx = tgtX;

    if( this.vy < this.tgtYVelocity )
      this.vy += tstamp / 200;
    else if ( this.vy > this.tgtYVelocity )
      this.vy -= tstamp / 200;
    if( Math.abs( this.vy - this.tgtYVelocity ) < .01 )
      this.vy = this.tgtYVelocity;

    // translate
    this.p.y += this.vy / 10;
    this.p.x += this.vx / 5;

    if( this.p.y < 0 )
      this.p.y = 0;

    // figure out angle. + is degrees 'down' from level
    // Accel in quickly +10deg (.175 rad)
    // Maintain current dir +5
    // decel to change direction -5
    // idle 0
    const a20 = -.35; // 20 degres in radians.
    const a10 = -.175;
    let tgtAngle = 0.0;
    let tgtVel = this.getTgtXVel();

    if( this.vx > c.EFFECTIVE_ZERO ) // going right
    {
      this.chopperDir = c.DIRECTION_RIGHT;

      if( Math.abs( this.vx - tgtVel ) < c.EFFECTIVE_ZERO )
        tgtAngle = a10; // maintain speed. We're at tgtVel
      else if( this.vx < tgtVel )
        tgtAngle = a20; // accellerate
      else
        tgtAngle = -a10; // slow down
    }
    else if( this.vx < -c.EFFECTIVE_ZERO ) // going left
    {
      this.chopperDir = c.DIRECTION_LEFT;

      if( Math.abs( this.vx - tgtVel ) < c.EFFECTIVE_ZERO )
        tgtAngle = a10; 
      else if( this.vx > tgtVel )
        tgtAngle = a20; 
      else
        tgtAngle = -a10; 
    }
    else // not moving
    {
      if( this.tgtXVelocity > .1 )
        this.chopperDir = c.DIRECTION_RIGHT;
      else if( this.tgtXVelocity < -.1 )
        this.chopperDir = c.DIRECTION_LEFT;
      else
        this.chopperDir = c.DIRECTION_FORWARD;

      tgtAngle = 0;
    }

    if( tgtAngle == a10 )
      rotorSpeed = 2;
    else if( tgtAngle == a20 )
      rotorSpeed = 3;

    if( this.bodyAngle < tgtAngle - c.EFFECTIVE_ZERO )
      this.bodyAngle += .02; // tbd, adjust for timedelta
    else if( this.bodyAngle > tgtAngle + c.EFFECTIVE_ZERO )
      this.bodyAngle -= .02;

    // Spin the rotors
    if( ( this.tgtXVelocity > 1 ) || ( this.tgtYVelocity > 0 ) )
      rotorSpeed = 2; // fast

    this.rotorTheta += rotorSpeed * tstamp / 100;
    if( this.rotorTheta > 2 * c.PI )
      this.rotorTheta -= 2 * c.PI ;
  }

  draw( p )
  {
    var projShadow, hImg, xlate = new( Point );

    xlate.x = 0;
    xlate.y = 0;

    hImg = ( this.chopperDir == c.DIRECTION_FORWARD ) ? Helicopter.heloForward : Helicopter.heloL;

    const hWidth  = hImg.width  * this.imgFactor;
    const hHeight = hImg.height * this.imgFactor;

    this.rotVertex.y = hHeight * -.22;
    xlate.y = 18;

    if( this.chopperDir == c.DIRECTION_FORWARD )
      this.rotVertex.x = hWidth * -.012;
    else
    {
      this.rotVertex.x = hWidth * -.16;
      xlate.x = 20;
    }

    // if( this.logVertex )
    // {
    //   if( this.rotVertex.x != 0 && this.rotVertex.y != 0 )
    //     console.log( this.rotVertex.x / hWidth, this.rotVertex.y / hHeight );
    //   this.logVertex = false; 
    // }

    this.e.ctx.translate( p.x + this.rotVertex.x + xlate.x, p.y + this.rotVertex.y - xlate.y );

    if( this.chopperDir == c.DIRECTION_RIGHT ) // right? flip image
      this.e.ctx.scale( -1, 1 );

    this.e.ctx.rotate( this.bodyAngle );
    this.e.ctx.drawImage( hImg,
                          -hWidth / 2 - this.rotVertex.x, -hHeight / 2 - this.rotVertex.y,
                          hWidth, hHeight );

    if( this.e.debugCoords ) // draw the vertex
    {
      this.e.ctx.strokeStyle = 'black';
      this.e.ctx.beginPath();
      this.e.ctx.moveTo( -5,  0 );
      this.e.ctx.lineTo(  5,  0 );
      this.e.ctx.moveTo(  0, -5 );
      this.e.ctx.lineTo(  0,  5 );
      this.e.ctx.stroke();
    }

    // rotor
    const rLen = 80 * Math.cos( this.rotorTheta );
    this.e.ctx.strokeStyle = 'black';
    this.e.ctx.beginPath();
    this.e.ctx.moveTo( -rLen, -5 );
    this.e.ctx.lineTo( rLen, -5 );
    this.e.ctx.stroke();

    // Reset transformation matrix
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    // shadow
    projShadow = projection( this.e.camera, new Point( p.x, 0, p.z ) );
    this.e.ctx.fillStyle = '#000000';
    this.e.ctx.fillRect( p.x - hWidth/4, projShadow.y, hWidth/2, 1 );

    // fuel
    // structural integ
    // weapons
  }
}