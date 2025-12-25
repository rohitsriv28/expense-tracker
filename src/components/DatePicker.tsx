import { toLocalISODateString } from "../utils/dateUtils";

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  max?: Date;
  min?: Date;
  placeholder?: string;
}

const DatePicker = ({
  label,
  value,
  onChange,
  max,
  min,
  placeholder,
}: DatePickerProps) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        type="date"
        value={toLocalISODateString(value)}
        onChange={(e) => {
          // Parse as local date
          if (!e.target.value) return; // Handle empty?
          const [year, month, day] = e.target.value.split("-").map(Number);
          const newDate = new Date(year, month - 1, day);
          onChange(newDate);
        }}
        max={max ? toLocalISODateString(max) : undefined}
        min={min ? toLocalISODateString(min) : undefined}
        placeholder={placeholder}
        className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 text-gray-900 dark:text-white"
      />
    </div>
  );
};

export default DatePicker;
