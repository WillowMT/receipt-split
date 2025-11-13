"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Users, ReceiptIcon, Share2, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

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

export default function ReceiptSplitter() {
  const [people, setPeople] = useState<Person[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [newPersonName, setNewPersonName] = useState("")
  const [newItemName, setNewItemName] = useState("")
  const [newItemPrice, setNewItemPrice] = useState("")
  const [tipPercentage, setTipPercentage] = useState("0")
  const [tax, setTax] = useState("0")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const dataParam = params.get("data")

    if (dataParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(dataParam)))
        setPeople(decoded.people || [])
        setItems(decoded.items || [])
        setTipPercentage(decoded.tipPercentage || "0")
        setTax(decoded.tax || "0")
      } catch (error) {
        console.error("Failed to load shared receipt:", error)
      }
    }
  }, [])

  const generateShareLink = () => {
    const data = {
      people,
      items,
      tipPercentage,
      tax,
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
    const url = `${window.location.origin}${window.location.pathname}?data=${encoded}`
    return url
  }

  const copyShareLink = async () => {
    try {
      const link = generateShareLink()
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const addPerson = () => {
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
    setPeople(people.filter((p) => p.id !== id))
    setItems(
      items.map((item) => ({
        ...item,
        sharedBy: item.sharedBy.filter((personId) => personId !== id),
      })),
    )
  }

  const addItem = () => {
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
    setItems(items.filter((item) => item.id !== id))
  }

  const togglePersonForItem = (itemId: string, personId: string) => {
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
  const tipAmount = ((subtotal + taxAmount) * Number.parseFloat(tipPercentage || "0")) / 100
  const total = subtotal + taxAmount + tipAmount

  const calculatePersonTotal = (personId: string) => {
    let personSubtotal = 0
    items.forEach((item) => {
      if (item.sharedBy.includes(personId) && item.sharedBy.length > 0) {
        personSubtotal += item.price / item.sharedBy.length
      }
    })
    const personTax = (personSubtotal / subtotal) * taxAmount || 0
    const personTip = ((personSubtotal + personTax) / (subtotal + taxAmount)) * tipAmount || 0
    return personSubtotal + personTax + personTip
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

          {(people.length > 0 || items.length > 0) && (
            <div className="mt-4 flex justify-center">
              <Button onClick={copyShareLink} variant="outline" className="gap-2 bg-transparent">
                {copied ? (
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
            </div>
          )}
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
                  />
                  <Button onClick={addPerson} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {people.map((person) => (
                    <Badge key={person.id} variant="secondary" className="gap-2 pr-1">
                      <div className={`h-2 w-2 rounded-full ${person.color}`} />
                      {person.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0"
                        onClick={() => removePerson(person.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
                  />
                  <Input
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    className="w-24"
                  />
                  <Button onClick={addItem} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">${item.price.toFixed(2)}</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {people.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {people.map((person) => (
                            <label key={person.id} className="flex cursor-pointer items-center gap-1.5">
                              <Checkbox
                                checked={item.sharedBy.includes(person.id)}
                                onCheckedChange={() => togglePersonForItem(item.id, person.id)}
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
            {/* Tax & Tip */}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tip (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="1"
                      value={tipPercentage}
                      onChange={(e) => setTipPercentage(e.target.value)}
                      placeholder="0"
                      className="flex-1"
                    />
                    <Button variant="outline" onClick={() => setTipPercentage("15")} size="sm">
                      15%
                    </Button>
                    <Button variant="outline" onClick={() => setTipPercentage("18")} size="sm">
                      18%
                    </Button>
                    <Button variant="outline" onClick={() => setTipPercentage("20")} size="sm">
                      20%
                    </Button>
                  </div>
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
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({tax}%)</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tip ({tipPercentage}%)</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
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
                  const personTotal = calculatePersonTotal(person.id)
                  return (
                    <div key={person.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${person.color}`} />
                        <span className="font-medium">{person.name}</span>
                      </div>
                      <span className="font-mono text-lg font-semibold">${personTotal.toFixed(2)}</span>
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
