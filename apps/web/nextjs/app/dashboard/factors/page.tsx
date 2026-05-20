"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '/ui';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const factors = [
  {
    id: "freight-funding",
    name: "Freight Funding",
    location: "Little Rock, AR",
    riskTolerance: "MODERATE",
    minScore: 70,
    minFleet: 5,
    maxFleet: 200,
    advanceRate: 95,
    fee: 2.5,
    totalClients: 450,
    activeClients: 380,
    retentionRate: 92,
    satisfaction: 4.6,
    status: "ACTIVE",
    preferredStates: ["AR", "TX", "OK", "MO", "TN", "MS", "LA"],
  },
  {
    id: "sunbelt-finance",
    name: "Sunbelt Finance",
    location: "Dallas, TX",
    riskTolerance: "CONSERVATIVE",
    minScore: 75,
    minFleet: 10,
    maxFleet: 500,
    advanceRate: 97,
    fee: 2.0,
    totalClients: 1200,
    activeClients: 980,
    retentionRate: 95,
    satisfaction: 4.8,
    status: "ACTIVE",
    preferredStates: ["TX", "AR", "OK", "NM", "LA", "CO", "KS"],
  },
  {
    id: "century-finance",
    name: "Century Finance of Jonesboro",
    location: "Jonesboro, AR",
    riskTolerance: "AGGRESSIVE",
    minScore: 60,
    minFleet: 3,
    maxFleet: 100,
    advanceRate: 92,
    fee: 3.5,
    totalClients: 180,
    activeClients: 145,
    retentionRate: 88,
    satisfaction: 4.2,
    status: "ACTIVE",
    preferredStates: ["AR", "TN", "MS", "MO", "KY", "AL", "LA"],
  },
];

export default function FactorsPage() {
  const [selectedFactor, setSelectedFactor] = useState(factors[0]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CONSERVATIVE":
        return "bg-green-100 text-green-800";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800";
      case "AGGRESSIVE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Factoring Companies</h1>
          <p className="text-muted-foreground">
            Manage pilot factoring partners and their preferences
          </p>
        </div>
        <Badge variant="outline">{factors.length} Active Factors</Badge>
      </div>

      {/* Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {factors.map((factor) => (
          <Card
            key={factor.id}
            className={`cursor-pointer transition-all ${
              selectedFactor.id === factor.id
                ? "ring-2 ring-primary"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedFactor(factor)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{factor.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className={getRiskColor(factor.riskTolerance)}
                >
                  {factor.riskTolerance}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{factor.location}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Min Score</span>
                  <span className="font-medium">{factor.minScore}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fleet Range</span>
                  <span className="font-medium">
                    {factor.minFleet}-{factor.maxFleet}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Advance</span>
                  <span className="font-medium">{factor.advanceRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Factor Details */}
      <Card>
        <CardHeader>
          <CardTitle>{selectedFactor.name} - Detailed Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Requirements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Requirements</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Min Authority Score</TableCell>
                    <TableCell>{selectedFactor.minScore}/100</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Fleet Size Range</TableCell>
                    <TableCell>
                      {selectedFactor.minFleet}-{selectedFactor.maxFleet} drivers
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Risk Tolerance</TableCell>
                    <TableCell>
                      <Badge className={getRiskColor(selectedFactor.riskTolerance)}>
                        {selectedFactor.riskTolerance}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Max Advance Rate</TableCell>
                    <TableCell>{selectedFactor.advanceRate}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Base Fee</TableCell>
                    <TableCell>{selectedFactor.fee}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="pt-2">
                <h4 className="font-medium mb-2">Preferred States</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedFactor.preferredStates.map((state) => (
                    <Badge key={state} variant="outline">
                      {state}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Performance Metrics</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Client Retention</span>
                    <span className="text-sm font-medium">
                      {selectedFactor.retentionRate}%
                    </span>
                  </div>
                  <Progress value={selectedFactor.retentionRate} />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Client Satisfaction</span>
                    <span className="text-sm font-medium">
                      {selectedFactor.satisfaction}/5.0
                    </span>
                  </div>
                  <Progress value={(selectedFactor.satisfaction / 5) * 100} />
                </div>

                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Total Clients</TableCell>
                      <TableCell>{selectedFactor.totalClients}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Active Clients</TableCell>
                      <TableCell>{selectedFactor.activeClients}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Utilization</TableCell>
                      <TableCell>
                        {Math.round(
                          (selectedFactor.activeClients / selectedFactor.totalClients) * 100
                        )}
                        %
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
