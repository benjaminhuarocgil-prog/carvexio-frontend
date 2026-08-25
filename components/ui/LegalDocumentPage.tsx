import Link from "next/link";

type LegalBlock = {
  heading?: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalSection = {
  title: string;
  blocks: LegalBlock[];
};

type LegalDocumentPageProps = {
  title: string;
  updatedAt?: string;
  intro: string[];
  sections: LegalSection[];
};

export default function LegalDocumentPage({
  title,
  updatedAt,
  intro,
  sections,
}: LegalDocumentPageProps) {
  return (
    <div className="bg-gray-50 min-h-screen">
      <section className="bg-blue-900 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition text-sm mb-6 group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-1 transition-transform"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al inicio
          </Link>

          <div className="flex items-center justify-center gap-3 mb-3 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
              <path d="M16 13H8" />
              <path d="M16 17H8" />
              <path d="M10 9H8" />
            </svg>
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
          </div>
          {updatedAt && (
            <p className="text-blue-200 text-sm text-center">
              Última actualización: {updatedAt}
            </p>
          )}
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <article className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 space-y-7">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-4 text-sm leading-relaxed text-orange-900 space-y-3">
            {intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <h2 className="text-base font-bold text-blue-900 border-b border-blue-200 pb-2">
                {section.title}
              </h2>

              {section.blocks.map((block, index) => (
                <div key={`${section.title}-${index}`} className="space-y-3">
                  {block.heading && (
                    <h3 className="text-sm font-bold text-gray-900">
                      {block.heading}
                    </h3>
                  )}
                  {block.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-relaxed text-gray-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {block.items && (
                    <ul className="space-y-2 pl-5 text-sm leading-relaxed text-gray-600 list-disc">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </article>
      </main>
    </div>
  );
}
