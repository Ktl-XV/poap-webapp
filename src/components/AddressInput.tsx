import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import classNames from 'classnames';

import { resolveENS, getENSFromAddress } from '../api';
import { isValidAddress, isValidEmail } from '../lib/helpers';
import { AddressOrEmailSchema } from '../lib/schemas';

type AddressInputProps = {
  onAddressButton: (addressOrENS: string, address: string) => void;
  allowEmail: boolean;
  buttonText: string;
};

type AddressFormValues = {
  address: string;
};

const initialValues: AddressFormValues = {
  address: '',
};

export const AddressInput: React.FC<AddressInputProps> = ({ onAddressButton, allowEmail, buttonText }) => {
  const [ensError, setEnsError] = useState(false);
  const [working, setWorking] = useState(false);

  const onSubmit = async ({ address }: AddressFormValues) => {
    setWorking(true);

    if (isValidAddress(address)) {
      try {
        const addressResponse = await getENSFromAddress(address);
        onAddressButton(addressResponse.valid ? addressResponse.ens : address, address);
      } catch (e) {
        onAddressButton(address, address);
      }
    } else if (allowEmail && isValidEmail(address)) {
      onAddressButton(address, address);
    } else {
      setEnsError(false);
      const ensResponse = await resolveENS(address);

      if (ensResponse.valid) {
        onAddressButton(address, ensResponse.ens);
      } else {
        setEnsError(true);
      }
    }

    setWorking(false);
  };

  return (
    <Formik onSubmit={onSubmit} initialValues={initialValues} validationSchema={AddressOrEmailSchema}>
      {({ values, errors, setFieldValue }) => (
        <Form className="address-input-form">
          <input
            type="text"
            id="address"
            name="address"
            placeholder={'matoken.eth' + (allowEmail ? ' or alison@google.com' : '')}
            onChange={(e) => setFieldValue('address', e.target.value, true)}
            autoComplete="off"
            value={values.address}
            className={classNames(ensError && 'error')}
          />
          {ensError && <p className="text-error">Invalid ENS name</p>}
          <input
            type="submit"
            id="submit"
            value={working ? '' : buttonText}
            disabled={Boolean(errors.address) || !values.address}
            className={classNames(working && 'loading')}
            name="submit"
          />
        </Form>
      )}
    </Formik>
  );
};

export default AddressInput;
