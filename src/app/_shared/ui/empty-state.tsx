type EmptyStateProps = {
  title: string;
  message?: string;
};

const EmptyState = ({ title, message = "Try another search term" }: EmptyStateProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl">{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
