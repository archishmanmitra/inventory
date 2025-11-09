import { useEffect, useRef, useState } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Scan } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  disabled?: boolean
}

export default function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If Enter is pressed or value ends with Enter, process immediately
    if (value.includes('\n') || value.length > 10) {
      const cleanBarcode = value.replace(/\n/g, '').trim()
      if (cleanBarcode) {
        onScan(cleanBarcode)
        setBarcode('')
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
      return
    }

    setBarcode(value)

    // Auto-submit after 100ms of no typing (barcode scanners send data quickly)
    timeoutRef.current = setTimeout(() => {
      if (value.trim().length > 0) {
        onScan(value.trim())
        setBarcode('')
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle Enter key
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault()
      onScan(barcode.trim())
      setBarcode('')
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="barcode-scanner" className="flex items-center gap-2">
        <Scan className="h-4 w-4" />
        Barcode Scanner
      </Label>
      <Input
        id="barcode-scanner"
        ref={inputRef}
        type="text"
        placeholder="Scan barcode or type manually..."
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="font-mono"
        autoFocus
      />
      <p className="text-xs text-muted-foreground">
        Connect USB barcode scanner and scan, or type barcode manually
      </p>
    </div>
  )
}

