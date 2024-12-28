import Navbar from "@/app/_navbar";

const PageLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex h-full max-w-screen-2xl">
      <Navbar />
      <div className="flex w-full p-4 md:pl-20">{children}</div>
    </div>
  );
};

export default PageLayout;
