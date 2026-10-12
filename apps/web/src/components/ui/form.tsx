import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { createContext, useContext, useId, type ComponentProps } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const Form = FormProvider;

type FormFieldContextValue = { name: string };
const FormFieldContext = createContext<FormFieldContextValue | null>(null);
const FormItemContext = createContext<{ id: string } | null>(null);

export function FormField<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: ControllerProps<TFieldValues, TName>,
) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

export function FormItem({ className, ...props }: ComponentProps<'div'>) {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

function useFormField() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();
  if (!fieldContext || !itemContext) {
    throw new Error('Pole formularza jest poza FormField');
  }
  const fieldState = getFieldState(fieldContext.name as FieldPath<FieldValues>, formState);
  return { id: itemContext.id, name: fieldContext.name, ...fieldState };
}

export function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const { error, id } = useFormField();
  return <Label className={cn(error && 'text-destructive', className)} htmlFor={id} {...props} />;
}

export function FormControl(props: ComponentProps<typeof Slot>) {
  const { error, id } = useFormField();
  return <Slot id={id} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-message` : undefined} {...props} />;
}

export function FormMessage({ className, children, ...props }: ComponentProps<'p'>) {
  const { error, id } = useFormField();
  const body = error ? String(error.message ?? '') : children;
  if (!body) return null;
  return (
    <p id={`${id}-message`} className={cn('text-sm text-destructive', className)} {...props}>
      {body}
    </p>
  );
}
