import SideModal from "components/Elements/SideModal";
import FilterBuilder from "pages/Filter/FilterBuilder";
import React, { FC, ReactNode } from "react";

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterId?: string;
  workflowId: string;
  afterContent?: ReactNode;
  onSubmit: (id?: string) => void;
}

const FilterModal: FC<FilterModalProps> = ({
  isOpen,
  onClose,
  workflowId,
  filterId,
  onSubmit,
}) => {
  return (
    <SideModal isOpen={isOpen} onClose={onClose}>
      <FilterBuilder filterId={filterId} onSubmit={onSubmit} />
    </SideModal>
  );
};

export default FilterModal;
