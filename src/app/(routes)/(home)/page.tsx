import Link from "next/link";

const HomePage = () => {
  return (
    <div className="flex flex-1 flex-col justify-between p-2 text-2xl">
      <div className="flex flex-col gap-4">
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
      <div className="flex flex-col gap-4 self-end text-right">
        <a href="https://dev.to/vftiago" rel="noreferrer" target="_blank">
          Dev.to ↗
        </a>
        <a href="https://www.linkedin.com/in/vftiago/" rel="noreferrer" target="_blank">
          LinkedIn ↗
        </a>
        <a href="https://github.com/vftiago" rel="noreferrer" target="_blank">
          GitHub ↗
        </a>
      </div>
    </div>
  );
};

export default HomePage;
