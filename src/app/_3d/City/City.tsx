import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import Buildings from "./Buildings/Buildings";
import { generateCity } from "./generate";

/** Aspect is quantized so small resizes (scrollbars, mobile URL bar) don't regenerate the city. */
const ASPECT_STEP = 0.1;

const City = () => {
  const aspect = useThree((state) => state.viewport.aspect);
  const quantizedAspect = Math.max(0.5, Math.round(aspect / ASPECT_STEP) * ASPECT_STEP);

  const layout = useMemo(() => generateCity(quantizedAspect), [quantizedAspect]);

  return (
    <group>
      {layout.layers.map((layer) => (
        // keyed on aspect: a new layout remounts the layer so attributes and uniforms are built once per mount
        <Buildings key={`${layer.index}-${quantizedAspect}`} layer={layer} layout={layout} />
      ))}
    </group>
  );
};

export default City;
