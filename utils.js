import { c } from './constants.js';

function distance( x1, y1, x2, y2 )
{
  return Math.sqrt( ( x1 - x2 ) ** 2 + ( y1 - y2 ) ** 2 );
}

export function addAngle( theta, delta )
{
  theta += delta;
  if( theta < -c.PI )
    theta += 2 * c.PI;
  else if( theta > c.PI )
    theta -= 2 * c.PI;
  
  return theta;
}

// given theta, is it facing RIGHT or LEFT?
export function dirFromAngle( theta )
{
  return( ( Math.abs( theta ) < .5 * c.PI ) ? c.DIR_RIGHT : c.DIR_LEFT );
}

// if relative is say 10deg, then if we're facing right theta will be 10deg, if left it'll be 180-10 = 170 deg
export function setRelTheta( theta, relative )
{
  let dir = dirFromAngle( theta );

  theta = ( dir == c.DIR_RIGHT ) ? relative : c.PI - relative;
  theta = addAngle( theta, 0 ); // just for +-PI range bounds

  return( theta );
}

// What's theta relative to 'level'.
// Level is 0 if right, +/i c.PI if going left.
export function getRelTheta( theta )
{
  let dir = dirFromAngle( theta );
  if( dir == c.DIR_RIGHT )
    return theta;
  else
    return( theta > 0 ? c.PI - theta : -( theta + c.PI ) );
}

// What's the angle from t1 to t2? + means t2 CCW from t1, aka t1 + diff = t2
export function angleDiff( t1, t2 )
{
  let diff = t2 - t1;
  if( diff > c.PI )
    diff = 2 * c.PI - diff;
  else if( diff < -c.PI )
    diff = -2 * c.pi - diff + c.PI;

  return diff;
}

//////////////////////////////////////////////////
/////////// Point ////////////////////////////////
//////////////////////////////////////////////////
export class Point
{
  constructor( x=0, y=0, z=0 )
  {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  distanceTo( p )
  {
    return Math.sqrt( ( this.x - p.x ) ** 2 + ( this.y - p.y ) ** 2 + this.z - p.z );
  }

  directionTo( p )
  {
    cx = p.x - this.x;
    cy = p.y - this.y;

    mag = Math.sqrt( cx ** 2 + cy ** 2 );

    if( mag < c.EFFECTIVE_ZERO )
      dir = 0;
    else
      if( Math.abs( cx ) < c.EFFECTIVE_ZERO )
        if( cy > 0 )
          dir = -c.PI / 2;
        else
          dir = c.PI / 2;
      else if( cx > 0 )
        dir = Math.atan( -cy / cx );
      else
        dir = c.PI + Math.atan( -cy / cx );

    return dir;
  }

  move( v )
  {
    this.x += v.xc;
    this.y += v.yc;
  }
}

/////////////////////////////////////////
// Vector ///////////////////////////////
/////////////////////////////////////////
export class Vector
{
  constructor( xc=0, yc=0 ) // x, y components
  {
    this.xc = xc;
    this.yc = yc;
  }

  setPolar( ang, mag ) // angle, magnitude
  {
    this.xc = mag * Math.cos( ang );
    this.yc = mag * Math.sin( ang );
  }

