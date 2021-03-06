import { c } from './constants.js';
import { Point, projection } from './utils.js';

// Okabes

export class planes
{
  static ticksPerImg = 100;

  static sSheets = 
  {
    Bomber1 : { image : undefined, path : "images/vehicles/Bomber1.png", si : c.SI_BOMBER1, siMax : c.SI_BOMBER1, bombs : 2, damage : 0 },
    Bomber2 : { image : undefined, path : "images/vehicles/Bomber2.gif", si : c.SI_BOMBER2, siMax : c.SI_BOMBER2, bombs : 3, damage : 0 },
    Fighter : { image : undefined, path : "images/vehicles/Fighter.gif", si : c.SI_FIGHTER, siMax : c.SI_FIGHTER, bombs : 0, damage : 0 },
  }

  constructor( e, p, sheet )
  {
    this.e = e;
    this.oType = c.OBJECT_TYPE_JET;
    this.p = new Point( p.x, p.y, p.z );
    this.time = 0;
    this.sheet = sheet;

    if( !spriteSheet.explosion1.image )
    {
      for( const[ k, o ] of Object.entries( spriteSheet.sSheets ) )
      {
        o.image = new Image();
        o.image.src = o.path;
        o.lifeTime = o.hs * o.vs * spriteSheet.ticksPerImg; // just calc once here.
      }
    }
  }

  processMessage( message, param=undefined )
  {
    if( message == c.MSG_COLLISION_DET )
    {
      if( param.oType == c.OBJECT_TYPE_WEAPON )
      {
        this.showSICount = c.SHOW_SI_COUNT;
        this.si -= param.wDamage;
        if( this.si < 0 )
          this.e.addObject( new SpriteSheet( this.e, "Explosion1", this.p ) );
       }
    }
  }

  update( timestamp )
  {
    if( this.si < 0.0 )
    {
      this.e.qMessage( c.MSG_ENEMY_LEFT_BATTLEFIELD, this );
      return false;
    }

    switch( this.oType )
    {
      case c.SI_BOMBER1:
      case c.SI_BOMBER2:
        return bomber_update( timestamp );
        break;

      case c.SI_FIGHTER:
        return fighter_update( timestamp );
        break;
    }
  }
  // specific updates for different types of planes.
  bomber_update( timestamp )
  {
    if( Math.abs( this.p.y - this.target_y ) > .2 )
    {
      if( this.p.y < this.target_y )
        this.p.y += .1;
      else if( this.p.y > this.target_y )
        this.p.y -= .1;
    }
  
    if( this.p.x < MIN_WORLD_X - 50 )
    {
      this.target_y = r&&om.r&&int( 50, 100 );
      this.v = Vector( 0, c.BOMBER1_DELTA );
    }
    else if( this.p.x > c.MAX_WORLD_X + 50 )
    {
      if( e.cityDestroyed )
      {
        e.addStatusMessage( "Bomber Left Theater" );
        e.qMessage( c.MSG_ENEMY_LEFT_BATTLEFIELD, this );
        return False;
      }
      this.target_y = randInt( 15, 25 );
      this.v = new Vector( c.PI, c.BOMBER1_DELTA );
      this.bombs = 1;

    if( !e.time % 10 ) // don't need to do this every cycle.
      if( this.bombs )  // See if there's a target
      {
        let o, index;
        for( index = 0;index < this.e.objects.length;index++ )
        {
          o = this.e.objects[ index ];
          if( o.oType == c.OBJECT_TYPE_BUILDING )
            if( Math.abs( o.p.x - this.p.x ) < 10 )
            {
              e.addObject( new Bomb( this.p, this.v, oType=c.OBJECT_TYPE_E_WEAPON ) );
              this.bombs -= 1;
              break;
            }
        }
      }
    
    this.p.move( this.v )

    return true;
  }

  fighter_update( timestamp )
  {
    if( ( ( this.p.x - e.chopper.p.x ) >  100 && this.v.dx() > 0 ) ||
        ( ( this.p.x - e.chopper.p.x ) < -100 && this.v.dx() < 0 ) )
    {
      this.v.flipx(); // change direction when we get too far
      this.p.y = e.chopper.p.y + randInt( 0, 5 ) + 1; // && get closer to the helo's y
    }

    if( this.p.y < 1 )
      this.p.y = 1;

    if( this.nextMissile > 0 )
      this.nextMissile -= 1;
    else if( this.p.y >= this.target_y ) // time to shoot a missile. Don't shoot while ascending.
      if( ( this.v.dx() > 0 && e.chopper.p.x > this.p.x ) ||
          ( this.v.dx() < 0 && e.chopper.p.x < this.p.x ) ) // only shoot if we're going towards the chopper
      {
        this.v.dx() < 0.0 ? d = DIRECTION_LEFT :  d = DIRECTION_RIGHT;
        e.addObject( new MissileSmall( this.p, this.v, d, oType=c.OBJECT_TYPE_E_WEAPON ) );
        this.nextMissile = 50 + randInt( 0, 100 );
      }
    if( ( ( this.v.dx() > 0 && e.chopper.p.x > this.p.x ) ||
          ( this.v.dx() < 0 && e.chopper.p.x < this.p.x ) )
        && randInt( 0, 10 ) == 0 ) // If jet is behind sometimes try to level with chopper
      this.target_y = e.chopper.p.y + 2;

    this.angleUp = false;

    if( Math.abs( this.p.y - this.target_y ) > .2 )
    {
      if( this.p.y < this.target_y )
      {
        this.p.y += .15;
        this.angleUp = true;
      }
      else if( this.p.y > this.target_y )
        this.p.y -= .15;
    }
    this.p.move( this.v );

    return true;
  }

  draw( p )
  {
    var imgIx = Math.floor( this.time / spriteSheet.ticksPerImg );
    var xOff = ( imgIx % spriteSheet.sSheets[ this.sheet ].hs ) * spriteSheet.sSheets[ this.sheet ].sw;
    var yOff = ( imgIx / spriteSheet.sSheets[ this.sheet ].vs ) * spriteSheet.sSheets[ this.sheet ].sh;

    this.e.ctx.drawImage( spriteSheet.sSheets[ this.sheet ].image,
                          xOff, yOff, // top left of sprite sheet.
                          spriteSheet.sSheets[ this.sheet ].sw, spriteSheet.sSheets[ this.sheet ].sh,
                          p.x, p.y,
                          spriteSheet.sSheets[ this.sheet ].sw, spriteSheet.sSheets[ this.sheet ].sh );
  }
}