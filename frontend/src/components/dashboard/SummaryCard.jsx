// =====================================================
// SummaryCard.jsx
// Kartu summary di bagian atas Dashboard.
// Setiap kartu menampilkan:
//   - Label kecil (ex: "Produk Tersedia")
//   - Icon di sebelah kanan
//   - Angka besar di bawah
//
// Background: rgba(227,194,172,0.35) dengan border #a47352.
// =====================================================

/**
 * Props:
 * - label: judul kartu (string)
 * - value: angka yang ditampilkan (number atau string)
 * - icon: component icon dari lucide-react (passed sebagai komponen)
 *         Contoh: <SummaryCard icon={Package} ... />
 */
export default function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div
      className="rounded-[10px] border border-[#a47352] p-6 h-[130px] flex flex-col justify-between"
      style={{ backgroundColor: 'rgba(227, 194, 172, 0.35)' }}
    >
      {/* Baris atas: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[#A37252] text-[18px] font-medium leading-tight">
          {label}
        </p>
        {Icon && (
          <Icon className="w-12 h-12 text-[#A37252] shrink-0" strokeWidth={1.5} />
        )}
      </div>

      {/* Baris bawah: angka besar */}
      <p className="text-[32px] font-medium text-[#A37252] leading-none">
        {value ?? 0}
      </p>
    </div>
  )
}