  getPolar() // get polar coords as object
  {
    var mag = Math.sqrt( this.xc ** 2 + this.yc ** 2 );
    var ang = 0;

    if( mag > c.EFFECTIVE_ZERO )
    {
      if( Math.abs( this.xc ) < c.EFFECTIVE_ZERO )
        if( this.yc > 0 )
          ang = c.PI / 2;
        else
          ang = -c.PI / 2;
      else if( this.xc > 0 )
        ang = Math.atan( this.yc / this.xc );
      else
        ang = c.PI + Math.atan( this.yc / this.xc );
    }
    return { a : ang, m : mag };
  }
}

// Given a Camera at Point cam and a point at p, compute the screen coordinates. See projection.jpg
export function projection( cam, p )
{
  const x1 = p.x - cam.x; // translate to camera coords (like p is at 0,0)
  const y1 = p.y - cam.y;
  const zTot = p.z + cam.z; // Distance from camera to the plane p is on

  const thetaX = Math.atan( x1 / zTot );
  const thetaY = Math.atan( y1 / zTot );

  // If camera Z never changes make into constants..
  const projEdgeX = cam.z * Math.tan( c.CAM_FOV_X / 2 ); // X value of edge of screen at proj plane
  const projEdgeY = cam.z * Math.tan( c.CAM_FOV_Y / 2 ); // Y value of edge of screen

  const pProjX = cam.z * Math.tan( thetaX ); // where p is on the projection plane
  const pProjY = cam.z * Math.tan( thetaY );

  const xNorm = pProjX / projEdgeX; // Normalized coords. +1 to -1 mean screen edges
  const yNorm = pProjY / projEdgeY;

  // ( 0, 0 ) is the pixel at ( SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 ). +y is up, so flip y
  const xRaster = ( c.SCREEN_WIDTH  / 2 ) + ( c.SCREEN_WIDTH  / 2 ) * xNorm;
  const yRaster = ( c.SCREEN_HEIGHT / 2 ) - ( c.SCREEN_HEIGHT / 2 ) * yNorm;

  return new Point( xRaster, yRaster, 0 );
}

// See if these two objects have collided. Objects have a Point p indicating
// their world position and a colRect tuple indicating the ( x left, y top, x right, y bottom )
// collision rectangle in relative world coords to p. We assume constant Z and ignore.
// Collision detection is done using screen coordinates since that's the player sees.
// and may not correspond perfectly based on sprite shape.

// returns true of obj's colRect boxes overlap indicating a collision.
export function collisionCheck( obj1, obj2 )
{
  let l1x = obj1.p.x + obj1.colRect[ 0 ];
  let l1y = obj1.p.y + obj1.colRect[ 1 ];
  let r1x = obj1.p.x + obj1.colRect[ 2 ];
  let r1y = obj1.p.y + obj1.colRect[ 3 ];

  let l2x = obj2.p.x + obj2.colRect[ 0 ];
  let l2y = obj2.p.y + obj2.colRect[ 1 ];
  let r2x = obj2.p.x + obj2.colRect[ 2 ];
  let r2y = obj2.p.y + obj2.colRect[ 3 ];

  if( l1x >= r2x || l2x >= r1x || l1y <= r2y || l2y <= r1y )
    return false;

  return true;
}

export function displayColRect( e, o ) // Display the projection of the collision rectangle for debug.
{
  let l1x = o.p.x + o.colRect[ 0 ];
  let l1y = o.p.y + o.colRect[ 1 ];
  let r1x = o.p.x + o.colRect[ 2 ];
  let r1y = o.p.y + o.colRect[ 3 ];

  let p1 = projection( e.camera, new Point( l1x, l1y, o.p.z ) );
  let p2 = projection( e.camera, new Point( r1x, r1y, o.p.z ) );

  e.ctx.strokeStyle = 'orange';
  e.ctx.beginPath();
  e.ctx.moveTo( p1.x, p1.y );
  e.ctx.lineTo( p2.x, p1.y );
  e.ctx.lineTo( p2.x, p2.y );
  e.ctx.lineTo( p1.x, p2.y );
  e.ctx.lineTo( p1.x, p1.y );
  e.ctx.stroke();
}
// Label this object's screen position with a red +
export function drawCoords( e, p )
{
  e.ctx.strokeStyle = 'red';
  e.ctx.beginPath();
  e.ctx.moveTo( p.x - 5, p.y );
  e.ctx.lineTo( p.x + 5, p.y );
  e.ctx.moveTo( p.x, p.y - 5 );
  e.ctx.lineTo( p.x, p.y + 5 );
  e.ctx.stroke();
}

// Horizontal distance to the nearest object of type oType
// + means it's in the +x direction, neg means -x direction
export function distanceToObjectType( e, xPos, oType ) { }

export function showSI( e, p, pct )
{
  e.ctx.fillStyle = 'red';
  e.ctx.beginPath();
  e.ctx.rect( p.x - 50, p.y - 15, 100, 3 );
  e.ctx.fill();

  e.ctx.fillStyle = 'black';
  e.ctx.beginPath();
  e.ctx.rect( p.x - 50, p.y - 15, 100 * pct, 2 );
  e.ctx.fill();
}

export function randInt( min, max )
{
  return Math.floor( Math.random() * ( max - min ) ) + min;
}

var audioFiles = [];

export function playAudio( )
{
  var index;

  var audio = new Audio( './sounds/Chopper1.mp3' );
  audio.play();
}