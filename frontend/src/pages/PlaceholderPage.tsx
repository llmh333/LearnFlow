export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="text-neutral-500 dark:text-neutral-400">
      <h1 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>
      <p>Coming soon.</p>
    </div>
  )
}
