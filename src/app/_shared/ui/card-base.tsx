import { ReactNode } from "react";
import clsx from "clsx";

import GlassPanel from "./glass-panel";

type CardBaseProps = {
  title: string;
  homepageUrl?: string | null;
  githubUrl?: string | null;
  description?: string | null;
  children: ReactNode;
  className?: string;
};

const CardBase = ({
  title,
  homepageUrl,
  githubUrl,
  description,
  children,
  className,
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
              target="_blank"
              rel="noreferrer"
              href={homepageUrl}
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
            target="_blank"
            rel="noreferrer"
            href={githubUrl}
          >
            {githubUrl}
          </a>
        </div>
      )}
    </GlassPanel>
  );
};

export default CardBase;
