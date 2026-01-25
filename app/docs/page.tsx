"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, CreditCard, Shield, Zap } from "lucide-react"

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Documentation</h1>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">What is PayEase?</h3>
            <p className="text-sm text-muted-foreground">
              PayEase is a revolutionary crypto PayLater platform built on Algorand blockchain. 
              It allows you to buy now and pay later using cryptocurrency with zero collateral requirements.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How it Works</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Connect your Algorand wallet</li>
              <li>Get instant credit limit based on your profile</li>
              <li>Shop at partner merchants</li>
              <li>Pay later with flexible terms</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Key Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline">Instant Approval</Badge>
              <p className="text-sm text-muted-foreground">
                Get approved instantly without lengthy verification processes.
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Zero Collateral</Badge>
              <p className="text-sm text-muted-foreground">
                No need to lock up your crypto assets as collateral.
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Flexible Payments</Badge>
              <p className="text-sm text-muted-foreground">
                Choose your payment schedule that works for you.
              </p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Partner Network</Badge>
              <p className="text-sm text-muted-foreground">
                Shop at hundreds of partner merchants worldwide.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Trust
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Blockchain Security</h3>
            <p className="text-sm text-muted-foreground">
              Built on Algorand's secure and fast blockchain infrastructure with enterprise-grade security.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Privacy Protection</h3>
            <p className="text-sm text-muted-foreground">
              Your financial data is encrypted and protected with industry-standard security protocols.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">For Developers</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Integrate PayEase into your application with our comprehensive API.
            </p>
            <div className="bg-muted p-3 rounded-lg">
              <code className="text-sm">
                POST /api/checkout<br/>
                GET /api/limits<br/>
                GET /api/transactions
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}