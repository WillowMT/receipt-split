"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Users, ReceiptIcon, Share2, Check, Lock, Unlock, RotateCcw, ChevronDown, Eye } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

interface Person {
  id: string
  name: string
  color: string
}

interface Item {
  id: string
  name: string
  price: number
  sharedBy: string[]
}

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-yellow-500",
  "bg-red-500",
]

const CURRENCIES = [
  { value: "$", label: "$ USD" },
  { value: "€", label: "€ EUR" },
  { value: "£", label: "£ GBP" },
  { value: "¥", label: "¥ JPY" },
  { value: "₹", label: "₹ INR" },
  { value: "₱", label: "₱ PHP" },
  { value: "R$", label: "R$ BRL" },
  { value: "C$", label: "C$ CAD" },
  { value: "A$", label: "A$ AUD" },
  { value: "₩", label: "₩ KRW" },
]

export default function ReceiptSplitter() {
  const [people, setPeople] = useState<Person[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [newPersonName, setNewPersonName] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [tax, setTax] = useState("0")
  const [copied, setCopied] = useState(false)
  const [viewCopied, setViewCopied] = useState(false)
  const [isLoadingShare, setIsLoadingShare] = useState(false)
  const [isLoadingView, setIsLoadingView] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [currency, setCurrency] = useState("$")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dataParam = params.get("data")

    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(dataParam)))
        setPeople(decoded.people || [])
        setItems(decoded.items || [])
        setTax(decoded.tax || "0")
        setIsLocked(decoded.isLocked || false)
        setCurrency(decoded.currency || "$")
      } catch (error) {
        console.error("Failed to load shared receipt:", error)
      }
    }
  }, [])

  const getBaseUrl = () => {
    const origin = window.location.origin
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return "https://receipt.waiyanmt.com"
    }
    return origin
  }

  const generateShareLink = () => {
    const data = {
      people,
      items,
      tax,
      isLocked,
      currency,
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}${window.location.pathname}?data=${encoded}`
    return url
  }

  const generateViewLink = () => {
    const data = {
      people,
      items,
      tax,
      currency,
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    const baseUrl = getBaseUrl()
    const url = `${baseUrl}/view?data=${encoded}`
    return url
  }

  const shortenUrl = async (url: string): Promise<string> => {
    try {
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `https://${url}`
      }
      const response = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`)
      const data = await response.json()
      if (data.shorturl) {
        return data.shorturl
      }
      throw new Error(data.errormessage || "Failed to shorten URL")
    } catch (error) {
      console.error("Failed to shorten URL:", error)
      return url
    }
  }

  const copyShareLink = async () => {
    try {
      setIsLoadingShare(true)
      const link = generateShareLink()
      const shortLink = await shortenUrl(link)
      await navigator.clipboard.writeText(shortLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    } finally {
      setIsLoadingShare(false)
    }
  }

  const copyViewLink = async () => {
    try {
      setIsLoadingView(true)
      const link = generateViewLink()
      const shortLink = await shortenUrl(link)
      await navigator.clipboard.writeText(shortLink)
      setViewCopied(true)
      setTimeout(() => setViewCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy view link:", error)
    } finally {
      setIsLoadingView(false)
    }
  }

  const resetReceipt = () => {
    if (isLocked) return
    setPeople([])
    setItems([])
    setNewPersonName("")
    setNewItemName("")
    setNewItemPrice("")
    setTax("0")
    setCurrency("$")
    setCopied(false)
    setViewCopied(false)
    setIsLoadingShare(false)
    setIsLoadingView(false)

    const url = new URL(window.location.href)
    url.searchParams.delete("data")
    window.history.replaceState({}, document.title, url.toString())
  }

  const addPerson = () => {
    if (isLocked) return
    if (newPersonName.trim()) {
      const newPerson: Person = {
        id: Date.now().toString(),
        name: newPersonName.trim(),
        color: COLORS[people.length % COLORS.length],
      }
      setPeople([...people, newPerson])
      setNewPersonName("")
    }
  }

  const removePerson = (id: string) => {
    if (isLocked) return
    setPeople(people.filter((p) => p.id !== id))
    setItems(
      items.map((item) => ({
        ...item,
        sharedBy: item.sharedBy.filter((personId) => personId !== id),
      })),
    )
  }

  const addItem = () => {
    if (isLocked) return
    if (newItemName.trim() && newItemPrice && !isNaN(Number.parseFloat(newItemPrice))) {
      const newItem: Item = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        price: Number.parseFloat(newItemPrice),
        sharedBy: [],
      }
      setItems([...items, newItem])
      setNewItemName("")
      setNewItemPrice("")
    }
  }

  const removeItem = (id: string) => {
    if (isLocked) return
    setItems(items.filter((item) => item.id !== id))
  }

  const togglePersonForItem = (itemId: string, personId: string) => {
    if (isLocked) return
    setItems(
      items.map((item) => {
        if (item.id === itemId) {
          const sharedBy = item.sharedBy.includes(personId)
            ? item.sharedBy.filter((id) => id !== personId)
            : [...item.sharedBy, personId]
          return { ...item, sharedBy }
        }
        return item
      }),
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const taxAmount = (subtotal * Number.parseFloat(tax || "0")) / 100
  const total = subtotal + taxAmount

  const calculatePersonBreakdown = (personId: string) => {
    const sharedItems = items.filter((item) => item.sharedBy.includes(personId) && item.sharedBy.length > 0)
    const itemShares = sharedItems.map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.price / item.sharedBy.length,
    }))
    const personSubtotal = itemShares.reduce((sum, entry) => sum + entry.amount, 0)
    const personTax = subtotal > 0 ? (personSubtotal / subtotal) * taxAmount : 0

    return {
      items: itemShares,
      personSubtotal,
      personTax,
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <ReceiptIcon className="h-8 w-8" />
            <h1 className="font-sans text-4xl font-bold tracking-tight">Receipt Splitter</h1>
          </div>
          <p className="text-muted-foreground">Split bills fairly among friends</p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => setIsLocked(!isLocked)} variant={isLocked ? "default" : "outline"} className="gap-2">
              {isLocked ? (
                <>
                  <Lock className="h-4 w-4" />
                  Locked
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" />
                  Unlocked
                </>
              )}
            </Button>

            <Select value={currency} onValueChange={setCurrency} disabled={isLocked}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(people.length > 0 || items.length > 0) && (
              <>
                <Button onClick={copyShareLink} variant="outline" className="gap-2 bg-transparent" disabled={isLoadingShare}>
                  {isLoadingShare ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Loading...
                    </>
                  ) : copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share Receipt
                    </>
                  )}
                </Button>
                <Button onClick={copyViewLink} variant="outline" className="gap-2 bg-transparent" disabled={isLoadingView}>
                  {isLoadingView ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Loading...
                    </>
                  ) : viewCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      View Only
                    </>
                  )}
                </Button>
              </>
            )}

            <Button onClick={resetReceipt} variant="destructive" className="gap-2" disabled={isLocked}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - People & Items */}
          <div className="space-y-6">
            {/* Add People */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  People
                </CardTitle>
                <CardDescription>Add everyone who's splitting the bill</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Person's name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPerson()}
                    disabled={isLocked}
                  />
                  <Button onClick={addPerson} size="icon" disabled={isLocked}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => (
                    <Badge key={person.id} variant="secondary" className="gap-2 pr-1">
                      <div className={`h-2 w-2 rounded-full ${person.color}`} />
                      {person.name}
                      {!isLocked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => removePerson(person.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                  {people.length === 0 && <p className="text-sm text-muted-foreground">No people added yet</p>}
                </div>
              </CardContent>
            </Card>

            {/* Add Items */}
            <Card>
              <CardHeader>
                <CardTitle>Receipt Items</CardTitle>
                <CardDescription>Add items from the receipt</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1"
                    disabled={isLocked}
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    className="w-24"
                    disabled={isLocked}
                  />
                  <Button onClick={addItem} size="icon" disabled={isLocked}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {currency}
                            {item.price.toFixed(2)}
                          </div>
                        </div>
                        {!isLocked && (
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {people.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {people.map((person) => (
                            <label key={person.id} className="flex cursor-pointer items-center gap-1.5">
                              <Checkbox
                                checked={item.sharedBy.includes(person.id)}
                                onCheckedChange={() => togglePersonForItem(item.id, person.id)}
                                disabled={isLocked}
                              />
                              <span className="text-sm">{person.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No items added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Tax */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tax (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0"
                    disabled={isLocked}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Total Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {currency}
                    {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({tax}%)</span>
                  <span>
                    {currency}
                    {taxAmount.toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {currency}
                    {total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Per Person Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Per Person</CardTitle>
                <CardDescription>How much each person owes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {people.map((person) => {
                  const breakdown = calculatePersonBreakdown(person.id)
                  const personTotal = breakdown.personSubtotal + breakdown.personTax
                  return (
                    <div key={person.id} className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${person.color}`} />
                          <span className="font-medium">{person.name}</span>
                        </div>
                        <span className="font-mono text-lg font-semibold">
                          {currency}
                          {personTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1">
                              View breakdown
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 space-y-3 p-3">
                            <div className="space-y-2 text-sm">
                              {breakdown.items.length > 0 ? (
                                breakdown.items.map((item) => (
                                  <div key={item.id} className="flex justify-between">
                                    <span>{item.name}</span>
                                    <span className="font-mono">
                                      {currency}
                                      {item.amount.toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-muted-foreground">No items assigned.</p>
                              )}
                            </div>
                            <Separator />
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Tax share</span>
                                <span className="font-mono">
                                  {currency}
                                  {breakdown.personTax.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm font-semibold">
                              <span>Total due</span>
                              <span className="font-mono">
                                {currency}
                                {personTotal.toFixed(2)}
                              </span>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )
                })}
                {people.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">Add people to see breakdown</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
