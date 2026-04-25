import { memo, ReactNode } from 'react';

export interface FormActionProps {
  children?: ReactNode;
}

const FormAction = memo<FormActionProps>(({ children }) => {
  return <div>{children}</div>;
});

FormAction.displayName = 'FormAction';

export default FormAction;
