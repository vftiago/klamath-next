const SCENE_START_TIME = performance.now();
const TIME_SPEED = 1;

export const getSceneTime = () => ((performance.now() - SCENE_START_TIME) / 1000) * TIME_SPEED;
