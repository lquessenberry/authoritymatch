"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@authoritymatch/ui';
import { Badge } from "@/components/ui/badge";
import { Input } from '@authoritymatch/ui';
import { Button } from '@authoritymatch/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@authoritymatch/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Truck } from "lucide-react";

// Sample authority data
const authorities = [
  {
    dotNumber: "168450",
    legalName: "WAL-MART TRANSPORTATION",
    dbaName: null,
    state: "AR",
    status: "A",
    drivers: 7200,
    powerUnits: 6500,
    safetyRating: "S",
    score: 94,
    grade: "A",
  },
  {
    dotNumber: "169051",
    legalName: "JB HUNT TRANSPORT",
    dbaName: null,
    state: "AR",
    status: "A",
    drivers: 28500,
    powerUnits: 22000,
    safetyRating: "S",
    score: 91,
    grade: "A",
  },
  {
    dotNumber: "169094",
    legalName: "AVERITT EXPRESS",
    dbaName: null,
    state: "TN",
    status: "A",
    drivers: 4500,
    powerUnits: 3800,
    safetyRating: "S",
    score: 88,
    grade: "A-",
  },
  {
    dotNumber: "168802",
    legalName: "MAVERICK TRANSPORTATION",
    dbaName: null,
    state: "AR",
    status: "A",
    drivers: 1800,
    powerUnits: 1650,
    safetyRating: "S",
    score: 85,
    grade: "A-",
  },
  {
    dotNumber: "167928",
    legalName: "PAM TRANSPORT",
    dbaName: null,
    state: "AR",
    status: "A",
    drivers: 2500,
    powerUnits: 2200,
    safetyRating: "S",
    score: 82,
    grade: "B+",
  },
];

const getGradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "bg-green-100 text-green-800";
  if (grade.startsWith("B")) return "bg-blue-100 text-blue-800";
  if (grade.startsWith("C")) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "A":
      return <Badge className="bg-green-500">Active</Badge>;
    case "I":
      return <Badge variant="destructive">Inactive</Badge>;
    case "N":
      return <Badge variant="outline">Not Authorized</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function AuthoritiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<string>("all");

  const filteredAuthorities = authorities.filter((auth) => {
    const matchesSearch =
      auth.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      auth.dotNumber.includes(searchQuery);
    const matchesState = selectedState === "all" || auth.state === selectedState;
    const matchesGrade =
      selectedGrade === "all" || auth.grade.startsWith(selectedGrade);
    return matchesSearch && matchesState && matchesGrade;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Authority Database</h1>
          <p className="text-muted-foreground">
            Search and filter FMCSA authorized carriers
          </p>
        </div>
        <Badge variant="outline">{filteredAuthorities.length} Results</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or DOT number..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="AR">Arkansas</SelectItem>
                <SelectItem value="TN">Tennessee</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">A (90-100)</SelectItem>
                <SelectItem value="B">B (75-89)</SelectItem>
                <SelectItem value="C">C (60-74)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Carrier Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DOT #</TableHead>
                <TableHead>Legal Name</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Drivers</TableHead>
                <TableHead>Power Units</TableHead>
                <TableHead>Safety</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAuthorities.map((auth) => (
                <TableRow key={auth.dotNumber}>
                  <TableCell className="font-mono">{auth.dotNumber}</TableCell>
                  <TableCell className="font-medium">{auth.legalName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{auth.state}</Badge>
                  </TableCell>
                  <TableCell>{auth.drivers.toLocaleString()}</TableCell>
                  <TableCell>{auth.powerUnits.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={auth.safetyRating === "S" ? "default" : "destructive"}
                    >
                      {auth.safetyRating}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{auth.score}</span>
                      <Badge className={getGradeColor(auth.grade)}>{auth.grade}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(auth.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                    <Button variant="ghost" size="sm">
                      Match
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {filteredAuthorities.reduce((sum, a) => sum + a.drivers, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total Drivers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {filteredAuthorities.filter((a) => a.grade.startsWith("A")).length}
            </div>
            <p className="text-sm text-muted-foreground">A-Rated Carriers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {filteredAuthorities.filter((a) => a.status === "A").length}
            </div>
            <p className="text-sm text-muted-foreground">Active Authorities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(
                filteredAuthorities.reduce((sum, a) => sum + a.score, 0) /
                  filteredAuthorities.length
              )}
            </div>
            <p className="text-sm text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
