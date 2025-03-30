import Link from "next/link";

const Custom404 = () => {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-2xl">
      <h1>This isn&apos;t the page you&apos;re looking for.</h1>
      <Link href="/">Go back.</Link>
    </div>
  );
};

export default Custom404;
