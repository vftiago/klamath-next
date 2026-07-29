const SCENE_START_TIME = performance.now();
const TIME_SPEED = 1;
// wrapped hourly: unbounded time degrades float precision in the shaders during long-lived tabs
const TIME_WRAP_SECONDS = 3600;

export const getSceneTime = () => (((performance.now() - SCENE_START_TIME) / 1000) * TIME_SPEED) % TIME_WRAP_SECONDS;
