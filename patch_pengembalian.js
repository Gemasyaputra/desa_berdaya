const fs = require('fs');
const path = 'app/dashboard/laporan-keuangan-intervensi/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const buktiPengembalianComponent = `
  const BuktiPengembalianUploader = ({ a, compact = false }: { a: any, compact?: boolean }) => {
    if (!a) return null

    let entries: any[] = []
    if (a.bukti_pengembalian_url) {
      try {
        if (a.bukti_pengembalian_url.trim().startsWith('[')) {
          entries = JSON.parse(a.bukti_pengembalian_url)
        } else {
          entries = []
        }
      } catch {
        entries = []
      }
    }

    if (compact) {
      if (entries.length === 0) {
        return (
          <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
            {!isAdminOrFinance ? (
              <div 
                className="text-[10px] font-black text-rose-500 bg-rose-50 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-rose-100 transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide border border-rose-200"
                onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Refund
              </div>
            ) : (
              <div className="text-[10px] font-bold text-slate-400 py-2.5 px-3 rounded-xl text-center uppercase tracking-wide border border-dashed border-slate-200 bg-white">
                Belum Refund
              </div>
            )}
          </div>
        )
      }

      const hasRejected = entries.some((e: any) => e.ditolak)
      const isVerified = a.status_pengembalian === 'DIVERIFIKASI'
      
      let colorClass = 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
      if (isVerified) {
        colorClass = 'text-[#008784] bg-[#008784]/10 hover:bg-[#008784]/20 border-[#008784]/20'
      }

      return (
        <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
          <div className="relative">
            <div 
              className={\`text-[10px] font-black py-2.5 px-3 rounded-xl cursor-pointer transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide border \${colorClass}\`}
              onClick={(e) => { e.stopPropagation(); setDetailAnggaran(a); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              <FileText className="w-3.5 h-3.5" />
              {entries.length} Bukti Refund
            </div>
            {hasRejected && (
              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse shadow-sm" title="Ada Laporan yang Ditolak!" />
            )}
          </div>
          {(!isAdminOrFinance && !isVerified) && (
            <button
              onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
              className="text-[9px] font-bold text-slate-500 hover:text-[#008784] py-1.5 text-center w-full rounded-lg border border-dashed border-slate-300 hover:bg-[#008784]/5 transition-colors uppercase tracking-widest mt-1"
            >
              + Tambah Refund
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        {entries.length > 0 ? (
          <>
            {entries.map((entry: any) => (
              <div key={entry.id} className={\`bg-slate-50 border rounded-lg p-3 text-left shadow-sm \${entry.ditolak ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100'}\`}>
                {entry.ditolak && (
                  <div className="mb-3 p-2.5 bg-rose-100/50 text-rose-700 text-[10px] rounded border border-rose-200">
                    <span className="font-bold block mb-0.5 uppercase tracking-wide">Ditolak Admin/Finance:</span>
                    <span className="italic leading-tight">{entry.alasan_tolak}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className={\`text-[10px] font-bold truncate min-w-0 \${entry.ditolak ? 'text-rose-700/70 line-through' : 'text-slate-700'}\`} title={entry.deskripsi}>{entry.deskripsi}</div>
                  <div className="flex items-center gap-0.5">
                    {isAdminOrFinance && !entry.ditolak && (
                      <button onClick={(e) => { e.stopPropagation(); setRejectPengDialog({ open: true, anggaranId: a.id, entryId: entry.id }) }} className="text-slate-400 hover:text-amber-500 transition-colors p-1 rounded-md flex-shrink-0" title="Tolak Laporan">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(!isAdminOrFinance && a.status_pengembalian !== 'DIVERIFIKASI') && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePengembalianFoto(a.id, entry.id) }} className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md flex-shrink-0" title="Hapus Laporan Ini">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {entry.nominal !== undefined && (
                  <div className={\`text-[11px] font-black mb-2 border-b pb-1.5 \${entry.ditolak ? 'text-rose-700/70 border-rose-100/50 line-through' : 'text-[#008784] border-emerald-100/50'}\`}>
                    Rp {Number(entry.nominal).toLocaleString('id-ID')}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {entry.urls.map((u: string) => (
                    <div key={u} className="relative group w-10 h-10">
                      {isImage(u) ? (
                        <img src={u} onClick={(e) => { e.stopPropagation(); setPreviewImage(u) }} className="w-full h-full object-cover rounded-md cursor-pointer border border-slate-200" alt="Bukti Refund" />
                      ) : (
                        <a href={u} target="_blank" onClick={(e) => e.stopPropagation()} className="w-full h-full bg-[#008784]/10 text-[#008784] rounded flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      {(!isAdminOrFinance && a.status_pengembalian !== 'DIVERIFIKASI') && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePengembalianFoto(a.id, entry.id, u) }} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="w-3 h-3"/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!isAdminOrFinance && a.status_pengembalian !== 'DIVERIFIKASI') && (
              <button
                onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
                className="text-[10px] font-bold text-slate-500 hover:text-[#008784] py-2 text-center w-full rounded-lg border border-dashed border-slate-300 hover:bg-[#008784]/5 transition-colors uppercase tracking-widest mt-1"
              >
                + Tambah Refund
              </button>
            )}
          </>
        ) : (
          <>
            {!isAdminOrFinance ? (
              <div
                onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
                className="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#008784] hover:bg-[#008784]/5 transition-all text-center flex justify-center cursor-pointer items-center min-h-[80px]"
              >
                {uploadingId === a.id ? <Loader2 className="w-6 h-6 animate-spin text-[#008784]" /> : <Upload className="w-6 h-6 text-slate-300" />}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 text-slate-400 text-xs text-center flex justify-center items-center min-h-[80px] font-bold uppercase tracking-widest">
                Belum Upload
              </div>
            )}
          </>
        )}
      </div>
    )
  }
`;

// Inject BuktiPengembalianUploader just before BuktiCAUploader or after it
if (!content.includes('BuktiPengembalianUploader')) {
  content = content.replace('const BuktiCAUploader = ({ a, compact = false }: { a: any, compact?: boolean }) => {', buktiPengembalianComponent + '\\n\\n  const BuktiCAUploader = ({ a, compact = false }: { a: any, compact?: boolean }) => {');
}

// Mobile Table View: Replace "<BuktiCAUploader a={a} />" with double rendering
content = content.replace('<div className="shrink-0 w-[140px] flex justify-center">\\n                       <BuktiCAUploader a={a} />\\n                    </div>',
  '<div className="shrink-0 w-[140px] flex flex-col gap-4 justify-center">\\n                       <BuktiCAUploader a={a} compact />\\n                       <BuktiPengembalianUploader a={a} compact />\\n                    </div>');

// Desktop Table View headers
content = content.replace('<th className="px-8 py-5 text-center">Status</th>', '<th className="px-8 py-5 text-center">Pengembalian</th>\\n                  <th className="px-8 py-5 text-center">Status</th>');
// Desktop Table View td
content = content.replace('<td className="px-8 py-6 text-center">\\n                      <div className="flex justify-center flex-col items-center gap-2">', '<td className="px-8 py-6 text-center align-top">\\n                      <BuktiPengembalianUploader a={a} compact />\\n                    </td>\\n                    <td className="px-8 py-6 text-center align-top">\\n                      <div className="flex justify-center flex-col items-center gap-2">');

// Delete <BuktiCAUploader a={a} /> inside desktop and use compact=true just in case it doesn't have alignment
content = content.replace('<td className="px-8 py-6 align-top">\\n                      <div className="flex justify-center">\\n                        <BuktiCAUploader a={a} compact />\\n                      </div>\\n                    </td>',
  '<td className="px-8 py-6 align-top">\\n                      <div className="flex justify-center">\\n                        <BuktiCAUploader a={a} compact />\\n                      </div>\\n                    </td>');

// Mobile Verif Button logic
content = content.replace("a.status_ca === 'DIVERIFIKASI' ? 'Diverifikasi' : 'Verif'}", "a.status_ca === 'DIVERIFIKASI' ? 'Diverifikasi CA' : 'Verif CA'}");

// Add Verif Pengembalian Button to Mobile View
const mobileVerifIndex = content.indexOf(`{a.status_ca === 'DIVERIFIKASI' && (\\n                            <Button variant="ghost"`);
if(mobileVerifIndex !== -1 && !content.includes(`handleVerifyPengembalian(a.id, 'DIVERIFIKASI', note)`)) {
  // we add pengembalian verifications just below it.
  content = content.replace(/{isAdminOrFinance && \(\s*<div className="flex gap-1 flex-col">\s*<Button[\s\S]*?<\/div>\s*\)\s*}/g, (match) => {
    return match.replace("</Button>\\n                          {a.status_ca === 'DIVERIFIKASI' && (",
`</Button>
                          {a.bukti_pengembalian_url && (
                             <Button 
                              size="sm" 
                              className={\`h-8 rounded-lg text-[10px] font-bold transition-all \${a.status_pengembalian === 'DIVERIFIKASI' ? 'bg-indigo-50 text-indigo-700 pointer-events-none shadow-none border border-indigo-100' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}\`}
                              onClick={() => {
                                const note = (document.getElementById(\`note-mob-\${a.id}\`) as HTMLTextAreaElement).value
                                handleVerifyPengembalian(a.id, 'DIVERIFIKASI', note)
                              }}
                              disabled={verifyingId === a.id}
                            >
                              {verifyingId === a.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className={\`w-3 h-3 mr-1 \${a.status_pengembalian === 'DIVERIFIKASI' ? 'text-indigo-500' : ''}\`} />} 
                              {a.status_pengembalian === 'DIVERIFIKASI' ? 'Diverifikasi Refund' : 'Verif Refund'}
                            </Button>
                          )}
                          {a.status_ca === 'DIVERIFIKASI' && (`);
  });
}

// Desktop Verif Button logic
if (!content.includes('Verif Refund')) {
   content = content.replace(/{isAdminOrFinance && \(\s*<td className="px-8 py-6 text-center align-top">\s*<div className="flex flex-col gap-2 w-full max-w-\[120px\] mx-auto">[\s\S]*?<\/td>\s*\)\s*}/g, (match) => {
    return match.replace("</Button>\\n                          {a.status_ca === 'DIVERIFIKASI' && (",
    `</Button>
                          {a.bukti_pengembalian_url && (
                             <Button 
                              size="sm" 
                              className={\`h-8 rounded-lg text-[10px] font-bold transition-all \${a.status_pengembalian === 'DIVERIFIKASI' ? 'bg-indigo-50 text-indigo-700 pointer-events-none shadow-none border border-indigo-100' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}\`}
                              onClick={() => {
                                const note = (document.getElementById(\`note-desk-\${a.id}\`) as HTMLTextAreaElement).value
                                handleVerifyPengembalian(a.id, 'DIVERIFIKASI', note)
                              }}
                              disabled={verifyingId === a.id}
                            >
                              {verifyingId === a.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className={\`w-3 h-3 mr-1 \${a.status_pengembalian === 'DIVERIFIKASI' ? 'text-indigo-500' : ''}\`} />} 
                              {a.status_pengembalian === 'DIVERIFIKASI' ? 'Diverifikasi Refund' : 'Verif Refund'}
                            </Button>
                          )}
                          {a.status_ca === 'DIVERIFIKASI' && (`);
   });
}

// Add the two missing Dialogs at the bottom
const dialogs = `
      {/* PENGEMBALIAN UPLOAD DIALOG */}
      <Dialog open={pengUploadDialog.open} onOpenChange={(open) => !open && setPengUploadDialog({ open: false, anggaranId: null })}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white md:rounded-3xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-slate-50 border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Upload className="w-5 h-5 text-[#008784]" />
              Upload Bukti Kembalian
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Deskripsi/Keterangan</label>
              <textarea
                value={pengDeskripsi}
                onChange={e => setPengDeskripsi(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#008784] focus:ring-4 focus:ring-[#008784]/10 transition-all outline-none resize-none min-h-[100px]"
                placeholder="Ex: Kembalian Sisa Kegiatan"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nominal Dikembalikan (Rp)</label>
              <input
                type="number"
                value={pengNominal}
                onChange={e => setPengNominal(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#008784] focus:ring-4 focus:ring-[#008784]/10 transition-all outline-none"
                placeholder="50000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">File/Gambar Bukti (Bisa Pilih Banyak)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={e => setPengFiles(Array.from(e.target.files || []))}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#008784]/10 file:text-[#008784] hover:file:bg-[#008784]/20 transition-all cursor-pointer text-sm text-slate-500"
              />
              {pengFiles.length > 0 && <span className="text-xs font-bold text-[#008784] ml-2 block mt-2">{pengFiles.length} file terpilih</span>}
            </div>
            <Button 
              onClick={handlePengembalianUpload} 
              disabled={uploadingId === pengUploadDialog.anggaranId} 
              className="w-full bg-[#008784] hover:bg-[#007370] text-white py-6 rounded-xl font-bold shadow-lg shadow-[#008784]/20"
            >
              {uploadingId === pengUploadDialog.anggaranId ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
              Upload Kembalian
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* PENGEMBALIAN REJECT DIALOG */}
      <Dialog open={rejectPengDialog.open} onOpenChange={(open) => !open && setRejectPengDialog({ open: false, anggaranId: null, entryId: null })}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white md:rounded-3xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-rose-50 border-b border-rose-100 px-6 py-5">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              Tolak Kembalian
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-700/70 uppercase tracking-widest ml-1">Alasan Penolakan</label>
              <textarea
                value={rejectPengReason}
                onChange={e => setRejectPengReason(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none resize-none min-h-[120px] placeholder:text-rose-200"
                placeholder="Ex: Foto buram, tidak dapat terbaca..."
              />
            </div>
            <Button onClick={handleRejectPengembalian} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-rose-500/20">
              Tolak & Minta Upload Ulang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
`;

content = content.replace('      {/* REJECT DIALOG */}', dialogs + '\\n\\n      {/* REJECT DIALOG */}');

fs.writeFileSync(path, content);
console.log('Successfully injected UI logic for Pengembalian');
