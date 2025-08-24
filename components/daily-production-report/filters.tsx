'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSearch } from '@tabler/icons-react';

interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  lineFilter: string;
  setLineFilter: (line: string) => void;
  styleFilter: string;
  setStyleFilter: (style: string) => void;
  uniqueLines: string[];
  isMobile: boolean;
}

export function Filters({
  searchTerm,
  setSearchTerm,
  lineFilter,
  setLineFilter,
  styleFilter,
  setStyleFilter,
  uniqueLines,
  isMobile
}: FiltersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <IconSearch className="h-4 w-4" />
          Filters
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Filter and search production reports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Search</Label>
            <Input
              placeholder={isMobile ? "Search..." : "Search by style, buyer, item, or line..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Production Line</Label>
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Select line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                {uniqueLines.map(line => (
                  <SelectItem key={line} value={line || ''}>
                    {line || 'No Line'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Style Number</Label>
            <Input
              placeholder={isMobile ? "Style..." : "Filter by style number..."}
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="h-9 sm:h-10 text-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
