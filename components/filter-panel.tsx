"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState } from "react"

interface FilterState {
  action: string
  product: string[]
  actor: string[]
  from: string
  to: string
  ip: string[]
}

interface FilterPanelProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  orgId: string // Declare orgId as a prop
}

export function FilterPanel({ filters, onFiltersChange, orgId }: FilterPanelProps) {
  const [newProduct, setNewProduct] = useState("")
  const [newActor, setNewActor] = useState("")
  const [newIp, setNewIp] = useState("")

  const addProduct = () => {
    if (newProduct && !filters.product.includes(newProduct)) {
      onFiltersChange({
        ...filters,
        product: [...filters.product, newProduct],
      })
      setNewProduct("")
    }
  }

  const removeProduct = (product: string) => {
    onFiltersChange({
      ...filters,
      product: filters.product.filter((p) => p !== product),
    })
  }

  const addActor = () => {
    if (newActor && !filters.actor.includes(newActor)) {
      onFiltersChange({
        ...filters,
        actor: [...filters.actor, newActor],
      })
      setNewActor("")
    }
  }

  const removeActor = (actor: string) => {
    onFiltersChange({
      ...filters,
      actor: filters.actor.filter((a) => a !== actor),
    })
  }

  const addIp = () => {
    if (newIp && !filters.ip.includes(newIp)) {
      onFiltersChange({
        ...filters,
        ip: [...filters.ip, newIp],
      })
      setNewIp("")
    }
  }

  const removeIp = (ip: string) => {
    onFiltersChange({
      ...filters,
      ip: filters.ip.filter((i) => i !== ip),
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      action: "",
      product: [],
      actor: [],
      from: "",
      to: "",
      ip: [],
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Event Filters</h3>
        <Button variant="outline" onClick={clearAllFilters}>
          Clear All Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Action Filter */}
        <div className="space-y-2">
          <Label htmlFor="action">Action Filter</Label>
          <Input
            id="action"
            placeholder="e.g., admin.privilege, policy, login"
            value={filters.action}
            onChange={(e) => onFiltersChange({ ...filters, action: e.target.value })}
          />
          <p className="text-sm text-gray-500">Filter events by action type (partial match)</p>
        </div>

        {/* Time Range */}
        <div className="space-y-2">
          <Label>Time Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="from" className="text-xs">
                From
              </Label>
              <Input
                id="from"
                type="datetime-local"
                value={filters.from}
                onChange={(e) => onFiltersChange({ ...filters, from: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="to" className="text-xs">
                To
              </Label>
              <Input
                id="to"
                type="datetime-local"
                value={filters.to}
                onChange={(e) => onFiltersChange({ ...filters, to: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Product Filter */}
        <div className="space-y-2">
          <Label>Product Filter</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., jira, confluence, bitbucket"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addProduct()}
            />
            <Button onClick={addProduct} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.product.map((product) => (
              <Badge key={product} variant="secondary" className="flex items-center gap-1">
                {product}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeProduct(product)} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Actor Filter */}
        <div className="space-y-2">
          <Label>Actor Filter</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Email or name"
              value={newActor}
              onChange={(e) => setNewActor(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addActor()}
            />
            <Button onClick={addActor} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.actor.map((actor) => (
              <Badge key={actor} variant="secondary" className="flex items-center gap-1">
                {actor}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeActor(actor)} />
              </Badge>
            ))}
          </div>
        </div>

        {/* IP Filter */}
        <div className="space-y-2 md:col-span-2">
          <Label>IP Address Filter</Label>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 192.168.1.100"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addIp()}
            />
            <Button onClick={addIp} variant="outline">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.ip.map((ip) => (
              <Badge key={ip} variant="secondary" className="flex items-center gap-1">
                {ip}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeIp(ip)} />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">API Endpoint Configuration</h4>
        <code className="text-sm bg-white p-2 rounded block">
          GET /v1/orgs/{orgId}/events-stream
          {filters.action && `?q=${filters.action}`}
          {filters.from && `&from=${new Date(filters.from).getTime()}`}
          {filters.to && `&to=${new Date(filters.to).getTime()}`}
          {filters.product.length > 0 && `&product=${filters.product.join(",")}`}
          {filters.actor.length > 0 && `&actor=${filters.actor.join(",")}`}
          {filters.ip.length > 0 && `&ip=${filters.ip.join(",")}`}
        </code>
      </div>
    </div>
  )
}
