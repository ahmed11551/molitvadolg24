// Календарь в стиле iPhone - компактный и удобный

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type IPhoneCalendarProps = React.ComponentProps<typeof DayPicker>;

function IPhoneCalendar({ 
  className, 
  classNames, 
  showOutsideDays = false, 
  ...props 
}: IPhoneCalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col space-y-2",
        month: "space-y-3",
        caption: "flex justify-center pt-2 relative items-center mb-2",
        caption_label: "text-base font-semibold text-gray-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 bg-transparent p-0 hover:bg-gray-100 rounded-full"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex justify-between mb-1",
        head_cell: "text-gray-500 rounded-md w-10 font-medium text-xs uppercase tracking-wider",
        row: "flex w-full justify-between mt-1",
        cell: "h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal rounded-full hover:bg-gray-100 transition-colors"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white rounded-full",
        day_today: "bg-gray-100 text-gray-900 font-semibold rounded-full",
        day_outside:
          "day-outside text-gray-300 opacity-30 aria-selected:bg-gray-100 aria-selected:text-gray-300 aria-selected:opacity-30",
        day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
        day_range_middle: "aria-selected:bg-emerald-100 aria-selected:text-emerald-700 rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      {...props}
    />
  );
}

IPhoneCalendar.displayName = "IPhoneCalendar";

export { IPhoneCalendar };

