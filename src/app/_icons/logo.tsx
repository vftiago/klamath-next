import Image from "next/image";

const Logo = ({ size = 64 }: { size?: number }) => {
  return <Image alt="" src="/logo.svg" width={size} height={size} />;
};

export default Logo;
