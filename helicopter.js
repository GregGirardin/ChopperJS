import { c } from './constants.js';
import { Point, projection, setRelTheta, getRelTheta, Vector, dirFromAngle } from './utils.js';
import { Missile } from './missiles.js';
import { Explosion } from './explosions.js';

export class Helicopter
{
  static heloForward;
  static heloR;
  static missileA;
  static missileB;
  static bomb;

  constructor( e, x, y, z )
  {
    this.debugCounter = 0;

    this.e = e;
    this.oType = "Chopper";
    this.colRect = [ -2, 3, 2, 0 ];
    this.p = new Point( x, y, z );
    this.rotVertex = new Point();
    this.logVertex = false;
    this.onGround = false;
    this.rotorTheta = 0.0;
    this.v = new Vector(); // velocity
    this.tgtXv = 0;
    this.tgtYv = 0;
    this.bodyAngle = 0; // + means down, left or right. This does not indicate direction
    this.chopperDir = c.DIR_FWD;
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
      Helicopter.heloR        = new Image();
      Helicopter.missileA     = new Image(); // to display inventory.
      Helicopter.missileB     = new Image();
      Helicopter.bomb         = new Image();

      Helicopter.heloForward.src  = "./images/chopper/bodyForward.gif";
      Helicopter.heloR.src        = "./images/chopper/bodyRight.gif";
      Helicopter.missileA.src     = "./images/chopper/missileA.gif";
      Helicopter.missileB.src     = "./images/chopper/missileB.gif";
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
            if( this.p.y > 0 )
            {
              if( this.tgtXv < 0 )
              {
                this.tgtXv += c.MAX_C_X_VEL / 2;
                if( this.tgtXv > 0 )
                  this.tgtXv = 0;
              }
              else if( this.tgtXv == 0 )
              {
                if( this.chopperDir == c.DIR_LEFT )
                  this.chopperDir = c.DIR_FWD;
                else if( this.chopperDir == c.DIR_FWD )
                  this.chopperDir = c.DIR_RIGHT;
                else
                  this.tgtXv += c.MAX_C_X_VEL / 2;
              }
              else
              {
                this.tgtXv += c.MAX_C_X_VEL / 2;
                if( this.tgtXv > c.MAX_C_X_VEL )
                  this.tgtXv = c.MAX_C_X_VEL;
              }

            }
            break;
          
          case "ArrowLeft":
            if( this.p.y > 0 )
            {
              if( this.tgtXv > 0 )
              {
                this.tgtXv -= c.MAX_C_X_VEL / 2;
                if( this.tgtXv < 0 )
                  this.tgtXv = 0;
              }
              else if( this.tgtXv == 0 )
              {
                if( this.chopperDir == c.DIR_RIGHT )
                  this.chopperDir = c.DIR_FWD;
                else if( this.chopperDir == c.DIR_FWD )
                  this.chopperDir = c.DIR_LEFT;
                else
                  this.tgtXv -= c.MAX_C_X_VEL / 2;
              }
              else
              {
                this.tgtXv -= c.MAX_C_X_VEL / 2;
                if( this.tgtXv < -c.MAX_C_X_VEL )
                  this.tgtXv = -c.MAX_C_X_VEL;
              }
            }
            break;

          case "ArrowUp":
            this.tgtYv += c.MAX_C_Y_VEL / 2;
            if( this.tgtYv > c.MAX_C_Y_VEL )
              this.tgtYv = c.MAX_C_Y_VEL;
            break;

          case "ArrowDown":
            this.tgtYv -= c.MAX_C_Y_VEL / 2;
            if( this.tgtYv < c.MIN_Y_VEL )
              this.tgtYv = c.MIN_Y_VEL;
            break;

          case "a":
            this.weapon = "MissileA";
            break;

          case "s":
            this.weapon = "MissileB";
            break;

          case "d":
            this.weapon = "Bomb";
            break;

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

  update( deltaMs )
  {
    if( this.curAmount[ c.RESOURCE_SI ] < 0 )
    {
      this.e.qMessage( c.MSG_CHOPPER_DESTROYED, this );
      return False;
    }

    if( this.weapon )
    {
      let direction = setRelTheta( ( this.chopperDir == c.DIR_RIGHT ) ? 0 : c.PI, this.bodyAngle )

      if( this.chopperDir != c.DIR_FWD || this.weapon == "Bomb" )
        this.e.addObject( new Missile( this.e,
                                       this.weapon,
                                       new Point( this.p.x, this.p.y, 1 ),
                                       direction,
                                       this.v ) );
      this.weapon = undefined;
    }

    if( this.bulletRdyCounter > 0 )
      this.bulletRdyCounter -= deltaMs;

    // Accelerate to target v
    if( this.v.xc < this.tgtXv )
      this.v.xc += deltaMs / 100;
    else if( this.v.xc > this.tgtXv )
      this.v.xc -= deltaMs / 100;
    if( Math.abs( this.v.xc - this.tgtXv ) < .05 )
      this.v.xc = this.tgtXv;

    if( this.v.yc < this.tgtYv )
      this.v.yc += deltaMs / 100;
    else if( this.v.yc > this.tgtYv )
      this.v.yc -= deltaMs / 100;
    if( Math.abs( this.v.yc - this.tgtYv ) < .05 )
      this.v.yc = this.tgtYv;

    // translate
    this.p.y += this.v.yc * deltaMs / 1000;
    this.p.x += this.v.xc * deltaMs / 1000;

    if( this.p.y < 0 )
    {
      this.bodyAngle = setRelTheta( this.bodyAngle, 0 );
      this.tgtXv = 0;
      this.tgtYv = 0;
      this.p.y = 0;
      this.v.xc = 0;
      this.v.yc = 0;
    }

    // figure out angle. + is down' from level. Accel +20deg, maintain dir +10, decel -10, idle 0
    const a20 = -.35; // 20 degres in radians.
    const a10 = -.175;
    let tgtAngle = 0.0;

    if( Math.abs( this.v.xc - this.tgtXv ) < c.EFFECTIVE_ZERO )
    {
      if( Math.abs( this.tgtXv ) > 0)
        tgtAngle = a10; // maintain speed. We're at tgtVel
    }
    else if( this.chopperDir == c.DIR_RIGHT )
      tgtAngle = ( this.v.xc < this.tgtXv ) ? a20 : -a10;
    else if( this.chopperDir == c.DIR_LEFT ) // going left
      tgtAngle = ( this.v.xc > this.tgtXv ) ? a20 : -a10;

    if( this.bodyAngle < tgtAngle - c.EFFECTIVE_ZERO )
      this.bodyAngle += .02; // tbd, adjust for timedelta
    else if( this.bodyAngle > tgtAngle + c.EFFECTIVE_ZERO )
      this.bodyAngle -= .02;

    // Spin the rotors
    let rotorSpeed = 1; // default, slow spin

    if( tgtAngle == a20 )
      rotorSpeed = 3;
    else if( ( tgtAngle == a10 ) || ( this.tgtYv > 0 ) )
      rotorSpeed = 2;
    this.rotorTheta += rotorSpeed * deltaMs / 100;
    if( this.rotorTheta > 2 * c.PI )
      this.rotorTheta -= 2 * c.PI ;
  }

  draw( p )
  {
    var projShadow, hImg,
        xlate = new( Point ); // translation of the objects postion from p

    xlate.x = 0;
    xlate.y = 0;

    hImg = ( this.chopperDir == c.DIR_FWD ) ? Helicopter.heloForward : Helicopter.heloR;

    const w = hImg.width * this.imgFactor;
    const h = hImg.height * this.imgFactor;

    this.rotVertex.y = h * -.22;
    xlate.y = 18;

    if( this.chopperDir == c.DIR_FWD )
      this.rotVertex.x = w * -.012;
    else
    {
      this.rotVertex.x = w * .16;
      xlate.x = -20;
    }

    this.e.ctx.translate( p.x + this.rotVertex.x + xlate.x, p.y + this.rotVertex.y - xlate.y );
    if( this.chopperDir == c.DIR_LEFT )
      this.e.ctx.scale( -1, 1 );

    this.e.ctx.rotate( -this.bodyAngle );
    this.e.ctx.lineWidth = 2;

    // tail rotor. Draw behind body, looks cleaner.
    if( this.chopperDir != c.DIR_FWD )
    {
      this.e.ctx.strokeStyle = 'black';
      this.e.ctx.beginPath();
      let t = this.rotorTheta * 2;
      this.e.ctx.lineWidth = 2;
      this.e.ctx.moveTo( -90 - 10 * Math.cos( t ), -10 - 10 * Math.sin( t ) );
      this.e.ctx.lineTo( -90 + 10 * Math.cos( t ), -10 + 10 * Math.sin( t ) );
      this.e.ctx.stroke();
    }

    this.e.ctx.drawImage( hImg, -w / 2 - this.rotVertex.x, -h / 2 - this.rotVertex.y, w, h );

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
    this.e.ctx.fillStyle = 'black';
    this.e.ctx.beginPath();
    var offset = 0;
    if( this.chopperDir == c.DIR_RIGHT )
      offset = 10;
    else if( this.chopperDir == c.DIR_LEFT )
      offset = -10;
    this.e.ctx.ellipse( p.x + offset, projShadow.y, w/3, 2, 0, 0, 2 * c.PI )
    this.e.ctx.fill();

    // fuel
    // structural integ
    // weapons
  }
}