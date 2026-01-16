import clsx from "clsx";
import type { ReactNode } from "react";
import GlassPanel from "./glass-panel";

type CardBaseProps = {
  children: ReactNode;
  className?: string;
  description?: null | string;
  githubUrl?: null | string;
  homepageUrl?: null | string;
  title: string;
};

const CardBase = ({
  children,
  className,
  description,
  githubUrl,
  homepageUrl,
  title,
}: CardBaseProps) => {
  return (
    <GlassPanel rootClassName={clsx("flex flex-1 flex-col gap-4 p-4 drop-shadow", className)}>
      <div className="flex flex-col gap-1 border-b pb-2 font-barlow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg">{title}</h2>
          {homepageUrl && (
            <a
              aria-label={`${title}'s homepage`}
              className="underline"
              href={homepageUrl}
              rel="noreferrer"
              target="_blank"
            >
              {homepageUrl}
            </a>
          )}
        </div>
        {description && <p className="text-sm">{description}</p>}
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
      {githubUrl && (
        <div className="flex">
          <a
            aria-label={`${title}'s GitHub repository`}
            className="font-barlow underline"
            href={githubUrl}
            rel="noreferrer"
            target="_blank"
          >
            {githubUrl}
          </a>
        </div>
      )}
    </GlassPanel>
  );
};

export default CardBase;
