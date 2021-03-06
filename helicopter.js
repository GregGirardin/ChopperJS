import { c } from './constants.js';
import { Point, projection } from './utils.js';

var rotate = 0.0;

export class Helicopter
{
  static heloForward;
  static heloL;
  static missileA;
  static missileB;
  static bomb;

  constructor( e, x, y, z )
  {
    this.e = e;
    this.oType = c.OBJECT_TYPE_CHOPPER;
    this.colRect = [ -2, 3, 2, 0 ];
    this.p = new Point( x, y, z );
    this.onGround = false;
    this.rotorSpeed = 1.0; // Hz
    this.rotorTheta = 0.0;
    this.vx = 0.0;
    this.vy = 0.0;
    this.tgtXVelocity = c.TGT_VEL_STOP;
    this.tgtYVelocity = c.TGT_VEL_STOP;
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
      Helicopter.heloForward = new Image();
      Helicopter.heloL = new Image();
      Helicopter.missileA = new Image(); // to display inventory.
      Helicopter.missileB = new Image();
      Helicopter.bomb = new Image();

      Helicopter.heloForward.src = "./images/chopper/bodyForward.gif";
      Helicopter.heloL.src = "./images/chopper/bodyLeft.gif";
      Helicopter.missileA.src = "./images/chopper/missileA_L.gif";
      Helicopter.missileB.src = "./images/chopper/missileB_L.gif";
      Helicopter.bomb.src = "./images/chopper/bomb.gif";
    }
  } 

  processMessage( message, param=undefined )
  {
    switch( message )
    {
      case c.MSG_ACCEL_L:
        if( this.tgtXVelocity > c.TGT_VEL_LEFT_FAST && this.p.y > 0 && this.p.x > c.MIN_WORLD_X )
        {
          this.tgtXVelocity -= 1;
          this.displayStickCount = c.DISPLAY_CONTROL_TIME;
        }
        else if( message == MSG_ACCEL_R )
        {
          if( this.tgtXVelocity < c.TGT_VEL_RIGHT_FAST && this.p.y > 0 )
          {
            this.tgtXVelocity += 1;
            this.displayStickCount = c.DISPLAY_CONTROL_TIME;
          }
        }
        else if( message == c.MSG_ACCEL_U )
        {
          if( this.tgtYVelocity < c.TGT_VEL_UP_FAST )
          {
            this.tgtYVelocity += 1;
            // this.displayStickCount = c.DISPLAY_CONTROL_TIME;
          }
        }
        else if( message == c.MSG_ACCEL_D )
          if( this.tgtYVelocity > c.TGT_VEL_DN_FAST )
          {
            this.tgtYVelocity -= 1;
            this.displayStickCount = c.DISPLAY_CONTROL_TIME;
          }
      break;

    // Don't spawn the weapon here. Let's keep that loosely coupled. Spawn in update().
    case c.MSG_WEAPON_MISSILE_S:
      if( this.chopperDir != c.DIRECTION_FORWARD )
        if( this.curAmount[ c.RESOURCE_SM ] > 0 )
        {
          this.weapon = c.WEAPON_SMALL_MISSILE;
          this.curAmount[ c.RESOURCE_SM ] -= 1;
        }
      break;

    case c.MSG_WEAPON_MISSILE_L:
      if( this.chopperDir != c.DIRECTION_FORWARD )
        if( this.curAmount[ c.RESOURCE_LM ] > 0 )
        {
          this.curAmount[ c.RESOURCE_LM ] -= 1;
          this.weapon = c.WEAPON_LARGE_MISSILE;
        }
      break;

    case c.MSG_WEAPON_BOMB:
      if( this.curAmount[ c.RESOURCE_BOMB ] > 0 )
      {
        this.curAmount[ c.RESOURCE_BOMB ] -= 1;
        this.weapon = c.WEAPON_BOMB;
      }
      break;

    case c.MSG_WEAPON_BULLET:
      if( this.curAmount[ c.RESOURCE_BULLET ] > 0 && this.bulletRdyCounter == 0 )
      {
        this.curAmount[ c.RESOURCE_BULLET ] -= 1;
        this.weapon = c.WEAPON_BULLET;
        this.bulletRdyCounter = 5;
      }
      break;

    case c.MSG_GUN_UP:
      break;

    case c.MSG_GUN_DOWN:
      break;

    case c.MSG_COLLISION_DET:
      // and e.cameraOnHelo:
      // Note that we ignore collisions after we spawn a helo but before the camera
      // has moved to the helo, otherwise we could get destroyed again before we see the helo
      if( param.oType == OBJECT_TYPE_E_WEAPON )
        this.curAmount[ c.RESOURCE_SI ] -= param.wDamage;
      break;

    case c.MSG_RESOURCES_AVAIL:
      // param is a list of c.RESOURCE amounts available that we will mutate
      var r;

      for( r =c.RESOURCE_FUEL;r < c.RESOURCE_COUNT;r++ )
      {
        var wantedAmt;

        wantedAmt = this.maxAmount[ r ] - this.curAmount[ r ];
        if( wantedAmt > 0.0 && param[ r ] > 1.0 ) // We want some of this c.RESOURCE
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
      break;
    }
  }

  update( tstamp )
  {
    var tv;

    if( this.curAmount[ c.RESOURCE_SI ] < 0 )
    {
      this.e.qMessage( c.MSG_CHOPPER_DESTROYED, this );
      return False;
    }
   
    if( this.bulletRdyCounter > 0 )
      this.bulletRdyCounter -= tstamp;

    // Spin the rotors
    this.rotorTheta += this.rotorSpeed * tstamp / 1000.0;
    if( this.rotorTheta > 6.2818 )
      this.rotorTheta -= 6.2818;

    // Accelerate to target velocities
    tv = 0; // this.tgtXVelDict[ this.tgtXVelocity ];
    if( this.vx < tv )
      this.vx += c.CHOPPER_X_DELTA;
    else if( this.vx > tv )
      this.vx -= c.CHOPPER_X_DELTA;
    if( Math.abs( this.vx - tv ) < c.CHOPPER_X_DELTA ) // In case of rounding
      this.vx = tv;

    tv = 0; // this.tgtYVelDict[ this.tgtYVelocity ];
    if( tv == c.TGT_VEL_STOP )
      this.vy *= .5;
    else if( this.vy < tv )
      this.vy += c.CHOPPER_Y_DELTA;
    else if( this.vy > tv )
      this.vy -= c.CHOPPER_Y_DELTA;
    if( Math.abs( this.vy - tv ) <= c.CHOPPER_Y_DELTA )
      this.vy = tv;

    this.p.y += this.vy;
    this.p.x += this.vx;

    rotate += .01;
    this.p.x -= .05;
  }

  draw( p )
  {
    var projShadow;

    projShadow = projection( this.e.camera, new Point( p.x, 0, p.z ) );

    this.e.ctx.translate( p.x, p.y ); 
    this.e.ctx.rotate( rotate );
    // this.e.ctx.scale( -1, 1 ); // flip
    this.e.ctx.drawImage( Helicopter.heloL,
                         -Helicopter.heloL.width  * this.imgFactor / 2,
                         -Helicopter.heloL.height * this.imgFactor / 2,
                          Helicopter.heloL.width  * this.imgFactor,
                          Helicopter.heloL.height * this.imgFactor );
    // Reset transformation matrix
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    // shadow
    this.e.ctx.fillStyle = '#000000';
    this.e.ctx.fillRect( p.x - 60, projShadow.y + 10, 100, 2 );
    // fuel
    // structural integ
    // weapons
  }
}