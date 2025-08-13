'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconTarget, IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';

export default function TargetPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Production Targets</h1>
        <p className="text-muted-foreground">
          Set and monitor production targets for different product lines
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Add New Target */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPlus className="h-5 w-5" />
              Add New Target
            </CardTitle>
            <CardDescription>
              Create a new production target
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-line">Product Line</Label>
              <Input id="product-line" placeholder="Enter product line name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-amount">Target Amount</Label>
              <Input id="target-amount" type="number" placeholder="Enter target amount" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-date">Target Date</Label>
              <Input id="target-date" type="date" />
            </div>
            <Button className="w-full">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
          </CardContent>
        </Card>

        {/* Current Targets Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTarget className="h-5 w-5" />
              Current Targets
            </CardTitle>
            <CardDescription>
              Overview of active production targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Product Line A</p>
                  <p className="text-sm text-muted-foreground">Target: 1000 units</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Product Line B</p>
                  <p className="text-sm text-muted-foreground">Target: 500 units</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Target Progress</CardTitle>
          <CardDescription>
            Track progress towards production targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Product Line A</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Product Line B</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="text-sm text-muted-foreground">90%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
