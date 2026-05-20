"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '/ui';
import { Badge } from "@/components/ui/badge";
import { Button } from '/ui';
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Send, Eye } from "lucide-react";

// Sample matches data
const sampleMatches = [
  {
    id: "match-1",
    authority: {
      dotNumber: "168450",
      legalName: "WAL-MART TRANSPORTATION",
      state: "AR",
      drivers: 7200,
      score: 94,
      grade: "A",
    },
    factor: {
      name: "Freight Funding",
      riskTolerance: "MODERATE",
    },
    compatibility: {
      geographic: 100,
      fleetSize: 100,
      riskProfile: 95,
      preferences: 90,
      financial: 85,
    },
    score: 94,
    status: "ACCEPTED",
  },
  {
    id: "match-2",
    authority: {
      dotNumber: "168450",
      legalName: "WAL-MART TRANSPORTATION",
      state: "AR",
      drivers: 7200,
      score: 94,
      grade: "A",
    },
    factor: {
      name: "Sunbelt Finance",
      riskTolerance: "CONSERVATIVE",
    },
    compatibility: {
      geographic: 100,
      fleetSize: 100,
      riskProfile: 98,
      preferences: 85,
      financial: 90,
    },
    score: 95,
    status: "PENDING",
  },
  {
    id: "match-3",
    authority: {
      dotNumber: "169051",
      legalName: "JB HUNT TRANSPORT",
      state: "AR",
      drivers: 28500,
      score: 91,
      grade: "A",
    },
    factor: {
      name: "Sunbelt Finance",
      riskTolerance: "CONSERVATIVE",
    },
    compatibility: {
      geographic: 100,
      fleetSize: 85,
      riskProfile: 92,
      preferences: 88,
      financial: 95,
    },
    score: 92,
    status: "SENT",
  },
  {
    id: "match-4",
    authority: {
      dotNumber: "168802",
      legalName: "MAVERICK TRANSPORTATION",
      state: "AR",
      drivers: 1800,
      score: 85,
      grade: "A-",
    },
    factor: {
      name: "Freight Funding",
      riskTolerance: "MODERATE",
    },
    compatibility: {
      geographic: 100,
      fleetSize: 90,
      riskProfile: 85,
      preferences: 80,
      financial: 80,
    },
    score: 87,
    status: "VIEWED",
  },
  {
    id: "match-5",
    authority: {
      dotNumber: "167928",
      legalName: "PAM TRANSPORT",
      state: "AR",
      drivers: 2500,
      score: 82,
      grade: "B+",
    },
    factor: {
      name: "Century Finance",
      riskTolerance: "AGGRESSIVE",
    },
    compatibility: {
      geographic: 100,
      fleetSize: 88,
      riskProfile: 75,
      preferences: 95,
      financial: 70,
    },
    score: 86,
    status: "DECLINED",
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return <Badge className="bg-green-500">Accepted</Badge>;
    case "PENDING":
      return <Badge variant="outline">Pending</Badge>;
    case "SENT":
      return <Badge className="bg-blue-500">Sent</Badge>;
    case "VIEWED":
      return <Badge className="bg-yellow-500">Viewed</Badge>;
    case "INTERESTED":
      return <Badge className="bg-purple-500">Interested</Badge>;
    case "DECLINED":
      return <Badge variant="destructive">Declined</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const CompatibilityBreakdown = ({
  compatibility,
}: {
  compatibility: (typeof sampleMatches)[0]["compatibility"];
}) => (
  <div className="space-y-2">
    {Object.entries(compatibility).map(([key, value]) => (
      <div key={key} className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
          <span className="font-medium">{value}%</span>
        </div>
        <Progress value={value} className="h-2" />
      </div>
    ))}
  </div>
);

export default function MatchesPage() {
  const [selectedTab, setSelectedTab] = useState("all");

  const filteredMatches =
    selectedTab === "all"
      ? sampleMatches
      : sampleMatches.filter((m) => m.status.toLowerCase() === selectedTab);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Match Management</h1>
          <p className="text-muted-foreground">
            View and manage authority-factor matches
          </p>
        </div>
        <Badge variant="outline">{sampleMatches.length} Total Matches</Badge>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All ({sampleMatches.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({sampleMatches.filter((m) => m.status === "PENDING").length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sampleMatches.filter((m) => m.status === "SENT").length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({sampleMatches.filter((m) => m.status === "ACCEPTED").length})
          </TabsTrigger>
          <TabsTrigger value="declined">
            Declined ({sampleMatches.filter((m) => m.status === "DECLINED").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-6">
          <div className="grid gap-4">
            {filteredMatches.map((match) => (
              <Card key={match.id}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Authority Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Authority</h3>
                      <div className="text-sm">
                        <p className="font-medium">{match.authority.legalName}</p>
                        <p className="text-muted-foreground">
                          DOT #{match.authority.dotNumber}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{match.authority.state}</Badge>
                          <Badge className="bg-green-100 text-green-800">
                            {match.authority.grade}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {match.authority.drivers.toLocaleString()} drivers
                        </p>
                      </div>
                    </div>

                    {/* Factor Info */}
                    <div className="space-y-2">
                      <h3 className="font-semibold">Factor</h3>
                      <div className="text-sm">
                        <p className="font-medium">{match.factor.name}</p>
                        <Badge
                          className={
                            match.factor.riskTolerance === "CONSERVATIVE"
                              ? "bg-green-100 text-green-800"
                              : match.factor.riskTolerance === "MODERATE"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {match.factor.riskTolerance}
                        </Badge>
                      </div>
                    </div>

                    {/* Compatibility */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Compatibility</h3>
                        <span className="text-2xl font-bold">{match.score}%</span>
                      </div>
                      <CompatibilityBreakdown compatibility={match.compatibility} />
                    </div>

                    {/* Status & Actions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Status</h3>
                        {getStatusBadge(match.status)}
                      </div>

                      <div className="flex gap-2">
                        {match.status === "PENDING" && (
                          <>
                            <Button size="sm" className="flex-1">
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {match.status === "SENT" && (
                          <Button size="sm" variant="outline" className="flex-1">
                            <Eye className="h-4 w-4 mr-1" />
                            View Response
                          </Button>
                        )}
                        {match.status === "VIEWED" && (
                          <>
                            <Button size="sm" variant="default" className="flex-1">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sampleMatches.filter((m) => m.status === "ACCEPTED").length}
            </div>
            <p className="text-sm text-muted-foreground">Successful Matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(
                sampleMatches.reduce((sum, m) => sum + m.score, 0) / sampleMatches.length
              )}
              %
            </div>
            <p className="text-sm text-muted-foreground">Average Match Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {sampleMatches.filter((m) => m.status === "PENDING").length}
            </div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Math.round(
                (sampleMatches.filter((m) => m.status === "ACCEPTED").length /
                  sampleMatches.length) *
                  100
              )}
              %
            </div>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
