// constants all in a single object.

export const c =
{
  NUM_CHOPPERS : 3,

  MAX_ALTITUDE : 100,

  // Max velocities.
  MAX_C_X_VEL : 20, // chopper
  MAX_C_Y_VEL : 10,
  MIN_C_Y_VEL : -5,

  MAX_JEEP_VEL    : 10,
  MAX_TRANS1_VEL  :  6,
  MAX_TRANS2_VEL  :  4,
  MAX_TRUCK_VEL   :  8,
  MAX_TANK_VEL    :  4,

  MAX_BOMBER1_VEL  : 19,
  MAX_BOMBER2_VEL  : 12,
  MAX_FIGHTER1_VEL : 22,
  MAX_FIGHTER2_VEL : 28,

  MAX_BULLET_VEL    : 70,
  MAX_MISSILE_A_VEL : 60,
  MAX_MISSILE_B_VEL : 40,

  GRAVITY_TERM_VEL  : 30, // how fast things that are falling reach

  SCREEN_WIDTH  : 1600,
  SCREEN_HEIGHT : 800,
  SCREEN_PAD    : 500, // Smaller saves wasted drawing. Make sure nothing disappears.

  PI : 3.14159,
  EFFECTIVE_ZERO : .001,

  // Think of these in terms of meters maybe
  MIN_WORLD_X : 0,
  MAX_WORLD_X : 1000,
  BASE_LOCATION : 250,
  E_BASE_LOCATION : 750,

  NUM_CHOPPERS          : 3,
  NUM_BUILDINGS         : 20,
  NUM_E_BASE_BUILDINGS  : 5,
  NUM_LEVELS            : 3,

  // World geometry
  HORIZON_DISTANCE : 10000,

  CAM_FOV_X   : 45.0 / 360.0 * 6.2818,
  CAM_FOV_Y   : 30.0 / 360.0 * 6.2818,
  CAM_Z       : 100, // Distance behind projection plane, NOTE: should be negative in theory.

  DISPLAY_CONTROL_TIME : 1000, // How many ms to display the control "stick" position after movement

  BULLET_WAIT_TIME  :  200, // Time until we can fire again.
  BULLET_LIFETIME   : 2000,
  SHOW_SI_TIME      : 2000, // How long to show an enemies structural integrity in ms

  DIR_LEFT : 0, DIR_RIGHT : 1, DIR_FWD : 2,

  // Weapon damage
  WEAPON_DAMAGE_BULLET    :   2.0,
  WEAPON_DAMAGE_MISSLE_A  :  10.0,
  WEAPON_DAMAGE_MISSLE_B  :  30.0,
  WEAPON_DAMAGE_BOMB      : 100.0,

  // Structural integrity, "health"
  SI_CHOPPER    : 20.0, // The player
  SI_JEEP       : 15.0,
  SI_TRUCK      : 15.0,
  SI_TRANSPORT1 : 40.0,
  SI_TRANSPORT2 : 60.0,
  SI_FIGHTER1   : 15.0,
  SI_FIGHTER2   : 10.0,
  SI_BOMBER1    : 70.0,
  SI_BOMBER2    : 30.0,
  SI_BUILDING   : 50.0,
  SI_TANK       : 150.0,

  // points
  POINTS_JEEP       : 5,
  POINTS_TRUCK      : 10,
  POINTS_TRANSPORT  : 15,
  POINTS_TANK       : 50,
  POINTS_BOMBER     : 20,
  POINTS_FIGHTER1   : 30,
  POINTS_FIGHTER2   : 30,
  POINTS_E_BUILDING : 10, // enemy base building.
  POINTS_BUILDING   : 5, // Building that survives the level.

  // Full weapon payload.
  MAX_MISSILE_A     : 20.0, // temp
  MAX_MISSILE_B     : 4.0,
  MAX_BULLETS       : 100.0,
  MAX_BOMBS         : 4.0,

  // Messages to objects
  // From UI to chopper
  MSG_UI            : 0, // a UI messages to main Q sent to chopper for handling.
  MSG_COLLISION_DET : 1, // Collision detected

  MSG_BUILDING_DESTROYED      : 10, // One of our buildings destroyed
  MSG_E_BUILDING_DESTROYED    : 11, // enemy base building destroyed
  MSG_CHOPPER_DESTROYED       : 13,
  MSG_ENEMY_LEFT_BATTLEFIELD  : 15, // destroyed or left due to mission complete
  MSG_MISSION_COMPLETE        : 16,
  MSG_CHOPPER_AT_BASE         : 20,
  MSG_SOLDIERS_TO_CITY        : 21,
  MSG_RESOURCES_AVAIL         : 22, // param A list of Resources
  MSG_CREATE_OBJECT           : 23,
};