const KnownRoutesLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return <div className="flex w-full p-4">{children}</div>;
};

export default KnownRoutesLayout;
