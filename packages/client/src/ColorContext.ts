import React from "react";

interface ColorContextSchema {
  toggleColorMode: () => void;
}

export const ColorContext = React.createContext<ColorContextSchema>(
  {} as ColorContextSchema
);
