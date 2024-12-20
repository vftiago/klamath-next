import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

const ClearColor = () => {
  const { gl } = useThree();

  useEffect(() => {
    gl.setClearColor(0xeeeeee, 1.1);
  }, [gl]);

  return null;
};

export default ClearColor;
