type EmptyStateProps = {
  message?: string;
  title: string;
};

const EmptyState = ({ message = "Try another search term", title }: EmptyStateProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl">{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
