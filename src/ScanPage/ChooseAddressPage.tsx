import React, { useCallback } from 'react';

import AddressInput from '../components/AddressInput';

/* Hooks */
import { useToggleState } from '../react-helpers';

/* Helpers */
import { connectWallet } from '../poap-eth';
import { getENSFromAddress } from '../api';

type ChooseAddressPageProps = {
  onAccountDetails: (addressOrENS: string, address: string) => void;
};

type LoginButtonProps = {
  onAddress: (addressOrENS: string, address: string) => void;
};

const LoginButton: React.FC<LoginButtonProps> = ({ onAddress }) => {
  const doLogin = useCallback(async () => {
    let { web3 } = await connectWallet();

    if (!web3) {
      return;
    }
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) return null;
    const account = accounts[0];

    if (account) {
      try {
        const ensResponse = await getENSFromAddress(account);
        onAddress(ensResponse.valid ? ensResponse.ens : account, account);
      } catch (e) {
        onAddress(account, account);
      }
    }
  }, [onAddress]);

  return (
    <button className="btn" onClick={doLogin}>
      <span>Show me my Badges</span>
    </button>
  );
};

export const ChooseAddressPage: React.FC<ChooseAddressPageProps> = ({ onAccountDetails }) => {
  const [enterByHand, toggleEnterByHand] = useToggleState(false);

  return (
    <main id="site-main" role="main" className="app-content">
      <div className="container">
        <div className="content-event" data-aos="fade-up" data-aos-delay="300">
          <p>
            The <span>Proof of attendance protocol</span> (POAP) reminds you off the <span>cool places</span> you’ve
            been to.
          </p>
          <br />
          {enterByHand ? (
            <AddressInput onAddressButton={onAccountDetails} allowEmail={true} buttonText="Display Badges" />
          ) : (
            <>
              <LoginButton onAddress={onAccountDetails} />
              <p>
                or{' '}
                <a
                  href="/"
                  onClick={(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
                    event.preventDefault();
                    toggleEnterByHand();
                  }}
                >
                  enter an address by hand
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
