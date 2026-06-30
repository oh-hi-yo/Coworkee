'use client';

import { createPerson, generateUsername, updatePerson, type PersonInput } from '@/api/people';
import { listOffices } from '@/api/offices';
import { listOrganizations } from '@/api/organizations';
import {
  emptyPersonForm,
  personFormSchema,
  WIZARD_STEP_FIELDS,
  type PersonFormValues,
} from '@/domain/person/personForm';
import { useAccessToken } from '@/lib/useAccessToken';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, DatePicker, Form, Input, Select, Space, Steps } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

const STEP_TITLES = ['General', 'Personal', 'Work'];

export interface PersonWizardProps {
  mode: 'create' | 'edit';
  personId?: string;
  initialValues?: PersonFormValues;
}

function toInput(v: PersonFormValues): PersonInput {
  const blankToNull = (s?: string) => (s && s.length > 0 ? s : null);
  return {
    email: v.email,
    username: v.username,
    firstname: v.firstname,
    lastname: v.lastname,
    title: v.title,
    phone: v.phone,
    extension: blankToNull(v.extension),
    skype: blankToNull(v.skype),
    linkedin: blankToNull(v.linkedin),
    birthday: v.birthday,
    started: v.started,
    ended: blankToNull(v.ended),
    officeId: v.officeId,
    organizationId: v.organizationId,
  };
}

export function PersonWizard({ mode, personId, initialValues }: PersonWizardProps) {
  const token = useAccessToken();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [step, setStep] = useState(0);

  // BR-21: in edit mode the username is user-owned from the start (never auto-overwrite).
  const usernameManuallyEdited = useRef(mode === 'edit');

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: initialValues ?? emptyPersonForm,
    mode: 'onTouched',
  });

  const { data: offices = [] } = useQuery({
    queryKey: ['offices'],
    queryFn: ({ signal }) => listOffices({ token, signal }),
    enabled: !!token,
  });
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: ({ signal }) => listOrganizations({ token, signal }),
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: (values: PersonFormValues) =>
      mode === 'create'
        ? createPerson(toInput(values), { token })
        : updatePerson(personId!, toInput(values), { token }),
    onSuccess: (person) => {
      void queryClient.invalidateQueries({ queryKey: ['people'] });
      void queryClient.invalidateQueries({ queryKey: ['person', person.id] });
      message.success(mode === 'create' ? 'Employee created' : 'Employee updated');
      router.push(`/people/${person.id}`);
    },
    onError: (err: Error) => message.error(err.message),
  });

  // BR-21: auto-generate username on name blur unless the user typed their own.
  async function maybeGenerateUsername() {
    if (usernameManuallyEdited.current) return;
    const { firstname, lastname } = getValues();
    if (!firstname || !lastname) return;
    try {
      const username = await generateUsername(firstname, lastname, { token });
      if (!usernameManuallyEdited.current) {
        setValue('username', username, { shouldValidate: true });
      }
    } catch {
      // ignore — user can type a username manually
    }
  }

  async function next() {
    const valid = await trigger(WIZARD_STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Card style={{ maxWidth: 720, margin: '24px auto' }}>
      <Steps
        current={step}
        items={STEP_TITLES.map((t) => ({ title: t }))}
        style={{ marginBottom: 24 }}
      />
      <Form layout="vertical" onFinish={onSubmit}>
        <div hidden={step !== 0}>
          <TextField name="firstname" label="First name" control={control} error={errors.firstname?.message} onBlur={maybeGenerateUsername} />
          <TextField name="lastname" label="Last name" control={control} error={errors.lastname?.message} onBlur={maybeGenerateUsername} />
          <Controller
            name="username"
            control={control}
            render={({ field }) => (
              <Form.Item label="Username" validateStatus={errors.username ? 'error' : ''} help={errors.username?.message}>
                <Input
                  {...field}
                  placeholder="Username"
                  onChange={(e) => {
                    usernameManuallyEdited.current = true;
                    field.onChange(e);
                  }}
                />
              </Form.Item>
            )}
          />
          <TextField name="email" label="Email" control={control} error={errors.email?.message} />
          <TextField name="title" label="Title" control={control} error={errors.title?.message} />
        </div>

        <div hidden={step !== 1}>
          <DateField name="birthday" label="Birthday" control={control} error={errors.birthday?.message} />
          <TextField name="phone" label="Phone" control={control} error={errors.phone?.message} />
          <TextField name="extension" label="Extension" control={control} error={errors.extension?.message} />
          <TextField name="skype" label="Skype" control={control} error={errors.skype?.message} />
          <TextField name="linkedin" label="LinkedIn" control={control} error={errors.linkedin?.message} />
        </div>

        <div hidden={step !== 2}>
          <SelectField
            name="officeId"
            label="Office"
            control={control}
            error={errors.officeId?.message}
            options={offices.map((o) => ({ value: o.id, label: o.name }))}
          />
          <SelectField
            name="organizationId"
            label="Organization"
            control={control}
            error={errors.organizationId?.message}
            options={organizations.map((o) => ({ value: o.id, label: o.name }))}
          />
          <DateField name="started" label="Entry date" control={control} error={errors.started?.message} />
          <DateField name="ended" label="Exit date (optional)" control={control} error={errors.ended?.message} />
        </div>

        <Space style={{ marginTop: 8 }}>
          {step > 0 && <Button onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < STEP_TITLES.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {step === STEP_TITLES.length - 1 && (
            <Button type="primary" htmlType="submit" loading={isSubmitting || mutation.isPending}>
              {mode === 'create' ? 'Create' : 'Save'}
            </Button>
          )}
          <Button onClick={() => router.back()}>Cancel</Button>
        </Space>
      </Form>
    </Card>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function TextField({
  name,
  label,
  control,
  error,
  onBlur,
}: {
  name: keyof PersonFormValues;
  label: string;
  control: any;
  error?: string;
  onBlur?: () => void;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Form.Item label={label} validateStatus={error ? 'error' : ''} help={error}>
          <Input
            {...field}
            placeholder={label}
            onBlur={() => {
              field.onBlur();
              onBlur?.();
            }}
          />
        </Form.Item>
      )}
    />
  );
}

function DateField({
  name,
  label,
  control,
  error,
}: {
  name: keyof PersonFormValues;
  label: string;
  control: any;
  error?: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Form.Item label={label} validateStatus={error ? 'error' : ''} help={error}>
          <DatePicker
            style={{ width: '100%' }}
            placeholder={label}
            format="YYYY-MM-DD"
            value={field.value ? dayjs(field.value) : null}
            onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
          />
        </Form.Item>
      )}
    />
  );
}

function SelectField({
  name,
  label,
  control,
  error,
  options,
}: {
  name: keyof PersonFormValues;
  label: string;
  control: any;
  error?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Form.Item label={label} validateStatus={error ? 'error' : ''} help={error}>
          <Select {...field} options={options} showSearch optionFilterProp="label" placeholder={`Select ${label.toLowerCase()}`} />
        </Form.Item>
      )}
    />
  );
}
