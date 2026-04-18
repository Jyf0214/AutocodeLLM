import { Modal, ModalProps, ButtonProps } from 'antd';
import { useCallback, useState } from 'react';

export interface ConfirmModalProps {
  title?: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  okButtonProps?: ButtonProps;
  modalProps?: Partial<ModalProps>;
  children?: React.ReactNode;
  trigger?: React.ReactElement;
  okDanger?: boolean;
}

export const useConfirmModal = (
  options: Omit<ConfirmModalProps, 'trigger' | 'children'>
) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = useCallback(async () => {
    if (options.onConfirm) {
      setLoading(true);
      try {
        await options.onConfirm();
        setOpen(false);
      } finally {
        setLoading(false);
      }
    } else {
      setOpen(false);
    }
  }, [options]);

  const modalProps: ModalProps = {
    title: options.title || '确认操作',
    open,
    onOk: handleConfirm,
    onCancel: () => setOpen(false),
    confirmLoading: loading,
    okText: options.okText || '确定',
    cancelText: options.cancelText || '取消',
    okButtonProps: {
      danger: options.okDanger,
      ...options.okButtonProps,
    },
    ...options.modalProps,
  };

  return {
    open,
    setOpen,
    loading,
    modalProps,
    triggerProps: {
      onClick: () => setOpen(true),
    },
  };
};

export const ConfirmModal = ({
  title,
  content,
  okText,
  cancelText,
  onConfirm,
  okButtonProps,
  modalProps,
  children,
  okDanger,
}: ConfirmModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (onConfirm) {
      setLoading(true);
      try {
        await onConfirm();
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>{children}</div>
      <Modal
        title={title || '确认操作'}
        open={open}
        onOk={handleConfirm}
        onCancel={() => setOpen(false)}
        confirmLoading={loading}
        okText={okText || '确定'}
        cancelText={cancelText || '取消'}
        okButtonProps={{ danger: okDanger, ...okButtonProps }}
        {...modalProps}
      >
        {content}
      </Modal>
    </>
  );
};

export const showConfirm = (options: {
  title?: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  onOk?: () => void | Promise<void>;
  okDanger?: boolean;
}) => {
  Modal.confirm({
    title: options.title || '确认操作',
    content: options.content,
    okText: options.okText || '确定',
    cancelText: options.cancelText || '取消',
    okButtonProps: {
      danger: options.okDanger,
    },
    onOk: options.onOk,
  });
};