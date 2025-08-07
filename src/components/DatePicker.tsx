import { toLocalISODateString } from "../utils/dateUtils";

interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  max?: Date;
}

const DatePicker = ({ label, value, onChange, max }: DatePickerProps) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={toLocalISODateString(value)}
        onChange={(e) => {
          // Parse as local date
          const [year, month, day] = e.target.value.split("-").map(Number);
          const newDate = new Date(year, month - 1, day);
          onChange(newDate);
        }}
        max={max ? toLocalISODateString(max) : undefined}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
};

export default DatePicker;
