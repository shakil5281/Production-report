'use client';

import { Badge } from '@/components/ui/badge';
import { ComprehensiveTargetData } from './types';

interface ComprehensiveReportTableProps {
  data: ComprehensiveTargetData[];
  timeSlotHeaders: string[];
  timeSlotTotals: Record<string, number>;
}

export function ComprehensiveReportTable({ 
  data, 
  timeSlotHeaders, 
  timeSlotTotals 
}: ComprehensiveReportTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No targets found</p>
        <p className="text-sm">No target data available for the selected date</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 bg-white shadow-sm">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-300">
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
              Line
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
              Style
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
              Buyer
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">
              Item
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-blue-50">
              Target
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-blue-50">
              Hours
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-blue-50">
              Targets
            </th>
            {timeSlotHeaders.map((timeSlot, index) => (
              <th key={index} className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-blue-100">
                {timeSlot}
              </th>
            ))}
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-green-100">
              Total
            </th>
            <th className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-green-100">
              Avg/Hour
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm">
                <div>
                  <div className="font-semibold text-gray-900">{row.lineNo}</div>
                  <div className="text-xs text-gray-500">{row.lineName}</div>
                </div>
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900">
                {row.styleNo}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-700">
                {row.buyer}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-700">
                {row.item}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-semibold text-blue-700 bg-blue-50">
                {row.target.toLocaleString()}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center text-gray-700 bg-blue-50">
                {row.hours}h
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-semibold text-blue-700 bg-blue-50">
                {row.targets.toLocaleString()}
              </td>
              
              {/* Dynamic Hourly Production Columns */}
              {timeSlotHeaders.map((timeSlot, index) => (
                <td key={index} className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center bg-blue-50 text-gray-700">
                  {row.hourlyProduction[timeSlot]?.toLocaleString() || '0'}
                </td>
              ))}
              
              {/* Totals */}
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-green-700 bg-green-50">
                {row.totalProduction.toLocaleString()}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-semibold text-green-700 bg-green-50">
                {row.averageProductionPerHour.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
        
        {/* Footer with Totals */}
        {data.length > 0 && (
          <tfoot>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-t-2 border-gray-400">
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-bold text-gray-900" colSpan={4}>
                TOTALS
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-blue-800 bg-blue-100">
                {data.reduce((sum, row) => sum + row.target, 0).toLocaleString()}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-blue-800 bg-blue-100">
                {data.reduce((sum, row) => sum + row.hours, 0)}h
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-blue-800 bg-blue-100">
                {data.reduce((sum, row) => sum + row.targets, 0).toLocaleString()}
              </td>
              
              {/* Dynamic Hourly Totals */}
              {timeSlotHeaders.map((timeSlot, index) => (
                <td key={index} className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-blue-800 bg-blue-200">
                  {timeSlotTotals[timeSlot]?.toLocaleString() || '0'}
                </td>
              ))}
              
              {/* Total Totals */}
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-green-800 bg-green-200">
                {data.reduce((sum, row) => sum + row.totalProduction, 0).toLocaleString()}
              </td>
              <td className="border border-gray-300 px-2 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-center font-bold text-green-800 bg-green-200">
                {data.length > 0 
                  ? (data.reduce((sum, row) => sum + row.averageProductionPerHour, 0) / data.length).toFixed(0)
                  : '0'
                }
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
