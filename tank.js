
import { c } from './constants.js';
import { Point, projection, Vector } from './utils.js';

class Tank()
{
  static tankImage;
  static cannonImage;

  constructor( e, p, v=undefined )
  {
    this.e = e;
    this.oType = c.OBJECT_TYPE_TANK;
    //v ? this.v = v : v = new Vector( PI, TANK_DELTA );
    this.p = new Point( p.x, p.y, p.z );
    this.cannonAngle = 0; // 0 - 3
    this.si = this.siMax = c.SI_TANK;
    this.points = c.POINTS_TANK;
    this.showSICount = 0;
    this.state = c.TANK_STATE_MOVE_TO_ATK;
    this.delayCount = 0 // general delay counter
    this.direction = c.DIRECTION_LEFT;
    //this.tankDelta = TANK_DELTA + float( random.randint( 0, 10 ) ) / 100;
    this.wDamage = 0; // it damages by shooting..

    if( !Tank.tankImage )
    {
      Helicopter.tankImage = new Image();
      Helicopter.cannonIage = new Image();

      Helicopter.tankImage.src = "./images/vehicles/Tank.gif";
      Helicopter.cannonImage.src = "./images/vehicles/Cannon.gif";
    }
  }

  update( timestamp )
  {
    if( this.si < 0 )
    {
      e.qMessage( c.MSG_ENEMY_LEFT_BATTLEFIELD, this );
      return False;
    }
    // Behavior / AI
    if( this.e.time % 10 == 0 ) // Don't need to do this every update..
    {
      if( this.state == c.TANK_STATE_MOVE_TO_ATK )
      {
        let dis = distanceToObjectType( this.e, this.p.x, c.OBJECT_TYPE_E_BUILDING )
        if( dis < 20 ) // Guard this building
          this.state = c.TANK_STATE_GUARD;
        else
        {
          dis = distanceToObjectType( this.e, this.p.x, c.OBJECT_TYPE_BUILDING );
          if( !dis ) // No more city buildings ? attack the chopper
            this.state = c.TANK_STATE_ATK_CHOPPER;
          else
          {
            if( dis > 25 )
              this.v = new Vector( 0, this.tankDelta );
            else if( dis < -25 )
              this.v = new Vector( PI, this.tankDelta );
            else
              this.state = c.TANK_STATE_SHELLING;
          }
        }
      }
      else if( this.state == c.TANK_STATE_SHELLING )
      {
        this.v = new Vector( 0, 0 );
        if( this.delayCount <= 0 )
        {
          this.delayCount = 3;
          this.cannonAngle = 0;
          angle = Tank.cannonAngles[ this.cannonAngle ];

          if( this.direction == c.DIRECTION_RIGHT )
            e.addObject( new Bullet( Point( this.p.x + 5, this.p.y + 2, this.p.z ),
                                            new Vector( angle, c.BULLET_DELTA ), oType=c.OBJECT_TYPE_E_WEAPON, wDamage=10 ) );
          else:
            e.addObject( new Bullet( Point( this.p.x - 5, this.p.y + 2, this.p.z ),
                                           new Vector( ( PI - angle ),c.BULLET_DELTA ), oType=c.OBJECT_TYPE_E_WEAPON, wDamage=10 ) );
          this.state = c.TANK_STATE_MOVE_TO_ATK;
        }
        else
          this.delayCount -= 1;
      }
      else if( this.state == c.TANK_STATE_ATK_CHOPPER )
      {
        dis = e.chopper.p.x - this.p.x;
        if( dis > 50 )
          this.v = new Vector( 0, this.tankDelta );
        else if( dis < -50 )
          this.v = new Vector( PI, this.tankDelta );
        else  // Chopper isn't too far. Determine angle and shoot.
        {
          this.v = new Vector( 0, 0 );
          theta = vec_dir( Math.aabs( dis ), self.e.chopper.p.y );
          if( theta > Tank.cannonAngles[ 3 ] )
            this.cannonAngle = 3;
          else if( theta > Tank.cannonAngles[ 2 ] )
            this.cannonAngle = 2;
          else if( theta > Tank.cannonAngles[ 1 ] )
            this.cannonAngle = 1;
          else
            this.cannonAngle = 0;
        }
        dis > 0 ? this.direction = DIRECTION_RIGHT :this.direction = DIRECTION_LEFT;

        let angle = 0; // Tank.cannonAngles[ this.cannonAngle ];
        yOff = [ 2.5, 3, 4, 4 ][ this.cannonAngle ];

        if( this.delayCount <= 0 )
        {
          this.delayCount = 5;

          if( this.direction == c.DIRECTION_RIGHT )
            e.addObject( new Bullet( Point( this.p.x + 6, this.p.y + yOff, this.p.z ),
                                            new Vector( angle, c.BULLET_DELTA ), oType=c.OBJECT_TYPE_E_WEAPON, wDamage=10 ) );
          else
            e.addObject( new Bullet( Point( this.p.x - 6, this.p.y + yOff, this.p.z ),
                                            new Vector( ( this.PI - angle ), c.BULLET_DELTA ), oType=c.OBJECT_TYPE_E_WEAPON, wDamage=10 ) );
        }
        else
          this.delayCount -= 1;
      }
      else if( this.state == c.TANK_STATE_GUARD )
      {
        this.v = new Vector( 0, 0 );
        dis = e.chopper.p.x - this.p.x;
        if( Math.abs( dis ) < 50.0 )
          this.state = c.TANK_STATE_ATK_CHOPPER;
      }
    }
    if( this.v.magnitude > .01 ) // if not moving don't change direction
      this.direction = this.v.dx() > 0 ? DIRECTION_RIGHT : DIRECTION_LEFT;

    this.p.move( this.v );
    return true;
  }

  draw( p )
  {
  }