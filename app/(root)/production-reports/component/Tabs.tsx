"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "./DataTable";
import { Badge } from "@/components/ui/badge";
import { productionData } from "../data/productionData";

export function ProductionTabs() {
  // Calculate dynamic counts
  const counts = {
    all: productionData.length,
    running: productionData.filter(item => item.status === "running").length,
    pending: productionData.filter(item => item.status === "pending").length,
    complete: productionData.filter(item => item.status === "complete").length,
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">
          All Report
          <Badge className="bg-blue-500 text-white rounded-full overflow-hidden ml-2" variant="secondary">
            {counts.all}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="running">
          Running
          <Badge className="bg-neutral-400 text-white rounded-full overflow-hidden ml-2" variant="secondary">
            {counts.running}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending
          <Badge className="bg-yellow-300 text-white rounded-full overflow-hidden ml-2" variant="secondary">
            {counts.pending}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="complete">
          Complete
          <Badge className="bg-green-800 text-white rounded-full overflow-hidden ml-2" variant="secondary">
            {counts.complete}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <DataTable statusFilter="all" />
      </TabsContent>
      <TabsContent value="running">
        <DataTable statusFilter="running" />
      </TabsContent>
      <TabsContent value="pending">
        <DataTable statusFilter="pending" />
      </TabsContent>
      <TabsContent value="complete">
        <DataTable statusFilter="complete" />
      </TabsContent>
    </Tabs>
  );
}
