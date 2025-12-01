import React from "react";

interface DotProps {
  style?: React.CSSProperties;
}

export function Dot({ style }: DotProps) {
  return (
    <span 
      className="h-2 w-2 rounded-full inline-block animate-bounce [animation-duration:1.2s]" 
      style={style} 
    />
  );
}

