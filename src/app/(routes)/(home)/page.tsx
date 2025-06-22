import Link from "next/link";

const HomePage = () => {
  return (
    <div className="flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4 text-3xl">
        <Link className="self-start" href="/projects">
          Projects
        </Link>
        <Link className="self-start" href="/repositories">
          Repositories
        </Link>
        <Link className="self-start" href="/about">
          About
        </Link>
      </div>
      <div className="flex flex-col gap-4 self-end text-right text-3xl">
        <a target="_blank" href="https://dev.to/vftiago">
          Dev.to ↗
        </a>
        <a target="_blank" href="https://www.linkedin.com/in/vftiago/">
          LinkedIn ↗
        </a>
        <a target="_blank" href="https://github.com/vftiago">
          GitHub ↗
        </a>
      </div>
    </div>
  );
};

export default HomePage;
