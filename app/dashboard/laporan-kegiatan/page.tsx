'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLaporanKegiatan } from './actions'
import DeleteLaporanButton from './DeleteLaporanButton'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { useSearchParams } from 'next/navigation'
import { MultiSelectFilter } from '@/components/multi-select-filter'
import { X, Layers, ChevronDown, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function LaporanKegiatanListContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [laporanList, setLaporanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [filters, setFilters] = useState({
    desa: [] as string[],
    jenis: [] as string[],
    tahun: [] as string[]
  })
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const role = (session?.user as any)?.role
  const canMod = role === 'RELAWAN' || role === 'PROG_HEAD' || role === 'ADMIN' || role === 'KORWIL'

  useEffect(() => {
    getLaporanKegiatan().then((data: any[]) => {
      setLaporanList(data)
      setLoading(false)
    }).catch((err: any) => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString))
  }

  const getEditUrl = (laporan: any) => {
    return `/dashboard/laporan-kegiatan/${laporan.id}/edit`
  }

  const filterOptions = React.useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filters) => {
      return laporanList.filter(item => {
        const q = searchQuery.toLowerCase()
        const matchesSearch = !q || (
          (item.judul_kegiatan || '').toLowerCase().includes(q) ||
          (item.nama_desa || '').toLowerCase().includes(q)
        )

        const matchDesa = excludeKey === 'desa' || filters.desa.length === 0 || filters.desa.includes(item.nama_desa || 'Tanpa Desa')
        const matchJenis = excludeKey === 'jenis' || filters.jenis.length === 0 || filters.jenis.includes(item.jenis_kegiatan || 'Tidak Ada')
        const dateStr = item.tanggal_kegiatan || item.created_at
        const tahunItem = dateStr ? new Date(dateStr).getFullYear().toString() : 'Tanpa Tahun'
        const matchTahun = excludeKey === 'tahun' || filters.tahun.length === 0 || filters.tahun.includes(tahunItem)

        return matchesSearch && matchDesa && matchJenis && matchTahun
      })
    }

    return {
      desa: Array.from(new Set(getOptions('desa').map(i => i.nama_desa || 'Tanpa Desa'))).sort() as string[],
      jenis: Array.from(new Set(getOptions('jenis').map(i => i.jenis_kegiatan || 'Tidak Ada'))).sort() as string[],
      tahun: Array.from(new Set(getOptions('tahun').map(i => {
        const dateStr = i.tanggal_kegiatan || i.created_at
        return dateStr ? new Date(dateStr).getFullYear().toString() : 'Tanpa Tahun'
      }))).sort((a,b) => Number(b) - Number(a)) as string[],
    }
  }, [laporanList, searchQuery, filters])

  const filteredList = React.useMemo(() => {
    return laporanList.filter(item => {
      const q = searchQuery.toLowerCase()
      const matchesSearch = !q || (
        (item.judul_kegiatan || '').toLowerCase().includes(q) ||
        (item.nama_desa || '').toLowerCase().includes(q)
      )

      if (!matchesSearch) return false

      const matchDesa = filters.desa.length === 0 || filters.desa.includes(item.nama_desa || 'Tanpa Desa')
      const matchJenis = filters.jenis.length === 0 || filters.jenis.includes(item.jenis_kegiatan || 'Tidak Ada')
      const dateStr = item.tanggal_kegiatan || item.created_at
      const tahunItem = dateStr ? new Date(dateStr).getFullYear().toString() : 'Tanpa Tahun'
      const matchTahun = filters.tahun.length === 0 || filters.tahun.includes(tahunItem)

      return matchDesa && matchJenis && matchTahun
    })
  }, [laporanList, searchQuery, filters])

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const hasAnyFilter = searchQuery !== '' || Object.values(filters).some(arr => arr.length > 0)

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'desa') val = item.nama_desa || 'Tanpa Desa';
      else if (keyType === 'jenis') val = item.jenis_kegiatan || 'Tidak Ada';
      else if (keyType === 'tahun') {
        const dateStr = item.tanggal_kegiatan || item.created_at;
        val = dateStr ? new Date(dateStr).getFullYear().toString() : 'Tanpa Tahun';
      }
      
      if (!map.has(val)) map.set(val, []);
      map.get(val)!.push(item);
    });

    const groups = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return groups.map(([groupName, items]) => {
      const currentPath = path ? `${path}|${groupName}` : groupName;
      return {
        groupName,
        path: currentPath,
        depth,
        itemsCount: items.length,
        children: buildGroups(items, keys, depth + 1, currentPath),
        isLeaf: depth === keys.length - 1
      };
    });
  };

  const groupedData = React.useMemo(() => {
    if (groupBys.length === 0) return null;
    return buildGroups(filteredList, groupBys);
  }, [filteredList, groupBys]);

  const toggleGroup = (path: string) => {
    setExpandedGroups(prev => ({ ...prev, [path]: !prev[path] }))
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Kegiatan</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar pelaporan realisasi kegiatan di Desa Binaan.</p>
        </div>
        {canMod && (
          <Link href="/dashboard/laporan-kegiatan/tambah">
            <Button className="bg-[#7a1200] hover:bg-[#5a0d00] text-white w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tambah Laporan
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row flex-wrap gap-4 bg-slate-50/50">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari kegiatan, desa..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl h-[42px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
          <MultiSelectFilter 
            label="Desa Binaan" 
            options={filterOptions.desa} 
            selected={filters.desa}
            onSelect={(val) => toggleFilter('desa', val)}
            onClear={() => setFilters(f => ({ ...f, desa: [] }))}
          />
          <MultiSelectFilter 
            label="Jenis Kegiatan" 
            options={filterOptions.jenis} 
            selected={filters.jenis}
            onSelect={(val) => toggleFilter('jenis', val)}
            onClear={() => setFilters(f => ({ ...f, jenis: [] }))}
          />
          <MultiSelectFilter 
            label="Tahun" 
            options={filterOptions.tahun} 
            selected={filters.tahun}
            onSelect={(val) => toggleFilter('tahun', val)}
            onClear={() => setFilters(f => ({ ...f, tahun: [] }))}
          />
          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[42px] px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
              onClick={() => {
                setSearchQuery('')
                setFilters({ desa: [], jenis: [], tahun: [] })
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}

          <div className="flex flex-col gap-2 w-full lg:w-auto ml-auto">
            <Select value="none" onValueChange={(val) => { 
              if (val !== 'none' && !groupBys.includes(val)) {
                setGroupBys(prev => [...prev, val]);
                setExpandedGroups({}); 
              }
            }}>
              <SelectTrigger className="w-full lg:w-[220px] bg-white border-slate-200 rounded-xl h-[42px] font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Tambah Group By..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tambah Group By...</SelectItem>
                <SelectItem value="desa">Berdasarkan Desa</SelectItem>
                <SelectItem value="jenis">Berdasarkan Jenis</SelectItem>
                <SelectItem value="tahun">Berdasarkan Tahun</SelectItem>
              </SelectContent>
            </Select>
            <div className="w-full lg:w-[220px]">
              <FavoriteGroupSelector 
                moduleName="laporan_kegiatan" 
                currentGroupBys={groupBys} 
                onApplyFavorite={(groups) => {
                  setGroupBys(groups)
                  setExpandedGroups({})
                }} 
              />
            </div>
            {groupBys.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                {groupBys.map((g, idx) => (
                  <React.Fragment key={g}>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px] uppercase gap-1 flex items-center pr-1 h-6">
                      {g} 
                      <button onClick={() => {
                          setGroupBys(prev => prev.filter(v => v !== g));
                          setExpandedGroups({});
                      }} className="hover:bg-slate-300 p-0.5 rounded-full transition-colors">
                        <X className="w-3 h-3 hover:text-rose-600"/>
                      </button>
                    </Badge>
                    {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile View: Card Layout */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : (
            filteredList.map((laporan) => (
              <div key={laporan.id} className="p-4 space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 leading-tight mb-1">{laporan.judul_kegiatan}</div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 border-teal-100 px-2 py-0">
                      {laporan.jenis_kegiatan}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase shrink-0 bg-slate-100 px-2 py-1 rounded-md">
                    {formatDate(laporan.tanggal_kegiatan || laporan.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">{laporan.nama_desa}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/dashboard/laporan-kegiatan/${laporan.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-teal-600 border-teal-100 hover:bg-teal-50 rounded-xl font-bold text-[10px] uppercase">
                      Lihat Detail
                    </Button>
                  </Link>
                  {canMod && (
                    <>
                      <Button asChild variant="outline" size="sm" className="text-slate-600 border-slate-100 hover:bg-slate-50 rounded-xl font-bold text-[10px] uppercase">
                        <Link href={getEditUrl(laporan)}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteLaporanButton id={laporan.id} />
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Judul Kegiatan</th>
                <th className="px-6 py-4">Desa Binaan</th>
                <th className="px-6 py-4">Tanggal Aktifitas</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : (
                (() => {
                  const renderDataRow = (laporan: any) => (
                    <tr key={laporan.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{laporan.judul_kegiatan}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{laporan.jenis_kegiatan}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {laporan.nama_desa}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatDate(laporan.tanggal_kegiatan || laporan.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/laporan-kegiatan/${laporan.id}`}>
                            <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-teal-50">
                              Lihat Detail
                            </Button>
                          </Link>
                          {canMod && (
                            <>
                              <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">
                                <Link href={getEditUrl(laporan)}>
                                  Edit
                                </Link>
                              </Button>
                              <DeleteLaporanButton id={laporan.id} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );

                  const renderGroupNodes = (nodes: any[]) => {
                    let rows: React.ReactNode[] = [];
                    nodes.forEach(node => {
                      rows.push(
                        <tr 
                          key={`group-${node.path}`}
                          className="bg-slate-100/50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                          onClick={() => toggleGroup(node.path)}
                        >
                          <td colSpan={4} className="px-6 py-3">
                            <div className="flex items-center gap-2 font-black text-slate-800" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                              {expandedGroups[node.path] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              <span className="uppercase tracking-tight">{node.groupName}</span>
                              <Badge variant="secondary" className="bg-slate-200 text-slate-600 ml-1">{node.itemsCount}</Badge>
                            </div>
                          </td>
                        </tr>
                      );
                      
                      if (expandedGroups[node.path]) {
                        if (node.isLeaf) {
                          node.children.forEach((row: any) => {
                            rows.push(renderDataRow(row));
                          });
                        } else {
                          rows.push(...renderGroupNodes(node.children));
                        }
                      }
                    });
                    return rows;
                  };

                  if (groupedData) {
                    return renderGroupNodes(groupedData);
                  } else {
                    return filteredList.map(renderDataRow);
                  }
                })()
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredList.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            Belum ada data laporan kegiatan yang terdaftar atau sesuai filter.
          </div>
        )}
      </div>
    </div>
  )
}

export default function LaporanKegiatanListPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat halaman...</div>}>
      <LaporanKegiatanListContent />
    </Suspense>
  )
}
