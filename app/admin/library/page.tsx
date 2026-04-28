import PageHeader from '../_components/PageHeader'
import { LIBRARY_TEMPLATES } from '../_lib/templates'

export default function StrategyLibraryPage() {
  // Group templates by category
  const groupedTemplates = LIBRARY_TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    },
    {} as Record<string, typeof LIBRARY_TEMPLATES>
  )

  return (
    <div className="p-6 md:p-8 space-y-8">
      <PageHeader
        eyebrow="Content Strategy"
        title="Strategy Library"
        description="Pre-built content templates and messaging frameworks"
      />

      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category}>
          <h3 className="text-lg font-black text-white mb-4">{category}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition cursor-pointer"
              >
                <h4 className="text-white font-bold mb-2">{template.title}</h4>
                <p className="text-sm text-slate-400 mb-4">{template.description}</p>

                <p className="text-xs text-slate-500 mb-3">
                  <strong>Category:</strong> {template.subCategory}
                </p>

                <div className="flex flex-wrap gap-2">
                  {template.hashtags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#C9A25F]/20 text-[#F4E6C5] px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button className="flex-1 bg-[#C9A25F]/20 hover:bg-[#C9A25F]/30 text-[#F4E6C5] text-xs font-semibold py-2 rounded-lg transition">
                    Use Template
                  </button>
                  <button className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold py-2 rounded-lg transition">
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
