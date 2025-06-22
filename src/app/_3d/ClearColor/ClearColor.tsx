import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

const ClearColor = () => {
  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor(0x000, 1.0);
  }, [gl]);

  return null;
};

export default ClearColor;
