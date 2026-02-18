// ─── ProductCard.jsx ──────────────────────────────────────────────
import { Star, ChevronRight, Zap } from 'lucide-react'

export default function ProductCard({ product, onClick, aiSelected = false }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md hover:border-orange-200 transition cursor-pointer relative group">
      {aiSelected && (
        <div className="absolute -top-2 -right-2 bg-[#FF6B00] text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Zap size={9} /> AI Pick
        </div>
      )}
      <div className="text-2xl mb-2">{product.icon || '🛡️'}</div>
      <p className="text-gray-400 text-xs mb-1">{product.type || product.productType}</p>
      <h3 className="font-semibold text-gray-800 text-sm mb-1">{product.name || product.productName}</h3>
      {product.desc && <p className="text-gray-500 text-xs mb-3">{product.desc}</p>}
      {product.reason && <p className="text-gray-400 text-xs mb-3 italic">{product.reason}</p>}
      <div className="flex items-center justify-between">
        <span className="text-[#FF6B00] text-xs flex items-center gap-1">
          <Star size={10} fill="#FF6B00" /> {product.tag || product.urgency || 'Recommended'}
        </span>
        <ChevronRight size={14} className="text-gray-400 group-hover:text-[#FF6B00] transition" />
      </div>
    </div>
  )
}
