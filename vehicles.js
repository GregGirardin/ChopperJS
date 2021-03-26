import { c } from './constants.js';
import { Point, projection, addAngle, dirFromAngle, setRelTheta, getRelTheta, randInt, collisionCheck } from './utils.js';

export class Vehicle
{
  static vehicles =
  {
    Jeep :    {
              image : undefined,
              src : "images/vehicles/Jeep.png",
              si : c.SI_JEEP,
              siMax : c.SI_JEEP,
              damage : 0,
              imgFactor : .5,
              points : c.POINTS_BOMBER,
              spd : c.MAX_JEEP_VEL,
              adjTimeMs : 1000, // average time to recalculate ideal trajectory 
              wheelY : - 5, // all wheel's have the same y
              wheelX : [ -42, 45 ], // array of x positions for each wheel.
              wheelR : 12 // Wheel radius
              },
    Transport1 : {
              image : undefined,
              src : "images/vehicles/Transport1.gif",
              si : c.SI_TRANSPORT1,
              siMax : c.SI_TRANSPORT1,
              damage : 0,
              imgFactor : .5,
              points : c.POINTS_TRANSPORT,
              spd : c.MAX_TRANS1_VEL,
              adjTimeMs : 1000,
              wheelX : [ 60, 20, -28, -65 ], wheelY : -5, wheelR : 16,
              },
    Transport2 : {
              image : undefined,
              src : "images/vehicles/Transport2.gif",
              si : c.SI_TRANSPORT2,
              siMax : c.SI_TRANSPORT2,
              damage : 0,
              imgFactor : .4,
              points : c.POINTS_FIGHTER1,
              spd : c.MAX_TRANS2_VEL,
              adjTimeMs : 3000, 
              wheelX : [ 53, 20, -20, -51 ], wheelY : - 5, wheelR : 14,
              },
    Truck :   {
              image : undefined,
              src : "images/vehicles/Truck1.gif",
              si : c.SI_TRUCK,
              siMax : c.SI_TRUCK,
              damage : 0,
              imgFactor : .4,
              points : c.POINTS_FIGHTER2,
              spd : c.MAX_TRUCK_VEL,
              adjTimeMs : 500, 
              wheelX : [ 72, -23, -60 ], wheelY : - 5, wheelR : 16,
              },
  }

  constructor( e, type, x, dir=c.DIR_LEFT )
  {
    this.e = e;
    this.oType = type;
    this.si = Vehicle.vehicles[ type ].si;
    this.siMax = Vehicle.vehicles[ type ].spd;
    this.imgFactor = Vehicle.vehicles[ type ].imgFactor;
    this.spd = Vehicle.vehicles[ type ].spd;
    this.wheelX = Vehicle.vehicles[ type ].wheelX;
    this.wheelY = Vehicle.vehicles[ type ].wheelY;
    this.wheelR = Vehicle.vehicles[ type ].wheelR;
    this.p = new Point( x, 0, 2 );
    this.showSICount = 0;
    this.bodyAngle = (dir == c.DIR_LEFT) ? c.PI : 0;

    if( !Vehicle.vehicles.Jeep.image )
      for( const[ k, o ] of Object.entries( Vehicle.vehicles ) )
      {
        o.image = new Image();
        o.image.src = o.src;
      }
  }

  processMessage( message, param=undefined )
  {
    if( message == c.MSG_COLLISION_DET )
      if( param.oType == c.OBJECT_TYPE_WEAPON )
      {
        this.showSICount = c.SHOW_SI_COUNT;
        this.si -= param.wDamage;
        if( this.si < 0 )
          this.e.addObject( new SpriteSheet( this.e, "Explosion1", this.p ) );
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

    this.p.x += this.spd * deltaMs / 1000 * Math.cos( this.bodyAngle );

    if( this.p.x < c.MIN_WORLD_X ) // To the left of the theater, turn around.
      this.bodyAngle = 0;
    else if( this.p.x > c.MAX_WORLD_X )
      this.bodyAngle = c.PI;

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
      this.i = Vehicle.vehicles[ this.oType ].image;
      this.w = this.i.width * this.imgFactor;
      this.h = this.i.height * this.imgFactor;
    }

    this.e.ctx.translate( p.x, p.y );
    let theta = this.bodyAngle;
    let wheelRot = this.p.x;

    if( dirFromAngle( this.bodyAngle ) == c.DIR_LEFT )
    {
      wheelRot *= -1;
      this.e.ctx.scale( 1, -1 );
    }
    else
      theta = -theta;

    this.e.ctx.rotate( theta );
    
    var index;
    for( index = 0;index < this.wheelX.length;index++ )
      this.drawWheel( this.wheelX[ index ], this.wheelY, this.wheelR, wheelRot );

    this.e.ctx.drawImage( this.i, -this.w / 2, -this.h, this.w, this.h );

    this.e.ctx.setTransform( 1, 0, 0, 1, 0, 0 );

    const projShadow = projection( this.e.camera, new Point( p.x, 0, 0 ) );
    this.e.ctx.fillStyle = 'black';
    this.e.ctx.beginPath();
    this.e.ctx.ellipse( p.x, projShadow.y, this.w/3, 2, 0, 0, 2 * c.PI )
    this.e.ctx.fill();
  }
}