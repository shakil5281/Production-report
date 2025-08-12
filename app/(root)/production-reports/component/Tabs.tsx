"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DataTable } from "./DataTable";
import { Badge } from "@/components/ui/badge";

export function ProductionTabs() {
  return (
    <Tabs defaultValue="running" className="w-full">
      <TabsList>
        <TabsTrigger value="all">
          All Report
          </TabsTrigger>
        <TabsTrigger value="running">
          Running
          <Badge className="bg-neutral-400 text-white rounded-full overflow-hidden" variant="secondary">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="pending">
          Pending
          <Badge className="bg-yellow-300 rounded-full overflow-hidden" variant="secondary">3</Badge>
        </TabsTrigger>
        <TabsTrigger value="complete">
          Complete
          <Badge className="bg-green-800 text-white rounded-full overflow-hidden" variant="secondary">3</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="running">
        <DataTable />
      </TabsContent>
      <TabsContent value="pending">
        <div>Pending Table Here</div>
      </TabsContent>
      <TabsContent value="complete">
        <div>Complete Table Here</div>
      </TabsContent>
    </Tabs>
  );
}
