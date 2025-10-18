const PageLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="flex max-w-screen-2xl">{children}</div>;
};

export default PageLayout;
