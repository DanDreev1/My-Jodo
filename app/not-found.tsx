export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 opacity-80">
          This page doesn’t exist. Try going back or open the main screen.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-xl px-4 py-2 bg-black text-white"
        >
          Go home
        </a>
      </div>
    </main>
  );
}