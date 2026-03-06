'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

type PivotRow = {
  label: string
  monthly: {
    month: number
    sum: number
  }[]
}

type PivotSection = {
  title: string
  groups: {
    title: string
    rows: PivotRow[]
  }[]
}

type PivotResponse = {
  success: boolean
  year: number
  months: {
    month: number
    label: string
  }[]
  sections: PivotSection[]
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const monthOptions = [
  { value: '1', label: 'Jan' },
  { value: '2', label: 'Feb' },
  { value: '3', label: 'Mar' },
  { value: '4', label: 'Apr' },
  { value: '5', label: 'Mei' },
  { value: '6', label: 'Jun' },
  { value: '7', label: 'Jul' },
  { value: '8', label: 'Agu' },
  { value: '9', label: 'Sep' },
  { value: '10', label: 'Okt' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Des' },
]

export default function SummaryDashboardPage() {
  const now = new Date()
  const [year, setYear] = useState<number>(now.getFullYear())

  // State untuk tabel pivot SE & Fundraising
  const [loadingTable, setLoadingTable] = useState(false)
  const [tableData, setTableData] = useState<PivotResponse | null>(null)

  const loadTableData = async (options?: { year?: number }) => {
    const y = options?.year ?? year
    setLoadingTable(true)
    try {
      const params = new URLSearchParams({ year: String(y) })
      const res = await fetch(`/api/summary/se-yearly?${params.toString()}`, { cache: 'no-store' })
      const json = (await res.json()) as PivotResponse
      if (!json.success) {
        console.error('Gagal mengambil summary SE yearly', json)
        setTableData(null)
        return
      }
      setTableData(json)
    } catch (error) {
      console.error('Error fetch summary SE:', error)
      setTableData(null)
    } finally {
      setLoadingTable(false)
    }
  }

  useEffect(() => {
    loadTableData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApply = () => {
    const y = year
    loadTableData({ year: y })
  }

  const yearOptions = []
  const baseYear = now.getFullYear()
  for (let offset = -1; offset <= 1; offset++) {
    yearOptions.push(baseYear + offset)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Summary Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Rekap capaian SE Klinik, Ambulance, Fundraising dan grafik capaian SE per klinik langsung dari API Zains.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Tahun" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleApply}
            disabled={loadingTable}
            className="bg-[#7a1200] hover:bg-[#5a0d00] flex items-center gap-2"
          >
            {loadingTable ? (
              <>
                <Spinner className="size-5 text-white" />
                <span>Memuat...</span>
              </>
            ) : (
              'Terapkan'
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          {tableData ? (
            <Card>
              <CardHeader className="bg-emerald-50 border-b border-emerald-100">
                <CardTitle className="text-lg font-semibold">
                  Summary SE &amp; Fundraising{' '}
                  <span className="text-sm font-normal text-slate-500">
                    (Tahun {tableData.year})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                          Keterangan
                        </th>
                        {tableData.months.map((m) => (
                          <th
                            key={m.month}
                            className="px-2 py-2 text-right text-xs font-semibold text-slate-600"
                          >
                            {m.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.sections.map((section) => (
                        <Fragment key={`section-${section.title}`}>
                          <tr>
                            <td
                              className="px-4 py-2 text-xs font-semibold text-slate-700 uppercase tracking-wide bg-emerald-50 border-t border-emerald-100"
                              colSpan={1 + tableData.months.length}
                            >
                              {section.title}
                            </td>
                          </tr>
                          {section.groups.map((group) => (
                            <Fragment key={`group-${section.title}-${group.title || 'default'}`}>
                              {group.title && (
                                <tr>
                                  <td
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50 border-t border-slate-200"
                                    colSpan={1 + tableData.months.length}
                                  >
                                    {group.title}
                                  </td>
                                </tr>
                              )}
                              {group.rows.map((row) => {
                                const isTotal =
                                  row.label.toUpperCase().startsWith('TOTAL') ||
                                  row.label.toUpperCase().includes('GRAND TOTAL')
                                const isGrandTotal = row.label
                                  .toUpperCase()
                                  .includes('GRAND TOTAL')
                                const valueByMonth = new Map<number, number>()
                                row.monthly.forEach((p) => {
                                  valueByMonth.set(p.month, p.sum)
                                })
                                return (
                                  <tr
                                    key={`row-${section.title}-${group.title}-${row.label}`}
                                    className="border-t border-slate-100"
                                  >
                                    <td
                                      className={`px-4 py-2 ${
                                        isTotal ? 'font-semibold text-slate-800' : 'text-slate-700'
                                      }`}
                                    >
                                      {row.label}
                                    </td>
                                    {tableData.months.map((m) => {
                                      const val = valueByMonth.get(m.month) || 0
                                      return (
                                        <td
                                          key={`cell-${section.title}-${group.title}-${row.label}-${m.month}`}
                                          className={`px-2 py-2 text-right tabular-nums ${
                                            isGrandTotal
                                              ? 'font-bold text-emerald-700'
                                              : isTotal
                                                ? 'font-semibold text-slate-800'
                                                : 'text-slate-800'
                                          }`}
                                        >
                                          {formatRupiah(val)}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </Fragment>
                          ))}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : loadingTable ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400 text-sm">
              <Spinner className="size-6 text-[#7a1200]" />
              <span>Memuat data summary...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
              Belum ada data summary yang bisa ditampilkan
            </div>
          )}
        </div>

        {/* Chart SE per bulan disembunyikan sementara */}
        {/* <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Grafik Capaian SE per Bulan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="h-[280px]">
                  {clinicChartData && clinicChartData.labels.length > 0 ? (
                    <Bar data={clinicChartData} options={horizontalBarOptions('Capaian SE per Klinik')} />
                  ) : loadingChart ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 text-sm">
                      <Spinner className="size-6 text-[#7a1200]" />
                      <span>Memuat grafik...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      Tidak ada data grafik
                    </div>
                  )}
                </div>
                <div>
                  {chartData ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="py-2 px-3 text-left font-semibold text-slate-600">
                            Bulan
                          </th>
                          <th className="py-2 px-3 text-right font-semibold text-slate-600">
                            Capaian
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {!chartData.monthly.length ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="py-4 px-3 text-center text-slate-400"
                            >
                              Tidak ada data
                            </td>
                          </tr>
                        ) : (
                          monthOptions.map((m, idx) => {
                            const item = chartData.monthly.find((it) => Number(it.month) === idx + 1)
                            const value = item ? item.sum : 0
                            return (
                              <tr key={m.value} className="border-b border-slate-100">
                                <td className="py-1.5 px-3 text-slate-700">{m.label}</td>
                                <td className="py-1.5 px-3 text-right text-slate-800 tabular-nums">
                                  {formatRupiah(value)}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-300 bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-700">
                            Total Tahun {chartData.year}
                          </td>
                          <td className="py-2 px-3 font-semibold text-right text-slate-900 tabular-nums">
                            {formatRupiah(chartData.grand_total.sum)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : loadingChart ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6 text-slate-400 text-xs">
                      <Spinner className="size-5 text-[#7a1200]" />
                      <span>Memuat ringkasan grafik...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6 text-slate-400 text-xs">
                      Belum ada data grafik yang bisa ditampilkan
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  )
}

