import Image from "next/image";

const Logo = ({ size = 64 }: { size?: number }) => {
  return <Image alt="" height={size} src="/logo.svg" width={size} />;
};

export default Logo;
