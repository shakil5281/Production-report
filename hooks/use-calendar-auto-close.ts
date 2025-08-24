import { useState, useCallback } from 'react';

export const useCalendarAutoClose = () => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = useCallback((date: Date | undefined, onDateChange: (date: Date) => void) => {
    if (date) {
      onDateChange(date);
      // Auto-close calendar when date is selected
      setIsCalendarOpen(false);
    }
  }, []);

  const openCalendar = useCallback(() => {
    setIsCalendarOpen(true);
  }, []);

  const closeCalendar = useCallback(() => {
    setIsCalendarOpen(false);
  }, []);

  return {
    isCalendarOpen,
    setIsCalendarOpen,
    handleDateSelect,
    openCalendar,
    closeCalendar
  };
};
