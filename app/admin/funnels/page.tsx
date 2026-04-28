import PageHeader from '../_components/PageHeader'
import { FUNNEL_BLUEPRINTS } from '../_lib/templates'

export default function LegacyHubPage() {
  return (
    <div className="p-6 md:p-8 space-y-8">
      <PageHeader
        eyebrow="Funnel Strategy"
        title="Legacy Hub"
        description="Pre-built funnel blueprints and conversion strategies"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FUNNEL_BLUEPRINTS.map((funnel) => (
          <div
            key={funnel.id}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition"
          >
            <h4 className="text-white font-bold text-lg mb-2">{funnel.name}</h4>

            <p className="text-sm text-slate-400 mb-4">{funnel.description}</p>

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</p>
                <p className="text-white text-sm">{funnel.category}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Target Persona</p>
                <p className="text-white text-sm">{funnel.persona}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Stages</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {funnel.stages.map((stage, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#C9A25F]/20 text-[#F4E6C5] px-2 py-1 rounded-full"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-[#C9A25F] hover:bg-[#D4AF77] text-slate-900 font-bold text-sm py-2 rounded-lg transition">
                Launch
              </button>
              <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm py-2 rounded-lg transition">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
