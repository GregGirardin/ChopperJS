// constants all in a single object.

export const c =
{
  NUM_CHOPPERS : 3,

  WEAPON_NONE : 0,
  WEAPON_SMALL_MISSILE : 1,
  WEAPON_LARGE_MISSILE : 2,
  WEAPON_BOMB : 3,
  WEAPON_BULLET : 4,

  MAX_ALTITUDE : 100,

  MAX_C_X_VEL : 20, // max chopper velocities.
  MAX_C_Y_VEL : 10,
  MIN_C_Y_VEL : -5,

  MAX_JEEP_VEL : 10,
  MAX_TRANS1_VEL : 6,
  MAX_TRANS2_VEL : 4,
  MAX_TRUCK_VEL : 8,
  MAX_TANK_VEL : 4,

  MAX_BOMBER1_VEL : 15,
  MAX_BOMBER2_VEL : 20,
  MAX_FIGHTER1_VEL : 25,
  MAX_FIGHTER1_VEL : 30,

  MAX_BULLET_VEL : 70,
  MAX_MISSILEA_VEL : 40,
  MAX_MISSILEB_VEL : 45,

  GRAVITY_TERM_VEL : 30, // how fast things that are falling reach

  SCREEN_WIDTH : 1600,
  SCREEN_HEIGHT : 800,
  SCREEN_PAD : 500, // Smaller saves wasted drawing. Make sure nothing disappears.

  PI : 3.14159,
  EFFECTIVE_ZERO : .001,

  // Think of these in terms of meters maybe
  MIN_WORLD_X : -50,
  MAX_WORLD_X : 500,

  NUM_CHOPPERS          : 3,
  NUM_CITY_BUILDINGS    : 5,
  NUM_E_BASE_BUILDINGS  : 5,
  NUM_LEVELS            : 5,

  // World geometry
  HORIZON_DISTANCE : 10000,

  CAM_FOV_X   : 45.0 / 360.0 * 6.2818,
  CAM_FOV_Y   : 30.0 / 360.0 * 6.2818,
  CAM_Z       : 100, // Distance behind projection plane, NOTE: should be negative in theory.

  DISPLAY_CONTROL_TIME : 1000, // How many ms to display the control "stick" position after movement

  BULLET_WAIT_TIME  : 200, // ms until we can fire again.
  BULLET_LIFETIME   : 2000, // ms.
  SHOW_SI_COUNT     : 2000, // How long to show an enemies structural integrity in ms

  DIR_LEFT  : 0,
  DIR_RIGHT : 1,
  DIR_FWD   : 2,

  OBJECT_TYPE_WEAPON      :  9, // Weapon I fired
  OBJECT_TYPE_E_WEAPON    : 10, // Weapon enemy fired
  OBJECT_TYPE_E_BUILDING  : 11, // Enemy base
  OBJECT_TYPE_BUILDING    : 12, // city building.

  OBJECT_TYPE_MGR         : 99,

  // weapon damage
  WEAPON_DAMAGE_BULLET    :   1.0,
  WEAPON_DAMAGE_MISSLE_S  :  10.0,
  WEAPON_DAMAGE_MISSLE_L  :  30.0,
  WEAPON_DAMAGE_BOMB      : 100.0,

  WEAPON_DAMAGE_JEEP  :   10.0,
  WEAPON_DAMAGE_T1    :   20.0,
  WEAPON_DAMAGE_T2    :   30.0,
  WEAPON_DAMAGE_TRUCK :   15.0,

  // Structural integrity, "health"
  SI_CHOPPER    : 20.0, // The player

  SI_JEEP       : 15.0,
  SI_TRUCK      : 15.0,
  SI_TRANSPORT1 : 40.0,
  SI_TRANSPORT2 : 60.0,
  SI_TANK       : 150.0,
  SI_FIGHTER1   : 15.0,
  SI_FIGHTER2   : 10.0,
  SI_BOMBER1    : 70.0,
  SI_BOMBER2    : 30.0,
  SI_BUILDING   : 50.0,
  SI_E_BUILDING : 50.0,

  // points
  POINTS_JEEP       : 5,
  POINTS_TRUCK      : 10,
  POINTS_TRANSPORT  : 15,
  POINTS_TANK       : 15,
  POINTS_BOMBER     : 20,
  POINTS_FIGHTER1   : 50,
  POINTS_FIGHTER2   : 100,
  POINTS_E_BUILDING : 10, // enemy base building.
  POINTS_E_BASE     : 50,
  POINTS_BUILDING   : 15, // city buildings not bombed after level complete

  // Full weapon payload.
  MAX_L_MISSILES  :   4.0,
  MAX_S_MISSILES  :  20.0,
  MAX_BULLETS     : 100.0,
  MAX_BOMBS       :   4.0,

  // Resources
  RESOURCE_FIRST : 0,

  RESOURCE_FUEL   : 0,
  RESOURCE_BULLET : 1,
  RESOURCE_SM     : 2, // Small missile
  RESOURCE_LM     : 3,
  RESOURCE_BOMB   : 4,
  RESOURCE_SI     : 5, // Increase structural integrity amount

  RESOURCE_COUNT  : 6,

  // Messages to objects
  // From UI to chopper
  MSG_UI            : 0,// a UI messages to main Q sent to chopper for handling.
  MSG_COLLISION_DET : 1, // Collision detected

  MSG_BUILDING_DESTROYED    : 10, // One of our buildings destroyed
  MSG_E_BUILDING_DESTROYED  : 11, // enemy base building destroyed
  MSG_CHOPPER_DESTROYED     : 13,
  MSG_SPAWNING_COMPLETE     : 14, // all enemies for this level have spawned
  MSG_ENEMY_LEFT_BATTLEFIELD : 15, // destroyed or left due to mission complete
  MSG_MISSION_COMPLETE      : 16,
  MSG_CHOPPER_AT_BASE       : 20,
  MSG_SOLDIERS_TO_CITY      : 21,
  MSG_RESOURCES_AVAIL       : 22, // param A list of Resources
};