"use client";

import { IoMdClose } from "react-icons/io";

type SearchInputProps = {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
};

const SearchInput = ({ placeholder, value, onChange, onClear }: SearchInputProps) => {
  return (
    <div className="relative flex-1">
      <input
        placeholder={placeholder}
        className="h-12 w-full rounded-lg border border-white/20 bg-gray-500/10 p-4 text-lg placeholder-white outline-none"
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2"
          aria-label="Clear search"
          onClick={onClear}
        >
          <IoMdClose size="1.2rem" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
