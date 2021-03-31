
import { c } from './constants.js';
import { Point, projection, addAngle, dirFromAngle, setRelTheta, getRelTheta, randInt } from './utils.js';

const S = // Tank operational states
{
  TANK_STATE_MOVE_TO_ATK  : 0,  // go to building
  TANK_STATE_ATK_CHOPPER  : 1,  // Helo present. Engage
  TANK_STATE_SHELLING     : 2,  // in position
  TANK_STATE_RELOAD       : 3,  // out of weapons, go back to reload.
  TANK_STATE_GUARD        : 4   // Wait here until the chopper comes local
}

export class Tank
{
  static image;
  static cannon;

  constructor( e, x )
  {
    this.e = e;
    this.oType = "Tank";
    this.p = new Point( x, 0, 1 );
    this.colRect = [ -4, 4, 4, 0 ];
    this.cannonAngle = .1; // relative angle 'up' from level (left or right)
    this.si = this.siMax = c.SI_TANK;
    this.points = c.POINTS_TANK;
    this.showSICount = 0;
    this.state = S.TANK_STATE_GUARD; // use a bit of a state machine for tank AI
    this.smTimer = 2000; // run the state machine once in a while
    this.wDamage = 0; // it damages by shooting..
    this.bodyAngle = c.PI;
    this.firstTime = true;
    this.spd = c.MAX_TANK_VEL;
    this.f = .9; // image scale factor

    if( !Tank.tankImage )
    {
      Tank.image = new Image();
      Tank.cannon = new Image();

      Tank.image.src = "./images/vehicles/Tank.gif";
      Tank.cannon.src = "./images/vehicles/Cannon.gif";
    }
  }

  processMessage( e, message, param=undefined )
  {
    if( message == c.MSG_COLLISION_DET ) { }
  }

  update( deltaMs )
  {
    if( this.si < 0 )
    {
      e.qMessage( c.MSG_ENEMY_LEFT_BATTLEFIELD, this );
      return false;
    }

    this.p.x += this.spd * deltaMs / 1000 * Math.cos( this.bodyAngle );

    if( this.p.x < c.MIN_WORLD_X )
      this.bodyAngle = 0;
    else if( this.p.x > c.MAX_WORLD_X )
      this.bodyAngle = c.PI;

    this.smTimer -= deltaMs;
    if( this.smTimer < 0 )
    {
      this.smTimer = 2000;

      // Behavior / AI
      switch( this.state )
      {
        case S.TANK_STATE_GUARD: break;
        case S.TANK_STATE_MOVE_TO_ATK: break;
        case S.TANK_STATE_SHELLING: break;
        case S.TANK_STATE_ATK_CHOPPER: break;
      }
    }
    return true;
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
      this.e.ctx.translate( p.x + this.d2p * Math.cos( a2p ),
                            p.y - this.d2p * Math.sin( a2p ) );
      this.e.ctx.scale( 1, -1 );
      theta = this.bodyAngle - this.cannonAngle;
    }
    else
    {
      var a2p = .85 + this.bodyAngle; // angle from p to pivot of cannon
      this.e.ctx.translate( p.x + this.d2p * Math.cos( a2p ),
                            p.y - this.d2p * Math.sin( a2p ) );
      theta = -( this.bodyAngle + this.cannonAngle);
    }
    this.e.ctx.rotate( theta );
    this.e.ctx.drawImage( this.ci, 0, -10, this.cw, this.ch );
    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    this.e.ctx.translate( p.x, p.y );
    var theta = this.bodyAngle;
    var trackPos = this.p.x;

    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
    {
      trackPos *= -1;
      this.e.ctx.scale( 1, -1 );
    }
    else
      theta = -theta;
    this.e.ctx.rotate( theta );

    // the 'wheels'
    let wheelRot = this.p.x * 1.4;
    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
      wheelRot *= -1;

    const wheelX = [ -57 * this.f,
                     -37 * this.f,
                     -17 * this.f,
                       1 * this.f,
                      20 * this.f,
                      40 * this.f,
                      60 * this.f ];
    var index;
    for( index = 0;index < wheelX.length;index++ )
      this.drawWheel( wheelX[ index ], -8 * this.f, 9 * this.f, wheelRot );

    this.drawWheel( -75 * this.f, -20 * this.f, 12 * this.f, wheelRot * .7 );

    // draw the track.
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
  }

}