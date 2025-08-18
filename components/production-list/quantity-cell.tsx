'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { QuantityItem } from './schema';

interface QuantityCellProps {
  quantities: QuantityItem[];
  totalQty: number;
}

export function QuantityCell({ quantities, totalQty }: QuantityCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!quantities || quantities.length === 0) {
    return <div className="text-muted-foreground">No quantities</div>;
  }
  
  const shouldCollapse = quantities.length > 4;
  const displayQuantities = shouldCollapse && !isExpanded ? quantities.slice(0, 3) : quantities;
  
  return (
    <div className="space-y-2 min-w-[280px]">
      {/* Total Summary */}
      <div className="flex items-center justify-between">
        <div className="font-semibold text-green-600">
          Total: {totalQty.toLocaleString()}
        </div>
        <Badge variant="outline" className="text-xs">
          {quantities.length} item{quantities.length > 1 ? 's' : ''}
        </Badge>
      </div>
      
      {/* Quantities Details */}
      <div className="space-y-1">
        {displayQuantities.map((qty: QuantityItem, index: number) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-xs px-1 py-0">
                {qty.variant}
              </Badge>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {qty.color}
              </Badge>
            </div>
            <div className="font-medium">
              {Number(qty.qty).toLocaleString()}
            </div>
          </div>
        ))}
        
        {/* Expand/Collapse Button */}
        {shouldCollapse && (
          <div className="flex justify-center pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <>
                  <IconChevronUp className="h-3 w-3 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <IconChevronDown className="h-3 w-3 mr-1" />
                  +{quantities.length - 3} more
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
