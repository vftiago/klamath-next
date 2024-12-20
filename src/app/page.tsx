import Link from "next/link";

const RootPage = () => {
  return (
    <div className="flex flex-col gap-4 text-xl">
      <Link href="/blog">Blog</Link>
      <Link href="/repositories">Repositories</Link>
      <Link href="/about">About</Link>
    </div>
  );
};

export default RootPage;
