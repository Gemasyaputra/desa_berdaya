'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, MapPin, Users, Search, Activity, Building2, ChevronRight, ChevronDown, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getDesaBinaanList } from './actions'
import DeleteDesaButton from './DeleteDesaButton'
import { useSession } from 'next-auth/react'
import { MultiSelectFilter } from '@/components/multi-select-filter'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { X } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function DesaBinaanPage() {
  const { data: session } = useSession()
  const [desaList, setDesaList] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    provinsi: [] as string[],
    kota: [] as string[],
    kecamatan: [] as string[],
    relawan: [] as string[],
    status: [] as string[]
  })
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedTableGroups, setExpandedTableGroups] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isKorwil = !!(session?.user as any)?.is_korwil
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const isOffice = (session?.user as any)?.role === 'OFFICE'
  const isAdminOrKorwil = isAdmin || isKorwil
  const isPrivilegedUI = isAdmin || isKorwil

  useEffect(() => {
    getDesaBinaanList()
      .then((data) => { setDesaList(data); setFiltered(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filterOptions = React.useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filters) => {
      return desaList.filter(d => {
        const q = search.toLowerCase()
        const matchesSearch = !q || (
          d.nama_desa?.toLowerCase().includes(q) ||
          d.nama_kecamatan?.toLowerCase().includes(q) ||
          d.nama_kota?.toLowerCase().includes(q) ||
          d.nama_relawan?.toLowerCase().includes(q)
        )

        const matchesProvinsi = excludeKey === 'provinsi' || filters.provinsi.length === 0 || filters.provinsi.includes(d.nama_provinsi)
        const matchesKota = excludeKey === 'kota' || filters.kota.length === 0 || filters.kota.includes(d.nama_kota)
        const matchesKecamatan = excludeKey === 'kecamatan' || filters.kecamatan.length === 0 || filters.kecamatan.includes(d.nama_kecamatan)
        const matchesRelawan = excludeKey === 'relawan' || filters.relawan.length === 0 || filters.relawan.includes(d.nama_relawan)
        
        const statusStr = d.status_aktif ? 'Aktif' : 'Nonaktif'
        const matchesStatus = excludeKey === 'status' || filters.status.length === 0 || filters.status.includes(statusStr)

        return matchesSearch && matchesProvinsi && matchesKota && matchesKecamatan && matchesRelawan && matchesStatus
      })
    }

    return {
      provinsi: Array.from(new Set(getOptions('provinsi').map(d => d.nama_provinsi).filter(Boolean))) as string[],
      kota: Array.from(new Set(getOptions('kota').map(d => d.nama_kota).filter(Boolean))) as string[],
      kecamatan: Array.from(new Set(getOptions('kecamatan').map(d => d.nama_kecamatan).filter(Boolean))) as string[],
      relawan: Array.from(new Set(getOptions('relawan').map(d => d.nama_relawan).filter(Boolean))) as string[],
      status: ['Aktif', 'Nonaktif']
    }
  }, [desaList, search, filters])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      desaList.filter((d) => {
        const matchesSearch = !q || (
          d.nama_desa?.toLowerCase().includes(q) ||
          d.nama_kecamatan?.toLowerCase().includes(q) ||
          d.nama_kota?.toLowerCase().includes(q) ||
          d.nama_relawan?.toLowerCase().includes(q)
        )

        const matchesProvinsi = filters.provinsi.length === 0 || filters.provinsi.includes(d.nama_provinsi)
        const matchesKota = filters.kota.length === 0 || filters.kota.includes(d.nama_kota)
        const matchesKecamatan = filters.kecamatan.length === 0 || filters.kecamatan.includes(d.nama_kecamatan)
        const matchesRelawan = filters.relawan.length === 0 || filters.relawan.includes(d.nama_relawan)
        
        const statusStr = d.status_aktif ? 'Aktif' : 'Nonaktif'
        const matchesStatus = filters.status.length === 0 || filters.status.includes(statusStr)

        return matchesSearch && matchesProvinsi && matchesKota && matchesKecamatan && matchesRelawan && matchesStatus
      })
    )
  }, [search, filters, desaList])

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilters({ provinsi: [], kota: [], kecamatan: [], relawan: [], status: [] })
  }

  const hasAnyFilter = search !== '' || Object.values(filters).some(arr => arr.length > 0)

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'provinsi') val = item.nama_provinsi || 'Tanpa Provinsi';
      else if (keyType === 'kota') val = item.nama_kota || 'Tanpa Kota';
      else if (keyType === 'relawan') val = item.nama_relawan || 'Tanpa Relawan';
      else if (keyType === 'status') val = item.status_aktif ? 'Aktif' : 'Nonaktif';
      
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
    return buildGroups(filtered, groupBys);
  }, [filtered, groupBys]);

  const toggleTableGroup = (path: string) => {
    setExpandedTableGroups(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Desa Binaan</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {mounted && isAdminOrKorwil ? 'Kelola wilayah desa binaan' : 'Desa binaan yang Anda kelola'}
            </p>
          </div>
          {mounted && isPrivilegedUI && (
            <Link href="/dashboard/desa/tambah">
              <Button size="sm" style={{ backgroundColor: '#7a1200' }} className="text-white gap-1 shrink-0">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-3">
        {/* Search */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari desa, kecamatan, relawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 h-[42px] border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]"
            />
          </div>

          <MultiSelectFilter 
            label="Provinsi" 
            options={filterOptions.provinsi} 
            selected={filters.provinsi}
            onSelect={(val) => toggleFilter('provinsi', val)}
            onClear={() => setFilters(f => ({ ...f, provinsi: [] }))}
          />
          <MultiSelectFilter 
            label="Kota/Kab" 
            options={filterOptions.kota} 
            selected={filters.kota}
            onSelect={(val) => toggleFilter('kota', val)}
            onClear={() => setFilters(f => ({ ...f, kota: [] }))}
          />
          <MultiSelectFilter 
            label="Kecamatan" 
            options={filterOptions.kecamatan} 
            selected={filters.kecamatan}
            onSelect={(val) => toggleFilter('kecamatan', val)}
            onClear={() => setFilters(f => ({ ...f, kecamatan: [] }))}
          />
          <MultiSelectFilter 
            label="Relawan" 
            options={filterOptions.relawan} 
            selected={filters.relawan}
            onSelect={(val) => toggleFilter('relawan', val)}
            onClear={() => setFilters(f => ({ ...f, relawan: [] }))}
          />
          <MultiSelectFilter 
            label="Status" 
            options={filterOptions.status} 
            selected={filters.status}
            onSelect={(val) => toggleFilter('status', val)}
            onClear={() => setFilters(f => ({ ...f, status: [] }))}
          />

          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[42px] px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
              onClick={clearFilters}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}

          <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
            <Select value="none" onValueChange={(val) => { 
              if (val !== 'none' && !groupBys.includes(val)) {
                setGroupBys(prev => [...prev, val]);
                setExpandedTableGroups({}); 
              }
            }}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl h-[42px] font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Tambah Group By" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tambah Group By...</SelectItem>
                <SelectItem value="provinsi">Berdasarkan Provinsi</SelectItem>
                <SelectItem value="kota">Berdasarkan Kota</SelectItem>
                <SelectItem value="relawan">Berdasarkan Relawan</SelectItem>
                <SelectItem value="status">Berdasarkan Status</SelectItem>
              </SelectContent>
            </Select>
            <FavoriteGroupSelector 
              moduleName="desa" 
              currentGroupBys={groupBys} 
              onApplyFavorite={(groups) => {
                setGroupBys(groups)
                setExpandedTableGroups({})
              }} 
            />
          </div>
        </div>

        {/* Group By Chips (Desktop Only) */}
        <div className="hidden md:flex">
          {groupBys.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              {groupBys.map((g, idx) => (
                <div key={g} className="flex items-center gap-1">
                  <div className="bg-slate-200 text-slate-700 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
                    {g} 
                    <button onClick={() => {
                        setGroupBys(prev => prev.filter(v => v !== g));
                        setExpandedTableGroups({});
                    }} className="hover:bg-slate-300 p-0.5 rounded-full transition-colors">
                      <X className="w-3 h-3 hover:text-rose-600"/>
                    </button>
                  </div>
                  {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && (
          <p className="text-xs text-slate-400">{filtered.length} desa ditemukan</p>
        )}

        {/* ── MOBILE: Card layout (hidden on md+) ── */}
        <div className="md:hidden space-y-3">
          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {desaList.length === 0
                  ? (isPrivilegedUI ? 'Belum ada desa binaan.' : 'Anda belum ditugaskan ke desa manapun.')
                  : 'Tidak ada hasil yang cocok'}
              </p>
            </div>
          )}

          {!loading && filtered.map((desa) => (
            <div key={desa.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Card body */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 leading-tight">{desa.nama_desa}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Kec. {desa.nama_kecamatan}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-xs font-semibold shrink-0 ${
                    desa.status_aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${desa.status_aktif ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {desa.status_aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{desa.nama_kota}, {desa.nama_provinsi}</span>
                  </div>
                  {desa.nama_relawan && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{desa.nama_relawan}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span>Mulai: {formatDate(desa.tanggal_mulai)}</span>
                  </div>
                </div>
              </div>
              {/* Card footer */}
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2">
                <Link href={`/dashboard/desa/${desa.id}`}>
                  <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50 h-8 text-xs gap-1">
                    Detail <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
                {isPrivilegedUI && (
                  <>
                    <Link href={`/dashboard/desa/${desa.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 h-8 text-xs">Edit</Button>
                    </Link>
                    <DeleteDesaButton id={desa.id} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP: Table layout (hidden below md) ── */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Desa / Kecamatan</th>
                  <th className="px-6 py-4">Wilayah Kota &amp; Provinsi</th>
                  <th className="px-6 py-4">Relawan Bertugas</th>
                  <th className="px-6 py-4">Status &amp; Waktu</th>
                  <th className="px-6 py-4 w-48">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {desaList.length === 0
                      ? (isPrivilegedUI ? 'Belum ada data desa binaan.' : 'Anda belum ditugaskan ke desa manapun.')
                      : 'Tidak ada hasil yang cocok'}
                  </td></tr>
                ) : (() => {
                  const renderDataRow = (desa: any) => (
                    <tr key={desa.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{desa.nama_desa}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Kec. {desa.nama_kecamatan}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {desa.nama_kota}
                        </div>
                        <span className="text-xs text-slate-400 pl-5">{desa.nama_provinsi}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Users className="w-4 h-4 text-slate-400" />
                          {desa.nama_relawan}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <span className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium ${
                            desa.status_aktif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${desa.status_aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                            {desa.status_aktif ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            Mulai: {formatDate(desa.tanggal_mulai)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/dashboard/desa/${desa.id}`}>
                            <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50">Detail</Button>
                          </Link>
                          {isPrivilegedUI && (
                            <>
                              <Link href={`/dashboard/desa/${desa.id}/edit`}>
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                              </Link>
                              <DeleteDesaButton id={desa.id} />
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
                          className="bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                          onClick={() => toggleTableGroup(node.path)}
                        >
                          <td colSpan={5} className="px-6 py-3 sticky left-0 z-20 bg-slate-50/90">
                            <div className="flex items-center gap-2 font-black text-slate-800" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                              {expandedTableGroups[node.path] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              <span className="uppercase tracking-tight">{node.groupName}</span>
                              <div className="bg-slate-200 text-slate-600 ml-1 px-2 py-0.5 rounded text-xs">{node.itemsCount}</div>
                            </div>
                          </td>
                        </tr>
                      );
                      
                      if (expandedTableGroups[node.path]) {
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
                    return filtered.map(renderDataRow);
                  }
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
