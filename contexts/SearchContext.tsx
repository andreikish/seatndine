import React, { createContext, useContext, useState } from 'react';

interface SearchContextType {
  selectedDate: Date;
  selectedTime: Date;
  selectedPeople: number;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: Date) => void;
  setSelectedPeople: (people: number) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedPeople, setSelectedPeople] = useState(2);

  return (
    <SearchContext.Provider value={{
      selectedDate,
      selectedTime,
      selectedPeople,
      setSelectedDate,
      setSelectedTime,
      setSelectedPeople
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 