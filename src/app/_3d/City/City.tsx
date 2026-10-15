import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import Beacon from "./Beacon/Beacon";
import Beacons from "./Beacons/Beacons";
import Billboards from "./Billboards/Billboards";
import Buildings from "./Buildings/Buildings";
import Fog from "./Fog/Fog";
import type { CityLayout } from "./generate";
import { generateCity } from "./generate";
import River from "./River/River";
import Signs from "./Signs/Signs";
import Sky from "./Sky/Sky";
import Stalls from "./Stalls/Stalls";
import type { TextAtlas } from "./text-atlas";
import { createTextAtlas, resolveSignFont } from "./text-atlas";

/** Aspect is quantized so small resizes (scrollbars, mobile URL bar) don't regenerate the city. */
const ASPECT_STEP = 0.1;

/** Every character the layout's signs and billboards use. */
const collectChars = (layout: CityLayout): string[] => {
  const chars = new Set<string>();

  for (const layer of layout.layers) {
    for (const sign of layer.signs) {
      for (const char of sign.text) chars.add(char);
    }
    for (const board of layer.billboards) {
      for (const char of board.text) chars.add(char);
    }
  }

  return [...chars];
};

/**
 * Builds the text atlas for a layout once the page's fonts are ready (the condensed display face comes
 * from next/font and may still be loading on first paint). Signs and billboards mount when it resolves.
 */
const useTextAtlas = (layout: CityLayout): null | TextAtlas => {
  const [atlas, setAtlas] = useState<null | TextAtlas>(null);

  useEffect(() => {
    let cancelled = false;
    let created: null | TextAtlas = null;

    const build = async () => {
      const font = resolveSignFont();
      await document.fonts.ready;
      await document.fonts.load(`700 32px ${font}`).catch(() => undefined);

      if (cancelled) {
        return;
      }

      created = createTextAtlas(collectChars(layout), font);
      setAtlas(created);
    };

    void build();

    return () => {
      cancelled = true;
      created?.texture.dispose();
    };
  }, [layout]);

  return atlas;
};

const City = () => {
  const aspect = useThree((state) => state.viewport.aspect);
  const quantizedAspect = Math.max(0.5, Math.round(aspect / ASPECT_STEP) * ASPECT_STEP);

  const layout = useMemo(() => generateCity(quantizedAspect), [quantizedAspect]);
  const atlas = useTextAtlas(layout);

  // keyed on aspect: a new layout remounts everything so attributes and uniforms are built once per mount
  return (
    <group key={quantizedAspect}>
      <Sky aspect={quantizedAspect} />
      {layout.layers.map((layer) => (
        <Buildings key={layer.index} layer={layer} layout={layout} />
      ))}
      {atlas ? <Billboards atlas={atlas} layout={layout} /> : null}
      {atlas ? <Signs atlas={atlas} layout={layout} /> : null}
      <Beacon layout={layout} />
      <Beacons layout={layout} />
      <Stalls layout={layout} />
      <Fog layout={layout} />
      <River shoreZ={layout.shoreZ} />
    </group>
  );
};

export default City;
