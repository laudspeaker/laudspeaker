import { Dialog, Transition } from "@headlessui/react";
import { FC, Fragment, KeyboardEvent } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Button, { ButtonType } from "../Buttonv2";

export interface ModalProps {
  isOpen: boolean;
  title?: JSX.Element;
  children?: JSX.Element;
  titleClass?: string;
  childrenClass?: string;
  panelClass?: string;
  dialogClass?: string;
  closeButtonNeed?: boolean;
  hasBottomActionButtons?: boolean;
  onClose?: () => void;
  onEnterPress?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onRetest?: () => void;
}

const Modal: FC<ModalProps> = ({
  isOpen,
  onClose = () => null,
  children,
  title,
  childrenClass = "",
  dialogClass = "",
  panelClass = "",
  titleClass = "",
  closeButtonNeed = true,
  hasBottomActionButtons = false,
  onEnterPress,
  onRetest = () => null,
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`${dialogClass} relative z-[1000]`}
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div
          className="fixed inset-0 overflow-y-auto"
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnterPress) onEnterPress(e);
          }}
        >
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`${panelClass} w-full max-w-md transform overflow-visible rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh]`}
              >
                {title && (
                  <Dialog.Title className={titleClass}>{title}</Dialog.Title>
                )}
                <div className="mt-2">
                  <Dialog.Description
                    className={`${childrenClass} max-h-[80vh] overflow-visible pr-[10px]`}
                  >
                    {children}
                  </Dialog.Description>
                </div>
                {closeButtonNeed && (
                  <button
                    id="close-modal"
                    className="absolute top-[10px] right-[20px] border-0 bg-transparent outline-none text-[24px] cursor-pointer"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-[30px] w-[30px]" />
                  </button>
                )}
                {hasBottomActionButtons && (
                  <div className="flex justify-end gap-2 mt-8">
                    <Button
                      type={ButtonType.SECONDARY}
                      onClick={onRetest}
                      className="text-black border-gray-200 hover:border-gray-400 hover:text-black focus:border-gray-500 focus:text-black"
                    >
                      Retest
                    </Button>
                    <Button type={ButtonType.PRIMARY} onClick={onClose}>
                      OK
                    </Button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
