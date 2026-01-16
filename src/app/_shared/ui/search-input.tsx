"use client";

import { IoMdClose } from "react-icons/io";

type SearchInputProps = {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  placeholder: string;
  value: string;
};

const SearchInput = ({ onChange, onClear, placeholder, value }: SearchInputProps) => {
  return (
    <div className="relative flex-1">
      <input
        className="h-12 w-full rounded-lg border border-white/20 bg-gray-500/10 p-4 text-lg placeholder-white outline-none"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          aria-label="Clear search"
          className="absolute right-4 top-1/2 -translate-y-1/2"
          onClick={onClear}
        >
          <IoMdClose size="1.2rem" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
