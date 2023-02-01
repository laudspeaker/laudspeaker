interface IChipProps {
  label: string | React.ReactNode;
  wrapperClass?: string;
  textClass?: string;
  onClick?: (ev: React.MouseEvent<HTMLElement>) => void;
}

const Chip = ({
  label = "",
  textClass = "",
  wrapperClass = "",
  onClick,
}: IChipProps) => {
  return (
    <div
      onClick={onClick}
      className={`${wrapperClass} text-[#065F46] bg-[#D1FAE5] cursor-pointer inline-flex justify-center text-[12px] font-medium py-[2px] px-[10px] rounded-[10px]`}
    >
      <span
        className={`${textClass} overflow-hidden whitespace-nowrap p-0 font-[Poppins]`}
      >
        {label}
      </span>
    </div>
  );
};

export default Chip;
