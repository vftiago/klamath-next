const PageLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex max-w-screen-2xl flex-grow">
      <div className="flex w-full p-4 md:pl-20">{children}</div>
    </div>
  );
};

export default PageLayout;
