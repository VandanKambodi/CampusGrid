function renderFormattedInline(str) {
  if (!str) return null;
  // Regex to match **bold** and http(s):// links
  const parts = str.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s]+)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-gray-900 dark:text-white px-0.5">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="text-cyan-500 underline font-semibold hover:text-cyan-400 break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function FormattedMarkdownText({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-2 text-xs md:text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3: ### Header
        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className="text-sm md:text-base font-black text-cyan-600 dark:text-cyan-400 mt-3 mb-1 flex items-center gap-1.5 border-b border-cyan-500/20 pb-1"
            >
              {renderFormattedInline(trimmed.replace(/^###\s+/, ''))}
            </h3>
          );
        }

        // Header 4: #### Header
        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={idx}
              className="text-xs md:text-sm font-extrabold text-indigo-600 dark:text-indigo-300 mt-2 mb-1"
            >
              {renderFormattedInline(trimmed.replace(/^####\s+/, ''))}
            </h4>
          );
        }

        // Bullet point: • or - or 1.
        if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || /^\d+[\.\)]\s/.test(trimmed)) {
          const content = trimmed.replace(/^([•\-]|(\d+[\.\)]))\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 my-1">
              <span className="text-cyan-500 font-extrabold select-none">•</span>
              <span className="leading-relaxed text-gray-800 dark:text-gray-200">
                {renderFormattedInline(content)}
              </span>
            </div>
          );
        }

        // Standard paragraph line
        return (
          <p key={idx} className="leading-relaxed text-gray-800 dark:text-gray-200">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default FormattedMarkdownText;
