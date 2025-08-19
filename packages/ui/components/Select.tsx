import React from 'react';
import {
  Select as SelectPrimitive,
  SelectContent as SelectContentPrimitive,
  SelectGroup,
  SelectItem as SelectItemPrimitive,
  SelectTrigger as SelectTriggerPrimitive,
  SelectValue as SelectValuePrimitive,
} from "@radix-ui/react-select";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: { label: string; value: string }[];
  label?: string;
}

// Export the main Select component
export function Select({
  value,
  onValueChange,
  placeholder,
  options = [],
  label,
}: SelectProps) {
  return (
    <div className="flex flex-col space-y-2">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <SelectPrimitive onValueChange={onValueChange} value={value}>
        <SelectTriggerPrimitive className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <SelectValuePrimitive placeholder={placeholder} />
        </SelectTriggerPrimitive>
        <SelectContentPrimitive>
          <SelectGroup>
            {options.map((option) => (
              <SelectItemPrimitive key={option.value} value={option.value}>
                {option.label}
              </SelectItemPrimitive>
            ))}
          </SelectGroup>
        </SelectContentPrimitive>
      </SelectPrimitive>
    </div>
  );
}

// Export the individual Radix components for direct use
export const SelectContent = SelectContentPrimitive;
export const SelectItem = SelectItemPrimitive;
export const SelectTrigger = SelectTriggerPrimitive;
export const SelectValue = SelectValuePrimitive;

// Keep default export for backward compatibility
export default Select;
// Export individual Radix components for direct use
