import Navbar from "../_navbar";

const KnownRoutesLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <>
      <div className="fixed h-full p-4">
        <Navbar />
      </div>
      <div className="flex w-full p-4 md:pl-24">{children}</div>
    </>
  );
};

export default KnownRoutesLayout;
