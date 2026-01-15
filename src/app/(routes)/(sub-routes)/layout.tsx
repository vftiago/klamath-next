const PageLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="flex w-full max-w-screen-2xl">{children}</div>;
};

export default PageLayout;
