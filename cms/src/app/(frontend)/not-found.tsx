export default function FrontendNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <h2 className="text-xl font-bold text-slate-800">Sayfa Bulunamadı (404)</h2>
      <p className="text-sm text-slate-600 mt-2">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
      <a href="/" className="mt-4 text-sm font-semibold text-emerald-600 hover:underline">
        Ana Sayfaya Dön
      </a>
    </div>
  )
}
