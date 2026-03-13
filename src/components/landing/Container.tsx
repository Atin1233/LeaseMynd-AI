import React from "react";

interface Props {
  className?: string;
}

const Container: React.FC<React.PropsWithChildren<Props>> = ({
  children,
  className,
}) => {
  return (
    <div
      className={`mx-auto w-full max-w-7xl px-5 ${className ?? ""}`}
    >
      {children}
    </div>
  );
};

export default Container;
