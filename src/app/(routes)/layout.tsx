import RainToggle from "../_shared/ui/rain-toggle";

const KnownRoutesLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <div className="flex w-full p-4">{children}</div>
      <RainToggle />
    </>
  );
};

export default KnownRoutesLayout;
