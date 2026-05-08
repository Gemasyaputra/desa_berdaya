'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { getAllLaporanKeuanganLogs } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, ArrowLeft, Search, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MultiSelectGroup } from '@/components/ui/multi-select-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function RiwayatGlobalPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    aksi: [] as string[],
    desa: [] as string[],
    program: [] as string[],
    aktor: [] as string[]
  })

  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getAllLaporanKeuanganLogs()
      setLogs(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filterOptions = useMemo(() => {
    return {
      aksi: Array.from(new Set(logs.map(i => i.action_type))).filter(Boolean).sort() as string[],
      desa: Array.from(new Set(logs.map(i => i.nama_desa))).filter(Boolean).sort() as string[],
      program: Array.from(new Set(logs.map(i => i.nama_program))).filter(Boolean).sort() as string[],
      aktor: Array.from(new Set(logs.map(i => i.actor_name))).filter(Boolean).sort() as string[],
    }
  }, [logs])

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase()
    const matchSearch = !term || (
      (log.nama_program || '').toLowerCase().includes(term) ||
      (log.nama_desa || '').toLowerCase().includes(term) ||
      (log.actor_name || '').toLowerCase().includes(term) ||
      (log.notes || '').toLowerCase().includes(term)
    )

    const matchAksi = filters.aksi.length === 0 || filters.aksi.includes(log.action_type)
    const matchDesa = filters.desa.length === 0 || filters.desa.includes(log.nama_desa)
    const matchProgram = filters.program.length === 0 || filters.program.includes(log.nama_program)
    const matchAktor = filters.aktor.length === 0 || filters.aktor.includes(log.actor_name)

    return matchSearch && matchAksi && matchDesa && matchProgram && matchAktor
  })

  const hasAnyFilter = search !== '' || Object.values(filters).some(arr => arr.length > 0)

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'aksi') val = item.action_type || 'Tanpa Aksi';
      else if (keyType === 'desa') val = item.nama_desa || 'Tanpa Desa';
      else if (keyType === 'program') val = item.nama_program || 'Tanpa Program';
      else if (keyType === 'aktor') val = item.actor_name || 'Tanpa Aktor';
      
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

  const groupedData = useMemo(() => {
    if (groupBys.length === 0) return null;
    return buildGroups(filteredLogs, groupBys);
  }, [filteredLogs, groupBys]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#7a1200]/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <Link 
            href="/dashboard/laporan-keuangan-intervensi"
            className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#7a1200] hover:border-[#7a1200] hover:bg-[#7a1200]/5 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#7a1200]" />
              Riwayat Global Laporan Keuangan
            </h1>
            <p className="text-sm font-bold text-slate-500 mt-1">
              Catatan aktivitas (log) dari seluruh laporan keuangan.
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-64 z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari program, aktor, catatan..."
            className="pl-11 h-11 w-full rounded-2xl border-slate-200 bg-white text-sm shadow-sm focus:border-[#7a1200]/40 focus:ring-4 focus:ring-[#7a1200]/5"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <MultiSelectGroup 
            title="Filter Riwayat"
            groups={[
              { key: 'aksi', title: 'Aksi', options: filterOptions.aksi, selected: filters.aksi, onChange: (val) => setFilters(f => ({ ...f, aksi: val })) },
              { key: 'desa', title: 'Desa', options: filterOptions.desa, selected: filters.desa, onChange: (val) => setFilters(f => ({ ...f, desa: val })) },
              { key: 'program', title: 'Program', options: filterOptions.program, selected: filters.program, onChange: (val) => setFilters(f => ({ ...f, program: val })) },
              { key: 'aktor', title: 'Aktor', options: filterOptions.aktor, selected: filters.aktor, onChange: (val) => setFilters(f => ({ ...f, aktor: val })) },
            ]}
          />
          
          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
              onClick={() => {
                setSearch('')
                setFilters({ aksi: [], desa: [], program: [], aktor: [] })
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value="none"
              onValueChange={(val) => {
                if (val !== 'none' && !groupBys.includes(val)) {
                  setGroupBys(prev => [...prev, val]);
                  setExpandedGroups({});
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl border-slate-200 bg-slate-50">
                <SelectValue placeholder="Tambah Group By..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tambah Group By...</SelectItem>
                <SelectItem value="aksi">Berdasarkan Aksi</SelectItem>
                <SelectItem value="desa">Berdasarkan Desa</SelectItem>
                <SelectItem value="program">Berdasarkan Program</SelectItem>
                <SelectItem value="aktor">Berdasarkan Aktor</SelectItem>
              </SelectContent>
            </Select>
            <FavoriteGroupSelector 
              moduleName="laporan_keuangan_riwayat" 
              currentGroupBys={groupBys} 
              onApplyFavorite={(groups) => {
                setGroupBys(groups)
                setExpandedGroups({})
              }} 
            />
          </div>

          {/* Active Group Bys Row */}
          {groupBys.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center w-full sm:w-auto">
              {groupBys.map((g, idx) => (
                <div key={g} className="flex items-center gap-1">
                  <div className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
                    {g} 
                    <button onClick={() => {
                        setGroupBys(prev => prev.filter(v => v !== g));
                        setExpandedGroups({});
                    }} className="hover:bg-indigo-200 p-0.5 rounded-full transition-colors ml-1 text-indigo-500 hover:text-indigo-900">
                      <X className="w-3 h-3"/>
                    </button>
                  </div>
                  {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardHeader className="border-b border-slate-100/80 bg-white/50 px-6 py-5 md:px-8 md:py-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800">Tabel Riwayat Aktivitas</CardTitle>
          <span className="text-sm font-bold text-[#7a1200] bg-[#7a1200]/10 px-3 py-1 rounded-lg">
            {filteredLogs.length} Data
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-10 h-10 text-[#7a1200] animate-spin" />
               <p className="text-slate-500 font-medium">Memuat data riwayat...</p>
             </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-slate-400 py-16 font-medium">Tidak ada riwayat yang sesuai pencarian.</div>
          ) : (
            <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Aksi</th>
                    <th className="px-6 py-4">Program / Desa</th>
                    <th className="px-6 py-4">Bulan Anggaran</th>
                    <th className="px-6 py-4">Aktor</th>
                    <th className="px-6 py-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const renderDataRow = (log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-500">
                            {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            log.action_type.includes('BATAL') || log.action_type.includes('TOLAK') 
                              ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}>
                            {log.action_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{log.nama_program}</div>
                          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{log.nama_desa}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#7a1200] bg-[#7a1200]/5 px-2.5 py-1 rounded-lg border border-[#7a1200]/10">{log.bulan} {log.tahun}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">{log.actor_name}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{log.actor_role}</div>
                        </td>
                        <td className="px-6 py-4 max-w-[250px] truncate">
                          {log.notes ? (
                            <span className="text-xs text-slate-600 italic bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50" title={log.notes}>"{log.notes}"</span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-300">-</span>
                          )}
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
                            <td colSpan={6} className="px-4 py-3">
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
                            node.children.forEach((a: any) => {
                              rows.push(renderDataRow(a));
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
                      return filteredLogs.map(renderDataRow);
                    }
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
