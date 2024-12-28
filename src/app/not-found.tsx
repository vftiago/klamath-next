import Link from "next/link";

const Custom404 = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center text-2xl">
      <h1>This isn&apos;t the page you&apos;re looking for.</h1>
      <Link href="/">You have to go back.</Link>
    </div>
  );
};

export default Custom404;
