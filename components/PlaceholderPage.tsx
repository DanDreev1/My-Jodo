type PlaceholderPageProps = {
  title: string;
  subtitle?: string;
};

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center opacity-70">
        <h1 className="text-2xl font-semibold mb-2">{title}</h1>
        <p className="text-sm">
          {subtitle ?? "This section is under construction"}
        </p>
      </div>
    </div>
  );
}
