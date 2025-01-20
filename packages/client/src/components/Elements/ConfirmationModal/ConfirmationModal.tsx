import React, { FC, ReactNode } from "react";
import Modal from "../Modalv2";
import Button, { ButtonType } from "../Buttonv2";
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  renderDescription?: any; //function to render a description which has jsx in it
  closeButtonText?: string;
  confirmButtonText: string;
  closeButtonAction?: () => void;
  confirmButtonAction?: () => void;
  confirmButtonId?: string;
  Icon?: () => JSX.Element;
  children?: ReactNode;
  headerClassName?: string;
  modalClassName?: string;
  titleClassName?: string;
}

const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  renderDescription,
  closeButtonText,
  confirmButtonText,
  closeButtonAction,
  confirmButtonAction,
  confirmButtonId = "",
  Icon = () => <></>,
  children,
  headerClassName,
  modalClassName,
  titleClassName,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className={`${modalClassName}`}>
      <div className="font-roboto">
        {(title || description || renderDescription || !!Icon) && (
          <div className={`flex gap-4 ${headerClassName}`}>
            {/* Icon is displayed only if it's added in props */}
            <div>
              <Icon />
            </div>
            <div className="flex flex-col gap-2">
              <div className={`font-medium text-base ${titleClassName}`}>
                {title}
              </div>
              {(!!description || !!renderDescription) && (
                <div className="font-normal text-[14px] leading-[22px]">
                  {description || renderDescription?.()}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Children are displayed between title with description and buttons. Example: Input in 'rename modal' */}
        {children}
        <div className="flex justify-end items-center mt-[24px] gap-2">
          {/* If there is no closeButtonText prop do not display secondary button */}
          {!!closeButtonText && (
            <Button
              type={ButtonType.SECONDARY}
              onClick={closeButtonAction || onClose}
            >
              {closeButtonText}
            </Button>
          )}
          <Button
            type={ButtonType.PRIMARY}
            onClick={confirmButtonAction || onClose}
            id={confirmButtonId}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
