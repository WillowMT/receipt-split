"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ReceiptIcon, Users } from "lucide-react"

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

export default function ReceiptView() {
    const [people, setPeople] = useState<Person[]>([])
    const [items, setItems] = useState<Item[]>([])
    const [tax, setTax] = useState("0")
    const [currency, setCurrency] = useState("$")
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const dataParam = params.get("data")

        if (dataParam) {
            try {
                const decoded = JSON.parse(decodeURIComponent(atob(dataParam)))
                setPeople(decoded.people || [])
                setItems(decoded.items || [])
                setTax(decoded.tax || "0")
                setCurrency(decoded.currency || "$")
            } catch (error) {
                console.error("Failed to load receipt data:", error)
            }
        }
        setIsLoading(false)
    }, [])

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
            total: personSubtotal + personTax,
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading receipt...</p>
            </div>
        )
    }

    if (people.length === 0 && items.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">No receipt data found</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl p-4 md:p-8">
                <div className="mb-6 text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                        <ReceiptIcon className="h-6 w-6" />
                        <h1 className="text-2xl font-bold">Receipt</h1>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-4 w-4" />
                            People ({people.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {people.map((person) => (
                                <Badge key={person.id} variant="secondary" className="gap-2">
                                    <div className={`h-2 w-2 rounded-full ${person.color}`} />
                                    {person.name}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {items.map((item) => {
                            const sharedByNames = people
                                .filter((p) => item.sharedBy.includes(p.id))
                                .map((p) => p.name)
                                .join(", ")

                            return (
                                <div key={item.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                                    <div className="flex-1">
                                        <div className="font-medium">{item.name}</div>
                                        {sharedByNames && (
                                            <div className="text-xs text-muted-foreground mt-1">Shared by: {sharedByNames}</div>
                                        )}
                                    </div>
                                    <div className="ml-4 font-mono text-sm">
                                        {currency}
                                        {item.price.toFixed(2)}
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-mono">
                                {currency}
                                {subtotal.toFixed(2)}
                            </span>
                        </div>
                        {Number.parseFloat(tax) > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax ({tax}%)</span>
                                <span className="font-mono">
                                    {currency}
                                    {taxAmount.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span className="font-mono">
                                {currency}
                                {total.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Per Person Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {people.map((person) => {
                            const breakdown = calculatePersonBreakdown(person.id)
                            return (
                                <div key={person.id} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-3 w-3 rounded-full ${person.color}`} />
                                            <span className="font-medium">{person.name}</span>
                                        </div>
                                        <span className="font-mono text-lg font-semibold">
                                            {currency}
                                            {breakdown.total.toFixed(2)}
                                        </span>
                                    </div>
                                    {breakdown.items.length > 0 && (
                                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                            {breakdown.items.map((item) => (
                                                <div key={item.id} className="flex justify-between">
                                                    <span>{item.name}</span>
                                                    <span className="font-mono">
                                                        {currency}
                                                        {item.amount.toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                            {breakdown.personTax > 0 && (
                                                <div className="flex justify-between pt-1">
                                                    <span>Tax share</span>
                                                    <span className="font-mono">
                                                        {currency}
                                                        {breakdown.personTax.toFixed(2)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {breakdown.items.length === 0 && (
                                        <p className="text-xs text-muted-foreground mt-2">No items assigned</p>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

