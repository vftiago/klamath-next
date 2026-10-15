import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import Beacons from "./Beacons/Beacons";
import Billboards from "./Billboards/Billboards";
import Buildings from "./Buildings/Buildings";
import Fog from "./Fog/Fog";
import { generateCity } from "./generate";
import Sky from "./Sky/Sky";

/** Aspect is quantized so small resizes (scrollbars, mobile URL bar) don't regenerate the city. */
const ASPECT_STEP = 0.1;

const City = () => {
  const aspect = useThree((state) => state.viewport.aspect);
  const quantizedAspect = Math.max(0.5, Math.round(aspect / ASPECT_STEP) * ASPECT_STEP);

  const layout = useMemo(() => generateCity(quantizedAspect), [quantizedAspect]);

  // keyed on aspect: a new layout remounts everything so attributes and uniforms are built once per mount
  return (
    <group key={quantizedAspect}>
      <Sky aspect={quantizedAspect} />
      {layout.layers.map((layer) => (
        <Buildings key={layer.index} layer={layer} layout={layout} />
      ))}
      <Billboards layout={layout} />
      <Beacons layout={layout} />
      <Fog layout={layout} />
    </group>
  );
};

export default City;
