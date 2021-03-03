import { c } from './constants.js';

const hc = // helicopter constants
{
  // Chopper body angle
  ANGLE_0   : 0, // level
  ANGLE_U5  : 1, // Up 5 degrees for slowing down
  ANGLE_D5  : 2, // Down 5
  ANGLE_D10 : 3, // Down 10

  WEAPON_NONE : 0,
  WEAPON_SMALL_MISSILE : 1,
  WEAPON_LARGE_MISSILE : 2,
  WEAPON_BOMB : 3,
  WEAPON_BULLET : 4,

  ROTOR_STOP : 0,
  ROTOR_SLOW : 1,
  ROTOR_FAST : 2,
  MAX_ALTITUDE : 100,

  // What's the desired X velocity? We have to accelerate to it.
  TGT_VEL_STOP       :  0, // facing fwd
  TGT_VEL_LEFT_STOP  : -1, // stopped facing left
  TGT_VEL_LEFT_SLOW  : -2,
  TGT_VEL_LEFT_FAST  : -3,
  TGT_VEL_RIGHT_STOP :  1,
  TGT_VEL_RIGHT_SLOW :  2,
  TGT_VEL_RIGHT_FAST :  3,

  // What's the desired Y velocity
  TGT_VEL_UP_SLOW : 1,
  TGT_VEL_UP_FAST : 2,
  TGT_VEL_DN_SLOW : -1,
  TGT_VEL_DN_FAST : -2,
}

export class Helicopter
{
  constructor( e, x, y, z )
  {
    this.e = e;
    this.oType = OBJECT_TYPE_CHOPPER;
    this.colRect = [ -2, 3, 2, 0 ];
    this.p = new Point( x, y, z );
    this.onGround = False;
    this.rotorSpeed = ROTOR_SLOW;
    this.rotorTheta = 0.0;
    this.loadImages();
    this.vx = 0.0;
    this.vy = 0.0;
    this.tgtXVelocity = TGT_VEL_STOP;
    this.tgtYVelocity = TGT_VEL_STOP;
    this.chopperDir = DIRECTION_FORWARD;
    this.weapon = WEAPON_NONE; // This gets set and then fired in the next update()
                               // Trying to keep msg processing loosely coupled.
    // resources / weapons. See RESOURCE_XYZ
    this.maxAmount = [ 100.0, MAX_BULLETS, MAX_S_MISSILES, MAX_L_MISSILES, MAX_BOMBS, SI_CHOPPER ];
    this.curAmount = [ 100.0, MAX_BULLETS, MAX_S_MISSILES, MAX_L_MISSILES, MAX_BOMBS, SI_CHOPPER ];

    this.bulletRdyCounter = 0;
    this.displayStickCount = 0;
    this.gunAngle = 0;
    this.gunPosition = 0; // currently just a number from 0-4

    // Target vx enum -> vx map
    this.tgtXVelDict =
    {
      TGT_VEL_STOP        :  0.0,
      TGT_VEL_LEFT_STOP   :  0.0,
      TGT_VEL_LEFT_SLOW   :  -.5,
      TGT_VEL_LEFT_FAST   : -1.0,
      TGT_VEL_RIGHT_STOP  :  0.0,
      TGT_VEL_RIGHT_SLOW  :   .5,
      TGT_VEL_RIGHT_FAST  :  1.0
    }

    // Target vy enum -> vy map
    this.tgtYVelDict = 
    {
      TGT_VEL_STOP      : 0.0,
      TGT_VEL_UP_SLOW   :  .3,
      TGT_VEL_UP_FAST   :  .6,
      TGT_VEL_DN_SLOW   : -.3,
      TGT_VEL_DN_FAST   : -.6
    }

    this.gunAngleFromPosition =
    {
      0 :  10.0 / 360 * 2 * c.PI,
      1 :   0.0 / 360 * 2 * c.PI,
      2 : -10.0 / 360 * 2 * c.PI,
      3 : -20.0 / 360 * 2 * c.PI,
      4 : -45.0 / 360 * 2 * c.PI,
    }

    this.angleDict =
    {
      ANGLE_0   :  .0,
      ANGLE_U5  : -.087,
      ANGLE_D5  :  .087,
      ANGLE_D10 :  .174
    }
    // weapon images for inventory
    //this.missileSImg = ImageTk.PhotoImage( Image.open( "images/chopper/missileB_L.gif" ) );
    //this.missileLImg = ImageTk.PhotoImage( Image.open( "images/chopper/missileA_L.gif" ) );
    //bombImage = Image.open( "images/chopper/bomb.gif" );
    //bombImage = bombImage.resize( ( 10, 30 ) );
    //this.bombImg = ImageTk.PhotoImage( bombImage );
  }

  processMessage( e, message, param=None )
  {
    switch( message) 
    {
    }
  }

  update( tstamp )
  {
  }

  draw( p )
  {
  }

}