import * as React from "react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search } from "lucide-react"

export type FilterGroup = {
  key: string
  title: string
  options: string[]
  selected: string[]
  onChange: (val: string[]) => void
}

export function MultiSelectGroup({ 
  title, 
  groups
}: { 
  title: string, 
  groups: FilterGroup[]
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  
  const totalSelected = groups.reduce((acc, g) => acc + g.selected.length, 0)
  const selectedText = totalSelected === 0 ? title : `${title} (${totalSelected})`

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (!open) setSearchQuery("")
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full lg:w-auto min-w-[180px] justify-between bg-slate-50 border-slate-200 rounded-xl h-[42px] font-normal text-slate-600 hover:bg-slate-100 px-3">
          <span className="truncate font-medium">{selectedText}</span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[260px] max-h-[400px] overflow-hidden flex flex-col p-0" align="start">
        <div className="flex items-center px-3 py-2 border-b border-slate-100 bg-slate-50/50">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder={`Cari...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 focus:ring-0 min-w-0"
          />
        </div>
        <div className="overflow-y-auto flex-1 p-1">
          {groups.map((g, idx) => {
            const filteredOptions = g.options.filter(opt => String(opt).toLowerCase().includes(searchQuery.toLowerCase()))
            
            // Hide section if search is active and no results match this section
            if (filteredOptions.length === 0 && searchQuery) return null

            return (
              <div key={g.key} className="mb-1">
                <div className="px-2 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-white sticky top-0 z-10">
                  {g.title}
                </div>
                {filteredOptions.length === 0 && !searchQuery ? (
                  <div className="py-2 px-2 text-sm text-center text-slate-400">Tidak ada data</div>
                ) : (
                  filteredOptions.map(opt => (
                    <DropdownMenuCheckboxItem
                      key={opt}
                      checked={g.selected.includes(opt)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          g.onChange([...g.selected, opt])
                        } else {
                          g.onChange(g.selected.filter(x => x !== opt))
                        }
                      }}
                      onSelect={(e) => e.preventDefault()}
                    >
                      {opt}
                    </DropdownMenuCheckboxItem>
                  ))
                )}
                {idx < groups.length - 1 && <div className="h-px bg-slate-100 my-1"></div>}
              </div>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
