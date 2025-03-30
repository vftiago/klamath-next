import Link from "next/link";

const HomePage = () => {
  return (
    <div className="flex w-full flex-col justify-between text-2xl">
      <div className="flex flex-col gap-4">
        <Link href="/projects">Projects</Link>
        <Link href="/repositories">Repositories</Link>
        <Link href="/about">About</Link>
      </div>
      <div className="flex flex-col gap-4 self-end text-right">
        <a target="_blank" href="https://www.linkedin.com/in/vftiago/">
          LinkedIn
        </a>
        <a target="_blank" href="https://github.com/vftiago">
          GitHub
        </a>
      </div>
    </div>
  );
};

export default HomePage;
