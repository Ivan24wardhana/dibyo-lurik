// =====================================================
// GrafikPendapatan.jsx
// Bar chart 12 bulan menggunakan Chart.js (via react-chartjs-2).
//
// CATATAN tentang data dari backend:
// - Data berasal dari VIEW v_pendapatan_bulanan di DB.
// - Sumber pendapatan: orders + pre_order_reguler/custom (status='selesai').
// - Backend kirim array 12 angka (Jan-Dec).
// - Untuk role non-owner, backend kirim array 12 nol → bar chart kosong.
//
// Penjelasan singkat tentang Chart.js:
// - Chart.js library untuk render chart di canvas HTML.
// - react-chartjs-2 wrapper React-nya.
// - Kita perlu register module yang dipakai (BarElement, dll)
//   karena Chart.js sengaja modular biar bundle kecil.
// =====================================================

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { formatNumberID } from '../../lib/formatCurrency'

// Register modul Chart.js yang dipakai (wajib sekali di file ini)
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Helper: hitung Y-axis max yang "rapi" (rounded ke kelipatan 10jt).
 *
 * Contoh:
 *   data max = 0       → return 50.000.000 (default)
 *   data max = 7jt     → return 10.000.000
 *   data max = 47jt    → return 50.000.000
 *   data max = 78jt    → return 80.000.000
 *   data max = 234jt   → return 240.000.000
 *
 * Tujuan: bar tidak menyentuh atap chart (kasih ruang ~20% di atas)
 * dan angka di Y-axis selalu kelipatan 10jt biar mudah dibaca.
 */
function calculateYAxisMax(data) {
  const maxValue = Math.max(...data, 0)

  // Kalau semua data 0 (atau kosong), default ke 50jt
  if (maxValue === 0) return 50_000_000

  // Tambah buffer 20% di atas, lalu round ke kelipatan 10jt ke atas
  const withBuffer = maxValue * 1.2
  const roundedToTenMillion = Math.ceil(withBuffer / 10_000_000) * 10_000_000

  return roundedToTenMillion
}

/**
 * Props:
 * - data: array angka 12 elemen (pendapatan per bulan)
 *         Contoh: [40000000, 30000000, 20000000, ...]
 *         Kalau kosong/undefined, otomatis pakai array nol.
 */
export default function GrafikPendapatan({ data = [] }) {
  // Pastikan selalu 12 elemen (pad dengan 0 kalau kurang)
  const safeData = Array.from({ length: 12 }, (_, i) => Number(data[i] ?? 0))

  // Hitung Y-axis max secara dinamis berdasarkan data aktual
  const yAxisMax = calculateYAxisMax(safeData)
  // Step size = max / 5 supaya selalu ada 6 garis horizontal (0, 1/5, 2/5, ..., max)
  const stepSize = yAxisMax / 5

  const chartData = {
    labels: BULAN,
    datasets: [
      {
        label: 'Pendapatan',
        data: safeData,
        backgroundColor: '#a47352',
        borderColor: '#a47352',
        borderRadius: 0,
        barThickness: 40, // lebar bar dalam pixel
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // hide legend (sudah ada judul section)
      tooltip: {
        callbacks: {
          // Saat hover, tampil "Rp 30.000.000,00"
          label: (ctx) => `Rp ${formatNumberID(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#a47352', font: { size: 12 } },
      },
      y: {
        beginAtZero: true,
        max: yAxisMax,           // ← dinamis berdasarkan data
        ticks: {
          stepSize: stepSize,    // ← juga dinamis
          color: '#a47352',
          font: { size: 12 },
          callback: (value) => formatNumberID(value), // "10.000.000,00"
        },
        grid: {
          color: 'rgba(164, 115, 82, 0.2)',
          lineWidth: 1,
        },
      },
    },
  }

  return (
    <div
      className="rounded-[10px] border border-[#a47352] p-6"
      style={{ backgroundColor: 'rgba(227, 194, 172, 0.35)' }}
    >
      <h3 className="text-[#a47352] text-[22px] font-medium mb-4">
        Grafik Pendapatan
      </h3>
      <div className="h-[420px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}