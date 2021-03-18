import { c } from './constants.js';

function distance( x1, y1, x2, y2 )
{
  return Math.sqrt( ( x1 - x2 ) ** 2 + ( y1 - y2 ) ** 2 );
}
// given p1, p2, return p3 which is the point dis along the line from p1 to p2
function pointAlong( x1, y1, x2, y2, dis )
{
  dis /= distance( x1, y1, x2, y2 ); // turn distance in units to a fraction
  x3 = x1 + ( x2 - x1 ) * dis;
  y3 = y1 + ( y2 - y1 ) * dis;
  return x3, y3;
}

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

    magnitude = Math.sqrt( cx ** 2 + cy ** 2 );

    if( magnitude < c.EFFECTIVE_ZERO )
      direction = 0;
    else
      if( Math.abs( cx ) < c.EFFECTIVE_ZERO )
        if( cy > 0 )
          direction = -c.PI / 2;
        else
          direction = c.PI / 2;
      else if( cx > 0 )
        direction = Math.atan( -cy / cx );
      else
        direction = c.PI + Math.atan( -cy / cx );
    return direction;
  }

  move( v )
  {
    this.x += v.dx();
    this.y += v.dy();
  }
}

export class Vector
{
  constructor( d, m, maxLen=None )
  {
    this.direction = d; // 0 is right, PI/2 is up, PI is left, -PI/2 is down
    this.magnitude = m;
    this.maxLen = maxLen;
  }
  // Add vector v
  add( v )
  {
    cx = this.dx() + v.dx(); //v.magnitude * Math.cos( v.direction )
    cy = this.dy() + v.dy(); //v.magnitude * Math.sin( v.direction )
    magnitude = Math.sqrt( cx ** 2 + cy ** 2 );
    direction = vec_dir( cx, cy );
    if( this.maxLen )
      if( this.magnitude > this.maxLen )
        this.magnitude = this.maxLen;
    this.magnitude = magnitude;
    this.direction = direction;
  }

  direction()
  {
    return this.direction;
  }

  dx()
  {
    return this.magnitude * Math.cos( this.direction );
  }

  dy()
  {
    return this.magnitude * Math.sin( this.direction );
  }

  flipx()
  {
    this.direction = vec_dir( -this.dx(), this.dy() );
  }

  flipy()
  {
    this.direction = vec_dir( this.dx(), -this.dy() );
  }

  dot( angle )
  {
    theta = Math.abs( this.direction - angle );
    return this.magnitude * Math.cos( theta );
  }
}

export function vecFromComps( dx, dy )
{
  direction = vec_dir( dx, dy );
  magnitude = Math.sqrt( dx ** 2 + dy ** 2 );
  return Vector( direction, magnitude );
}

  // Compute angle of a vector (dx, dy)
function vec_dir( dx, dy )
{
  magnitude = Math.sqrt( dx ** 2 + dy ** 2 );

  if( magnitude < c.EFFECTIVE_ZERO )
    direction = 0;
  else
  {
    if( Math.abs( dx ) < EFFECTIVE_ZERO )
      if( dy > 0 )
        direction = PI / 2;
      else
        direction = -PI / 2;
    else if( dx > 0 )
      direction = Math.atan( dy / dx );
    else
      direction = PI + Math.atan( dy / dx );

  return direction;
  }
}
// Given vectors f and t (from, to) return a vector that would connect f to t
export function vectorDiff( f, t )
{
  dx = t.dx() - f.dx();
  dy = t.dy() - f.dy();

  m = Math.sqrt( dx ** 2 + dy ** 2 );
  d = vec_dir( dx, dy );
  return new Vector( m, d );
}

//Given a Camera at Point cam and a point at p, compute the screen coordinates
//See projection.jpg

export function projection( cam, p )
{
  var x1, y1, zTot, thetaX, thetaY, projEdgeX, projEdgeY;
  var pProjX, pProjY, xNorm, yNorm, xRaster, yRaster
  //assert c.z > 1, "Camera in front of projection plane"

  x1 = p.x - cam.x; // translate to camera coords (like camera is at 0,0)
  y1 = p.y - cam.y;
  zTot = p.z + cam.z; // Distance from camera to the plane p is on

  thetaX = Math.atan( x1 / zTot );
  thetaY = Math.atan( y1 / zTot );

  // If camera Z never changes make into constants..
  projEdgeX = cam.z * Math.tan( c.CAM_FOV_X / 2 ); // X value of edge of screen at proj plane
  projEdgeY = cam.z * Math.tan( c.CAM_FOV_Y / 2 ); // Y value of edge of screen

  pProjX = cam.z * Math.tan( thetaX ); // where p is on the projection plane
  pProjY = cam.z * Math.tan( thetaY );

  xNorm = pProjX / projEdgeX; // Normalized coords. +1 to -1 mean screen edges
  yNorm = pProjY / projEdgeY;

  // ( 0, 0 ) is the pixel at ( SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 ). +y is up, so flip y
  xRaster = ( c.SCREEN_WIDTH  / 2 ) + ( c.SCREEN_WIDTH  / 2 ) * xNorm;
  yRaster = ( c.SCREEN_HEIGHT / 2 ) - ( c.SCREEN_HEIGHT / 2 ) * yNorm;

  return new Point( xRaster, yRaster, 0 );
}
// See if these two objects have collided. Objects have a Point p indicating
// their world position and a colRect tuple indicating the ( x left, y top, x right, y bottom )
// collision rectangle in relative world coords to p. We assume constant Z and ignore.
// Collision detection is done using screen coordinates since that's the player sees.
// and may not correspond perfectly based on sprite shape.

export function collisionCheck( e, obj1, obj2 )
{
}

export function displayColRect( e, o ) // Display the projection of the collision rectangle for debug.
{
}
// Horizontal distance to the nearest object of type oType
// + means it's in the +x direction, neg means -x direction
export function distanceToObjectType( e, xPos, oType )
{
}

export function showSI( c, p, o )
{
  if( o.showSICount > 0 )
  {
  }
}

export class dbgPoint // Debug point
{
  constructor( p )
  {
    this.p = Point( p.x, p.y, p.z );
    this.oType = c.OBJECT_TYPE_NONE;
    this.colRect = ( -1, -1, 1, 1 );
  }

  processMessage( message, param=None )
  {
  }

  update( e )
  {
    return True;
  }

  draw( e )
  {
    proj = projection( e.camera, this.p );
    e.canvas.create_rectangle( proj.x - 1, proj.y - 1, proj.x, proj.y, outline="red" );
  }
}