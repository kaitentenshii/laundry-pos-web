type PageHeadingProps = {
  title: string
  description: string
}

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <header>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">{description}</p>
    </header>
  )
}
