const HomePageLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex flex-grow">
      <div className="flex w-full p-4 md:pl-20">{children}</div>
    </div>
  );
};

export default HomePageLayout;
