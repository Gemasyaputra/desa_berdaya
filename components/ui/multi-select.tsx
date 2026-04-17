import * as React from "react"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown, Search } from "lucide-react"

export function MultiSelect({ 
  title, 
  options, 
  selected, 
  onChange 
}: { 
  title: string, 
  options: string[], 
  selected: string[], 
  onChange: (val: string[]) => void 
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const selectedText = selected.length === 0 ? `Semua ${title}` : selected.length === 1 ? selected[0] : `${selected.length} terpilih`

  const filteredOptions = options.filter(opt => String(opt).toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <DropdownMenu onOpenChange={(open) => {
      if (!open) setSearchQuery("")
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full lg:w-auto min-w-[150px] justify-between bg-slate-50 border-slate-200 rounded-xl h-[42px] font-normal text-slate-600 hover:bg-slate-100 px-3">
          <span className="truncate max-w-[130px]">{selectedText}</span>
          <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[220px] max-h-[350px] overflow-hidden flex flex-col p-0" align="start">
        <div className="flex items-center px-3 py-2 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder={`Cari ${title}...`} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-400 focus:ring-0 min-w-0"
          />
        </div>
        <div className="overflow-y-auto flex-1 p-1">
          <DropdownMenuCheckboxItem
            checked={selected.length === 0}
            onCheckedChange={() => onChange([])}
          >
            Semua {title}
          </DropdownMenuCheckboxItem>
          <div className="h-px bg-slate-100 my-1"></div>
          {filteredOptions.length === 0 ? (
            <div className="py-4 px-2 text-sm text-center text-slate-400">Tidak ada hasil</div>
          ) : (
            filteredOptions.map(opt => (
              <DropdownMenuCheckboxItem
                key={opt}
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selected, opt])
                  } else {
                    onChange(selected.filter(x => x !== opt))
                  }
                }}
                onSelect={(e) => e.preventDefault()}
              >
                {opt}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
