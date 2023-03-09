import { Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import React, { FC, Fragment } from "react";
import { ModalProps } from "../Modal/Modal";

const SideModal: FC<ModalProps> = ({
  isOpen,
  children,
  childrenClass = "",
  closeButtonNeed = true,
  onClose = () => null,
  panelClass = "",
  title,
  titleClass = "",
}) => {
  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 z-[999999] h-full">
      <Transition appear show={isOpen} as={Fragment}>
        <div className="flex h-full justify-start text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="-translate-x-full scale-95"
            enterTo="-translate-x-0 scale-100"
            leave="ease-in duration-200"
            leaveFrom="-translate-x-0 scale-100"
            leaveTo="-translate-x-full scale-95"
          >
            <div
              className={`${panelClass} w-full h-full overflow-visible bg-white p-6 text-left align-middle shadow-xl transition-all`}
            >
              {title && <h3 className={titleClass}>{title}</h3>}
              <div className="mt-2">
                <p className={`${childrenClass} overflow-visible`}>
                  {children}
                </p>
              </div>
              {closeButtonNeed && (
                <button
                  className="absolute top-[10px] right-[20px] border-0 bg-transparent outline-none text-[24px] cursor-pointer"
                  onClick={onClose}
                >
                  <XMarkIcon
                    id="close-side-modal"
                    className="h-[30px] w-[30px]"
                  />
                </button>
              )}
            </div>
          </Transition.Child>
        </div>
      </Transition>
    </div>
  );
};

export default SideModal;
