import React, { ReactNode } from "react";

interface ILinkProps extends React.HTMLProps<HTMLLinkElement> {
  children: ReactNode;
}

const Link = ({ children, className, href, ...props }: ILinkProps) => {
  return (
    //@ts-ignore
    <a
      className={`${className} font-[Poppins] text-[1rem] leading-[1.5]`}
      href={href}
      {...props}
    >
      {children}
    </a>
  );
};

export default Link;
