interface ListItemProps {
  title: string;
  subtitle: string;
  tick?: boolean;
}
const ListItem = ({ title, subtitle, tick }: ListItemProps) => {
  return (
    <div className="flex flex-[1] justify-between items-center p-[10px] border-[1px] border-[#F3F3F3] rounded-[5px]">
      <div>
        <p className="font-medium text-[16px] text-black flex justify-between">
          {title}
        </p>
        <p className="ml-[25px] text-[12px] text-black">{subtitle}</p>
      </div>
      {tick && (
        <div className="rounded-[50%] aspect-[1] w-[20px] h-[20-px] bg-[#4FA198] text-white flex justify-center items-center">
          ✔
        </div>
      )}
    </div>
  );
};

export default ListItem;
