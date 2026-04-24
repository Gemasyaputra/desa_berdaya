'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Filter, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectFilterProps {
  label: string
  options: string[]
  selected: string[]
  onSelect: (value: string) => void
  onClear: () => void
  icon?: React.ReactNode
}

export function MultiSelectFilter({ label, options, selected, onSelect, onClear, icon }: MultiSelectFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-[42px] rounded-xl border-slate-200 font-medium text-slate-600 hover:bg-slate-50 gap-2 px-3 transition-all",
            selected.length > 0 && "border-[#7a1200]/30 bg-[#7a1200]/5 text-[#7a1200] hover:bg-[#7a1200]/10"
          )}
        >
          {icon || <Filter className="w-4 h-4 text-slate-400" />}
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 bg-[#7a1200]/10 text-[#7a1200] border-none font-bold text-[10px]">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl border-slate-100 shadow-2xl" align="start">
        <Command className="rounded-2xl">
          <CommandInput placeholder={`Cari ${label.toLowerCase()}...`} className="h-10 border-none focus:ring-0" />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-sm text-slate-400 text-center">Data tidak ditemukan</CommandEmpty>
            <CommandGroup className="p-2">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => onSelect(option)}
                  className="rounded-lg cursor-pointer py-2 px-3 data-[selected=true]:bg-slate-50 group"
                >
                  <div className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded border border-slate-300 transition-colors group-hover:border-[#7a1200]/50",
                    selected.includes(option) ? "bg-[#7a1200] border-[#7a1200]" : "bg-white"
                  )}>
                    {selected.includes(option) && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    selected.includes(option) ? "text-[#7a1200] font-bold" : "text-slate-600"
                  )}>
                    {option}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t border-slate-50 p-2 bg-slate-50/50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg uppercase tracking-wider"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
              >
                Reset {label}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
