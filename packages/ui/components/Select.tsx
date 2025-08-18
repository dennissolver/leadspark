import React from 'react';
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select"; // This assumes you have @radix-ui/react-select installed.

interface SelectProps {
  // The current value of the select input.
  value?: string;
  // Callback function to handle value changes.
  onValueChange?: (value: string) => void;
  // A placeholder text to display when no value is selected.
  placeholder?: string;
  // An array of options to display in the dropdown.
  options: { label: string; value: string }[];
  // The label for the select component.
  label?: string;
}

/**
 * A reusable Select component for your application.
 * This component wraps the basic functionality of a select dropdown.
 * It is designed to be flexible and easy to use.
 *
 * @param {SelectProps} props - The props for the component.
 * @returns {JSX.Element} A Select React element.
 */
export default function SelectComponent({
  value,
  onValueChange,
  placeholder,
  options = [],
  label,
}: SelectProps) {
  return (
    <div className="flex flex-col space-y-2">
      {/* Renders a label if the 'label' prop is provided */}
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}

      {/* The main Select component, with value and change handler */}
      <SelectPrimitive onValueChange={onValueChange} value={value}>
        {/* The visible trigger for the dropdown, styled with Tailwind classes */}
        <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          {/* Displays the selected value or a placeholder */}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        {/* The content container for the dropdown list */}
        <SelectContent>
          <SelectGroup>
            {/* Maps through the options array to render each selectable item */}
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </SelectPrimitive>
    </div>
  );
}
